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
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
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
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-slate-800/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
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
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={fetchNotifications}
                className="w-full text-center text-sm text-blue-500 hover:text-blue-700 font-medium"
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
