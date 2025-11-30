// /app/api/driver-reports/all-time-metrics/route.ts
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

export async function GET(req: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required." }, { status: 400 });
    }

    // Fetch total rides, total earnings, and average rating
    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT 
        COUNT(*) AS totalRides,
        SUM(estimated_cost) AS totalEarnings,
        AVG(rating) AS averageRating
      FROM request
      WHERE Driver_ID = ? AND RequestStatus = 'Completed'
      `,
      [driverId]
    );

    const metrics = rows[0] || { totalRides: 0, totalEarnings: 0, averageRating: 0 };

    return NextResponse.json({
      totalRides: metrics.totalRides ?? 0,
      totalEarnings: metrics.totalEarnings ?? 0,
      averageRating: metrics.averageRating ?? 0,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching driver metrics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
