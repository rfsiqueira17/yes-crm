/**
 * Helpers para WhatsApp Business Cloud API (Meta)
 */

const GRAPH_API_VERSION = 'v20.0'
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

interface SendTextOptions {
  phoneNumberId: string
  accessToken: string
  to: string
  body: string
  replyToMessageId?: string
}

export async function sendWhatsAppText(options: SendTextOptions): Promise<string> {
  const { phoneNumberId, accessToken, to, body, replyToMessageId } = options

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body },
  }

  if (replyToMessageId) {
    payload.context = { message_id: replyToMessageId }
  }

  const response = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.messages?.[0]?.id ?? ''
}

/**
 * Valida a assinatura HMAC-SHA256 do webhook Meta
 */
export async function verifyWhatsAppSignature(
  payload: string,
  signature: string,
  appSecret: string
): Promise<boolean> {
  if (!signature.startsWith('sha256=')) return false

  const expectedSignature = signature.slice(7) // remove "sha256="

  const encoder = new TextEncoder()
  const keyData = encoder.encode(appSecret)
  const msgData = encoder.encode(payload)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return signatureHex === expectedSignature
}

/**
 * Formata número de telefone para padrão E.164 sem o "+"
 * Ex: "+55 11 91234-5678" → "5511912345678"
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}
