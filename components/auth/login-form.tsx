"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, Mail, Lock } from "lucide-react"
import { AuthService } from "@/lib/auth"
import Link from "next/link"; // ✅ Import Link from 'next/link'
import { ArrowLeft } from "lucide-react"; // ✅ Import the back arrow icon

// LoginForm component that works for both students and staff
export function LoginForm({ type }: { type: "student" | "staff" }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const apiUrl = type === "student" ? "/api/login" : "/api/staff-login"

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Login failed")
      }

      const { user } = await response.json()
      AuthService.saveUser(user)

      if (user) {
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
          default:
            router.push("/")
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-primary font-heading">Sign In</h2>
        <p className="text-muted-foreground">Access your UniLift dashboard</p>
      </div>

      {/* Login Form */}
      <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@nwu.ac.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Forgot Password */}
          <div className="flex justify-between items-center">
            {/* ✅ Added a back button using a Link component */}
           
            <Link href="/forgot-password" passHref>
              <button type="button" className="text-sm text-accent hover:text-accent/80 transition-colors">
                Forgot password?
              </button>
            </Link>
          </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  )
  
}















