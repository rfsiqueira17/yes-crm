'use client'

import { useState, FormEvent } from 'react'
import { updateLead, deleteLead } from '@/app/actions/leads'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Check } from 'lucide-react'
import { formatPhone } from '@/lib/utils'
import type { Lead } from '@/lib/types'

interface EditLeadFormProps {
  lead: Lead
  onSaved: () => void
}

export default function EditLeadForm({ lead, onSaved }: EditLeadFormProps) {
  const [name, setName] = useState(lead.name)
  const [email, setEmail] = useState(lead.email ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const result = await updateLead(lead.id, {
      name: name.trim(),
      email: email.trim() || undefined,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      onSaved()
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }
async function handleDelete() {
  const confirmed = window.confirm(
    `Deseja realmente excluir o lead "${lead.name}"?`
  )

  if (!confirmed) return

  const result = await deleteLead(lead.id)

  if (result.error) {
    alert(result.error)
    return
  }

  window.location.reload()
}

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-name">Nome</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input value={formatPhone(lead.phone)} disabled className="bg-gray-50 text-gray-500" />
          <p className="text-xs text-gray-400">O número não pode ser alterado</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Criado em</Label>
          <Input
            value={new Date(lead.created_at).toLocaleDateString('pt-BR')}
            disabled
            className="bg-gray-50 text-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-yes-red text-white rounded-lg py-2 text-sm font-medium hover:bg-yes-red-dark disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
<button
  type="button"
  onClick={handleDelete}
  className="w-full mt-3 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 transition-colors"
>
  🗑️ Excluir Lead
</button>
          {saving ? (
            <><Loader2 size={14} className="animate-spin" />Salvando...</>
          ) : saved ? (
            <><Check size={14} />Salvo!</>
          ) : (
            'Salvar Dados'
          )}
        </button>
      </form>
    </div>
  )
}
