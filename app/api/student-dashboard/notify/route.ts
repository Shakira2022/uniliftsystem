// app/api/student-dashboard/notify/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Muhle",
  database: "uniliftdb",
  port: 3306,
});

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rideId = parseInt(searchParams.get("rideId")!, 10);

    if (isNaN(rideId)) {
      return NextResponse.json({ message: "Invalid ride ID" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
        await connection.execute(
            `UPDATE request 
             SET Notified = 1 
             WHERE Request_ID = ? AND RequestStatus = 'Completed'`,
            [rideId]
          );
          

      return NextResponse.json({ message: "Notification marked" }, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Failed to update Notified:", error);
    return NextResponse.json(
      { message: "Failed to update Notified" },
      { status: 500 }
    );
  }
}
