"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts" // Removed LineChart and Line
import { Calendar, DollarSign, Star, RefreshCcw, Car, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { AuthService } from "@/lib/auth"
import { useRouter } from "next/navigation"

// Define the structure for the fetched data
interface DriverStats {
  totalRides: number
  totalEarnings: number
  averageRating: number
  // Updated: Added 'rating' property to the ridesTrend object
  ridesTrend: { month: string; rides: number; earnings: number; rating?: number | null }[]
  recentFeedback: { student: string; rating: number; comment: string; date: string }[]
  reviewsCount: number
}

// Initial state for stats, including default data for graphs and feedback
const initialStats: DriverStats = {
  totalRides: 0,
  totalEarnings: 0,
  averageRating: 0,
  reviewsCount: 0,
  ridesTrend: [
    { month: "Jan", rides: 0, earnings: 0, rating: null },
    { month: "Feb", rides: 0, earnings: 0, rating: null },
    { month: "Mar", rides: 0, earnings: 0, rating: null },
    { month: "Apr", rides: 0, earnings: 0, rating: null },
    { month: "May", rides: 0, earnings: 0, rating: null },
    { month: "Jun", rides: 0, earnings: 0, rating: null },
    { month: "Jul", rides: 0, earnings: 0, rating: null },
    { month: "Aug", rides: 0, earnings: 0, rating: null },
    { month: "Sep", rides: 0, earnings: 0, rating: null },
    { month: "Oct", rides: 0, earnings: 0, rating: null },
    { month: "Nov", rides: 0, earnings: 0, rating: null },
    { month: "Dec", rides: 0, earnings: 0, rating: null },
  ],
  recentFeedback: [],
}

export function DriverReports() {
  const router = useRouter()
  const [stats, setStats] = useState<DriverStats>(initialStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const currentUser = AuthService.getCurrentUser()
    if (!currentUser?.driver_id) {
      router.push("/login")
      return
    }

    try {
      const [mainStatsResponse, yearlyStatsResponse, monthlyRatingsResponse] = await Promise.all([
        fetch(`/api/stats/driver/${currentUser.driver_id}`),
        fetch(`/api/stats/driver/${currentUser.driver_id}/yearly?year=${selectedYear}`),
        fetch(`/api/stats/driver/${currentUser.driver_id}/ratings?year=${selectedYear}`), // New fetch call
      ])

      if (!mainStatsResponse.ok) {
        throw new Error("Failed to fetch driver stats")
      }
      if (!yearlyStatsResponse.ok) {
        throw new Error("Failed to fetch yearly stats")
      }
      if (!monthlyRatingsResponse.ok) {
        throw new Error("Failed to fetch monthly ratings")
      }

      const mainStatsData = await mainStatsResponse.json()
      const yearlyStatsData = await yearlyStatsResponse.json()
      const monthlyRatingsData = await monthlyRatingsResponse.json()

      // Combine the data from both yearly endpoints
      const combinedTrendData = (yearlyStatsData.yearly || []).map((item: any, index: number) => ({
        ...item,
        rating: monthlyRatingsData.ratings[index]?.rating,
      }));

      setStats(prev => ({
        ...prev,
        totalRides: mainStatsData.stats.totalRides,
        totalEarnings: mainStatsData.stats.monthlyEarnings,
        averageRating: mainStatsData.stats.averageRating,
        reviewsCount: mainStatsData.stats.reviewsCount,
        ridesTrend: combinedTrendData, // Use the combined data for the charts
        recentFeedback: mainStatsData.stats.recentFeedback || prev.recentFeedback,
      }))
    } catch (e: any) {
      console.error("Error fetching stats:", e)
      setError("Could not load performance data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [router, selectedYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading reports...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // Helper function to format currency using simple math
  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'R 0.00'
    const dollars = Math.floor(amount)
    const cents = Math.round((amount - dollars) * 100)
    const paddedCents = cents < 10 ? `0${cents}` : `${cents}`
    return `R ${dollars}.${paddedCents}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Performance Reports</h1>
          <p className="text-muted-foreground">Track your driving performance and earnings</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleYearChange(selectedYear - 1)}
            aria-label="Previous year"
            className="p-1 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            {selectedYear}
          </Badge>
          <button
            onClick={() => handleYearChange(selectedYear + 1)}
            aria-label="Next year"
            className="p-1 rounded-full hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Rides</p>
                <p className="text-2xl font-bold text-primary">{stats.totalRides}</p>
                <p className="text-xs text-muted-foreground">All-time rides</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalEarnings}</p>
                <p className="text-xs text-muted-foreground">Earnings to date</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
                <p className="text-xs text-muted-foreground">Based on {stats.reviewsCount} reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Performance (Bar Chart) - POPULATED WITH FETCHED DATA */}
      <Card>
        <CardHeader>
          <CardTitle>Yearly Performance for {selectedYear}</CardTitle>
          <CardDescription>Your monthly rides and earnings over the year</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.ridesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="rides" stroke="hsl(var(--primary))" />
              <YAxis yAxisId="earnings" orientation="right" stroke="hsl(var(--secondary))" />
              <Tooltip formatter={(value, name) => {
                if (name === "Earnings") return formatCurrency(value as number);
                return value;
              }} />
              <Bar yAxisId="rides" dataKey="rides" fill="hsl(var(--primary))" name="Rides" />
              <Bar yAxisId="earnings" dataKey="earnings" fill="hsl(var(--secondary))" name="Earnings" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Ride Trends (Bar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Ride Trends</CardTitle>
            <CardDescription>Number of rides completed each month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.ridesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rides" fill="hsl(var(--primary))" name="Rides" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Trends (Bar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Trends</CardTitle>
            <CardDescription>Your average rating over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.ridesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip formatter={(value) => `${value} Stars`} />
                <Bar dataKey="rating" fill="hsl(var(--accent))" name="Rating" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}