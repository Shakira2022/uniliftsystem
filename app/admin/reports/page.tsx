import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminReports } from "@/components/admin/admin-reports"

export default function AdminReportsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout activeTab="reports">
        <AdminReports />
      </AdminLayout>
    </ProtectedRoute>
  )
}
