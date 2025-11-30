// /app/api/login/route.ts
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
    connection = await pool.getConnection();

    let user: RowDataPacket | null = null;

    // 1️⃣ Check student table
    const [studentRows] = await connection.execute<RowDataPacket[]>(
      `SELECT
        s.Stud_ID,
        s.Name,
        s.Surname,
        s.Email,
        s.ContactDetails,
        s.role,
        s.Password,
        CONCAT(r.Name, ', ', r.Street_Name, ', ', r.House_Number) AS res_address
      FROM
        student AS s
      LEFT JOIN
        res_address AS r ON s.Res_Id = r.Res_Id
      WHERE s.Email = ?`,
      [email]
    );

    if (studentRows.length > 0) {
      user = studentRows[0];
    } 
    
    // 3️⃣ User not found
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // 4️⃣ Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.Password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // 5️⃣ Successful login
    const { Password, Stud_ID, Driver_ID, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful!',
      user: {
        ...userWithoutPassword,
        stud_id: Stud_ID ?? Driver_ID ?? null, // ✅ map Stud_ID for student or Driver_ID for driver
      },
    }, { status: 200 });
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

