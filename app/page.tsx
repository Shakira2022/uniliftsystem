// app/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = AuthService.getCurrentUser()
    if (user) {
      // Redirect authenticated users to their dashboard
      switch (user.role) {
        case "student":
          router.push("/student")
          break
        case "driver":
          router.push("/driver")
          break
        case "admin":
          router.push("/admin")
          break
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4 font-heading">Welcome to UniLift</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            North-West University's modern transportation management system. Connecting students, drivers, and campus
            efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-primary">Students</CardTitle>
              <CardDescription>
                Request rides, track your transportation, and manage your travel schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button asChild className="w-full">
                  {/* ✅ Updated Link to the student-specific login page */}
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/register">Create Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-primary">Drivers & Admin</CardTitle>
              <CardDescription>Manage transportation requests, track vehicles, and oversee operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button asChild className="w-full">
                  {/* ✅ Updated Link to the staff-specific login page */}
                  <Link href="/login/staff">Staff Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-primary mb-8">System Features</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold text-lg mb-2">Real-time Tracking</h3>
              <p className="text-muted-foreground">Track your ride status and estimated arrival times</p>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold text-lg mb-2">Smart Allocation</h3>
              <p className="text-muted-foreground">Optimized vehicle assignment based on location and availability</p>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold text-lg mb-2">Comprehensive Reports</h3>
              <p className="text-muted-foreground">Detailed analytics and operational insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}