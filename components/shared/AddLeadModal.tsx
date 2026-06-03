'use client'

import { useState, FormEvent } from 'react'
import { createLead } from '@/app/actions/leads'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface AddLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export default function AddLeadModal({ open, onOpenChange, onCreated }: AddLeadModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName('')
    setPhone('')
    setEmail('')
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createLead({ name, phone, email })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    reset()
    onOpenChange(false)
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent onClose={() => { onOpenChange(false); reset() }}>
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Adicionar lead manualmente ao pipeline</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Nome *</Label>
            <Input
              id="lead-name"
              placeholder="Nome do lead"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-phone">WhatsApp *</Label>
            <Input
              id="lead-phone"
              placeholder="5511912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
            />
            <p className="text-xs text-gray-400">Ex: 5511912345678 (com código do país)</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Email (opcional)</Label>
            <Input
              id="lead-email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { onOpenChange(false); reset() }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 size={14} className="animate-spin" />Criando...</> : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
