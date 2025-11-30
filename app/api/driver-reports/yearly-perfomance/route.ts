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
      return NextResponse.json({ error: 'Driver ID is required.' }, { status: 400 });
    }

    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT
          DATE_FORMAT(created_at, '%Y') AS year,
          COUNT(*) AS total_rides,
          SUM(estimated_cost) AS total_earnings
      FROM request
      WHERE Driver_ID = ? AND RequestStatus = 'Completed'
      GROUP BY year
      ORDER BY year ASC
      `,
      [driverId]
    );

    const yearlyPerformance = rows.map(row => ({
      year: row.year,
      rides: row.total_rides,
      earnings: row.total_earnings || 0, // Handle cases with no earnings
    }));
    
    return NextResponse.json(yearlyPerformance, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching yearly performance:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}