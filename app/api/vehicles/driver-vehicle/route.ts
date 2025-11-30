// /app/api/vehicles/driver-vehicle/route.ts (Renamed file)

import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

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

export async function GET(req: NextRequest) {
    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.execute<RowDataPacket[]>(
            `
            SELECT 
                v.Vehicle_ID,
                v.Model,
                v.Plate_Number,
                v.Capacity,
                v.Driver_ID,
                d.Driver_ID AS d_id,
                d.Name AS d_name,
                d.Surname AS d_surname,
                d.Email,
                d.License,
                d.ContactDetails,
                d.AvailabilityStatus
            FROM vehicle v
            LEFT JOIN driver d ON v.Driver_ID = d.Driver_ID
            `
        );

        const vehicles = rows.map((row) => ({
            Vehicle_ID: row.Vehicle_ID,
            Model: row.Model,
            Plate_Number: row.Plate_Number,
            Capacity: row.Capacity,
            Driver_ID: row.Driver_ID,
            driver: row.d_id
                ? {
                      id: row.d_id,
                      name: row.d_name,
                      surname: row.d_surname,
                      email: row.Email,
                      license: row.License,
                      contact_details: row.ContactDetails,
                      availability_status: !!row.AvailabilityStatus,
                      vehicle_details: null,
                      created_at: "",  // just set empty string if you need it
                      updated_at: "",  // same here
                  }
                : null,
        }));        

        return NextResponse.json(vehicles, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching vehicles:", error.message || error);
        return NextResponse.json(
            { error: "Failed to fetch vehicles", details: error.message || "Unknown error" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}


export async function DELETE(req: NextRequest) {
    let connection;
    try {
        const { searchParams } = new URL(req.url);
        const driverId = searchParams.get("driverId");

        if (!driverId) {
            return NextResponse.json({ error: "Driver ID is required." }, { status: 400 });
        }

        connection = await pool.getConnection();

        const [result] = await connection.execute(
            `UPDATE vehicle SET Driver_ID = NULL WHERE Driver_ID = ?`,
            [driverId]
        );

        const updateResult = result as unknown as { affectedRows: number };
        if (updateResult.affectedRows === 0) {
            return NextResponse.json({ error: "No vehicle found to unassign." }, { status: 404 });
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