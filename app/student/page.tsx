import { ProtectedRoute } from "@/components/auth/protected-route"
import { StudentLayout } from "@/components/student/student-layout"
import { StudentDashboard } from "@/components/student/student-dashboard"


export default function StudentPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentLayout activeTab="dashboard">
        <StudentDashboard />
      </StudentLayout>
    </ProtectedRoute>
  )
}
