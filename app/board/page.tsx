import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import type { Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca o school_id do usuário atual
  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Busca leads da escola com RLS garantindo isolamento
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <KanbanBoard
      initialLeads={(leads ?? []) as Lead[]}
      schoolId={profile.school_id}
    />
  )
}
