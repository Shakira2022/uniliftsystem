// /app/api/reports/route.ts
import { NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

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

export async function GET() {
  let connection = null;
  try {
    connection = await pool.getConnection();

    // 1️⃣ Peak Hours Analysis
    const [peakHoursResult] = await connection.query(`
      SELECT HOUR(PickupTime) AS hour, COUNT(*) AS volume
      FROM request
      GROUP BY hour
      ORDER BY hour
    `);

    // 2️⃣ Most Popular Routes
    const [popularRoutesResult] = await connection.query(`
      SELECT PickupLocation, Destination, COUNT(*) AS volume
      FROM request
      GROUP BY PickupLocation, Destination
      ORDER BY volume DESC
      LIMIT 5
    `);

    // 3️⃣ Monthly Ride Trends (Completed requests only)
    const [monthlyTrendsResult] = await connection.query(`
      SELECT
        DATE_FORMAT(PickupTime, '%b') AS month,
        COUNT(Request_ID) AS rides,
        COUNT(DISTINCT Stud_ID) AS students
      FROM request
      WHERE RequestStatus = 'Completed'
      GROUP BY month
      ORDER BY MIN(PickupTime)
    `);

    // 4️⃣ Driver Performance (total rides per driver)
    const [driverPerformanceResult] = await connection.query(`
      SELECT
        d.Driver_ID,
        d.Name,
        d.Surname,
        COUNT(r.Request_ID) AS totalRides
      FROM driver AS d
      LEFT JOIN request AS r ON d.Driver_ID = r.Driver_ID
      GROUP BY d.Driver_ID, d.Name, d.Surname
    `);

    // 5️⃣ Vehicle Status Distribution
       // ✅ Vehicle Utilization
       const [vehicleUtilizationRows] = await connection.query<RowDataPacket[]>(
        `SELECT 
          SUM(CASE WHEN assigned = 'Y' THEN 1 ELSE 0 END) AS in_use,
          SUM(CASE WHEN assigned = 'N' THEN 1 ELSE 0 END) AS available
         FROM vehicle`
      );
  
      const vehicleUtilization = {
        in_use: Number(vehicleUtilizationRows[0].in_use ?? 0),
        available: Number(vehicleUtilizationRows[0].available ?? 0),
      };

    // Combine all results
    const reportsData = {
      peakHours: peakHoursResult,
      popularRoutes: popularRoutesResult,
      monthlyTrends: monthlyTrendsResult,
      driverPerformance: driverPerformanceResult,
      vehicleStatus: [
        { status: "Available", count: vehicleUtilization.available },
        { status: "In Use", count: vehicleUtilization.in_use },
      ],
    };

    return NextResponse.json(reportsData);

  } catch (error: any) {
    console.error("Error fetching reports data:", error);
    let errorMessage = "Failed to fetch reports data.";
    if (error.code) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          errorMessage = 'Database error: One of the required tables does not exist.';
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          errorMessage = 'Database connection error: Access denied.';
          break;
        case 'ECONNREFUSED':
          errorMessage = 'Connection refused. The database server is likely not running.';
          break;
        default:
          errorMessage = `Database error: ${error.message}`;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
