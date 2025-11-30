export interface Request {
  id: number
  student_id: number
  driver_id?: number
  vehicle_id?: number
  pickup_time: string
  pickup_location: string
  destination: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  
}

// Shared requests array that all API endpoints will use
export const requests: Request[] = [
  {
    id: 1,
    student_id: 1,
    driver_id: 1,
    vehicle_id: 1,
    pickup_time: "2025-01-20T08:00:00Z",
    pickup_location: "123 Student Village, Potchefstroom",
    destination: "NWU Campus",
    status: "assigned",
    notes: "",
    created_at: "2025-01-19T10:00:00Z",
    updated_at: "2025-01-19T10:30:00Z",
  },
  {
    id: 2,
    student_id: 1,
    pickup_time: "2025-01-20T16:30:00Z",
    pickup_location: "NWU Campus",
    destination: "123 Student Village, Potchefstroom",
    status: "pending",
    notes: "",
    created_at: "2025-01-19T14:00:00Z",
    updated_at: "2025-01-19T14:00:00Z",
  },
]

let nextId = 3

export function getNextId(): number {
  return nextId++
}
