// ──────────────────────────────────────────────
// Tipos globais do YES! CRM
// ──────────────────────────────────────────────

export type LeadStage =
  | 'novos_leads'
  | 'sem_resposta'
  | 'em_negociacao'
  | 'aguardando_pagamento'
  | 'matriculou'

export const LEAD_STAGES: { id: LeadStage; label: string }[] = [
  { id: 'novos_leads', label: 'Novos Leads' },
  { id: 'sem_resposta', label: 'Sem Resposta' },
  { id: 'em_negociacao', label: 'Em Negociação' },
  { id: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
  { id: 'matriculou', label: 'Matriculou' },
]

export interface School {
  id: string
  name: string
  slug: string
  whatsapp_phone_id: string | null
  created_at: string
}

export interface UserProfile {
  id: string
  school_id: string
  name: string
  role: 'admin' | 'agent'
  email?: string
  school: School
}

export interface Lead {
  id: string
  school_id: string
  name: string
  phone: string
  stage: LeadStage
  email: string | null
  last_message_at: string | null
  last_message_body: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  lead_id: string
  direction: 'inbound' | 'outbound'
  body: string
  wa_message_id: string | null
  status: 'sent' | 'delivered' | 'read' | 'failed' | null
  timestamp: string
  created_at: string
}

export interface Note {
  id: string
  lead_id: string
  user_id: string
  body: string
  created_at: string
  user?: { name: string }
}

export interface LeadWithMessages extends Lead {
  messages: Message[]
  notes: Note[]
}

// Tipos para o Kanban
export interface KanbanColumn {
  id: LeadStage
  label: string
  leads: Lead[]
}

// Payload do webhook WhatsApp (Meta Cloud API)
export interface WhatsAppWebhookPayload {
  object: string
  entry: WhatsAppEntry[]
}

export interface WhatsAppEntry {
  id: string
  changes: WhatsAppChange[]
}

export interface WhatsAppChange {
  value: WhatsAppChangeValue
  field: string
}

export interface WhatsAppChangeValue {
  messaging_product: string
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts?: WhatsAppContact[]
  messages?: WhatsAppMessage[]
  statuses?: WhatsAppStatus[]
}

export interface WhatsAppContact {
  profile: { name: string }
  wa_id: string
}

export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location'
  text?: { body: string }
}

export interface WhatsAppStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
}
