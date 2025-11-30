"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation } from "lucide-react"
import { realtimeService } from "@/lib/realtime"

interface DriverLocation {
  driverId: number
  lat: number
  lng: number
  timestamp: string
}

export function DriverLocationMap() {
  const [driverLocations, setDriverLocations] = useState<Map<number, DriverLocation>>(new Map())

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe("driver-location", (location: DriverLocation) => {
      setDriverLocations((prev) => new Map(prev.set(location.driverId, location)))
    })

    return unsubscribe
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Live Driver Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from(driverLocations.values()).length === 0 ? (
            <p className="text-muted-foreground text-sm">No active drivers...</p>
          ) : (
            Array.from(driverLocations.values()).map((location) => (
              <div key={location.driverId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Driver #{location.driverId}</p>
                    <p className="text-xs text-muted-foreground">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-muted-foreground mt-1">Online</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
