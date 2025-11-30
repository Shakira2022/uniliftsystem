"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { realtimeService } from "@/lib/realtime"

export function RealTimeStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // Monitor connection status
    const unsubscribe = realtimeService.subscribe("system-status", (status) => {
      setIsConnected(status.connected)
      setLastUpdate(new Date())
    })

    // Simulate connection monitoring
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-600" />
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Live
          </Badge>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-600" />
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Offline
          </Badge>
        </>
      )}
      <span className="text-xs text-muted-foreground">Updated {lastUpdate.toLocaleTimeString()}</span>
    </div>
  )
}
