// app/api/drivers/[id]/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

// MySQL pool
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
  }

  try {
    const { status } = await request.json();
    
    // Validate the status input
    if (status !== 'Available' && status !== 'Not Available') {
      return NextResponse.json({ error: "Invalid status. Must be 'available' or 'not_available'." }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // 1. Check if the driver exists
      const [drivers] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM driver WHERE Driver_ID = ?`,
        [id]
      );

      if (drivers.length === 0) {
        connection.release();
        return NextResponse.json({ error: "Driver not found." }, { status: 404 });
      }

      // 2. Update the driver's availability status
      await connection.execute(
        `UPDATE driver SET AvailabilityStatus = ? WHERE Driver_ID = ?`,
        [status, id]
      );
      
      console.log(`Driver ${id} availability updated to ${status}.`);

      // 3. Return a success response
      return NextResponse.json({ message: `Driver availability updated to ${status}.` }, { status: 200 });
      
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      return NextResponse.json({ error: "Failed to update driver availability." }, { status: 500 });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Request processing failed:', error);
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}