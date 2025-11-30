// app/api/stats/driver/[id]/ratings/route.ts

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

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const selectedYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT 
        MONTH(updated_at) AS month,
        AVG(rating) AS rating
      FROM request
      WHERE Driver_ID = ? AND RequestStatus = 'Completed'
        AND YEAR(updated_at) = ?
      GROUP BY MONTH(updated_at)
      ORDER BY MONTH(updated_at);
      `,
      [id, selectedYear]
    );

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyRatings = months.map((m, idx) => {
        const found = rows.find((r) => r.month === idx + 1);
        return {
          month: m,
          rating: found && found.rating !== null 
            ? parseFloat(Number(found.rating).toFixed(2)) 
            : 0, // default to 0 if no rating
        };
      });
      
    return NextResponse.json({ ratings: monthlyRatings }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch monthly ratings:", error);
    return NextResponse.json(
      { message: "Failed to fetch monthly ratings." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}