'use client'

import { useRef, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Send, Loader2 } from 'lucide-react'
import type { Message } from '@/lib/types'

interface ConversationHistoryProps {
  messages: Message[]
  leadId: string
  onSent: () => void
}

export default function ConversationHistory({ messages, leadId, onSent }: ConversationHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!reply.trim() || sending) return
    setSending(true)

    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, body: reply.trim() }),
      })
      if (res.ok) {
        setReply('')
        onSent()
      }
    } finally {
      setSending(false)
    }
  }

  function formatTimestamp(ts: string) {
    return format(new Date(ts), "dd/MM HH:mm", { locale: ptBR })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Mensagens */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23f0f0f0\' fill-opacity=\'0.5\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm text-center">
              Nenhuma mensagem ainda.<br />
              <span className="text-xs">As mensagens do WhatsApp aparecerão aqui.</span>
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm
                  ${msg.direction === 'outbound'
                    ? 'bg-yes-red text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                  }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                <p className={`text-[10px] mt-1 text-right
                  ${msg.direction === 'outbound' ? 'text-white/70' : 'text-gray-400'}`}>
                  {formatTimestamp(msg.timestamp)}
                  {msg.direction === 'outbound' && msg.status && (
                    <span className="ml-1">
                      {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de resposta */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end">
        <textarea
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-yes-red max-h-32 min-h-[40px]"
          placeholder="Responder via WhatsApp..."
          rows={1}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={!reply.trim() || sending}
          className="h-9 w-9 rounded-full bg-yes-red text-white flex items-center justify-center hover:bg-yes-red-dark disabled:opacity-40 transition-colors flex-shrink-0"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}
