import { ProtectedRoute } from "@/components/auth/protected-route"
import { DriverLayout } from "@/components/driver/driver-layout"
import { DriverDashboard } from "@/components/driver/driver-dashboard"

export default function DriverPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DriverLayout activeTab="dashboard">
        <DriverDashboard />
      </DriverLayout>
    </ProtectedRoute>
  )
}
