"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, User } from "lucide-react"
import { realtimeService } from "@/lib/realtime"

interface RideUpdate {
  type: string
  rideId: number
  status: string
  timestamp: string
}

const statusColors = {
  requested: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  en_route: "bg-purple-100 text-purple-800",
  arrived: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
}

export function LiveRideTracker() {
  const [rideUpdates, setRideUpdates] = useState<RideUpdate[]>([])

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe("ride-updates", (update: RideUpdate) => {
      setRideUpdates((prev) => [update, ...prev.slice(0, 9)]) // Keep last 10 updates
    })

    return unsubscribe
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Live Ride Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rideUpdates.length === 0 ? (
            <p className="text-muted-foreground text-sm">Waiting for ride updates...</p>
          ) : (
            rideUpdates.map((update, index) => (
              <div
                key={`${update.rideId}-${update.timestamp}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Ride #{update.rideId}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Badge
                  className={statusColors[update.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}
                >
                  {update.status.replace("_", " ")}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
