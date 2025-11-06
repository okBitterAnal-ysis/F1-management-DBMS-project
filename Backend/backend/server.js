const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = 3001; 

app.use(cors());
app.use(express.json());

// --- Database Connection ---
// Use your F1 database name
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", 
    database: "formulaOne" // Make sure this matches your database name
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to database:", err);
        return;
    }
    console.log("Successfully connected to MySQL database!");
});

// --- API Routes (Endpoints) ---

// 1. GET all drivers (from your 'Driver' table)
app.get("/api/drivers", (req, res) => {
    // UPDATED: Query your 'Driver' table
    const sql = "SELECT * FROM Driver"; 
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// 2. ADD a new driver (to your 'Driver' table)
app.post("/api/drivers", (req, res) => {
    // UPDATED: Get new fields from the request body
    const { FirstName, LastName, Nationality, DOB, Championships } = req.body;

    if (!FirstName || !LastName || !Nationality || !DOB) {
        return res.status(400).json({ error: "First name, last name, nationality, and DOB are required" });
    }

    // UPDATED: Insert into your 'Driver' table
    const sql = "INSERT INTO Driver (FirstName, LastName, Nationality, DOB, Championships) VALUES (?, ?, ?, ?, ?)";
    const values = [
        FirstName,
        LastName,
        Nationality,
        DOB,
        Championships || 0 // Default championships to 0 if not provided
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ 
            Driver_ID: result.insertId, // Use the correct ID key
            FirstName, 
            LastName, 
            Nationality, 
            DOB, 
            Championships 
        });
    });
});

// 3. DELETE a driver (from your 'Driver' table)
app.delete("/api/drivers/:id", (req, res) => {
    const { id } = req.params; 
    // UPDATED: Use your primary key 'Driver_ID'
    const sql = "DELETE FROM Driver WHERE Driver_ID = ?"; 

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }
        res.status(200).json({ message: "Driver deleted successfully" });
    });
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});