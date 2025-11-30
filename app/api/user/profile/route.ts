import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get user from session/auth - for now using mock data
    // In a real app, you'd get this from your auth system
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock user data - in real app, fetch from database based on auth
    const mockUser = {
      id: 1,
      name: "John Doe",
      email: "john.doe@nwu.ac.za",
      student_number: "12345678",
      res_address: "Residence A, Room 101, North-West University",
      phone: "+27 12 345 6789",
      role: "student",
    }

    return NextResponse.json(mockUser)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Mock update - in real app, update database
    console.log("Updating user profile:", body)

    return NextResponse.json({
      message: "Profile updated successfully",
      user: body,
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
