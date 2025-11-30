// /app/api/vehicles/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

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

/**
 * Handles GET requests to fetch a vehicle associated with a driver_id.
 * URL: /api/vehicles?driverId=...
 */
export async function GET(req: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required." }, { status: 400 });
    }

    connection = await pool.getConnection();

    // Query to get vehicle details for the given driver_id
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT Vehicle_ID, Model, Plate_Number, Capacity, Driver_ID FROM vehicle WHERE Driver_ID = ?`,
      [driverId]
    );

    if (rows.length > 0) {
      // 🟢 CORRECTED: Return the vehicle data as an array
      return NextResponse.json(rows, { status: 200 });
    } else {
      // No vehicle found for the driver
      return NextResponse.json({ error: "No vehicle found for this driver." }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Detailed Error fetching vehicle:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle data.", details: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// 🟢 DELETE function (optional, but good practice for a complete route)
// This could be used to un-assign a vehicle from a driver.
export async function DELETE(req: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get("driverId");

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required." }, { status: 400 });
    }

    connection = await pool.getConnection();

    // 🟢 Query to set the Driver_ID to NULL for the given driver's vehicle
    const [result] = await connection.execute(
      `UPDATE vehicle SET Driver_ID = NULL WHERE Driver_ID = ?`,
      [driverId]
    );

    const updateResult = result as unknown as { affectedRows: number };
    if (updateResult.affectedRows === 0) {
      return NextResponse.json({ error: "No vehicle found to delete." }, { status: 404 });
    }

    return NextResponse.json({ message: "Vehicle unassigned successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Detailed Error unassigning vehicle:", error.message || error);
    return NextResponse.json(
      { error: "Failed to unassign vehicle.", details: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}