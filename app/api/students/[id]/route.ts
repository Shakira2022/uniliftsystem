import { NextResponse } from 'next/server';
import mysql, { PoolConnection, RowDataPacket } from 'mysql2/promise';

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

export async function GET() {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();

        // The key change is adding 'Email AS email' to the SELECT statement
        const [rows] = await connection.execute<RowDataPacket[]>(
            'SELECT Stud_ID AS id, StudentNo AS student_number, Name AS name, Surname AS surname, ContactDetails AS contact_details, Email AS email, Res_ID AS res_id FROM student'
        );

        const studentsWithResAddress = await Promise.all(
            rows.map(async (student) => {
                const [resRows] = await connection!.execute<RowDataPacket[]>(
                    'SELECT Name, Street_Name, House_Number FROM res_address WHERE Res_ID = ?',
                    [student.res_id]
                );
                const resAddressString = resRows[0] ? `${resRows[0].Name}, ${resRows[0].House_Number} ${resRows[0].Street_Name}` : 'N/A';
                return { ...student, res_address: resAddressString, created_at: new Date().toISOString() };
            })
        );

        return NextResponse.json(studentsWithResAddress, { status: 200 });
    } catch (error: any) {
        console.error('Failed to fetch students:', error);
        return NextResponse.json(
            { message: 'Failed to fetch student data.' },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export async function POST(req: Request) {
    let connection: PoolConnection | null = null;
    try {
        const { student_number, name, surname, contact_details, email, res_name, street_name, house_number } = await req.json();

        connection = await pool.getConnection();

        // Check for duplicate student number or email
        const [duplicateCheck] = await connection.execute<RowDataPacket[]>(
            'SELECT Stud_ID FROM student WHERE StudentNo = ? OR Email = ?',
            [student_number, email]
        );

        if (duplicateCheck.length > 0) {
            return NextResponse.json({ message: 'A student with this student number or email already exists.' }, { status: 409 });
        }

        // Check if the residence already exists
        let [resRows] = await connection.execute<RowDataPacket[]>(
            'SELECT Res_ID FROM res_address WHERE Name = ? AND Street_Name = ? AND House_Number = ?',
            [res_name, street_name, house_number]
        );

        let resId = resRows[0]?.Res_ID;

        // If residence doesn't exist, insert it and get the new ID
        if (!resId) {
            const [newResResult] = await connection.execute(
                'INSERT INTO res_address (Name, Street_Name, House_Number) VALUES (?, ?, ?)',
                [res_name, street_name, house_number]
            );
            resId = (newResResult as any).insertId;
        }

        // Insert the new student using the existing or new Res_ID
        const [studentResult] = await connection.execute(
            'INSERT INTO student (StudentNo, Name, Surname, ContactDetails, Email, Res_ID) VALUES (?, ?, ?, ?, ?, ?)',
            [student_number, name, surname, contact_details, email, resId]
        );

        const newStudentId = (studentResult as any).insertId;
        const resAddressString = `${res_name}, ${house_number} ${street_name}`;

        // Return the newly created student data
        return NextResponse.json({
            id: newStudentId,
            student_number,
            name,
            surname,
            contact_details,
            email,
            res_address: resAddressString,
        }, { status: 201 });

    } catch (error: any) {
        console.error('Failed to add student:', error);
        return NextResponse.json({ message: 'Failed to add student.' }, { status: 500 });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}