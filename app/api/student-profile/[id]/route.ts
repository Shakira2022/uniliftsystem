// app/api/student-profile/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Database connection pool
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

// GET request to fetch student profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'Student ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT
        s.Stud_ID,
        s.StudentNo,
        s.Name,
        s.Surname,
        s.Email,
        s.ContactDetails,
        s.role,
        r.Name AS res_name,
        r.Street_Name AS street_name,
        r.House_Number AS house_number
      FROM
        student AS s
      LEFT JOIN
        res_address AS r ON s.Res_Id = r.Res_Id
      WHERE s.Stud_ID = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Student not found.' }, { status: 404 });
    }

    const student = rows[0];

    return NextResponse.json({
      ...student,
      stud_id: student.Stud_ID,
      contact_details: student.ContactDetails
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch student profile:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PATCH request to update student profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { name, surname, email, contact_details, res_name, street_name, house_number, studentNo, current_password, new_password } = await request.json();

  if (!id) {
    return NextResponse.json({ message: 'Student ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch current student data to verify password and get Res_Id
    const [existingStudentRows] = await connection.execute<RowDataPacket[]>(
      'SELECT password, Res_Id FROM student WHERE Stud_ID = ?',
      [id]
    );

    if (existingStudentRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Student not found.' }, { status: 404 });
    }
    
    const existingPasswordHash = existingStudentRows[0].password;
    const resId = existingStudentRows[0].Res_Id;
    
    // 2. Validate current password if a new password is provided
    if (new_password) {
      if (!current_password) {
        await connection.rollback();
        return NextResponse.json({ message: 'Current password is required to change password.' }, { status: 400 });
      }

      const isPasswordMatch = await bcrypt.compare(current_password, existingPasswordHash);
      if (!isPasswordMatch) {
        await connection.rollback();
        return NextResponse.json({ message: 'Incorrect current password.' }, { status: 401 });
      }
    }
    
    // 3. Prepare and execute the UPDATE queries
    
    // Build the query and parameters for the student table
    let updateStudentQuery = `
      UPDATE student
      SET 
        Name = ?, 
        Surname = ?, 
        Email = ?, 
        ContactDetails = ?, 
        StudentNo = ?
    `;
    let studentParams: (string | undefined)[] = [name, surname, email, contact_details, studentNo];
    
    // Handle new password
    if (new_password) {
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      updateStudentQuery += `, password = ?`;
      studentParams.push(hashedNewPassword);
    }
    
    updateStudentQuery += ` WHERE Stud_ID = ?`;
    studentParams.push(id);
    
    await connection.execute(updateStudentQuery, studentParams);

    // Update the res_address table with all three components
    const updateResQuery = `
      UPDATE res_address
      SET Name = ?, Street_Name = ?, House_Number = ?
      WHERE Res_Id = ?
    `;
    await connection.execute(updateResQuery, [res_name, street_name, house_number, resId]);

    // 4. Fetch the updated profile to return to the client
    const [updatedRows] = await connection.execute<RowDataPacket[]>(
      `SELECT
        s.Stud_ID,
        s.StudentNo,
        s.Name,
        s.Surname,
        s.Email,
        s.ContactDetails,
        s.role,
        r.Name AS res_name,
        r.Street_Name AS street_name,
        r.House_Number AS house_number
      FROM
        student AS s
      LEFT JOIN
        res_address AS r ON s.Res_Id = r.Res_Id
      WHERE s.Stud_ID = ?`,
      [id]
    );

    if (updatedRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Student not found after update.' }, { status: 404 });
    }

    await connection.commit();

    const updatedStudent = updatedRows[0];
    return NextResponse.json({
      message: "Profile updated successfully.",
      user: {
        stud_id: updatedStudent.Stud_ID,
        studentNo: updatedStudent.StudentNo,
        name: updatedStudent.Name,
        surname: updatedStudent.Surname,
        email: updatedStudent.Email,
        contact_details: updatedStudent.ContactDetails,
        role: updatedStudent.role,
        res_name: updatedStudent.res_name,
        street_name: updatedStudent.street_name,
        house_number: updatedStudent.house_number
      }
    }, { status: 200 });

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Failed to update student profile:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}