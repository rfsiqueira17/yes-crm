'use client'

import { useState, FormEvent } from 'react'
import { createNote } from '@/app/actions/leads'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, StickyNote } from 'lucide-react'
import type { Note } from '@/lib/types'

interface NoteFormProps {
  notes: Note[]
  leadId: string
  onSaved: () => void
}

export default function NoteForm({ notes, leadId, onSaved }: NoteFormProps) {
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return

    setSaving(true)
    setError(null)

    const result = await createNote(leadId, body)

    if (result.error) {
      setError(result.error)
    } else {
      setBody('')
      onSaved()
    }

    setSaving(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Lista de notas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <StickyNote size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhuma nota ainda</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.body}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{note.user?.name ?? 'Usuário'}</span>
                <span className="text-xs text-gray-400">
                  {format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form nova nota */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 space-y-2">
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-yes-red"
          placeholder="Adicionar nota sobre este lead..."
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!body.trim() || saving}
          className="w-full bg-yes-red text-white rounded-lg py-2 text-sm font-medium hover:bg-yes-red-dark disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" />Salvando...</> : 'Salvar Nota'}
        </button>
      </form>
    </div>
  )
}
