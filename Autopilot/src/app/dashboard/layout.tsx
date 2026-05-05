export const metadata = {
  title: 'Dashboard - Autopilot',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      {children}
    </div>
  )
}
