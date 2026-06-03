import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppText } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leadId, body } = await request.json()

  if (!leadId || !body?.trim()) {
    return NextResponse.json({ error: 'leadId e body são obrigatórios' }, { status: 400 })
  }

  // Busca o lead (RLS garante que pertence à escola do usuário)
  const { data: lead } = await supabase
    .from('leads')
    .select('*, school:schools(whatsapp_phone_id)')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ error: 'WhatsApp não configurado' }, { status: 500 })
  }

  try {
    const waMessageId = await sendWhatsAppText({
      phoneNumberId,
      accessToken,
      to: lead.phone,
      body: body.trim(),
    })

    const now = new Date().toISOString()

    // Salva a mensagem enviada
    await supabase.from('messages').insert({
      lead_id: leadId,
      direction: 'outbound',
      body: body.trim(),
      wa_message_id: waMessageId,
      status: 'sent',
      timestamp: now,
    })

    // Atualiza last_message_at do lead
    await supabase
      .from('leads')
      .update({ last_message_at: now, last_message_body: body.trim().slice(0, 200), updated_at: now })
      .eq('id', leadId)

    return NextResponse.json({ ok: true, waMessageId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar mensagem'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
