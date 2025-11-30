"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Users, Car, MapPin, BarChart3, Clock, LogOut } from "lucide-react"
import { AuthService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab: "dashboard" | "students" | "drivers" | "vehicles" | "reports" | "requests"
}

export function AdminLayout({ children, activeTab }: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const user = AuthService.getCurrentUser()

  const handleLogout = async () => {
    await AuthService.logout()
    router.push("/")
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home, key: "dashboard" },
    { name: "Students", href: "/admin/students", icon: Users, key: "students" },
    { name: "Drivers", href: "/admin/drivers", icon: Car, key: "drivers" },
    { name: "Vehicles", href: "/admin/vehicles", icon: MapPin, key: "vehicles" },
    { name: "Requests", href: "/admin/requests", icon: Clock, key: "requests" },
    { name: "Reports", href: "/admin/reports", icon: BarChart3, key: "reports" },
  ]

  const NavigationItems = () => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.key
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 px-2 py-4 border-b">
                    <Car className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">UniLift Admin</span>
                  </div>
                  <nav className="flex-1 space-y-2 p-4">
                    <NavigationItems />
                  </nav>
                  <div className="p-4 border-t">
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/admin" className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">UniLift Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-muted-foreground">
              Admin: {user?.name} {user?.surname}
            </span>
            <Button variant="ghost" onClick={handleLogout} className="hidden md:flex">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/10 min-h-[calc(100vh-4rem)]">
          <nav className="flex-1 space-y-2 p-4">
            <NavigationItems />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}