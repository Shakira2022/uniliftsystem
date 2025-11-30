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

        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT 
                Stud_ID AS id, 
                StudentNo AS student_number, 
                Name AS name, 
                Surname AS surname, 
                ContactDetails AS contact_details, 
                Email AS email, 
                Res_ID AS res_id 
             FROM student`
        );

        const studentsWithResAddress = await Promise.all(
            rows.map(async (student) => {
                const [resRows] = await connection!.execute<RowDataPacket[]>(
                    'SELECT Name, Street_Name, House_Number FROM res_address WHERE Res_ID = ?',
                    [student.res_id]
                );
                const resAddressString = resRows[0]
                    ? `${resRows[0].Name}, ${resRows[0].House_Number} ${resRows[0].Street_Name}`
                    : 'N/A';

                return {
                    ...student,
                    res_address: resAddressString,
                    created_at: new Date().toISOString(),
                };
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
        const {
            student_number,
            email,
            name,
            surname,
            contact_details,
            res_name,
            street_name,
            house_number,
        } = await req.json();

        connection = await pool.getConnection();

        // 🔎 Check if residence already exists
        let [resRows] = await connection.execute<RowDataPacket[]>(
            'SELECT Res_ID FROM res_address WHERE Name = ? AND Street_Name = ? AND House_Number = ?',
            [res_name, street_name, house_number]
        );

        let resId = resRows[0]?.Res_ID;

        // 🏠 If not, insert a new one
        if (!resId) {
            const [newResResult] = await connection.execute(
                'INSERT INTO res_address (Name, Street_Name, House_Number) VALUES (?, ?, ?)',
                [res_name, street_name, house_number]
            );
            resId = (newResResult as any).insertId;
        }

        // 👤 Insert the new student with default password
        const [studentResult] = await connection.execute(
            `INSERT INTO student 
                (StudentNo, Email, Name, Surname, ContactDetails, Res_ID, Password) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [student_number, email, name, surname, contact_details, resId, "12345"]
        );

        const newStudentId = (studentResult as any).insertId;
        const resAddressString = `${res_name}, ${house_number} ${street_name}`;

        return NextResponse.json(
            {
                id: newStudentId,
                student_number,
                name,
                surname,
                contact_details,
                email,
                res_address: resAddressString,
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Failed to add student:", error);

        // ⚠️ Handle duplicate entry error
        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { message: "User with this email or student number already exists." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Failed to add student." },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export async function DELETE(req: Request) {
  let connection: PoolConnection | null = null;
  try {
      const { id } = await req.json(); // expect { "id": 123 }

      connection = await pool.getConnection();

      // First delete requests for this student
      await connection.execute(
          'DELETE FROM request WHERE Stud_ID = ?',
          [id]
      );

      // Then delete the student
      const [result] = await connection.execute(
          'DELETE FROM student WHERE Stud_ID = ?',
          [id]
      );

      if ((result as any).affectedRows === 0) {
          return NextResponse.json(
              { message: "Student not found." },
              { status: 404 }
          );
      }

      return NextResponse.json(
          { message: "Student and related requests deleted successfully." },
          { status: 200 }
      );

  } catch (error: any) {
      console.error("Failed to delete student:", error);
      return NextResponse.json(
          { message: "Failed to delete student." },
          { status: 500 }
      );
  } finally {
      if (connection) {
          connection.release();
      }
  }
}

// ================= UPDATE STUDENT =================
export async function PUT(req: Request) {
  let connection: PoolConnection | null = null;
  try {
      const { id, student_number, name, surname, contact_details, email, res_name, street_name, house_number } = await req.json();

      connection = await pool.getConnection();

      // 🔎 Check for duplicate student number or email in other students
      const [duplicateCheck] = await connection.execute<RowDataPacket[]>(
          'SELECT Stud_ID FROM student WHERE (StudentNo = ? OR Email = ?) AND Stud_ID != ?',
          [student_number, email, id]
      );

      if (duplicateCheck.length > 0) {
          return NextResponse.json(
              { message: 'Another student with this student number or email already exists.' },
              { status: 409 }
          );
      }

      // 🏠 Check if residence exists
      let [resRows] = await connection.execute<RowDataPacket[]>(
          'SELECT Res_ID FROM res_address WHERE Name = ? AND Street_Name = ? AND House_Number = ?',
          [res_name, street_name, house_number]
      );
      let resId = resRows[0]?.Res_ID;

      // Insert residence if not found
      if (!resId) {
          const [newResResult] = await connection.execute(
              'INSERT INTO res_address (Name, Street_Name, House_Number) VALUES (?, ?, ?)',
              [res_name, street_name, house_number]
          );
          resId = (newResResult as any).insertId;
      }

      // ✏️ Update student
      await connection.execute(
          'UPDATE student SET StudentNo = ?, Name = ?, Surname = ?, ContactDetails = ?, Email = ?, Res_ID = ? WHERE Stud_ID = ?',
          [student_number, name, surname, contact_details, email, resId, id]
      );

      const resAddressString = `${res_name}, ${house_number} ${street_name}`;

      return NextResponse.json({
          id: Number(id),
          student_number,
          name,
          surname,
          contact_details,
          email,
          res_address: resAddressString,
      }, { status: 200 });

  } catch (error: any) {
      console.error('Failed to update student:', error);
      return NextResponse.json({ message: 'Failed to update student.' }, { status: 500 });
  } finally {
      if (connection) connection.release();
  }
}
