"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { User, Mail, Phone, CreditCard, Edit, Save, X, RefreshCcw, Lock, Clock, Car } from "lucide-react"
import { AuthService, AuthUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface UserProfile {
  name: string
  surname: string
  email: string
  contact_details: string
  license: string
  availability_status: boolean
}

interface UserStats {
  totalRides: number
  activeRequests: number
  averageRating: number
  onTimeRate: string
  monthlyEarnings: string
}

// 🟢 New interface for Vehicle data
interface Vehicle {
  Vehicle_ID: number;
  Model: string;
  Plate_Number: string;
  Capacity: number;
  Driver_ID: number;
}

const initialFormData = {
  name: "",
  surname: "",
  email: "",
  contact_details: "",
  license: "",
  availability_status: false,
  current_password: "",
  new_password: "",
}

export function DriverProfile() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<UserStats>({
    totalRides: 0,
    activeRequests: 0,
    averageRating: 0,
    onTimeRate: "0%",
    monthlyEarnings: "R 0",
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  // 🟢 New state for vehicle information
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const fetchProfileAndStats = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !currentUser.driver_id) {
      router.push("/login");
      return;
    }

    setUser(currentUser);

    try {
      // 🟢 Added a new fetch call for vehicle data
      const [profileResponse, statsResponse, vehicleResponse] = await Promise.all([
        fetch(`/api/drivers-profile/${currentUser.driver_id}`),
        fetch(`/api/stats/driver/${currentUser.driver_id}`),
        fetch(`/api/vehicles?driverId=${currentUser.driver_id}`),
      ]);

      const profileData = await profileResponse.json();
      const statsData = await statsResponse.json();
      // 🟢 Adjusted vehicle data to handle the array response
      const vehicleData = await vehicleResponse.json();

      if (profileResponse.ok) {
        setFormData({
          ...initialFormData,
          name: profileData.name,
          surname: profileData.surname,
          email: profileData.email,
          contact_details: profileData.contact_details,
          license: profileData.license,
          availability_status: profileData.availability_status === 'Available',
        });
        setUser((prev) => (prev ? {
          ...prev,
          name: profileData.name,
          surname: profileData.surname,
          email: profileData.email,
          contact_details: profileData.contact_details,
          license: profileData.license,
          availability_status: profileData.availability_status === 'Available',
        } : null));
      } else {
        setError(profileData.message || "Failed to fetch driver profile.");
      }

      if (statsResponse.ok) {
        setStats(statsData.stats);
      } else {
        console.error("Failed to fetch driver stats:", statsData);
      }

      // 🟢 Handle the vehicle data and check for existence
      if (vehicleResponse.ok && vehicleData.length > 0) {
        setVehicle(vehicleData[0]); // The API returns an array, so we take the first item
      } else {
        console.error("No vehicle found for this driver or failed to fetch vehicle:", vehicleData);
        setVehicle(null);
      }
    } catch (e: any) {
      console.error("Error fetching data:", e);
      setError("Failed to fetch data due to a network error.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfileAndStats();
  }, [fetchProfileAndStats]);

  const handleEdit = () => {
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

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
        license: user.license || "",
        availability_status: user.availability_status || false,
      });
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ New validation function
  const validateForm = () => {
    const { email, contact_details, license, new_password } = formData;
    const errors: string[] = [];

    // Email validation
    if (!email.endsWith("@gmail.com")) {
      errors.push("Email must end with '@gmail.com'.");
    }

    // Phone number validation
    if (contact_details.length !== 10 || !contact_details.startsWith("0")) {
      errors.push("Phone number must be 10 digits and start with '0'.");
    }

    // Driver's license validation (e.g., ABC1234)
    const licenseRegex = /^[a-zA-Z]{3}\d{4}$/;
    if (!licenseRegex.test(license)) {
      errors.push("Driver's license must be 3 letters followed by 4 numbers (e.g., ABC1234).");
    }

    // Password validation
    if (showPasswordFields && new_password.trim() !== "") {
      const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
      if (!passwordRegex.test(new_password)) {
        errors.push("New password must be at least 6 characters long and include a number, a letter, and a special character.");
      }
    }

    if (errors.length > 0) {
      setError(errors.join(" ")); // Join all errors into a single string
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    if (!user?.driver_id) {
      setError("User not authenticated.");
      setIsSaving(false);
      return;
    }

    // ✅ Call the new validation function
    if (!validateForm()) {
      setIsSaving(false);
      return;
    }

    const payload = {
      driver_id: user.driver_id,
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      contact_details: formData.contact_details,
      license: formData.license,
      availability_status: formData.availability_status ? 'Available' : 'Not Available',
      current_password: showPasswordFields ? formData.current_password : undefined,
      new_password: showPasswordFields ? formData.new_password : undefined,
    };

    try {
      const response = await fetch(`/api/drivers-profile/${user.driver_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        AuthService.saveUser(result.user);
        setUser(result.user);
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        setShowPasswordFields(false);
      } else {
        // This handles the "Duplicate entry" error message from the backend
        setError(result.message || "Failed to update profile.");
      }
    } catch (apiError: any) {
      setError(apiError.message || "Failed to update profile due to a network error.");
      console.error("API Error:", apiError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Driver Profile
              </CardTitle>
              <CardDescription>Manage your personal information and driver details</CardDescription>
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
            {/* Personal Information */}
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
            </div>

            {/* Driver Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Driver Information</h3>
              <div className="space-y-2">
                <Label htmlFor="license">Driver's License</Label>
                <Input
                  id="license"
                  value={formData.license}
                  onChange={(e) => updateFormData("license", e.target.value)}
                  required
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Availability Status</span>
                </div>
                {isEditing ? (
                  <Switch
                    checked={formData.availability_status}
                    onCheckedChange={(checked) => updateFormData("availability_status", checked)}
                  />
                ) : (
                  <span
                    className={`px-2 py-1 rounded text-sm ${formData.availability_status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {formData.availability_status ? "Available" : "Not Available"}
                  </span>
                )}
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
                        required
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
                        required
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

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Assigned Vehicle
          </CardTitle>
          <CardDescription>Your current vehicle assignment</CardDescription>
        </CardHeader>
        <CardContent>
          {vehicle ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Registration:</span>
                  <span className="text-muted-foreground">{vehicle.Plate_Number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Type:</span>
                  <span className="text-muted-foreground">{vehicle.Model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Capacity:</span>
                  <span className="text-muted-foreground">{vehicle.Capacity} passengers</span>
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="default">
              <AlertTitle>No Vehicle Assigned</AlertTitle>
              <AlertDescription>
                You currently do not have a vehicle assigned to your profile. Please contact support.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Performance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Statistics</CardTitle>
          <CardDescription>Your driving performance and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {stats.totalRides ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Rides</div>
            </div>
            <div className="text-center p-4 bg-secondary/5 rounded-lg">
              <div className="text-2xl font-bold text-secondary">
                {stats.averageRating ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.monthlyEarnings ?? "R 0"}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Earnings</div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}