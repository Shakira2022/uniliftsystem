// /app/api/vehicles/manage/route.ts

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

/**
 * Handles POST requests to add a new vehicle.
 */
export async function POST(req: NextRequest) {
    let connection;
    try {
        const { Model, Plate_Number, Capacity } = await req.json();

        if (!Model || !Plate_Number || !Capacity) {
            return NextResponse.json(
                { error: "Model, Plate Number, and Capacity are required." },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        const [result] = await connection.execute(
            `INSERT INTO vehicle (Model, Plate_Number, Capacity) VALUES (?, ?, ?)`,
            [Model, Plate_Number, Capacity]
        );

        const insertId = (result as any).insertId;
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT * FROM vehicle WHERE Vehicle_ID = ?`,
            [insertId]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error adding vehicle:", error);

        // ✅ Custom error for duplicate plate number
        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { error: "This plate number is already in use. Please make sure you are enting the correct plate number." },
                { status: 409 } // Conflict status code
            );
        }

        return NextResponse.json(
            { error: "Failed to add vehicle.", details: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}


/**
 * Handles GET requests to fetch all vehicles.
 * This is now the main GET route for the management page.
 */
export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT * FROM vehicle`
        );
        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching vehicles:", error);
        return NextResponse.json({ error: "Failed to fetch vehicles.", details: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


/**
 * Handles PUT requests to update a vehicle.
 */
export async function PUT(req: NextRequest) {
    let connection;
    try {
        const { Vehicle_ID, Model, Plate_Number, Capacity } = await req.json();

        if (!Vehicle_ID || !Model || !Plate_Number || !Capacity) {
            return NextResponse.json(
                { error: "Vehicle_ID, Model, Plate Number, and Capacity are required." },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        await connection.execute(
            `UPDATE vehicle SET Model = ?, Plate_Number = ?, Capacity = ? WHERE Vehicle_ID = ?`,
            [Model, Plate_Number, Capacity, Vehicle_ID]
        );

        const [updatedRows] = await connection.execute<RowDataPacket[]>(
            `SELECT * FROM vehicle WHERE Vehicle_ID = ?`,
            [Vehicle_ID]
        );

        return NextResponse.json(updatedRows[0], { status: 200 });
    } catch (error: any) {
        console.error("Error updating vehicle:", error);

        // ✅ Custom error for duplicate plate number
        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { error: "This plate number is already in use. Please make sure you are enting the correct plate number." },
                { status: 409 } // Conflict status code
            );
        }

        return NextResponse.json(
            { error: "Failed to update vehicle.", details: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}


/**
 * Handles DELETE requests to delete a vehicle.
 */
export async function DELETE(req: NextRequest) {
    let connection;
    try {
        const { Vehicle_ID } = await req.json();

        if (!Vehicle_ID) {
            return NextResponse.json({ error: "Vehicle_ID is required." }, { status: 400 });
        }

        connection = await pool.getConnection();
        
        const [result] = await connection.execute(
            `DELETE FROM vehicle WHERE Vehicle_ID = ?`,
            [Vehicle_ID]
        );

        const deleteResult = result as unknown as { affectedRows: number };
        if (deleteResult.affectedRows === 0) {
            return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "Vehicle deleted successfully." }, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting vehicle:", error);
        return NextResponse.json({ error: "Failed to delete vehicle.", details: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}