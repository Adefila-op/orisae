'use client'

import { useState, useEffect } from 'react'
import DashboardMain from '@/components/dashboard/DashboardMain'
import Sidebar from '@/components/dashboard/Sidebar'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      setSidebarOpen(desktop)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(74,144,226,0.22),_transparent_35%),linear-gradient(180deg,_#d7d2c8_0%,_#8c98af_100%)] p-3 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1520px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#15161c] shadow-[0_30px_80px_rgba(13,18,30,0.45)]">
        <Sidebar
          isOpen={sidebarOpen}
          isDesktop={isDesktop}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 overflow-hidden">
          <DashboardMain onToggleSidebar={() => setSidebarOpen((current) => !current)} />
        </main>
      </div>
    </div>
  )
}
