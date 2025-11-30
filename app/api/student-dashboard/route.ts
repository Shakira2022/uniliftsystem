// /app/api/student-dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import { type Request as RideRequestType } from "@/lib/types";

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

export async function GET(req: NextRequest) {
    const studentId = req.nextUrl.searchParams.get("studentId");

    if (!studentId) {
        return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 1️⃣ Fetch ride requests with student, residence, driver, and vehicle info
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
                r.Rating,
                r.created_at,
                r.updated_at,
                s.StudentNo AS student_number,
                s.Name AS name,
                s.Surname AS surname,
                s.ContactDetails AS contact_details,
                CONCAT(res.Name, ', ', res.House_Number, ' ', res.Street_Name) AS res_address,
                d.Name AS driver_name,
                d.Surname AS driver_surname,
                v.Plate_Number AS vehicle_license_plate
            FROM
                request AS r
            INNER JOIN
                student AS s ON r.Stud_ID = s.Stud_ID
            INNER JOIN
                res_address AS res ON s.Res_ID = res.Res_ID
            LEFT JOIN
                driver AS d ON r.Driver_ID = d.Driver_ID
            LEFT JOIN
                vehicle AS v ON d.Driver_ID = v.Driver_ID
            WHERE
                r.Stud_ID = ?
            ORDER BY
                r.PickupTime ASC
            `,
            [studentId]
        );

        // 2️⃣ Fetch student profile
        const [profileRows] = await connection.execute<RowDataPacket[]>(
            `SELECT StudentNo, Name, Surname, ContactDetails FROM student WHERE Stud_ID = ?`,
            [studentId]
        );

        const profile = profileRows[0];

        // 3️⃣ Fetch student stats
        const [statsRows] = await connection.execute<RowDataPacket[]>(
            `
         SELECT
    SUM(CASE WHEN RequestStatus = 'Completed' THEN 1 ELSE 0 END) AS totalRides,
    SUM(CASE WHEN RequestStatus IN ('Pending', 'Assigned', 'In_progress') THEN 1 ELSE 0 END) AS activeRequests,
    AVG(Rating) AS averageRating
FROM request
WHERE Stud_ID = ?

            `,
            [studentId]
        );

        const formattedRequests = rows.map((row) => ({
            id: row.Request_ID,
            student_id: row.Stud_ID,
            driver_id: row.Driver_ID,
            vehicle_id: row.Driver_ID ? row.vehicle_license_plate : undefined,
            pickup_time: row.PickupTime,
            pickup_location: row.PickupLocation,
            destination: row.Destination,
            status: row.RequestStatus,
            notes: row.Notes,
            rating: row.Rating,
            created_at: row.created_at,
            updated_at: row.updated_at,
            student: {
                id: row.Stud_ID,
                student_number: row.student_number,
                name: row.name,
                surname: row.surname,
                contact_details: row.contact_details,
                res_address: row.res_address,
            },
            driver: row.driver_name
                ? {
                      id: row.Driver_ID,
                      name: row.driver_name,
                      surname: row.driver_surname,
                      vehicle_details: {
                          license_plate: row.vehicle_license_plate,
                      },
                  }
                : undefined,
        }));

        const stats = {
            totalRides: statsRows[0].totalRides || 0,
            activeRequests: statsRows[0].activeRequests || 0,
            averageRating: statsRows[0].averageRating || 0,
        };

        return NextResponse.json({ requests: formattedRequests, stats, profile }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching student dashboard data:", error.message || error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data.", details: error.message || "An unknown error occurred." },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
