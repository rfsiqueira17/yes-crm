import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyWhatsAppSignature, normalizePhone } from '@/lib/whatsapp'
import type { WhatsAppWebhookPayload } from '@/lib/types'

/**
 * GET — Verificação do webhook pelo Meta
 * Meta envia: hub.mode=subscribe, hub.verify_token=SEU_TOKEN, hub.challenge=CODIGO
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verificação bem-sucedida')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * POST — Recebe mensagens do WhatsApp
 * Valida HMAC-SHA256, processa mensagens e upsert leads
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256') ?? ''

  // Validação HMAC obrigatória
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.error('[WhatsApp Webhook] WHATSAPP_APP_SECRET não configurado')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const isValid = await verifyWhatsAppSignature(rawBody, signature, appSecret)
  if (!isValid) {
    console.warn('[WhatsApp Webhook] Assinatura HMAC inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: WhatsAppWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (payload.object !== 'whatsapp_business_account') {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const supabase = createServiceClient()
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? ''

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue

      const { value } = change

      // Verifica se é o número configurado
      if (value.metadata?.phone_number_id !== phoneNumberId) continue

      // Busca a escola pelo phone_number_id
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('whatsapp_phone_id', phoneNumberId)
        .single()

      if (!school) {
        console.warn(`[WhatsApp Webhook] Nenhuma escola com phone_number_id=${phoneNumberId}`)
        continue
      }

      const contacts = value.contacts ?? []
      const messages = value.messages ?? []
      const statuses = value.statuses ?? []

      // Processa atualizações de status das mensagens enviadas
      for (const status of statuses) {
        await supabase
          .from('messages')
          .update({ status: status.status })
          .eq('wa_message_id', status.id)
      }

      // Processa mensagens recebidas
      for (const msg of messages) {
        if (msg.type !== 'text' || !msg.text?.body) continue

        const phone = normalizePhone(msg.from)
        const contactName =
          contacts.find((c) => normalizePhone(c.wa_id) === phone)?.profile.name ?? phone

        const messageBody = msg.text.body
        const messageTimestamp = new Date(parseInt(msg.timestamp) * 1000).toISOString()

        // Upsert do lead: cria se não existe, atualiza last_message_at
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .upsert(
            {
              school_id: school.id,
              phone,
              name: contactName,
              stage: 'novos_leads',
              last_message_at: messageTimestamp,
              last_message_body: messageBody.slice(0, 200),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'school_id,phone',
              ignoreDuplicates: false,
            }
          )
          .select('id, stage')
          .single()

        if (leadError || !lead) {
          console.error('[WhatsApp Webhook] Erro ao upsert lead:', leadError)
          continue
        }

        // Se o lead já existia (não é novos_leads), atualiza apenas last_message
        if (lead.stage !== 'novos_leads') {
          await supabase
            .from('leads')
            .update({
              last_message_at: messageTimestamp,
              last_message_body: messageBody.slice(0, 200),
              updated_at: new Date().toISOString(),
            })
            .eq('id', lead.id)
        }

        // Insere a mensagem
        await supabase.from('messages').insert({
          lead_id: lead.id,
          direction: 'inbound',
          body: messageBody,
          wa_message_id: msg.id,
          status: null,
          timestamp: messageTimestamp,
        })
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
