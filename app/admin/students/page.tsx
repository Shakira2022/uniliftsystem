import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ManageStudents } from "@/components/admin/manage-students"

export default function AdminStudentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout activeTab="students">
        <ManageStudents />
      </AdminLayout>
    </ProtectedRoute>
  )
}
