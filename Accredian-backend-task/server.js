const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

// Use bodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all routes
app.use(cors({
  origin: 'http://127.0.0.1:3000',
  credentials: true,
}));

// MySQL database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'task',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    const connection = await pool.getConnection();
    console.log('Connected to the database');

    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ? OR email = ?', [usernameOrEmail, usernameOrEmail]);

    connection.release();

    const user = rows[0];

    if (!user) {
      console.log('User not found');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if the provided password matches the stored password
    if (password === user.password) {
      console.log('Login successful');
      res.status(200).json({ message: 'Login successful', user: { username: user.username, email: user.email } });
    } else {
      console.log('Incorrect password');
      res.status  (401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const connection = await pool.getConnection();

    // Check for email uniqueness
    const [existingUsers] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      console.log('Email already exists');
      res.status(400).json({ error: 'Email already exists' });
      connection.release();
      return;
    }

    // Insert the user into the database without hashing the password (not recommended for security reasons)
    await connection.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password]);

    connection.release();

    res.status(201).json({ message: 'User registered successfully', user: { username, email } });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
