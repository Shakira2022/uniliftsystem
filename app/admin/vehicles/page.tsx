import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ManageVehicles } from "@/components/admin/manage-vehicles"

export default function AdminVehiclesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout activeTab="vehicles">
        <ManageVehicles />
      </AdminLayout>
    </ProtectedRoute>
  )
}
