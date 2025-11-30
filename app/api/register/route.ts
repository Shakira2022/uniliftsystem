// /app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Create a connection pool
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

// Define type for frontend data
type FormData = {
  name: string;
  surname: string;
  email?: string;
  password: string;
  role: 'student' | 'driver';
  student_number?: string;
  license?: string;
  contact_details: string;
  res_name?: string;
  street_name?: string;
  house_number?: string;
};

export async function POST(req: NextRequest) {
  let connection;

  try {
    const data: FormData = await req.json();
    const {
      name,
      surname,
      password,
      email,
      role,
      student_number,
      license,
      contact_details,
      res_name,
      street_name,
      house_number,
    } = data;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    let assignedVehicle: any = null;

    if (role === 'student') {
      if (!student_number || !res_name || !street_name || !house_number) {
        return NextResponse.json(
          { message: 'All residence address fields are required for a student.' },
          { status: 400 }
        );
      }

      // Insert residence address
      const [resAddressResult] = await connection.execute(
        'INSERT INTO res_address (Name, Street_Name, House_Number) VALUES (?, ?, ?)',
        [res_name, street_name, house_number]
      );
      const resId = (resAddressResult as any).insertId;

      // Insert student
      await connection.execute(
        'INSERT INTO student (StudentNo, Email, Name, Surname, ContactDetails, Res_ID, Password, role) VALUES (?,?, ?, ?, ?, ?, ?, ?)',
        [student_number, email, name, surname, contact_details, resId, hashedPassword, role]
      );

    } else if (role === 'driver') {
      if (!license) {
        return NextResponse.json(
          { message: 'License is required for a driver.' },
          { status: 400 }
        );
      }

      // Check for duplicate driver
      const [existingDriver] = await connection.execute(
        `SELECT Driver_ID FROM driver WHERE License = ? OR ContactDetails = ? OR Email = ?`,
        [license, contact_details, email]
      );

      if ((existingDriver as any).length > 0) {
        return NextResponse.json(
          { message: 'A driver with this license, email, or contact number already exists.' },
          { status: 409 }
        );
      }

      // Insert new driver
      const [driverResult] = await connection.execute(
        `INSERT INTO driver 
          (Name, Surname, Email, AvailabilityStatus, License, Password, ContactDetails, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, surname, email, 'Not Available', license, hashedPassword, contact_details, role]
      );

      const newDriverId = (driverResult as any).insertId;

      // Auto-assign a vehicle if available
      const [vehicleRows] = await connection.execute(
        `SELECT Vehicle_ID FROM vehicle WHERE assigned = 'N' LIMIT 1`
      );

      if ((vehicleRows as any)[0]) {
        const vehicleId = (vehicleRows as any)[0].Vehicle_ID;
        await connection.execute(
          `UPDATE vehicle SET Driver_ID = ?, assigned = 'Y' WHERE Vehicle_ID = ?`,
          [newDriverId, vehicleId]
        );

        assignedVehicle = { Vehicle_ID: vehicleId };
      }

      // Fetch inserted driver to return full object
      const [newDriverRow] = await connection.execute(
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

      await connection.commit();

      return NextResponse.json({
        ...((newDriverRow as any)[0]),
        availability_status: ((newDriverRow as any)[0].availability_status === 'Available'),
        assignedVehicle: assignedVehicle || null
      }, { status: 201 });

    } else {
      return NextResponse.json({ message: 'Invalid role specified.' }, { status: 400 });
    }

    await connection.commit();
    return NextResponse.json({ message: 'Registration successful!' }, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Registration failed:', error);

    let userMessage = 'Registration failed due to a server error.';

    if (error.code) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          userMessage = 'Database error: One or more tables do not exist. Please check your database schema.';
          break;
        case 'ER_DUP_ENTRY':
          userMessage = 'A user with this information already exists.';
          break;
        case 'ER_BAD_FIELD_ERROR':
          userMessage = 'Database error: Column mismatch. Please check your schema.';
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          userMessage = 'Database connection error: Access denied. Check MySQL credentials.';
          break;
        default:
          userMessage = `Database error: ${error.message}`;
      }
    } else {
      userMessage = error.message;
    }

    return NextResponse.json({ message: userMessage }, { status: 500 });

  } finally {
    if (connection) connection.release();
  }
}
