// app/api/driver-summary/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

// Database connection pool
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

/**
 * Calculates and returns today's summary for a driver.
 * Includes total rides, total hours worked, and total earnings.
 */
export async function GET(req: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required." }, { status: 400 });
    }

    connection = await pool.getConnection();

    // 🟢 Query to get total rides and total hours worked today
    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT
        COUNT(*) AS total_rides,
        SUM(TIME_TO_SEC(TIMEDIFF(updated_at, created_at))) AS total_seconds_worked
      FROM request
      WHERE Driver_ID = ?
        AND RequestStatus = 'Completed'
        AND DATE(updated_at) = CURDATE()
      `,
      [driverId]
    );

    const summary = rows[0];
    const totalRides = summary.total_rides || 0;
    const totalSecondsWorked = summary.total_seconds_worked || 0;

    // 🟢 Calculate Earnings: Assume a fixed rate per completed ride (e.g., R50)
    const ratePerRide = 75;
    const totalEarnings = totalRides * ratePerRide;

    // 🟢 Format Hours Worked
    const hours = Math.floor(totalSecondsWorked / 3600);
    const minutes = Math.floor((totalSecondsWorked % 3600) / 60);
    const formattedHoursWorked = `${hours}h ${minutes}m`;

    return NextResponse.json({
      totalRides,
      hoursWorked: formattedHoursWorked,
      totalEarnings,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Detailed Error fetching driver summary:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch driver summary.", details: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}