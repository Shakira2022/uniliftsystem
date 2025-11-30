// /app/api/requests/[id]/rate/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = params.id;

  if (!requestId) {
    return NextResponse.json({ error: "Missing request ID." }, { status: 400 });
  }

  let connection;
  try {
    const { rate } = await req.json();

    if (!rate || typeof rate !== "number" || rate < 1 || rate > 5) {
      return NextResponse.json(
        { error: "Invalid rating value (1-5)." },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Make sure the request exists and is completed
    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT rating FROM request WHERE request_id = ? AND RequestStatus = 'Completed'`,
      [requestId]
    );

    if (!existing.length) {
      return NextResponse.json(
        { error: "Ride not found or not completed." },
        { status: 404 }
      );
    }

    if (existing[0].rating !== null && existing[0].rating !== 0) {
      return NextResponse.json(
        { error: "This ride has already been rated." },
        { status: 409 }
      );
    }    

    // Update rating
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE request SET rating = ? WHERE request_id = ? AND RequestStatus = 'Completed'`,
      [rate, requestId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Failed to submit rating." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: `Rating submitted successfully for request ${requestId}.` },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Error rating ride:", err);
    return NextResponse.json({ error: "Server error.", details: err.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
