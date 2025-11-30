// /app/api/requests/completed/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

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
 * Handles GET requests to count completed rides for a driver today.
 * URL: /api/requests/completed?driverId=...
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

    // 🟢 SQL query to count completed requests for today
    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS completed_count
      FROM request
      WHERE Driver_ID = ? 
      AND RequestStatus = 'Completed'
      AND DATE(updated_at) = CURDATE()
      `,
      [driverId]
    );

    const completedCount = rows[0].completed_count;

    return NextResponse.json({ count: completedCount }, { status: 200 });
  } catch (error: any) {
    console.error("Detailed Error fetching completed count:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch completed ride count.", details: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}