require('events').EventEmitter.defaultMaxListeners = 20;

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg'); // Use pg for PostgreSQL
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 5000; // Default to 5000 for local testing

// Enable CORS for all requests
app.use(cors());
app.use(bodyParser.json());

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for services like Render (SSL)
    },
});

// Connect to PostgreSQL database
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to PostgreSQL Database');
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the backend API');
});

// User signup route
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );
        res.send('Signup successful!');
    } catch (err) {
        console.error(err);
        res.status(400).send('Username already exists');
    }
});

// User login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length && await bcrypt.compare(password, result.rows[0].password)) {
            res.send(result.rows[0]);
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in');
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.send(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving users');
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.send(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving products');
    }
});

// Add a new product
app.post('/api/products', async (req, res) => {
    const { name, description, price, quantity } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, price, quantity]
        );
        res.send('Product added successfully!');
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).send('Error adding product');
    }
});

// Update an existing product
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, quantity } = req.body;
    try {
        await pool.query(
            'UPDATE products SET name = $1, description = $2, price = $3, quantity = $4 WHERE id = $5',
            [name, description, price, quantity, id]
        );
        res.send('Product updated successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating product');
    }
});

// Delete a product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.send('Product deleted successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting product');
    }
});

// Update a user's information
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET username = $1, password = $2 WHERE id = $3',
                [username, hashedPassword, id]
            );
        } else {
            await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, id]);
        }
        res.send('User updated successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user');
    }
});

// Delete a user
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.send('User deleted successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting user');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
