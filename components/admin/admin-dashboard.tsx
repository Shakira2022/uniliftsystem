"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, Car, Clock, TrendingUp, MapPin, Calendar, Loader2 } from "lucide-react"
import { AuthService } from "@/lib/auth"
import { useNotifications } from "@/components/ui/notification-provider"
import { realtimeService } from "@/lib/realtime"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

// Types
type VehicleUtilizationData = {
  name: string
  value: number
  color: string
}

export function AdminDashboard() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [dailyRides, setDailyRides] = useState<{ day: string; rides: number; }[]>([]);
  const [vehicleUtilization, setVehicleUtilization] = useState<VehicleUtilizationData[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalStudents: 0,
    activeDrivers: 0,
    totalVehicles: 0,
    pendingRequests: 0,
    completedToday: 0,
    activeRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const { addNotification } = useNotifications();

  // Date range for daily rides
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 6)),
    to: new Date(),
  });

  // Fetch dashboard stats including vehicle utilization
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin-dashboard");
      if (response.ok) {
        const data = await response.json();

        setSystemStats({
          totalStudents: data.total_students,
          activeDrivers: data.active_drivers,
          totalVehicles: data.total_vehicles,
          pendingRequests: data.pending_requests,
          completedToday: data.completed_today,
          activeRequests: data.active_requests,
        });

        setRecentRequests(data.recent_requests || []);

        // Update vehicle utilization for PieChart with defaults
        setVehicleUtilization([
          {
            name: "Available",
            value: Number(data.vehicle_utilization?.available ?? 0), // default 0
            color: "hsl(var(--secondary))"
          },
          {
            name: "In Use",
            value: Number(data.vehicle_utilization?.in_use ?? 0), // default 0
            color: "hsl(var(--primary))"
          }
        ]);
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching dashboard data:", error);
    }
  };

  // Fetch daily rides for selected date range
  const fetchDailyRides = async (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return;
    try {
      const start = range.from.toISOString().split('T')[0];
      const end = range.to.toISOString().split('T')[0];
      const response = await fetch(`/api/admin-dashboard?start_date=${start}&end_date=${end}`);
      if (response.ok) {
        const data = await response.json();
        setDailyRides(data.daily_rides || []);
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching daily rides:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true); // Start loading animation
      await Promise.all([
        fetchDashboardStats(),
        fetchDailyRides(dateRange)
      ]);
      setIsLoading(false); // Stop loading animation after all data is fetched
    };

    loadData();

    const unsubscribeRequests = realtimeService.subscribe("new-requests", (newRequest) => {
      console.log("[DEBUG] New request received:", newRequest);
      addNotification({
        title: "New Request",
        message: `${newRequest.student_name} requested a ride from ${newRequest.pickup_location}`,
        type: "info",
      });
      fetchDashboardStats();
      fetchDailyRides(dateRange);
    });

    return () => {
      unsubscribeRequests();
    };
  }, [addNotification, dateRange]);

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "In_progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-ZA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* --- HEADER --- */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-primary mb-2">Welcome to UniLift Admin Dashboard, {user?.name}!</h1>
            <p className="text-muted-foreground">
              Monitor and manage the entire transportation system from this central hub.
            </p>
          </div>

          {/* --- STATS CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Total Students</p>
                    <p className="text-2xl font-bold text-primary">{systemStats.totalStudents}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" /> +5% this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm font-medium">Active Drivers</p>
                    <p className="text-2xl font-bold text-secondary">{systemStats.activeDrivers}</p>
                    <p className="text-xs text-muted-foreground">of 15 total drivers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Pending Requests</p>
                    <p className="text-2xl font-bold text-accent">{systemStats.pendingRequests}</p>
                    <p className="text-xs text-muted-foreground">Awaiting assignment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Vehicles</p>
                    <p className="text-2xl font-bold text-orange-500">{systemStats.totalVehicles}</p>
                    <p className="text-xs text-red-600">1 in maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- DAILY RIDES & VEHICLE UTILIZATION --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Rides */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Daily Ride Statistics</CardTitle>
                    <CardDescription>Number of rides completed in the selected period</CardDescription>
                  </div>
                  <DatePickerWithRange date={dateRange} onDateChange={handleDateRangeChange} />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRides}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rides" fill="hsl(var(--primary))" name="Total Rides" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vehicle Utilization PieChart */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Utilization</CardTitle>
                <CardDescription>Current status of all vehicles in the fleet</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vehicleUtilization}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {vehicleUtilization.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* --- RECENT REQUESTS --- */}
          <div className="grid grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Recent Requests
                </CardTitle>
                <CardDescription>Latest transportation requests in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-scroll pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  {recentRequests.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent requests</p>
                    </div>
                  ) : (
                    recentRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Student: {request.student_name}</span>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.pickup_location} → {request.destination}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(request.created_at)}
                            {request.driver_name && <span className="ml-2">• Driver: {request.driver_name}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- QUICK ACTIONS --- */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="h-20 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  Manage Students
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Car className="h-6 w-6" />
                  Manage Drivers
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <MapPin className="h-6 w-6" />
                  Manage Vehicles
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Clock className="h-6 w-6" />
                  View All Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}