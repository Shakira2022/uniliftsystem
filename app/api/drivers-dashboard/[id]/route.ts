// app/api/driver-dashboard/[driverId]/route.ts
import { NextResponse } from "next/server"
import mysql, { RowDataPacket } from "mysql2/promise"

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Muhle",
  database: "uniliftdb",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
})

// Interfaces
interface DriverRow extends RowDataPacket {
  Driver_ID: number
  Name: string
  Surname: string
  ContactDetails: string | null
  Email: string | null
}

interface RequestRow extends RowDataPacket {
  Request_ID: number
  PickupLocation: string
  Destination: string
  RequestStatus: string
  Stud_ID: number
  Driver_ID: number
  PickupTime: string
  Notes: string | null
  Rating: number | null
  Created_At: string
  Updated_At: string
  Notified: number
  student_name: string
  student_surname: string
  student_number: string
  contact_details: string
}

// 📡 Driver dashboard API
export async function GET(
  req: Request,
  { params }: { params: { driverId: string } }
) {
  const { driverId } = params

  if (!driverId) {
    return NextResponse.json(
      { message: "Driver ID is required." },
      { status: 400 }
    )
  }

  let connection
  try {
    connection = await pool.getConnection()

    // 1️⃣ Driver info
    const [driverRows] = await connection.execute<DriverRow[]>(
      `SELECT Driver_ID, Name, Surname, ContactDetails, Email 
       FROM driver WHERE Driver_ID = ?`,
      [driverId]
    )
    const driver = driverRows[0] || null

    // 2️⃣ Vehicle info
    const [vehicleRows] = await connection.execute<RowDataPacket[]>(
      `SELECT Vehicle_ID, Model, Plate_Number, Capacity, Driver_ID 
       FROM vehicle WHERE Driver_ID = ?`,
      [driverId]
    )
    const vehicle = vehicleRows[0] || null

    // 3️⃣ Requests assigned to driver
    const [requestsRows] = await connection.execute<RequestRow[]>(
      `SELECT r.Request_ID, r.PickupLocation, r.Destination, r.RequestStatus, 
              r.Stud_ID, r.Driver_ID, r.PickupTime, r.Notes, r.Rating, 
              r.Created_At, r.Updated_At, r.Notified,
              s.Name AS student_name, s.Surname AS student_surname, 
              s.StudentNo AS student_number, s.ContactDetails AS contact_details
       FROM request r
       JOIN student s ON r.Stud_ID = s.Stud_ID
       WHERE r.Driver_ID = ?
       ORDER BY r.Created_At DESC`,
      [driverId]
    )

    // 4️⃣ Active requests (statuses still ongoing)
    const activeStatuses = ["Assigned", "In_progress", "Pending"]
    const activeRequests = requestsRows.filter((r) =>
      activeStatuses.includes(r.RequestStatus)
    )

    // 5️⃣ Stats
    const totalRides = requestsRows.filter(
      (r) => r.RequestStatus === "Completed"
    ).length
    const ratings = requestsRows.filter((r) => r.Rating !== null).map((r) => r.Rating!)
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0
    const totalEarnings = totalRides * 50 // Example logic (R50/ride)

    // 6️⃣ Shape response
    const requests = requestsRows.map((r) => ({
      id: r.Request_ID,
      student_id: r.Stud_ID,
      driver_id: r.Driver_ID,
      pickup_location: r.PickupLocation,
      destination: r.Destination,
      status: r.RequestStatus,
      pickup_time: r.PickupTime,
      notes: r.Notes,
      updated_at: r.Updated_At,
      student: {
        name: r.student_name,
        surname: r.student_surname,
        student_number: r.student_number,
        contact_details: r.contact_details,
      },
      rating: r.Rating,
    }))

    return NextResponse.json(
      {
        driver: driver
          ? {
              id: driver.Driver_ID,
              name: driver.Name,
              surname: driver.Surname,
              contact_details: driver.ContactDetails,
              email: driver.Email,
            }
          : null,
        vehicle,
        requests,
        stats: {
          totalRides,
          activeRequests: activeRequests.length,
          averageRating,
          totalEarnings,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Driver dashboard error:", error)
    return NextResponse.json(
      { message: "Failed to fetch driver dashboard" },
      { status: 500 }
    )
  } finally {
    if (connection) connection.release()
  }
}
