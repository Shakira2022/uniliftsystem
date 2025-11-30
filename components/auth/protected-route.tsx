"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService, type AuthUser } from "@/lib/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("student" | "driver" | "admin")[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles = [], redirectTo = "/login" }: ProtectedRouteProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser()

    if (!currentUser) {
      router.push(redirectTo)
      return
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
      // Redirect to appropriate dashboard based on user role
      switch (currentUser.role) {
        case "student":
          router.push("/student")
          break
        case "driver":
          router.push("/driver")
          break
        case "admin":
          router.push("/admin")
          break
        default:
          router.push("/")
      }
      return
    }

    setUser(currentUser)
    setIsLoading(false)
  }, [router, allowedRoles, redirectTo])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
