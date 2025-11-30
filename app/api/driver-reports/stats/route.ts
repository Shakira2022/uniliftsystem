// app/api/driver-reports/stats/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

// Create MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Muhle',
  database: 'uniliftdb',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const connection = await pool.getConnection();

    // 1. Total completed rides
    const [totalRidesResult] = await connection.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as totalRides FROM request WHERE Driver_ID = ? AND RequestStatus = ?',
      [id, 'Completed']
    );
    const totalRides = totalRidesResult[0]?.totalRides || 0;

    // 2. Average rating
    const [averageRatingResult] = await connection.execute<RowDataPacket[]>(
      'SELECT AVG(Rating) as averageRating FROM request WHERE Driver_ID = ? AND rating IS NOT NULL',
      [id]
    );
    const averageRating = parseFloat(averageRatingResult[0]?.averageRating || 0);

    // 3. Monthly earnings (completed rides * R75)
    const monthlyEarnings = totalRides * 75;

    connection.release();

    return NextResponse.json({
      totalRides,
      averageRating,
      totalEarnings: monthlyEarnings,
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return NextResponse.json({ error: 'Failed to fetch driver stats' }, { status: 500 });
  }
}
