import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (notification: Omit<Notification, 'id'>) => void
  hideNotification: (id: string) => void
  success: (message: string, title?: string, duration?: number) => void
  error: (message: string, title?: string, duration?: number) => void
  warning: (message: string, title?: string, duration?: number) => void
  info: (message: string, title?: string, duration?: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-hide notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(id)
      }, newNotification.duration)
    }
  }, [])

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const success = useCallback((message: string, title?: string, duration?: number) => {
    showNotification({ type: 'success', message, title, duration })
  }, [showNotification])

  const error = useCallback((message: string, title?: string, duration?: number) => {
    showNotification({ type: 'error', message, title, duration })
  }, [showNotification])

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    showNotification({ type: 'warning', message, title, duration })
  }, [showNotification])

  const info = useCallback((message: string, title?: string, duration?: number) => {
    showNotification({ type: 'info', message, title, duration })
  }, [showNotification])

  const value: NotificationContextType = {
    notifications,
    showNotification,
    hideNotification,
    success,
    error,
    warning,
    info
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}