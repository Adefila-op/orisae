'use client'

import {
  BarChart3,
  FolderOpen,
  Home,
  LogOut,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  isDesktop: boolean
  onClose: () => void
}

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderOpen, label: 'Smart Links', href: '/dashboard/links' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function Sidebar({ isOpen, isDesktop, onClose }: SidebarProps) {
  const pathname = usePathname()

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/'
    }
  }

  return (
    <>
      {!isDesktop && isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
        />
      )}

      <aside
        className={`${
          isDesktop ? 'translate-x-0' : isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-[90px] border-r border-white/6 bg-[#191b22] transition-transform duration-300 md:relative md:z-auto ${
          !isDesktop ? 'shadow-2xl' : ''
        }`}
      >
        <div className="flex h-full flex-col items-center justify-between py-6">
          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex w-full items-center justify-center px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,_rgba(71,150,255,0.95),_rgba(30,47,84,0.95))] shadow-[0_12px_32px_rgba(39,112,255,0.35)]">
                <Sparkles size={20} className="text-white" />
              </div>
              {!isDesktop && (
                <button
                  onClick={onClose}
                  className="absolute right-4 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-white/70"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <nav className="flex w-full flex-col items-center gap-4 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={() => {
                      if (!isDesktop) {
                        onClose()
                      }
                    }}
                    className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition ${
                      active
                        ? 'bg-[linear-gradient(180deg,_rgba(74,144,255,0.95),_rgba(42,94,255,0.85))] text-white shadow-[0_14px_30px_rgba(46,102,255,0.35)]'
                        : 'text-white/45 hover:bg-white/6 hover:text-white/90'
                    } ${isDesktop ? 'justify-center' : 'justify-start'}`}
                  >
                    <Icon size={18} />
                    {!isDesktop && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex w-full flex-col items-center gap-4 px-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
              <div className="h-6 w-6 rounded-full bg-[radial-gradient(circle_at_30%_30%,_#ffd76a,_#457dff)]" />
            </div>
            <button
              onClick={handleLogout}
              title="Disconnect"
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/55 transition hover:border-red-400/30 hover:bg-red-500/12 hover:text-red-200"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
