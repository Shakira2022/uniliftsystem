
//appp/api/admin-drivers
import { NextResponse } from 'next/server';
import mysql, { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { hash } from 'bcrypt';

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

// GET ALL DRIVERS
export async function GET() {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT
                Driver_ID AS id,
                Name AS name,
                Surname AS surname,
                Email AS email,
                License AS license,
                ContactDetails AS contact_details,
                AvailabilityStatus AS availability_status
             FROM driver`
        );
        
        const drivers = rows.map(row => ({
            ...row,
            // Convert the database string to a boolean for the frontend
            availability_status: row.availability_status === 'Available',
        }));
        
        return NextResponse.json(drivers, { status: 200 });
    } catch (error: any) {
        console.error('Failed to fetch drivers:', error);
        return NextResponse.json(
            { message: 'Failed to fetch driver data.' },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// CREATE A NEW DRIVER
// CREATE A NEW DRIVER
export async function POST(req: Request) {
    let connection: PoolConnection | null = null;
    try {
        const {
            name,
            surname,
            email,
            license,
            contact_details,
            availability_status,
        } = await req.json();

        connection = await pool.getConnection();

        // 🔎 Check if a driver with the same license, email, or contact number already exists
        const [existingDriver] = await connection.execute<RowDataPacket[]>(
            `SELECT Driver_ID FROM driver WHERE License = ? OR ContactDetails = ? OR Email = ?`,
            [license, contact_details, email]
        );

        if (existingDriver.length > 0) {
            return NextResponse.json(
                { message: "A driver with this license, email, or contact number already exists." },
                { status: 409 }
            );
        }

        // ✅ Use default password "12345" for all new drivers
        const defaultPassword = "12345";
        const hashedPassword = await hash(defaultPassword, 10);

        // 👤 Insert the new driver
        const [result] = await connection.execute(
            `INSERT INTO driver
                (Name, Surname, Email, License, ContactDetails, AvailabilityStatus, Password, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                surname,
                email,
                license,
                contact_details,
                availability_status ? 'Available' : 'Not Available',
                hashedPassword,
                'driver'
            ]
        );

        const newDriverId = (result as any).insertId;

        // 🔄 Attempt to auto-assign a vehicle (optional)
        const [vehicleRows] = await connection.execute<RowDataPacket[]>(
            `SELECT Vehicle_ID FROM vehicle WHERE assigned = 'N' LIMIT 1`
        );

        if (vehicleRows[0]) {
            const vehicleId = vehicleRows[0].Vehicle_ID;

            // Assign this driver to the vehicle
            await connection.execute(
                `UPDATE vehicle SET Driver_ID = ?, assigned = 'Y' WHERE Vehicle_ID = ?`,
                [newDriverId, vehicleId]
            );
        }

        // Fetch the newly created driver to return a complete object
        const [newDriverRow] = await connection.execute<RowDataPacket[]>(
            `SELECT
                Driver_ID AS id,
                Name AS name,
                Surname AS surname,
                Email AS email,
                License AS license,
                ContactDetails AS contact_details,
                AvailabilityStatus AS availability_status
             FROM driver WHERE Driver_ID = ?`,
            [newDriverId]
        );

        const newDriver = {
            ...newDriverRow[0],
            availability_status: newDriverRow[0].availability_status === 'Available',
        };

        return NextResponse.json(newDriver, { status: 201 });

    } catch (error: any) {
        console.error("Failed to add driver:", error);
        return NextResponse.json(
            { message: "Failed to add driver." },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}



// UPDATE AN EXISTING DRIVER
export async function PUT(req: Request) {
    let connection: PoolConnection | null = null;
    try {
        const {
            id,
            name,
            surname,
            email,
            license,
            contact_details,
            availability_status,
        } = await req.json();

        connection = await pool.getConnection();

        // 🔎 Check for a duplicate license, email, or contact number in other drivers
        const [duplicateCheck] = await connection.execute<RowDataPacket[]>(
            `SELECT Driver_ID FROM driver WHERE (License = ? OR ContactDetails = ? OR Email = ?) AND Driver_ID != ?`,
            [license, contact_details, email, id]
        );

        if (duplicateCheck.length > 0) {
            return NextResponse.json(
                { message: 'Another driver with this license, email, or contact number already exists.' },
                { status: 409 }
            );
        }

        // ✏️ Update the driver
        const [result] = await connection.execute(
            `UPDATE driver SET Name = ?, Surname = ?, Email = ?, License = ?, ContactDetails = ?, AvailabilityStatus = ? WHERE Driver_ID = ?`,
            [name, surname, email, license, contact_details, availability_status ? 'Available' : 'Not Available', id]
        );
        
        if ((result as any).affectedRows === 0) {
            return NextResponse.json({ message: "Driver not found." }, { status: 404 });
        }
        
        // Return the updated data to the frontend
        const updatedDriver = {
            id,
            name,
            surname,
            email,
            license,
            contact_details,
            availability_status,
        };

        return NextResponse.json(updatedDriver, { status: 200 });

    } catch (error: any) {
        console.error('Failed to update driver:', error);
        return NextResponse.json({ message: 'Failed to update driver.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE A DRIVER (and associated requests)
export async function DELETE(req: Request) {
    let connection: PoolConnection | null = null;
    try {
        const { id } = await req.json();

        connection = await pool.getConnection();

        // 1️⃣ Delete all requests linked to this driver
        await connection.execute(
            'DELETE FROM request WHERE Driver_ID = ?',
            [id]
        );

        // 2️⃣ Delete the driver
        const [result] = await connection.execute(
            'DELETE FROM driver WHERE Driver_ID = ?',
            [id]
        );

        if ((result as any).affectedRows === 0) {
            return NextResponse.json(
                { message: "Driver not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Driver and all associated requests deleted successfully." },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Failed to delete driver:", error);
        return NextResponse.json(
            { message: "Failed to delete driver." },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

