// /app/api/reset-password-sms/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";

// Create a connection pool to your database
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
 * Generates a random alphanumeric password.
 */
function generateRandomPassword(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 */
function formatPhoneNumber(contact: string): string {
    // Remove all non-digits
    let cleaned = contact.replace(/\D/g, "");

    if (cleaned.startsWith("0")) {
        cleaned = "+27" + cleaned.substring(1);
    } else if (!cleaned.startsWith("+27")) {
        // fallback: force +27
        cleaned = "+27" + cleaned;
    }

    return cleaned;
}

/**
 * Handles POST requests to reset a user's password and send it via SMS.
 */
export async function POST(req: NextRequest) {
    let connection;
    try {
        const { email } = await req.json();

        // 1. Validate incoming data
        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        connection = await pool.getConnection();

        // 2. Find the user's details and role (student or driver)
        const [rows] = await connection.execute<RowDataPacket[]>(
            `
            (SELECT 'student' AS role, Stud_ID AS id, ContactDetails, Email, Password 
             FROM student WHERE Email = ?)
            UNION
            (SELECT 'driver' AS role, Driver_ID AS id, ContactDetails, Email, Password 
             FROM driver WHERE Email = ?)
            LIMIT 1
            `,
            [email, email]
        );

        if (rows.length === 0) {
            // Return a generic success message to prevent user enumeration
            return NextResponse.json(
                { message: "If an account is found, a password reset SMS has been sent." },
                { status: 200 }
            );
        }

        const user = rows[0];
        const { role, id, ContactDetails } = user;

        // ✅ Format the phone number for BulkSMS
        const formattedContact = formatPhoneNumber(ContactDetails);

        const newPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update the user's password in the database
        let updateQuery = "";
        switch (role) {
            case "student":
                updateQuery = "UPDATE student SET Password = ? WHERE Stud_ID = ?";
                break;
            case "driver":
                updateQuery = "UPDATE driver SET Password = ? WHERE Driver_ID = ?";
                break;
            default:
                throw new Error("Invalid user role.");
        }
        await connection.execute(updateQuery, [hashedPassword, id]);

        // 4. Send the new password via SMS using the provided SMS API
        const smsResponse = await fetch("http://localhost:3000/api/send-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: formattedContact, // ✅ use formatted phone number
                body: `Your UniLift password has been reset. Your new password is: ${newPassword}. Please log in and change it immediately.`,
            }),
        });

        if (!smsResponse.ok) {
            console.error("Failed to send SMS:", await smsResponse.text());
            // Log only, do not leak SMS status to end-user
        }

        return NextResponse.json(
            { message: "If an account is found, a password reset SMS has been sent." },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("❌ Password reset API error:", error.message || error);
        return NextResponse.json(
            { error: "Internal server error. Please try again later." },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
