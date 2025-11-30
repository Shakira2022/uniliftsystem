// /app/api/stats/driver/[id]/route.ts
import { NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Muhle',
  database: 'uniliftdb',
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
    return NextResponse.json({ message: 'Driver ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Total Completed Rides
    const [totalRidesResult] = await connection.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as totalRides FROM request WHERE Driver_ID = ? AND RequestStatus = ?',
      [id, 'Completed']
    );
    const totalRides = totalRidesResult[0]?.totalRides || 0;

    // 2. Average Rating
    const [averageRatingResult] = await connection.execute<RowDataPacket[]>(
      'SELECT AVG(Rating) as averageRating FROM request WHERE Driver_ID = ? AND rating IS NOT NULL',
      [id]
    );
    const averageRating = parseFloat(averageRatingResult[0]?.averageRating || 0).toFixed(1);

    // 3. On-Time Rate (This column does not exist, so we return a static value)
    const onTimeRate = 'N/A';

    // 4. Monthly Earnings: Calculate based on total completed rides * R75
    const monthlyEarnings = totalRides * 75;

    return NextResponse.json(
      {
        stats: {
          totalRides,
          averageRating,
          onTimeRate,
          monthlyEarnings: `R ${monthlyEarnings.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to fetch driver stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch driver statistics.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}