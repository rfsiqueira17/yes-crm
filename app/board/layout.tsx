import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/shared/Header'
import type { UserProfile } from '@/lib/types'

export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca perfil do usuário com a escola
  const { data: profile } = await supabase
    .from('users')
    .select('*, school:schools(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={profile as UserProfile} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
