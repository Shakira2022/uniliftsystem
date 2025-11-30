// /app/api/driver-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// MySQL connection pool
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

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { email, password } = await req.json();

    // 1️⃣ Hardcoded Admin Login (no DB check)
    const adminEmail = 'admin@unilift.co.za';
    const adminPassword = 'adminpassword'; // plain-text for demo

    if (email === adminEmail && password === adminPassword) {
      return NextResponse.json({
        message: 'Login successful!',
        user: {
          name: 'Admin',
          surname: 'User',
          email: adminEmail,
          role: 'admin',
        },
      }, { status: 200 });
    }

    connection = await pool.getConnection();

    // 2️⃣ Check driver table
    const [driverRows] = await connection.execute<RowDataPacket[]>(
      `SELECT d.Driver_ID,
              d.Name,
              d.Surname,
              d.Email,
              d.License,
              d.AvailabilityStatus,
              d.role,
              d.Password
       FROM driver d
       WHERE d.Email = ?`,
      [email]
    );

    if (driverRows.length > 0) {
      const user = driverRows[0];
      // 3️⃣ Compare password
      const isPasswordMatch = await bcrypt.compare(password, user.Password);
      if (!isPasswordMatch) {
        return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
      }

      // 4️⃣ Successful driver login
      const { Password, Driver_ID, ...userWithoutPassword } = user;
      return NextResponse.json({
        message: 'Login successful!',
        user: {
          driver_id: Driver_ID,
          name: user.Name,
          surname: user.Surname,
          email: user.Email,
          license: user.License,
          availabilityStatus: user.AvailabilityStatus,
          role: user.role,
        },
      }, { status: 200 });
    }
   
    // 5️⃣ No user found (neither admin nor driver)
    return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });

  } catch (error: any) {
    console.error('Login failed:', error);
    const userMessage =
      error.code === 'ER_ACCESS_DENIED_ERROR'
        ? 'Database connection error: Check MySQL credentials.'
        : 'An unexpected error occurred.';
    return NextResponse.json({ message: userMessage }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
