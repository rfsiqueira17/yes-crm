'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead, LeadStage, KanbanColumn } from '@/lib/types'
import { LEAD_STAGES } from '@/lib/types'

export function useLeads(initialLeads: Lead[], schoolId: string) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), [])

  // Organiza leads por coluna
  const columns: KanbanColumn[] = LEAD_STAGES.map((stage) => ({
    id: stage.id,
    label: stage.label,
    leads: leads.filter((l) => l.stage === stage.id),
  }))

  // Move otimisticamente um lead para outro estágio
  const moveLead = useCallback((leadId: string, newStage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    )
  }, [])

  // Adiciona um lead novo ao estado local
  const addLead = useCallback((lead: Lead) => {
    setLeads((prev) => {
      const exists = prev.find((l) => l.id === lead.id)
      if (exists) return prev.map((l) => (l.id === lead.id ? { ...l, ...lead } : l))
      return [lead, ...prev]
    })
  }, [])

  // Remove lead do estado local
  const removeLead = useCallback((leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId))
  }, [])

  // Subscription Realtime do Supabase
  useEffect(() => {
    const channel = supabase
      .channel(`leads:school:${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addLead(payload.new as Lead)
          } else if (payload.eventType === 'UPDATE') {
            setLeads((prev) =>
              prev.map((l) => (l.id === payload.new.id ? { ...l, ...payload.new } : l))
            )
          } else if (payload.eventType === 'DELETE') {
            removeLead(payload.old.id as string)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [schoolId, addLead, removeLead]) // supabase é memoized, não precisa estar aqui

  return { leads, columns, moveLead, addLead, removeLead, setLeads }
}
