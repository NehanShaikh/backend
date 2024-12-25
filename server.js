const express = require('express');
const mysql = require('mysql2/promise'); // Use mysql2's promise-based interface
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a connection to the MySQL database
const dbConfig = {
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'your_password', // Replace with your MySQL password
  database: 'BiometricAttendance', // Replace with your database name
};

// Helper function to get a database connection
async function getConnection() {
  try {
    return await mysql.createConnection(dbConfig);
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

// API to authenticate user
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const connection = await getConnection();
    const query = `
      SELECT * 
      FROM Users 
      WHERE username = ? AND password_hash = ?`; // Ensure proper hashing (e.g., bcrypt) for passwords
    const [results] = await connection.execute(query, [username, password]);

    if (results.length > 0) {
      const user = results[0];
      res.json({
        message: 'Login successful',
        user: { id: user.id, username: user.username, role: user.role }, // Include necessary details
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }

    await connection.end(); // Close the connection
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API to fetch attendance records for a specific class
app.get('/api/attendance/:classId', async (req, res) => {
  const classId = req.params.classId;

  if (!classId) {
    return res.status(400).json({ message: 'Class ID is required' });
  }

  try {
    const connection = await getConnection();
    const query = `
      SELECT * 
      FROM AttendanceRecords 
      WHERE class_id = ?`;
    const [results] = await connection.execute(query, [classId]);

    res.json(results);
    await connection.end(); // Close the connection
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API to fetch all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const connection = await getConnection();
    const query = `
      SELECT subject_name 
      FROM Subjects`; // Assuming you have a "Subjects" table with a "subject_name" column
    const [results] = await connection.execute(query);

    const subjects = results.map((row) => row.subject_name); // Map results to a list of subject names
    res.json(subjects);
    await connection.end(); // Close the connection
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// API to fetch all attendance records
// API to fetch all attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const connection = await getConnection();
    const query = `
      SELECT student_name, subject, DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date_time 
      FROM attendance 
      ORDER BY date DESC
    `;
    const [rows] = await connection.execute(query);

    console.log('Attendance Data Sent to Client:', rows); // Debugging

    res.status(200).json(rows);
    await connection.end(); // Close the connection
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




// API to log attendance
// API to log attendance
app.post('/api/log-attendance', async (req, res) => {
  const { username, subject, date } = req.body;

  console.log('Received Data:', { username, subject, date }); // Debugging

  if (!username || !subject || !date) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  try {
    const connection = await getConnection();
    const query = `
      INSERT INTO attendance (student_name, subject, date) 
      VALUES (?, ?, ?)
    `;
    await connection.execute(query, [username, subject, date]);

    res.status(200).json({ message: 'Attendance logged successfully' });
    await connection.end(); // Close the connection
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Catch-all route for unhandled endpoints
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start the server
app.listen(3000, '192.168.20.7', () => {
  console.log('Server is running on http://192.168.20.7:3000');
});
