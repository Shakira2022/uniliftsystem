import { ProtectedRoute } from "@/components/auth/protected-route"
import { StudentLayout } from "@/components/student/student-layout"
import { StudentProfile } from "@/components/student/student-profile"

export default function StudentProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentLayout activeTab="profile">
        <StudentProfile />
      </StudentLayout>
    </ProtectedRoute>
  )
}
