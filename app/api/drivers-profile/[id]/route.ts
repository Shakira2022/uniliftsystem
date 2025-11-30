import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";

// Database connection pool
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

// GET driver profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: "Driver ID is required." }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        Driver_ID,
        Name,
        Surname,
        Email,
        AvailabilityStatus,
        License,
        Role,
        ContactDetails
      FROM driver
      WHERE Driver_ID = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "Driver not found." }, { status: 404 });
    }

    const driver = rows[0];
    console.log("Fetched driver:", driver);

    return NextResponse.json(
      {
        driver_id: driver.Driver_ID,
        name: driver.Name,
        surname: driver.Surname,
        email: driver.Email,
        availability_status: driver.AvailabilityStatus,
        license: driver.License,
        role: driver.Role,
        contact_details: driver.ContactDetails,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to fetch driver profile:", error);
    return NextResponse.json({ message: "An unexpected error occurred.", error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// PATCH driver profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // ✅ safer JSON parsing
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const {
    name,
    surname,
    email,
    contact_details,
    license,
    availability_status,
    current_password,
    new_password,
  } = body;

  if (!id) {
    return NextResponse.json({ message: "Driver ID is required." }, { status: 400 });
  }

  // ✅ New server-side validation
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^0\d{9}$/;
  const licenseRegex = /^[a-zA-Z]{3}\d{4}$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;

  if (email && !email.endsWith("@gmail.com")) {
      errors.push("Email must end with '@gmail.com'.");
  }
  if (contact_details && !phoneRegex.test(contact_details)) {
      errors.push("Phone number must be 10 digits and start with '0'.");
  }
  if (license && !licenseRegex.test(license)) {
      errors.push("Driver's license must be 3 letters followed by 4 numbers (e.g., ABC1234).");
  }
  if (new_password && !passwordRegex.test(new_password)) {
      errors.push("New password must be at least 6 characters long and include a number, a letter, and a special character.");
  }
  
  if (errors.length > 0) {
      return NextResponse.json({ message: errors.join(" ") }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Fetch current password hash
    const [existingDriverRows] = await connection.execute<RowDataPacket[]>(
      "SELECT Password, Email FROM driver WHERE Driver_ID = ?",
      [id]
    );

    if (existingDriverRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: "Driver not found." }, { status: 404 });
    }

    const existingPasswordHash = existingDriverRows[0].Password;
    const existingEmail = existingDriverRows[0].Email;

    // ✅ Verify only if new_password is provided
    if (new_password && new_password.trim() !== "") {
      if (!current_password) {
        await connection.rollback();
        return NextResponse.json(
          { message: "Current password is required to change password." },
          { status: 400 }
        );
      }

      const isPasswordMatch = await bcrypt.compare(current_password, existingPasswordHash);
      if (!isPasswordMatch) {
        await connection.rollback();
        return NextResponse.json({ message: "Incorrect current password." }, { status: 401 });
      }
    }

    // Build update query
    let updateQuery = `
      UPDATE driver
      SET 
        Name = ?, 
        Surname = ?, 
        Email = ?, 
        ContactDetails = ?, 
        License = ?,
        AvailabilityStatus = ?
    `;
    let paramsArr: (string | null)[] = [
      name || null,
      surname || null,
      email || null,
      contact_details || null,
      license || null,
      availability_status || null,
    ];

    // ✅ Only update password if provided
    if (new_password && new_password.trim() !== "") {
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      updateQuery += `, Password = ?`;
      paramsArr.push(hashedNewPassword);
    }

    updateQuery += " WHERE Driver_ID = ?";
    paramsArr.push(id);

    await connection.execute(updateQuery, paramsArr);

    // Fetch updated profile
    const [updatedRows] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        Driver_ID,
        Name,
        Surname,
        Email,
        AvailabilityStatus,
        License,
        Role,
        ContactDetails
      FROM driver
      WHERE Driver_ID = ?`,
      [id]
    );

    if (updatedRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: "Driver not found after update." }, { status: 404 });
    }

    await connection.commit();

    const updatedDriver = updatedRows[0];
    console.log("Updated driver:", updatedDriver);

    return NextResponse.json(
      {
        message: "Profile updated successfully.",
        user: {
          driver_id: updatedDriver.Driver_ID,
          name: updatedDriver.Name,
          surname: updatedDriver.Surname,
          email: updatedDriver.Email,
          availability_status: updatedDriver.AvailabilityStatus,
          license: updatedDriver.License,
          role: updatedDriver.Role,
          contact_details: updatedDriver.ContactDetails,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Failed to update driver profile:", error);

    // Check for the specific 'Duplicate entry' error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { message: "This email is already in use by another account. Please use a different one." },
        { status: 409 } // 409 Conflict status code is appropriate for this
      );
    }

    return NextResponse.json({ message: "An unexpected error occurred.", error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}