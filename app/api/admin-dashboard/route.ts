// app/api/admin-dashboard/route.ts
import { NextResponse } from "next/server";
import mysql, { PoolConnection, RowDataPacket } from "mysql2/promise";

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

export async function GET(req: Request) {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // 1. Students
    const [studentCountRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_students FROM student`
    );
    const totalStudents = studentCountRows[0].total_students;

    // 2. Drivers (available only)
    const [driverCountRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS active_drivers 
       FROM driver 
       WHERE AvailabilityStatus = 'Available'`
    );
    const activeDrivers = driverCountRows[0].active_drivers;

    // 3. Pending requests
    const [pendingRequestsRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS pending_requests 
       FROM request 
       WHERE RequestStatus = 'Pending'`
    );
    const pendingRequests = pendingRequestsRows[0].pending_requests;

    // 4. Vehicles total
    const [vehicleCountRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_vehicles FROM vehicle`
    );
    const totalVehicles = vehicleCountRows[0].total_vehicles;

    // 5. Vehicle utilization
    // Vehicle Utilization (In Use vs Available)
const [vehicleUtilizationRows] = await connection.execute<RowDataPacket[]>(
    `SELECT 
        SUM(CASE WHEN assigned = 'Y' THEN 1 ELSE 0 END) AS in_use,
        SUM(CASE WHEN assigned = 'N' THEN 1 ELSE 0 END) AS available
     FROM vehicle`
  );
  
  const vehicleUtilization = {
    in_use: vehicleUtilizationRows[0].in_use || 0,
    available: vehicleUtilizationRows[0].available || 0,
  };
  

    // 6. Completed today
    const [completedTodayRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS completed_today 
       FROM request 
       WHERE RequestStatus = 'Completed'
         AND DATE(updated_at) = CURDATE()`
    );
    const completedToday = completedTodayRows[0].completed_today;

    // 7. Active requests
    const [activeRequestsRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS active_requests 
       FROM request 
       WHERE RequestStatus IN ('Assigned', 'In_progress')`
    );
    const activeRequests = activeRequestsRows[0].active_requests;

    // 8. Daily rides if filtered
    let dailyRides: { day: string; rides: number }[] = [];
    if (startDate && endDate) {
      const [dailyRidesRows] = await connection.execute<RowDataPacket[]>(
        `WITH RECURSIVE Dates (d) AS (
            SELECT ?
            UNION ALL
            SELECT d + INTERVAL 1 DAY FROM Dates WHERE d <= ?
        )
        SELECT
            DATE_FORMAT(d.d, '%a') AS day_name,
            COUNT(r.Request_ID) AS rides
        FROM Dates d
        LEFT JOIN request r ON DATE(r.updated_at) = d.d AND r.RequestStatus = 'Completed'
        GROUP BY d.d, day_name
        ORDER BY d.d ASC`,
        [startDate, endDate]
      );
      dailyRides = dailyRidesRows.map((row) => ({
        day: row.day_name,
        rides: row.rides,
      }));
    }

    // 9. Recent requests
    const [recentRequestsRows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          r.Request_ID AS id,
          r.RequestStatus AS status,
          r.PickupLocation AS pickup_location,
          r.Destination AS destination,
          r.created_at,
          s.Name AS student_name,
          d.Name AS driver_name
       FROM request r
       LEFT JOIN student s ON r.Stud_ID = s.Stud_ID
       LEFT JOIN driver d ON r.Driver_ID = d.Driver_ID
       ORDER BY r.created_at DESC
       LIMIT 10`
    );

    return NextResponse.json(
      {
        total_students: totalStudents,
        active_drivers: activeDrivers,
        total_vehicles: totalVehicles,
        pending_requests: pendingRequests,
        completed_today: completedToday,
        active_requests: activeRequests,
        daily_rides: dailyRides,
        recent_requests: recentRequestsRows,
        vehicle_utilization: vehicleUtilization
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data.", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
