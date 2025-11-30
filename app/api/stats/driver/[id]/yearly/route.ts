import { NextResponse } from "next/server";
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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { message: "Driver ID is required." },
      { status: 400 }
    );
  }

  // Step 1: Extract the 'year' query parameter from the request URL
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  
  // Step 2: Use the year from the URL, or default to the current year
  const selectedYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  let connection;
  try {
    connection = await pool.getConnection();

    // Step 3: Use the selectedYear parameter in the SQL query
    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT 
        MONTH(updated_at) AS month,
        COUNT(*) AS rides,
        COUNT(*) * 75 AS earnings
      FROM request
      WHERE Driver_ID = ? AND RequestStatus = 'Completed'
        AND YEAR(updated_at) = ?
      GROUP BY MONTH(updated_at)
      ORDER BY MONTH(updated_at);
      `,
      [id, selectedYear] // Pass the selectedYear variable to the query
    );

    // Fill in missing months with 0s
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyData = months.map((m, idx) => {
        const found = rows.find((r) => r.month === idx + 1);
        return {
          month: m,
          rides: found ? found.rides : 0,
          earnings: found ? found.earnings : 0,
        };
      });
      
    return NextResponse.json({ yearly: monthlyData }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch yearly stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch yearly statistics." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}