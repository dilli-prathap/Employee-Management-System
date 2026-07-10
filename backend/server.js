const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const dbConfig = {
  host: process.env.DB_HOST || 'mysql-service',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  database: process.env.DB_NAME || 'employeedb',
  waitForConnections: true,
  connectionLimit: 10
};

let pool;

// Retry connecting to MySQL since the DB pod may not be ready immediately
async function initDb(retries = 15, delayMs = 4000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      pool = mysql.createPool(dbConfig);
      const conn = await pool.getConnection();
      console.log('Connected to MySQL successfully');
      conn.release();
      return;
    } catch (err) {
      console.log(`DB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.error('Could not connect to MySQL after multiple attempts. Exiting.');
  process.exit(1);
}

// Health check - used by Kubernetes liveness/readiness probes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single employee
app.get('/api/employees/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new employee
app.post('/api/employees', async (req, res) => {
  try {
    const { name, email, department, position, salary } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO employees (name, email, department, position, salary) VALUES (?, ?, ?, ?, ?)',
      [name, email, department || null, position || null, salary || null]
    );
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { name, email, department, position, salary } = req.body;
    const [existing] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Employee not found' });

    await pool.query(
      'UPDATE employees SET name = ?, email = ?, department = ?, position = ?, salary = ? WHERE id = ?',
      [name, email, department, position, salary, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend API server running on port ${PORT}`);
  });
});
