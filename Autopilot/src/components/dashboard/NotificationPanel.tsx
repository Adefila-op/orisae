'use client'

import { useEffect, useState } from 'react'
import { Bell, X, Check, Clock } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  data: Record<string, any>
}

function getAuthHeader(): string | undefined {
  const token = localStorage.getItem('auth_token') || ''
  if (!token) return undefined
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: getAuthHeader(),
        },
      })

      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [])

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: getAuthHeader(),
          },
        }
      )

      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: {
          Authorization: getAuthHeader(),
        },
      })

      const deleted = notifications.find((n) => n.id === notificationId)
      setNotifications(notifications.filter((n) => n.id !== notificationId))
      if (deleted && !deleted.read) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'conversion':
        return '🎉'
      case 'abandoned_cart':
        return '💔'
      case 'new_lead':
        return '⚡'
      case 'offer_accepted':
        return '✅'
      default:
        return '📢'
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-white/65 transition hover:bg-white/10 hover:text-white"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[24rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1a1d24] shadow-[0_28px_60px_rgba(6,10,18,0.48)] z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/8 p-4">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 transition hover:text-white/80"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-white/40">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/6">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors hover:bg-white/4 ${
                      !notification.read ? 'bg-sky-500/8' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white">
                          {notification.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-white/50">
                          {notification.message}
                        </p>
                        <p className="mt-2 flex items-center gap-1 text-xs text-white/35">
                          <Clock size={12} />
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-sky-300 transition hover:text-sky-200"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 text-white/35 transition hover:text-white/70"
                          title="Delete"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/8 p-4">
              <button
                onClick={fetchNotifications}
                className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-center text-sm font-medium text-sky-300 transition hover:bg-white/8 hover:text-sky-200"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationPanel
