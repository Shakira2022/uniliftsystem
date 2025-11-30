import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ManageDrivers } from "@/components/admin/manage-drivers"

export default function AdminDriversPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout activeTab="drivers">
        <ManageDrivers />
      </AdminLayout>
    </ProtectedRoute>
  )
}
