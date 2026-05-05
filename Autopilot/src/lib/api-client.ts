import axios, { AxiosInstance, AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export function getAuthHeaderValue() {
  if (typeof window === 'undefined') {
    return undefined
  }

  let token = localStorage.getItem('auth_token')

  if (!token && process.env.NODE_ENV === 'development') {
    try {
      const { getDemoToken } = require('./demo-auth')
      token = getDemoToken()
    } catch {
      return undefined
    }
  }

  if (!token) {
    return undefined
  }

  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add token to requests (use demo token in dev mode)
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = getAuthHeaderValue()

        if (token) {
          config.headers.Authorization = token
        }
      }
      return config
    })
  }

  async get<T>(url: string, config = {}) {
    try {
      const response = await this.client.get<T>(url, config)
      return response.data
    } catch (error) {
      this.handleError(error)
      throw error
    }
  }

  async post<T>(url: string, data: any, config = {}) {
    try {
      const response = await this.client.post<T>(url, data, config)
      return response.data
    } catch (error) {
      this.handleError(error)
      throw error
    }
  }

  async patch<T>(url: string, data: any, config = {}) {
    try {
      const response = await this.client.patch<T>(url, data, config)
      return response.data
    } catch (error) {
      this.handleError(error)
      throw error
    }
  }

  async delete<T>(url: string, config = {}) {
    try {
      const response = await this.client.delete<T>(url, config)
      return response.data
    } catch (error) {
      this.handleError(error)
      throw error
    }
  }

  private handleError(error: any) {
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    }
    console.error('API Error:', error.response?.data || error.message)
  }
}

export const apiClient = new ApiClient()

// Specific API methods
export const linksAPI = {
  create: (data: any) => apiClient.post('/links', data),
  list: () => apiClient.get('/links'),
  get: (code: string) => apiClient.get(`/links/code/${code}`),
  platformStats: () => apiClient.get('/links/stats/by-platform'),
  toggle: (linkId: string, enabled: boolean) =>
    apiClient.patch(`/links/${linkId}/toggle`, { enabled }),
  delete: (linkId: string) => apiClient.delete(`/links/${linkId}`),
}

export const eventsAPI = {
  trackClick: (data: any) => apiClient.post('/events/click', data),
  trackConversion: (data: any) => apiClient.post('/events/conversion', data),
  trackAbandon: (data: any) => apiClient.post('/events/abandoned', data),
  getEvents: (code: string) => apiClient.get(`/events/${code}`),
}

export const intentAPI = {
  score: (data: any) => apiClient.post('/intent/score', data),
  history: (code: string, uid: string) =>
    apiClient.get(`/intent/history/${code}/${uid}`),
}

export const notificationsAPI = {
  list: () => apiClient.get('/notifications'),
  unreadCount: () => apiClient.get('/notifications/unread/count'),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => apiClient.patch('/notifications/all/read', {}),
}

export const analyticsAPI = {
  dashboard: () => apiClient.get('/analytics/dashboard'),
  linkStats: (linkId: string) => apiClient.get(`/analytics/link/${linkId}`),
}

export default apiClient
