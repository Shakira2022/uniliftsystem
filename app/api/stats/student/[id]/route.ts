// /app/api/stats/student/[id]/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

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
  { params }: { params: { id: string } } // match the dynamic route [id]
) {
  const stud_id = params.id;
  if (!stud_id)
    return NextResponse.json({ message: 'Student ID is required.' }, { status: 400 });

  let connection;
  try {
    connection = await pool.getConnection();

    // Total Completed Rides
    const [totalRidesResult] = await connection.execute(
      'SELECT COUNT(*) as totalRides FROM request WHERE stud_id = ? AND RequestStatus = ?',
      [stud_id, 'Completed']
    );
    const totalRides = (totalRidesResult as any)[0]?.totalRides || 0;

    // Active Requests (Pending, Assigned, In_Progress)
const [activeRequestsResult] = await connection.execute(
  `SELECT COUNT(*) as activeRequests 
   FROM request 
   WHERE stud_id = ? 
     AND RequestStatus IN ('Pending', 'Assigned', 'In_Progress')`,
  [stud_id]
);

    const activeRequests = (activeRequestsResult as any)[0]?.activeRequests || 0;

   // SQL to calculate average rating from completed rides
const [averageRatingResult] = await connection.execute(
  `SELECT AVG(rating) as averageRating
   FROM request
   WHERE Stud_ID = ? AND RequestStatus = 'Completed' AND rating IS NOT NULL`,
  [stud_id]
);

const averageRating = parseFloat(
  (averageRatingResult as any)[0]?.averageRating || 0
);


    return NextResponse.json(
      { stats: { totalRides, activeRequests, averageRating } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to fetch student stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student statistics.' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
