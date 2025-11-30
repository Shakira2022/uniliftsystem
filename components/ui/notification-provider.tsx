"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { realtimeService } from "@/lib/realtime"
import { NotificationToast } from "./notification-toast"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: string
}

interface NotificationContextType {
  notifications: Notification[]       // for active toasts
  allNotifications: Notification[]    // persistent array for bell container
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider")
  return context
}

interface NotificationProviderProps {
  children: ReactNode
  userId?: string
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])       // for toast popups
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]) // for bell container

  const addNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }

    // add to toast notifications
    setNotifications(prev => [...prev, newNotification])

    // add to persistent array
    setAllNotifications(prev => [newNotification, ...prev])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setAllNotifications([])
  }

  useEffect(() => {
    if (!userId) return

    const unsubscribe = realtimeService.subscribe(`notifications-${userId}`, (notification: Notification) => {
      addNotification(notification)
    })

    return unsubscribe
  }, [userId])

  return (
    <NotificationContext.Provider value={{ notifications, allNotifications, addNotification, removeNotification, clearAllNotifications }}>
      {children}

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} onClose={removeNotification} />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
