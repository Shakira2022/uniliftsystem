"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, User, LogOut, Car, BarChart3, HelpCircle } from "lucide-react"
import { AuthService, AuthUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Define the new props for the child component
interface ChildProps {
    showHelp: boolean;
    onHelpClose: () => void;
}

// Update the children prop type to reflect the expected props
interface DriverLayoutProps {
    children: React.ReactElement<ChildProps>;
    activeTab: "dashboard" | "profile" | "reports";
}

export function DriverLayout({ children, activeTab }: DriverLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [user, setUser] = useState<AuthUser | null>(null)
    const router = useRouter()
    const [showHelp, setShowHelp] = useState(false)

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser()
        if (currentUser) {
            setUser(currentUser)
        } else {
            router.push("/login")
        }
    }, [router])

    const handleLogout = async () => {
        await AuthService.logout()
        router.push("/")
    }

    const handleHelpClose = () => setShowHelp(false)

    const navigation = [
        { name: "Dashboard", href: "/driver", icon: Home, key: "dashboard" },
        { name: "Profile", href: "/driver/profile", icon: User, key: "profile" },
        { name: "Reports", href: "/driver/reports", icon: BarChart3, key: "reports" },
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

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
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
                                        <span className="font-bold text-lg">UniLift Driver</span>
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
                        <Link href="/driver" className="flex items-center gap-2">
                            <Car className="h-6 w-6 text-primary" />
                            <span className="font-bold text-lg">UniLift Driver</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline text-sm text-muted-foreground">
                            Driver: {user?.name} {user?.surname}
                        </span>
                        <Button variant="ghost" onClick={() => setShowHelp(true)} className="flex items-center gap-1">
                            <HelpCircle className="h-4 w-4" />
                            <span className="hidden md:inline">Help</span>
                        </Button>
                        <Button variant="ghost" onClick={handleLogout} className="hidden md:flex">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto flex">
                <aside className="hidden md:flex w-64 flex-col border-r bg-muted/10 min-h-[calc(100vh-4rem)]">
                    <nav className="flex-1 space-y-2 p-4">
                        <NavigationItems />
                    </nav>
                </aside>

                <main className="flex-1 p-6">
                    {React.cloneElement(children, {
                        showHelp,
                        onHelpClose: handleHelpClose,
                    })}
                </main>
            </div>
        </div>
    )
}