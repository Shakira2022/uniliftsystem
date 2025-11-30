"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calendar, Download, TrendingUp, Users, Car, Clock, FileText, MapPin } from "lucide-react"

// Types for fetched reports
interface ReportsData {
  peakHours: { hour: number; volume: number }[]
  popularRoutes: { PickupLocation: string; Destination: string; volume: number }[]
  monthlyTrends: { month: string; rides: number; students: number }[]
  driverPerformance: { Driver_ID: number; Name: string; Surname: string; totalRides: number }[]
  vehicleStatus: { status: string; count: number }[]
}

export function AdminReports() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const response = await fetch("/api/reports")
        if (!response.ok) throw new Error("Failed to fetch reports data.")
        const result = await response.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchReportsData()
  }, [])

  const handleExportReport = async (reportType: string) => {
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;
  
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let yPos = 20;
  
      const primaryColor = "#1f2937"; // dark text
      const secondaryColor = "#e5e7eb"; // table header bg
  
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(primaryColor);
      pdf.text("UniLift Comprehensive Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;
  
      pdf.setFontSize(12);
      pdf.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, margin, yPos);
      yPos += 6;
      pdf.text(`Date Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 10;
  
      // ===== DRIVER PERFORMANCE =====
      if (data?.driverPerformance?.length) {
        pdf.setFontSize(14);
        pdf.text("Driver Performance", margin, yPos);
        yPos += 6;
  
        const driverHeaders = [["ID", "Driver Name", "Total Rides Completed"]];
        const driverBody = data.driverPerformance.map(d => [d.Driver_ID, `${d.Name} ${d.Surname}`, d.totalRides]);
  
        autoTable(pdf, {
          startY: yPos,
          head: driverHeaders,
          body: driverBody,
          theme: "grid",
          headStyles: { fillColor: secondaryColor, textColor: primaryColor, fontStyle: "bold" },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 80 },
            2: { cellWidth: 40, halign: "right" },
          },
          didDrawPage: (d) => {
            const pageCount = (pdf as any).internal.pages.length - 1;
            pdf.setFontSize(10);
            pdf.text(`Page ${d.pageNumber} of ${pageCount}`, pageWidth - margin, pdf.internal.pageSize.getHeight() - 10, { align: "right" });
          },
        });
        yPos = (pdf as any).lastAutoTable?.finalY + 10 || yPos + 10;
      }
  
      // ===== MONTHLY TRENDS =====
      if (data?.monthlyTrends?.length) {
        pdf.setFontSize(14);
        pdf.text("Monthly Ride Trends", margin, yPos);
        yPos += 6;
  
        const trendHeaders = [["Month", "Rides Completed", "Students Served"]];
        const trendBody = data.monthlyTrends.map(m => [m.month, m.rides, m.students]);
  
        autoTable(pdf, {
          startY: yPos,
          head: trendHeaders,
          body: trendBody,
          theme: "grid",
          headStyles: { fillColor: secondaryColor, textColor: primaryColor, fontStyle: "bold" },
        });
        yPos = (pdf as any).lastAutoTable?.finalY + 10 || yPos + 10;
      }
  
      // ===== PEAK HOURS =====
      if (data?.peakHours?.length) {
        pdf.setFontSize(14);
        pdf.text("Peak Hours Analysis", margin, yPos);
        yPos += 6;
  
        const peakHeaders = [["Hour", "Request Volume"]];
        const peakBody = data.peakHours.map(p => [`${p.hour}:00`, p.volume]);
  
        autoTable(pdf, {
          startY: yPos,
          head: peakHeaders,
          body: peakBody,
          theme: "grid",
          headStyles: { fillColor: secondaryColor, textColor: primaryColor, fontStyle: "bold" },
        });
        yPos = (pdf as any).lastAutoTable?.finalY + 10 || yPos + 10;
      }
  
      // ===== POPULAR ROUTES =====
      if (data?.popularRoutes?.length) {
        pdf.setFontSize(14);
        pdf.text("Most Popular Routes", margin, yPos);
        yPos += 6;
  
        const routeHeaders = [["Pickup Location", "Destination", "Request Volume"]];
        const routeBody = data.popularRoutes.map(r => [r.PickupLocation, r.Destination, r.volume]);
  
        autoTable(pdf, {
          startY: yPos,
          head: routeHeaders,
          body: routeBody,
          theme: "grid",
          headStyles: { fillColor: secondaryColor, textColor: primaryColor, fontStyle: "bold" },
        });
        yPos = (pdf as any).lastAutoTable?.finalY + 10 || yPos + 10;
      }
  
      // ===== VEHICLE STATUS =====
      if (data?.vehicleStatus?.length) {
        pdf.setFontSize(14);
        pdf.text("Vehicle Status Distribution", margin, yPos);
        yPos += 6;
  
        const vehicleHeaders = [["Status", "Count"]];
        const vehicleBody = data.vehicleStatus.map(v => [v.status, v.count]);
  
        autoTable(pdf, {
          startY: yPos,
          head: vehicleHeaders,
          body: vehicleBody,
          theme: "grid",
          headStyles: { fillColor: secondaryColor, textColor: primaryColor, fontStyle: "bold" },
        });
        yPos = (pdf as any).lastAutoTable?.finalY + 10 || yPos + 10;
      }
  
      // Footer note
      pdf.setFontSize(10);
      pdf.setTextColor("#6b7280");
      pdf.text("This report summarizes all key statistics of the UniLift platform.", margin, yPos);
  
      // Save
      pdf.save(`unilift-${reportType}-report.pdf`);
      alert(`PDF ${reportType} report exported successfully!`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Check console for details.");
    }
  };
  
  if (isLoading)
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Loading reports data...</p>
      </div>
    )

  if (error)
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error: {error}</p>
        <p>Please check your database connection and table schemas.</p>
      </div>
    )

  // Colors for vehicle status pie chart
  const statusColors: { [key: string]: string } = {
    Available: "#82ca9d",
    "In Use": "#8884d8",
  }

  // Transform vehicleStatus for PieChart
  const vehiclePieData =
    data?.vehicleStatus?.map((v) => ({
      name: v.status,
      value: Number(v.count ?? 0),
      color: statusColors[v.status] || "#ccc",
    })) ?? []

  // Transform popularRoutes for BarChart
  const formattedPopularRoutes =
    data?.popularRoutes.map((route) => ({
      name: `${route.PickupLocation} → ${route.Destination}`,
      volume: route.volume,
    })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Admin Reports</h2>
      </div>

      {/* Export Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" /> Export Reports
          </CardTitle>
          <CardDescription>Generate comprehensive reports for different time periods.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["daily", "weekly", "monthly", "custom"].map((type) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => handleExportReport(type)}
                className="h-20 flex-col gap-2 bg-transparent"
              >
                <Calendar className="h-6 w-6" />
                {type.charAt(0).toUpperCase() + type.slice(1)} Report
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports Container */}
      <div id="reports-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Monthly Ride Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Monthly Ride Trends
            </CardTitle>
            <CardDescription>Rides and students served per month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.monthlyTrends ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rides" fill="#8884d8" name="Rides" />
                <Bar dataKey="students" fill="#82ca9d" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Peak Hours Analysis
            </CardTitle>
            <CardDescription>Request volume by hour of the day.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.peakHours ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="volume" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vehicle Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5" /> Vehicle Status Distribution
            </CardTitle>
            <CardDescription>Distribution of vehicles by their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehiclePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {vehiclePieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Popular Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Most Popular Routes
            </CardTitle>
            <CardDescription>Top 5 most requested routes by volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart layout="vertical" data={formattedPopularRoutes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="volume" fill="#8884d8" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Driver Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Driver Performance
            </CardTitle>
            <CardDescription>Total rides completed by each driver.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Driver</th>
                    <th className="px-4 py-2 text-left">Total Rides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.driverPerformance.map((d) => (
                    <tr key={d.Driver_ID}>
                      <td className="px-4 py-2">{d.Name} {d.Surname}</td>
                      <td className="px-4 py-2">{d.totalRides}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
