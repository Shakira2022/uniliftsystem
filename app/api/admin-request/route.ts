// /app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import { type Request as RideRequestType } from "@/lib/types";

// Create a connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Muhle",
  database: "uniliftdb",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET(req: NextRequest) {
  const driverId = req.nextUrl.searchParams.get("driverId");

  let connection;
  try {
    connection = await pool.getConnection();

    // Build query dynamically
    let query = `
      SELECT
        r.Request_ID,
        r.PickupLocation,
        r.Destination,
        r.RequestStatus,
        r.Stud_ID,
        r.Driver_ID,
        r.PickupTime,
        r.Notes,
        r.created_at,
        r.updated_at,
        s.StudentNo AS student_number,
        s.Name AS name,
        s.Surname AS surname,
        s.Email AS email,
        s.ContactDetails AS contact_details,
        CONCAT(res.Name, ', ', res.House_Number, ' ', res.Street_Name) AS res_address
      FROM
        request AS r
      INNER JOIN
        student AS s ON r.Stud_ID = s.Stud_ID
      INNER JOIN
        res_address AS res ON s.Res_ID = res.Res_ID
      WHERE
        r.RequestStatus IN ('Assigned', 'In_progress', 'Pending', 'Completed' ,'Cancelled')
    `;

    const params: any[] = [];

    if (driverId) {
      query += ` AND r.Driver_ID = ?`;
      params.push(driverId);
    }

    query += ` ORDER BY r.PickupTime ASC`;

    // Execute query
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);

    // Format results
    const formattedRequests: RideRequestType[] = rows.map((row) => ({
      id: row.Request_ID,
      student_id: row.Stud_ID,
      driver_id: row.Driver_ID,
      vehicle_id: undefined,
      pickup_time: row.PickupTime,
      pickup_location: row.PickupLocation,
      destination: row.Destination,
      status: row.RequestStatus,
      notes: row.Notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      rating: null,
      student: {
        id: row.Stud_ID,
        student_number: row.student_number,
        name: row.name,
        surname: row.surname,
        email: row.email,
        contact_details: row.contact_details,
        res_address: row.res_address,
      },
    }));

    return NextResponse.json(formattedRequests, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching ride requests:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch ride requests.", details: error.message || "Unknown error" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
