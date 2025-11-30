// app/api/admin-drivers/availability/route.ts

import { NextResponse } from 'next/server';
import mysql, { PoolConnection } from 'mysql2/promise';

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
 * Handles PATCH requests to update a driver's availability status.
 * This is a dedicated endpoint for partial updates.
 */
export async function PATCH(req: Request) {
    let connection: PoolConnection | null = null;
    try {
        const { id, availability_status } = await req.json();

        if (id === undefined || availability_status === undefined) {
            return NextResponse.json({ message: "ID and status are required." }, { status: 400 });
        }

        connection = await pool.getConnection();

        // Convert boolean to a string as per your database schema
        const statusString = availability_status ? 'Available' : 'Not Available';

        const [result] = await connection.execute(
            `UPDATE driver SET AvailabilityStatus = ? WHERE Driver_ID = ?`,
            [statusString, id]
        );

        const affectedRows = (result as any).affectedRows;

        if (affectedRows === 0) {
            return NextResponse.json({ message: "Driver not found or status is already the same." }, { status: 404 });
        }
        
        // Fetch the updated driver data to return it in the response
        const [updatedDriverRows] = await connection.execute(
            `SELECT Driver_ID as id, Name as name, Surname as surname, License as license, ContactDetails as contact_details, Email as email, CASE WHEN AvailabilityStatus = 'Available' THEN TRUE ELSE FALSE END as availability_status FROM driver WHERE Driver_ID = ?`,
            [id]
        );
        const updatedDriver = (updatedDriverRows as any)[0];
        
        return NextResponse.json(updatedDriver, { status: 200 });

    } catch (error: any) {
        console.error('Failed to update driver availability:', error);
        return NextResponse.json(
            { message: "Failed to update driver availability. Please check server logs." },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}