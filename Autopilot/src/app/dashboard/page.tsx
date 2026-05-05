'use client'

import { useState, useEffect } from 'react'
import { Menu, Settings } from 'lucide-react'
import KanbanBoard from '@/components/dashboard/KanbanBoard'
import Sidebar from '@/components/dashboard/Sidebar'
import NotificationPanel from '@/components/dashboard/NotificationPanel'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      const desktop = window.innerWidth >= 1024
      setIsMobile(mobile)
      setIsDesktop(desktop)
      setSidebarOpen(desktop)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} isDesktop={isDesktop} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-black via-slate-900 to-black">
        {/* Top Navigation */}
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition text-gray-400 hover:text-white md:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1" />
            <div className="flex gap-4 items-center">
              <NotificationPanel />
              <button className="p-2 hover:bg-slate-800 rounded-lg transition text-gray-400 hover:text-white" title="Settings">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <KanbanBoard />
        </main>
      </div>
    </div>
  )
}
