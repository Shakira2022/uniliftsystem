import { ProtectedRoute } from "@/components/auth/protected-route"
import { StudentLayout } from "@/components/student/student-layout"
import { RequestRideForm } from "@/components/student/request-ride-form"; // This is the corrected import path

export default function RequestRidePage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentLayout activeTab="request">
        <RequestRideForm />
      </StudentLayout>
    </ProtectedRoute>
  )
}
