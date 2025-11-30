import { ProtectedRoute } from "@/components/auth/protected-route"
import { DriverLayout } from "@/components/driver/driver-layout"
import { DriverProfile } from "@/components/driver/driver-profile"

export default function DriverProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DriverLayout activeTab="profile">
        <DriverProfile />
      </DriverLayout>
    </ProtectedRoute>
  )
}
