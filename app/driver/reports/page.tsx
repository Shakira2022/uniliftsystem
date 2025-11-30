import { ProtectedRoute } from "@/components/auth/protected-route"
import { DriverLayout } from "@/components/driver/driver-layout"
import { DriverReports } from "@/components/driver/driver-reports"

export default function DriverReportsPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DriverLayout activeTab="reports">
        <DriverReports />
      </DriverLayout>
    </ProtectedRoute>
  )
}
