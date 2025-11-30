"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "" as "student" | "driver",
    student_number: "",
    license: "",
    contact_details: "",
    res_name: "",
    street_name: "",
    house_number: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // 1. Password and Role Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    if (!formData.role) {
      setError("Please select a role.")
      setIsLoading(false)
      return
    }

    // 2. Email Validation: must end with '@gmail.com'
    if (!formData.email.endsWith("@gmail.com")) {
      setError("Email must end with '@gmail.com'.")
      setIsLoading(false)
      return
    }

    // 3. Password Validation: at least 6 characters, including a number, a letter, and a special character
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<,>.?/~`]).{6,}$/
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 6 characters and include a letter, a number, and a special character.")
      setIsLoading(false)
      return
    }

    // 4. Contact Number Validation: 10 digits starting with '0'
    const contactRegex = /^0\d{9}$/
    if (!contactRegex.test(formData.contact_details)) {
      setError("Contact number must be 10 digits and start with '0'.")
      setIsLoading(false)
      return
    }

    // 5. Role-specific validation
    if (formData.role === "student") {
      // Student Number Validation: 8 digits
      const studentNumberRegex = /^\d{8}$/
      if (!studentNumberRegex.test(formData.student_number)) {
        setError("Student number must be exactly 8 digits.")
        setIsLoading(false)
        return
      }
    } else if (formData.role === "driver") {
      // Driver's License Validation: 3 letters followed by 4 digits
      const licenseRegex = /^[A-Z]{3}\d{4}$/
      if (!licenseRegex.test(formData.license)) {
        setError("Driver's license must start with 3 capital letters followed by 4 digits (e.g., ABC1234).")
        setIsLoading(false)
        return
      }
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      switch (formData.role) {
        case "student":
          router.push("/student");
          break;
        case "driver":
          router.push("/driver");
          break;
        default:
          router.push("/");
      }

    } catch (apiError: any) {
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Join UniLift</CardTitle>
        <CardDescription>Create your account to start using our transportation service</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">First Name</Label>
              <Input
                id="name"
                placeholder="John"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Last Name</Label>
              <Input
                id="surname"
                placeholder="Doe"
                value={formData.surname}
                onChange={(e) => updateFormData("surname", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@nwu.ac.za"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => updateFormData("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === "student" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="student_number">Student Number</Label>
                <Input
                  id="student_number"
                  placeholder="12345678"
                  value={formData.student_number}
                  onChange={(e) => updateFormData("student_number", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="res_name">Residence Name</Label>
                <Input
                  id="res_name"
                  placeholder="University Residence"
                  value={formData.res_name}
                  onChange={(e) => updateFormData("res_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street_name">Street Name</Label>
                <Input
                  id="street_name"
                  placeholder="Street name"
                  value={formData.street_name}
                  onChange={(e) => updateFormData("street_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="house_number">House Number</Label>
                <Input
                  id="house_number"
                  placeholder="123"
                  value={formData.house_number}
                  onChange={(e) => updateFormData("house_number", e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {formData.role === "driver" && (
            <div className="space-y-2">
              <Label htmlFor="license">Driver's License</Label>
              <Input
                id="license"
                placeholder="DL123456"
                value={formData.license}
                onChange={(e) => updateFormData("license", e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="contact_details">Contact Number</Label>
            <Input
              id="contact_details"
              placeholder="0123456789"
              value={formData.contact_details}
              onChange={(e) => updateFormData("contact_details", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}