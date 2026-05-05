'use client'

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Coming Soon */}
      <div className="border border-slate-700 rounded-xl p-12 text-center bg-slate-900/50">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
        <p className="text-slate-400">Notification preferences, webhooks, and more coming soon</p>
      </div>
    </div>
  )
}
