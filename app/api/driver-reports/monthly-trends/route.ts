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

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          COUNT(*) AS rides,
          AVG(rating) AS average_rating
      FROM request
      WHERE Driver_ID = ? AND RequestStatus = 'Completed' AND created_at >= ?
      GROUP BY month
      ORDER BY month ASC
      `,
      [driverId, sixMonthsAgo]
    );

    const monthlyTrends = rows.map(row => ({
      month: new Date(row.month).toLocaleString('default', { month: 'short' }),
      rides: row.rides,
      rating: row.average_rating !== null ? parseFloat(row.average_rating.toFixed(1)) : 0,
    }));
    
    return NextResponse.json(monthlyTrends, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching monthly trends:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}