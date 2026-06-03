'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MessageSquare, Phone, Clock } from 'lucide-react'
import { timeAgo, formatPhone, cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
  isDragging?: boolean
}

export default function LeadCard({ lead, onClick, isDragging = false }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sortableDragging } =
    useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isBeingDragged = isDragging || sortableDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing',
        'hover:border-yes-red/40 hover:shadow-sm transition-all duration-150',
        'select-none',
        isBeingDragged && 'opacity-40 shadow-lg ring-2 ring-yes-red',
        onClick && !isBeingDragged && 'hover:bg-yes-red-bg/30'
      )}
    >
      {/* Nome */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-1">
          {lead.name}
        </p>
        {lead.last_message_at && (
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400 flex-shrink-0">
            <Clock size={10} />
            {timeAgo(lead.last_message_at)}
          </span>
        )}
      </div>

      {/* Telefone */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <Phone size={11} />
        <span>{formatPhone(lead.phone)}</span>
      </div>

      {/* Última mensagem */}
      {lead.last_message_body && (
        <div className="flex items-start gap-1 text-xs text-gray-400">
          <MessageSquare size={11} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2 leading-tight">{lead.last_message_body}</span>
        </div>
      )}
    </div>
  )
}
