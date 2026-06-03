'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import { useLeads } from '@/hooks/useLeads'
import { moveLeadStage } from '@/app/actions/leads'
import KanbanColumn from './KanbanColumn'
import LeadCard from './LeadCard'
import LeadPanel from '@/components/lead/LeadPanel'
import AddLeadModal from '@/components/shared/AddLeadModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Lead, LeadStage } from '@/lib/types'

interface KanbanBoardProps {
  initialLeads: Lead[]
  schoolId: string
}

export default function KanbanBoard({ initialLeads, schoolId }: KanbanBoardProps) {
  const { columns, moveLead } = useLeads(initialLeads, schoolId)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  const findLeadById = useCallback(
    (id: string) => columns.flatMap((c) => c.leads).find((l) => l.id === id),
    [columns]
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
    setActiveLead(findLeadById(active.id as string) ?? null)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const overId = over.id as string

    // over pode ser um lead (dentro de uma coluna) ou uma coluna
    const overIsColumn = columns.some((c) => c.id === overId)
    if (overIsColumn) {
      moveLead(active.id as string, overId as LeadStage)
    } else {
      const targetLead = findLeadById(overId)
      if (targetLead) {
        moveLead(active.id as string, targetLead.stage)
      }
    }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    setActiveLead(null)
    if (!over) return

    const leadId = active.id as string
    const lead = findLeadById(leadId)
    if (!lead) return

    // Persiste no banco
    await moveLeadStage(leadId, lead.stage)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <p className="text-sm text-gray-500">
          {columns.reduce((sum, c) => sum + c.leads.length, 0)} leads no pipeline
        </p>
        <Button onClick={() => setAddModalOpen(true)} size="sm">
          <Plus size={14} />
          Novo Lead
        </Button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 p-4 overflow-x-auto flex-1 items-start">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onLeadClick={(id) => setSelectedLeadId(id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <LeadCard lead={activeLead} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Painel lateral do lead */}
      {selectedLeadId && (
        <LeadPanel
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}

      {/* Modal de novo lead */}
      <AddLeadModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />
    </div>
  )
}
