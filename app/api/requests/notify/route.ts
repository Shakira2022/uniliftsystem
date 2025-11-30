// app/api/student-dashboard/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id)
    return NextResponse.json(
      { message: 'Student ID is required.' },
      { status: 400 }
    );

  let connection;
  try {
    connection = await pool.getConnection();

    // 1️⃣ Fetch student profile
    const [profileRows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          Stud_ID,
          StudentNo,
          Name,
          Surname
       FROM student
       WHERE Stud_ID = ?`,
      [id]
    );

    if (profileRows.length === 0) {
      return NextResponse.json(
        { message: 'Student not found.' },
        { status: 404 }
      );
    }

    const student = profileRows[0];

    // 2️⃣ Fetch only requests that are Completed and not yet notified
    const [requestsRows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          Request_ID AS id,
          Stud_ID AS student_id,
          Driver_ID AS driver_id,
          PickupTime AS pickup_time,
          PickupLocation AS pickup_location,
          Destination AS destination,
          Notes AS notes,
          RequestStatus AS status,
          Rating AS rating,
          Notified AS notified,
          Created_At AS created_at,
          Updated_At AS updated_at
       FROM request
       WHERE Stud_ID = ? AND RequestStatus = 'Completed' AND Notified = 0
       ORDER BY Created_At DESC;`,
      [id]
    );

    const requests = requestsRows;

    // 3️⃣ Calculate dashboard stats from all requests (not just unnotified)
    const [allRequestsRows] = await connection.execute<RowDataPacket[]>(
      `SELECT
          Request_ID AS id,
          RequestStatus AS status,
          Rating AS rating
       FROM request
       WHERE Stud_ID = ?`,
      [id]
    );

    const allRequests = allRequestsRows;

    const totalRides = allRequests.filter(req => req.status === 'Completed').length;
    const activeRequests = allRequests.filter(req =>
      ['Pending', 'Assigned', 'In_Progress'].includes(req.status)
    ).length;

    const completedRequestsWithRating = allRequests.filter(
      req => req.status === 'Completed' && req.rating !== null
    );
    const sumRatings = completedRequestsWithRating.reduce(
      (sum, req) => sum + req.rating,
      0
    );
    const averageRating =
      completedRequestsWithRating.length > 0
        ? sumRatings / completedRequestsWithRating.length
        : 0;

    // 4️⃣ Return combined response
    return NextResponse.json(
      {
        profile: {
          stud_id: student.Stud_ID,
          studentNo: student.StudentNo,
          name: student.Name,
          surname: student.Surname,
        },
        stats: { totalRides, activeRequests, averageRating },
        requests: requests, // only Completed & Notified = 0
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to fetch student dashboard data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student dashboard.' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    const { id } = params;
    if (!id) return NextResponse.json({ message: "Request ID required" }, { status: 400 });
  
    let connection;
    try {
      connection = await pool.getConnection();
  
      const [result] = await connection.execute(
        `UPDATE request SET Notified = 1 WHERE Request_ID = ?`,
        [id]
      );
  
      return NextResponse.json({ message: "Notified updated" });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ message: "Failed to update notified" }, { status: 500 });
    } finally {
      if (connection) connection.release();
    }
  }