'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: GridIcon },
  { href: '/gastos', label: 'Transacciones', icon: ArrowsIcon },
  { href: '/metas', label: 'Metas', icon: TargetIcon },
  { href: '/chatbot', label: 'Asistente Fina', icon: ChatIcon },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-56 flex flex-col z-30 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ background: '#0D0E12', borderRight: '1px solid #1E2028' }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid #1E2028' }}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-instrument-serif)' }}>F</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E8E9F0] leading-none">Fami</p>
            <p className="text-[10px] text-[#3D4051] mt-0.5">Finanzas familiares</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-medium uppercase tracking-widest text-[#3D4051] px-3 mb-3">Menú</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm transition-all duration-150',
                isActive
                  ? 'bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20'
                  : 'text-[#6B7280] hover:text-[#E8E9F0] hover:bg-[#1A1B23]'
              )}>
              <Icon size={15} active={isActive} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-0.5" style={{ borderTop: '1px solid #1E2028' }}>
        {(() => {
          const isActive = pathname === '/configuracion'
          return (
            <Link href="/configuracion"
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-all duration-150',
                isActive
                  ? 'bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20'
                  : 'text-[#6B7280] hover:text-[#E8E9F0] hover:bg-[#1A1B23]'
              )}>
              <SettingsIcon size={15} active={isActive} />
              Configuración
            </Link>
          )
        })()}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm text-[#6B7280] hover:text-[#F87171] hover:bg-[#2D1515] transition-colors">
          <LogoutIcon size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function GridIcon({ size = 15, active }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={active ? '#818CF8' : 'currentColor'} strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function ArrowsIcon({ size = 15, active }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={active ? '#818CF8' : 'currentColor'} strokeWidth="1.75">
      <path d="M7 16V4m0 0L3 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TargetIcon({ size = 15, active }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={active ? '#818CF8' : 'currentColor'} strokeWidth="1.75">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round" />
      <line x1="2" y1="12" x2="5" y2="12" strokeLinecap="round" />
      <line x1="19" y1="12" x2="22" y2="12" strokeLinecap="round" />
    </svg>
  )
}

function ChatIcon({ size = 15, active }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={active ? '#818CF8' : 'currentColor'} strokeWidth="1.75">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsIcon({ size = 15, active }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? '#818CF8' : 'currentColor'} strokeWidth="1.75">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogoutIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
    </svg>
  )
}
