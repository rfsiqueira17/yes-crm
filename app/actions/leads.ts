'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { LeadStage } from '@/lib/types'

const createLeadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
})

/**
 * Move um lead para outro estágio do Kanban
 */
export async function moveLeadStage(leadId: string, newStage: LeadStage) {
  const supabase = createClient()

  const { error } = await supabase
    .from('leads')
    .update({ stage: newStage, updated_at: new Date().toISOString() })
    .eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/board')
}

/**
 * Cria um lead manualmente
 */
export async function createLead(formData: {
  name: string
  phone: string
  email?: string
}) {
  const supabase = createClient()

  const parsed = createLeadSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Perfil não encontrado' }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      school_id: profile.school_id,
      name: parsed.data.name,
      phone: parsed.data.phone.replace(/\D/g, ''),
      email: parsed.data.email || null,
      stage: 'novos_leads',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe um lead com este telefone' }
    }
    return { error: error.message }
  }

  revalidatePath('/board')
  return { data }
}

/**
 * Atualiza dados do lead
 */
export async function updateLead(
  leadId: string,
  updates: { name?: string; phone?: string; email?: string }
) {
  const supabase = createClient()

  const { error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', leadId)

  if (error) return { error: error.message }

  revalidatePath('/board')
  return { success: true }
}

/**
 * Adiciona uma nota ao lead
 */
export async function createNote(leadId: string, body: string) {
  const supabase = createClient()

  if (!body.trim()) return { error: 'Nota não pode ser vazia' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('notes')
    .insert({ lead_id: leadId, user_id: user.id, body: body.trim() })
    .select()
    .single()

  if (error) return { error: error.message }

  return { data }
}

/**
 * Busca detalhes completos de um lead (mensagens + notas)
 */
export async function getLeadDetails(leadId: string) {
  const supabase = createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (error || !lead) return { error: 'Lead não encontrado' }

  const [{ data: messages }, { data: notes }] = await Promise.all([
    supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('timestamp', { ascending: true }),
    supabase
      .from('notes')
      .select('*, user:users(name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false }),
  ])

  return {
    data: {
      ...lead,
      messages: messages ?? [],
      notes: notes ?? [],
    },
  }
}
/**
 * Exclui um lead
 */
export async function deleteLead(leadId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/board')
  return { success: true }
}