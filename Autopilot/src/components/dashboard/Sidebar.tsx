'use client'

import { BarChart3, Link2, Settings, LogOut, X } from 'lucide-react'
import Link from 'next/link'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
  { icon: Link2, label: 'Smart Links', href: '/dashboard/links' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const handleLogout = () => {\n    if (typeof window !== 'undefined') {\n      localStorage.removeItem('auth_token')\n      window.location.href = '/'\n    }\n  }
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 h-screen w-64 bg-black/50 backdrop-blur-lg border-r border-slate-700 transform transition-transform duration-200 z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Autopilot
            </div>
            <button onClick={onClose} className="md:hidden p-1 hover:bg-slate-800 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item, i) => {
              const Icon = item.icon
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white"
                  onClick={() => onClose()}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition font-medium"
            >
              <LogOut size={20} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
