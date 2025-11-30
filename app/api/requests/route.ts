// /app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import { type Request as RideRequestType, type Student } from "@/lib/types";

// Create a connection pool
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

// Define a type for the incoming request data
type RideRequestData = {
    student_id: string;
    pickup_location: string;
    pickup_time: string;
    destination: string;
    notes?: string;
};

/**
 * Handles GET requests to fetch all ride requests for a specific driver.
 */
// /app/api/requests/route.ts
// ... (existing imports and pool connection) ...

/**
 * Handles GET requests to fetch all ride requests for a specific driver.
 */
export async function GET(req: NextRequest) {
    const driverId = req.nextUrl.searchParams.get("driverId");

    if (!driverId) {
        return NextResponse.json({ error: "Driver ID is required." }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.execute<RowDataPacket[]>(
            `
            SELECT
    r.Request_ID,
    r.PickupLocation,
    r.Destination,
    r.RequestStatus,
    r.Stud_ID,
    r.Driver_ID,
    r.PickupTime,
    r.Notes,
    r.created_at,
    r.updated_at,
    s.StudentNo AS student_number,
    s.Name AS name,
    s.Surname AS surname,
    s.Email AS email, 
    s.ContactDetails AS contact_details,
    CONCAT(res.Name, ', ', res.House_Number, ' ', res.Street_Name) AS res_address
FROM
    request AS r
INNER JOIN
    student AS s ON r.Stud_ID = s.Stud_ID
INNER JOIN
    res_address AS res ON s.Res_ID = res.Res_ID
WHERE
    r.Driver_ID = ? AND r.RequestStatus IN ('Assigned', 'In_progress', 'Pending') -- 🟢 ADDED 'pending'
ORDER BY
    r.PickupTime ASC
            `,
            [driverId]
        );

        const formattedRequests: RideRequestType[] = rows.map((row) => ({
            id: row.Request_ID,
            student_id: row.Stud_ID,
            driver_id: row.Driver_ID,
            vehicle_id: undefined,
            pickup_time: row.PickupTime,
            pickup_location: row.PickupLocation,
            destination: row.Destination,
            status: row.RequestStatus,
            notes: row.Notes,
            created_at: row.created_at,
            updated_at: row.updated_at,
            rating: null,
            student: {
                id: row.Stud_ID,
                student_number: row.student_number,
                name: row.name,
                surname: row.surname,
                email: row.email, 
                contact_details: row.contact_details,
                res_address: row.res_address,
                created_at: row.student_created_at, // ✅ UPDATED to use the correct column
                updated_at: row.student_updated_at, // ✅ UPDATED to use the correct column
            },
        }));

        return NextResponse.json(formattedRequests, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching driver requests:", error.message || error);
        return NextResponse.json(
            { error: "Failed to fetch ride requests.", details: error.message || "An unknown error occurred." },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// ... (existing POST function) ...
/**
 * Handles POST requests to create a new ride request and assign an available driver.
 */
export async function POST(req: NextRequest) {
    const data: RideRequestData = await req.json();
    const { student_id, pickup_location, pickup_time, destination, notes } = data;

    // Validate incoming data
    if (!student_id || !pickup_location || !pickup_time || !destination) {
        return NextResponse.json(
            {
                error:
                    "Missing required fields: student_id, pickup_location, pickup_time, and destination are required.",
            },
            { status: 400 }
        );
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Find a driver with an "Available" status
        const [drivers] = await connection.execute<RowDataPacket[]>(
            `SELECT driver_id FROM driver WHERE AvailabilityStatus = 'Available' LIMIT 1`
        );

        if (drivers.length === 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "No drivers are currently available." },
                { status: 503 }
            );
        }

        const driverId = drivers[0].driver_id;
        const now = new Date();

        // 2. Insert the new ride request with timestamps and Notified flag
        const [requestResult] = await connection.execute(
            `INSERT INTO request 
        (stud_id, driver_id, PickupLocation, PickupTime, Destination, Notes, RequestStatus, Notified, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                student_id,
                driverId,
                pickup_location,
                pickup_time,
                destination,
                notes || null,
                "Pending",
                false, // ✅ Set Notified to false for a new request
                now,
                now,
            ]
        );

        const newRequestId = (requestResult as any).insertId;

        // 3. Update the assigned driver's status to 'Not Available'
        await connection.execute(
            `UPDATE driver SET AvailabilityStatus = 'Not Available' WHERE driver_id = ?`,
            [driverId]
        );

        await connection.commit();

        return NextResponse.json(
            {
                message:
                    "Ride request submitted and driver assigned successfully!",
                requestId: newRequestId,
                driverId,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error submitting ride request:", error);
        if (connection) {
            await connection.rollback();
        }

        let userMessage = "Failed to submit ride request due to a server error.";

        if (error.code) {
            switch (error.code) {
                case "ER_NO_SUCH_TABLE":
                    userMessage =
                        'Database error: The "request" table does not exist. Please check the name.';
                    break;
                case "ER_BAD_FIELD_ERROR":
                    userMessage =
                        'Database error: Column mismatch. Please check your "request" table schema.';
                    break;
                case "ER_ACCESS_DENIED_ERROR":
                    userMessage =
                        "Database connection error: Access denied. Check MySQL credentials.";
                    break;
                default:
                    userMessage = `Database error: ${error.message}`;
            }
        } else {
            userMessage = error.message;
        }

        return NextResponse.json({ error: userMessage }, { status: 500 });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}