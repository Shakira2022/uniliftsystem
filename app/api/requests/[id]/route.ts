// /app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import { type Request as RideRequestType } from "@/lib/types";

// Create a connection pool to your MySQL database
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

// Helper function to format dates for MySQL's DATETIME column
function formatMySQLDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Handles PUT requests to update a ride request or submit a rating.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = params.id;
  const data = await req.json();
  const { pickup_time, pickup_location, destination, notes, rate, status } = data; // 🟢 ADDED `status`

  let connection;
  try {
    connection = await pool.getConnection();

    // --- 🟢 NEW: Driver-initiated status update ---
    if (status !== undefined) {
      if (typeof status !== 'string' || status.trim() === '') {
        return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
      }

      const [updateResult] = await connection.execute(
        `UPDATE request SET RequestStatus = ?, updated_at = ? WHERE Request_ID = ?`,
        [status, formatMySQLDate(new Date()), requestId]
      );

      if ((updateResult as any).affectedRows === 0) {
        return NextResponse.json(
          { error: 'Ride request not found or status is already the same.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: 'Ride status updated successfully.' },
        { status: 200 }
      );
    }
    // --- 🟢 END NEW BLOCK ---

    // --- Notification check ---
    const [requestRows] = await connection.execute<RowDataPacket[]>(
      `SELECT RequestStatus, Notified FROM request WHERE Request_ID = ? FOR UPDATE`,
      [requestId]
    );

    if (requestRows.length === 0) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const request = requestRows[0];
    const notifyStatuses = ["Pending", "Assigned", "In_progress"]; // 🟢 Corrected `In_progress`

    let notificationMessage: string | null = null;

    if (notifyStatuses.includes(request.RequestStatus) && request.Notified === 0) {
      // Trigger your notification logic here
      console.log(`Sending notification for request ${requestId} with status ${request.RequestStatus}`);
      notificationMessage = `Notification: Request is ${request.RequestStatus}`;

      // Mark Notified = TRUE
      await connection.execute(
        `UPDATE request SET Notified = 1 WHERE Request_ID = ?`,
        [requestId]
      );
    }

    // --- Rating update ---
    if (rate !== undefined) {
      if (typeof rate !== "number" || rate < 1 || rate > 5) {
        return NextResponse.json(
          { error: "Invalid rating value. Must be a number between 1 and 5." },
          { status: 400 }
        );
      }

      if (request.RequestStatus !== "Completed") {
        return NextResponse.json(
          { error: "Request not completed." },
          { status: 403 }
        );
      }

      if (request.rating !== null) {
        return NextResponse.json(
          { error: "This ride has already been rated." },
          { status: 409 }
        );
      }

      await connection.execute(
        `UPDATE request SET rating = ?, updated_at = ? WHERE request_id = ?`,
        [rate, formatMySQLDate(new Date()), requestId]
      );

      const [updatedRows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM request WHERE request_id = ?`,
        [requestId]
      );

      const row = updatedRows[0];
      const updatedRequest: RideRequestType = {
        id: row.request_id,
        student_id: row.student_id,
        driver_id: row.driver_id,
        pickup_time: row.PickupTime,
        pickup_location: row.PickupLocation,
        destination: row.Destination,
        notes: row.Notes ?? null,
        status: row.RequestStatus,
        rating: row.rating ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };

      return NextResponse.json(
        { message: "Rating submitted successfully.", request: updatedRequest, notification: notificationMessage },
        { status: 200 }
      );
    }

    // --- Normal ride update (from student) ---
    if (!pickup_time || !pickup_location || !destination) {
      return NextResponse.json(
        { error: "Missing required fields: pickup_time, pickup_location, destination." },
        { status: 400 }
      );
    }

    const [result] = await connection.execute(
      `UPDATE request 
        SET PickupTime = ?, PickupLocation = ?, Destination = ?, Notes = ?, updated_at = ? 
        WHERE request_id = ? AND RequestStatus IN ('Pending', 'Assigned')`,
      [
        formatMySQLDate(new Date(pickup_time)),
        pickup_location,
        destination,
        notes || null,
        formatMySQLDate(new Date()),
        requestId,
      ]
    );    

    const updateResult = result as unknown as { affectedRows: number };
    if (updateResult.affectedRows === 0) {
      const [existingRequest] = await connection.execute<RowDataPacket[]>(
        `SELECT request_id, RequestStatus FROM request WHERE request_id = ?`,
        [requestId]
      );
      if (existingRequest.length === 0) {
        return NextResponse.json({ error: "Request not found." }, { status: 404 });
      } else {
        return NextResponse.json(
          { error: "Request cannot be updated as its status is no longer 'Pending'." },
          { status: 403 }
        );
      }
    }

    const [updatedRequestRows] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM request WHERE request_id = ?`,
      [requestId]
    );

    const row = updatedRequestRows[0];
    const updatedRequest: RideRequestType = {
      id: row.request_id,
      student_id: row.student_id,
      driver_id: row.driver_id,
      pickup_time: row.PickupTime,
      pickup_location: row.PickupLocation,
      destination: row.Destination,
      notes: row.Notes ?? null,
      status: row.RequestStatus,
      rating: row.rating ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return NextResponse.json({ message: "Request updated successfully.", request: updatedRequest, notification: notificationMessage });

  } catch (error: any) {
    console.error("Detailed Error updating request:", error.message || error);
    return NextResponse.json(
      { error: "Failed to update ride request.", details: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// ... (DELETE function remains unchanged)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = params.id;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [requestRows] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM request WHERE request_id = ? FOR UPDATE`,
      [requestId]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const request = requestRows[0];

    if (request.RequestStatus === "Completed" || request.RequestStatus === "Cancelled") {
      await connection.rollback();
      return NextResponse.json(
        { error: "Request is already completed or cancelled and cannot be modified." },
        { status: 403 }
      );
    }

    const notifyStatuses = ["Pending", "Assigned", "In-Progress"];
    let notificationMessage: string | null = null;

    if (notifyStatuses.includes(request.RequestStatus) && request.Notified === 0) {
      // Trigger your notification logic here
      console.log(`Sending notification for cancelled request ${requestId} with status ${request.RequestStatus}`);
      notificationMessage = `Notification: Request is being cancelled (was ${request.RequestStatus})`;

      // Mark Notified = TRUE
      await connection.execute(
        `UPDATE request SET Notified = 1 WHERE Request_ID = ?`,
        [requestId]
      );
    }

    const driverId = request.driver_id;
    await connection.execute(
      `UPDATE request SET RequestStatus = 'Cancelled', updated_at = ? WHERE request_id = ?`,
      [formatMySQLDate(new Date()), requestId]
    );

    if (driverId) {
      await connection.execute(
        `UPDATE driver SET AvailabilityStatus = 'Available' WHERE driver_id = ?`,
        [driverId]
      );
    }

    await connection.commit();

    const [cancelledRequestRows] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM request WHERE request_id = ?`,
      [requestId]
    );

    const row = cancelledRequestRows[0];
    const cancelledRequest: RideRequestType = {
      id: row.request_id,
      student_id: row.student_id,
      driver_id: row.driver_id,
      pickup_time: row.PickupTime,
      pickup_location: row.PickupLocation,
      destination: row.Destination,
      notes: row.Notes ?? null,
      status: row.RequestStatus,
      rating: row.rating ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return NextResponse.json({
      message: "Request cancelled successfully.",
      request: cancelledRequest,
      notification: notificationMessage,
    });
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Detailed Error cancelling request:", error.message || error);
    return NextResponse.json(
      { error: "Failed to cancel ride request.", details: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// 🟢 NEW PATCH METHOD
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { status } = await request.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'Request ID and status are required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 🟢 Refactored update query without start_time and end_time logic
    const updateQuery = `
      UPDATE request
      SET RequestStatus = ?, updated_at = NOW()
      WHERE Request_ID = ?
    `;
    const queryParams = [status, id];

    const [result] = await connection.execute(
      updateQuery,
      queryParams
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Ride request not found or status is already the same.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Status updated successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to update request status:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}