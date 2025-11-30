// app/api/drivers/[driverId]/profile/route.ts
import { NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

// Create a connection pool to your MySQL database
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

/**
 * Handles GET requests to fetch a driver's name and surname by their ID.
 * URL: /api/drivers/[driverId]/profile
 */
export async function GET(req: Request, { params }: { params: { driverId: string } }) {
    const { driverId } = params;

    if (!driverId) {
        return NextResponse.json({ error: "Driver ID is required." }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        // 🟢 Query to get only the name and surname
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT Name, Surname FROM driver WHERE Driver_ID = ?`,
            [driverId]
        );

        if (rows.length > 0) {
            const driver = rows[0];
            return NextResponse.json({ 
                name: driver.Name, 
                surname: driver.Surname 
            }, { status: 200 });
        } else {
            return NextResponse.json({ error: "Driver not found." }, { status: 404 });
        }

    } catch (error: any) {
        console.error("Detailed Error fetching driver profile:", error.message || error);
        return NextResponse.json(
            { error: "Failed to fetch driver profile.", details: error.message || "An unknown error occurred." },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}