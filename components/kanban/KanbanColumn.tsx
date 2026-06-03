'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import LeadCard from './LeadCard'
import type { KanbanColumn as KanbanColumnType } from '@/lib/types'

interface KanbanColumnProps {
  column: KanbanColumnType
  onLeadClick: (id: string) => void
}

export default function KanbanColumn({ column, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Header da coluna */}
      <div className="bg-yes-red rounded-t-xl px-3 py-2.5 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm truncate">{column.label}</h3>
        <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center">
          {column.leads.length}
        </span>
      </div>

      {/* Lista de cards */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 overflow-y-auto rounded-b-xl p-2 space-y-2 min-h-[200px]
          transition-colors duration-150
          ${isOver ? 'bg-yes-red-bg ring-2 ring-yes-red ring-inset' : 'bg-gray-100'}
        `}
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        <SortableContext
          items={column.leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead.id)} />
          ))}
        </SortableContext>

        {column.leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-gray-400 text-xs">
            Arraste leads aqui
          </div>
        )}
      </div>
    </div>
  )
}
