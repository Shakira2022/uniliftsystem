import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, this would be a real database
const vehicles = [
  {
    id: 1,
    registration: "NWU001GP",
    type: "Minibus",
    capacity: 14,
    status: "available",
    allocation: "Campus Route A",
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
  {
    id: 2,
    registration: "NWU002GP",
    type: "Minibus",
    capacity: 14,
    status: "in_use",
    allocation: "Campus Route B",
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
  {
    id: 3,
    registration: "NWU003GP",
    type: "Bus",
    capacity: 35,
    status: "available",
    allocation: "Main Campus Route",
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
  {
    id: 4,
    registration: "NWU004GP",
    type: "Minibus",
    capacity: 14,
    status: "maintenance",
    allocation: "Out of Service",
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:00:00Z",
  },
]

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const vehicleIndex = vehicles.findIndex((v) => v.id === id)

    if (vehicleIndex === -1) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    vehicles.splice(vehicleIndex, 1)
    return NextResponse.json({ message: "Vehicle deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()
    const vehicleIndex = vehicles.findIndex((v) => v.id === id)

    if (vehicleIndex === -1) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    vehicles[vehicleIndex] = {
      ...vehicles[vehicleIndex],
      ...body,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(vehicles[vehicleIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 })
  }
}
