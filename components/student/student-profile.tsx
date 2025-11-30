"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { User, Edit, Save, X, Lock, RefreshCcw } from "lucide-react"
import { AuthService, AuthUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface UserProfile {
  name: string
  surname: string
  email: string
  contact_details: string
  res_name?: string
  street_name?: string
  house_number?: string
  studentNo?: string
}

interface UserStats {
  totalRides: number
  activeRequests: number
  averageRating: number
}

// Ensure the initial form data has a place for all fields
const initialFormData = {
  name: "",
  surname: "",
  email: "",
  contact_details: "",
  res_name: "",
  street_name: "",
  house_number: "",
  studentNo: "",
  current_password: "",
  new_password: "",
  pickup_location: "", // <-- added
  destination: "", 
}

// Add studentNo to AuthUser interface to ensure type safety
interface AuthUserWithStudentNo extends AuthUser {
    studentNo?: string;
    res_name?: string;
    street_name?: string;
    house_number?: string;
}

export function StudentProfile() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUserWithStudentNo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [stats, setStats] = useState<UserStats>({
    totalRides: 0,
    activeRequests: 0,
    averageRating: 0,
  })

  // Add state for the password change checkbox
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

  const fetchProfileAndStats = useCallback(async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    const currentUser = AuthService.getCurrentUser()
    if (!currentUser || !currentUser.stud_id) {
      router.push("/login")
      return
    }

    // Set the initial user state based on the current user from auth service
    setUser(currentUser);

    try {
      const [profileResponse, statsResponse] = await Promise.all([
        fetch(`/api/student-profile/${currentUser.stud_id}`),
        fetch(`/api/stats/student/${currentUser.stud_id}`),
      ])

      const profileData = await profileResponse.json()
      const statsData = await statsResponse.json()

      if (profileResponse.ok) {
        // Update both formData and user state with the fetched data
        setFormData({
          ...initialFormData,
          name: profileData.Name,
          surname: profileData.Surname,
          email: profileData.Email,
          contact_details: profileData.ContactDetails,
          res_name: profileData.res_name,
          street_name: profileData.street_name,
          house_number: profileData.house_number,
          studentNo: profileData.StudentNo,
        });

        // Correctly update the user state with the student number
        setUser((prev) => (prev ? { 
          ...prev, 
          studentNo: profileData.StudentNo,
          res_name: profileData.res_name,
          street_name: profileData.street_name,
          house_number: profileData.house_number
        } : null));

      } else {
        setError(profileData.message || "Failed to fetch user profile.")
      }

      if (statsResponse.ok) {
        setStats(statsData.stats)
      } else {
        console.error("Failed to fetch user stats:", statsData)
      }
    } catch (e: any) {
      console.error("Error fetching data:", e)
      setError("Failed to fetch data due to a network error.")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchProfileAndStats()
  }, [fetchProfileAndStats])

  const handleEdit = () => {
    setIsEditing(true)
    setSuccess("")
    setError("")
  }

  const handleCancel = () => {
    setIsEditing(false);
    setSuccess("");
    setError("");
    setShowPasswordFields(false);
    
    if (user) {
      setFormData({
        ...initialFormData,
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        contact_details: user.contact_details || "",
        res_name: user.res_name || "",
        street_name: user.street_name || "",
        house_number: user.house_number || "",
        studentNo: user.studentNo || "",
      });
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    // Email validation: must end with "@gmail.com"
    if (formData.email && !formData.email.endsWith("@gmail.com")) {
      setError("Email must be a @gmail.com address.");
      return false;
    }

    // Phone number validation: must be 10 digits and start with 0
    const phoneRegex = /^0\d{9}$/;
    if (formData.contact_details && !phoneRegex.test(formData.contact_details)) {
      setError("Phone number must be 10 digits long and start with 0.");
      return false;
    }

    // Student number validation: exactly 8 digits
    const studentNoRegex = /^\d{8}$/;
    if (formData.studentNo && !studentNoRegex.test(formData.studentNo)) {
      setError("Student number must be exactly 8 digits.");
      return false;
    }

    // Password validation: at least 6 characters, including number, letter, and special character
    if (showPasswordFields) {
      if (!formData.current_password) {
        setError("Please enter your current password.");
        return false;
      }
      const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9]).{6,}$/
      if (!formData.new_password) {
        setError("New password cannot be empty.");
        return false;
      }
      if (!passwordRegex.test(formData.new_password)) {
        setError("New password must be at least 6 characters long and include a number, a letter, and a special character.");
        return false;
      }
    }
    return true;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")
    setSuccess("")

    if (!user?.stud_id) {
      setError("User not authenticated.")
      setIsSaving(false)
      return
    }

    if (!validateForm()) {
        setIsSaving(false);
        return;
    }

    // Construct the payload based on whether the password fields are shown
    const payload = {
      stud_id: user.stud_id,
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      contact_details: formData.contact_details,
      res_name: formData.res_name,
      street_name: formData.street_name,
      house_number: formData.house_number,
      studentNo: formData.studentNo,
      current_password: showPasswordFields ? formData.current_password : undefined,
      new_password: showPasswordFields ? formData.new_password : undefined,
    
      PickupLocation: formData.pickup_location, // user typed, leave as is
      Destination:
        formData.destination === "Residence"
          ? `${user?.res_name}, ${user?.street_name} ${user?.house_number}`
          : formData.destination,
    };
    

    try {
      const response = await fetch(`/api/student-profile/${user.stud_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        const updatedUser = result.user // <-- use the object from result
        AuthService.saveUser(updatedUser)
        setUser(updatedUser)                  
        setSuccess("Profile updated successfully!")
        setIsEditing(false)
        setShowPasswordFields(false) // Hide password fields after successful save
          // Update local state so the dashboard displays correct info
        setUser(updatedUser);
      } else {
        setError(result.message || "Failed to update profile.")
      }
    } catch (apiError: any) {
      setError(apiError.message || "Failed to update profile due to a network error.")
      console.error("API Error:", apiError)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Student Profile
              </CardTitle>
              <CardDescription>
                Manage your personal information and contact details
              </CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 mb-4">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">First Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    required
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Last Name</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) => updateFormData("surname", e.target.value)}
                    required
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentNo">Student Number</Label>
                <Input
                  id="studentNo"
                  value={formData.studentNo}
                  onChange={(e) => updateFormData("studentNo", e.target.value)}
                  required
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  required
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_details">Phone Number</Label>
                <Input
                  id="contact_details"
                  type="tel"
                  value={formData.contact_details}
                  onChange={(e) => updateFormData("contact_details", e.target.value)}
                  required
                  disabled={!isEditing}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="res_name">Residence Name</Label>
                      <Input
                        id="res_name"
                        value={formData.res_name}
                        onChange={(e) => updateFormData("res_name", e.target.value)}
                        required
                        disabled={!isEditing}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="street_name">Street Name</Label>
                      <Input
                        id="street_name"
                        value={formData.street_name}
                        onChange={(e) => updateFormData("street_name", e.target.value)}
                        required
                        disabled={!isEditing}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="house_number">House Number</Label>
                      <Input
                        id="house_number"
                        value={formData.house_number}
                        onChange={(e) => updateFormData("house_number", e.target.value)}
                        required
                        disabled={!isEditing}
                      />
                  </div>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <label className="flex items-center gap-2">
                    Change Password
                    <input
                      type="checkbox"
                      checked={showPasswordFields}
                      onChange={(e) => {
                        setShowPasswordFields(e.target.checked);
                        if (!e.target.checked) {
                          updateFormData("current_password", "");
                          updateFormData("new_password", "");
                        }
                      }}
                      className="h-4 w-4 text-primary"
                    />
                  </label>
                </h3>
                {showPasswordFields && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={formData.current_password}
                        onChange={(e) => updateFormData("current_password", e.target.value)}
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={formData.new_password}
                        onChange={(e) => updateFormData("new_password", e.target.value)}
                        placeholder="Enter your new password"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <span className="flex items-center">
                      <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>Your UniLift usage summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {stats.totalRides}
              </div>
              <div className="text-sm text-muted-foreground">Total Rides</div>
            </div>
            <div className="text-center p-4 bg-secondary/5 rounded-lg">
              <div className="text-2xl font-bold text-secondary">
                {stats.activeRequests}
              </div>
              <div className="text-sm text-muted-foreground">Active Requests</div>
            </div>
            <div className="text-center p-4 bg-accent/5 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {stats.averageRating}
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}