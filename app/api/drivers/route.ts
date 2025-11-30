import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, this would be a real database
const drivers = [
  {
    id: 1,
    name: "John",
    surname: "Smith",
    license: "DL001234",
    contact_details: "0987654321",
    availability_status: true,
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
  {
    id: 2,
    name: "Sarah",
    surname: "Johnson",
    license: "DL005678",
    contact_details: "0987654322",
    availability_status: true,
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
  {
    id: 3,
    name: "Michael",
    surname: "Brown",
    license: "DL009012",
    contact_details: "0987654323",
    availability_status: false,
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
]

export async function GET() {
  return NextResponse.json(drivers)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newDriver = {
      id: Math.max(...drivers.map((d) => d.id)) + 1,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    drivers.push(newDriver)
    return NextResponse.json(newDriver, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 })
  }
}
