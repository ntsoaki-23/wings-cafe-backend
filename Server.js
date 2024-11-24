// Increase the max listeners if needed to prevent warnings
require('events').EventEmitter.defaultMaxListeners = 20;

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 5000;

// Enable CORS for all requests
app.use(cors());
// Parse incoming JSON requests
app.use(bodyParser.json());

// Create the MySQL connection using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to the MySQL database
db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
});

// Root endpoint to check if the server is working
app.get('/', (req, res) => {
    res.send('Welcome to the backend API');
});

// User signup route
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
        if (err) return res.status(400).send('Username already exists');
        res.send('Signup successful!');
    });
});

// User login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Find the user in the database
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (results.length && await bcrypt.compare(password, results[0].password)) {
            res.send(results[0]);
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

// Get all users
app.get('/api/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

// Get all products
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

// Add a new product
app.post('/api/products', (req, res) => {
    const { name, description, price, quantity } = req.body;
    db.query('INSERT INTO products (name, description, price, quantity) VALUES (?, ?, ?, ?)', 
        [name, description, price, quantity], 
        (err, results) => {
            if (err) {
                console.error("Error adding product:", err);
                return res.status(500).send('Error adding product');
            }
            res.send('Product added successfully!');
    });
});

// Update an existing product
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, price, quantity } = req.body;

    db.query('UPDATE products SET name = ?, description = ?, price = ?, quantity = ? WHERE id = ?', 
        [name, description, price, quantity, id], 
        (err, results) => {
            if (err) throw err;
            res.send('Product updated successfully!');
    });
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM products WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.send('Product deleted successfully!');
    });
});

// Update a user's information
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    
    // Hash the new password before updating if it exists
    if (password) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).send('Error hashing password');
            
            db.query('UPDATE users SET username = ?, password = ? WHERE id = ?', 
                [username, hashedPassword, id], 
                (err, results) => {
                    if (err) return res.status(500).send('Error updating user');
                    res.send('User updated successfully!');
            });
        });
    } else {
        db.query('UPDATE users SET username = ? WHERE id = ?', 
            [username, id], 
            (err, results) => {
                if (err) return res.status(500).send('Error updating user');
                res.send('User updated successfully!');
        });
    }
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).send('Error deleting user');
        res.send('User deleted successfully!');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
