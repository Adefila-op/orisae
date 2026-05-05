'use client'

import { useState, useEffect } from 'react'
import { Menu, Settings } from 'lucide-react'
import DashboardMain from '@/components/dashboard/DashboardMain'
import Sidebar from '@/components/dashboard/Sidebar'
import NotificationPanel from '@/components/dashboard/NotificationPanel'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="border-b border-slate-700 bg-black/50 backdrop-blur-lg sticky top-0 z-40">
          <div className="px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div className="flex gap-4 items-center">
              <NotificationPanel />
              <button className="p-2 hover:bg-slate-800 rounded-lg transition text-gray-400 hover:text-white" title="Settings">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <DashboardMain />
        </main>
      </div>
    </div>
  )
}
