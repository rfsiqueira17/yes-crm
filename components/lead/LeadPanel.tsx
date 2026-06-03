'use client'

import { useState, useEffect } from 'react'
import { getLeadDetails } from '@/app/actions/leads'
import ConversationHistory from './ConversationHistory'
import NoteForm from './NoteForm'
import EditLeadForm from './EditLeadForm'
import { X, MessageSquare, StickyNote, User } from 'lucide-react'
import { formatPhone } from '@/lib/utils'
import type { LeadWithMessages } from '@/lib/types'

interface LeadPanelProps {
  leadId: string
  onClose: () => void
}

type Tab = 'conversation' | 'notes' | 'info'

export default function LeadPanel({ leadId, onClose }: LeadPanelProps) {
  const [lead, setLead] = useState<LeadWithMessages | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('conversation')

  async function load() {
    setLoading(true)
    const result = await getLeadDetails(leadId)
    if (result.data) setLead(result.data as LeadWithMessages)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'conversation', label: 'WhatsApp', icon: <MessageSquare size={14} /> },
    { id: 'notes', label: 'Notas', icon: <StickyNote size={14} /> },
    { id: 'info', label: 'Dados', icon: <User size={14} /> },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Painel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-yes-red px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            {loading ? (
              <div className="h-5 w-32 bg-white/30 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-white font-bold text-base">{lead?.name}</h2>
                <p className="text-white/80 text-xs">{lead ? formatPhone(lead.phone) : ''}</p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-yes-red border-b-2 border-yes-red'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-400 text-sm">Carregando...</div>
            </div>
          ) : lead ? (
            <>
              {activeTab === 'conversation' && (
                <ConversationHistory messages={lead.messages} leadId={lead.id} onSent={load} />
              )}
              {activeTab === 'notes' && (
                <NoteForm notes={lead.notes} leadId={lead.id} onSaved={load} />
              )}
              {activeTab === 'info' && (
                <EditLeadForm lead={lead} onSaved={load} />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Lead não encontrado
            </div>
          )}
        </div>
      </div>
    </>
  )
}
