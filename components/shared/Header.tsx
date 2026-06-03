'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'
import { LogOut, ChevronDown, User } from 'lucide-react'

interface HeaderProps {
  user: UserProfile
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-yes-red flex items-center justify-between px-4 shadow-md flex-shrink-0 relative z-40">
      {/* Logo + nome da escola */}
      <div className="flex items-center gap-3">
        <img
          src="/yes-logo.jpeg"
          alt="YES! Idiomas"
          className="h-8 w-auto object-contain brightness-0 invert"
        />
        <div className="hidden sm:block">
          <span className="text-white font-semibold text-sm">{user.school?.name}</span>
        </div>
      </div>

      {/* Título central */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-white font-bold text-base tracking-wide hidden md:block">
        CRM de Leads
      </h1>

      {/* Menu do usuário */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 text-white hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium hidden sm:block">{user.name}</span>
          <ChevronDown size={14} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-900">{user.name}</p>
                {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
