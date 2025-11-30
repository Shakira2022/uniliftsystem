export interface Student {
  email: string
  id: number
  student_number: string
  name: string
  surname: string
  contact_details: string
  res_address: string
  created_at?: string; // make optional
  updated_at?: string; // make optional
}

export interface Driver {
  email: any
  vehicle_details: any
  id: number
  name: string
  surname: string
  license: string
  contact_details: string
  availability_status: boolean
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: number
  registration: string
  type: string
  capacity: number
  status: "available" | "in_use" | "maintenance"
  allocation?: string
  created_at: string
  updated_at: string
}

export interface Admin {
  id: number
  name: string
  surname: string
  contact_details: string
  id_number: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface Request {
  notes: string
  id: number
  student_id: number
  driver_id?: number
  vehicle_id?: number
  pickup_time: string
  pickup_location: string
  destination: string
  status: "Pending" | "Assigned" | "In_progress" | "Completed" | "Cancelled"
  created_at: string
  updated_at: string
  student?: Student
  driver?: Driver
  vehicle?: Vehicle
  rating: number | null; 
}

export interface User {
  id: number
  role: "student" | "driver" | "admin"
  name: string
  surname: string
}
