require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = 3001; 

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is alive!");
});

// --- Database Connection ---

const db = mysql.createConnection(process.env.DATABASE_URL);

db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to database:", err);
    return;
  }
  console.log("✅ Successfully connected to MySQL database!");
});

// --- API Routes (Endpoints) ---

// === API FOR VISUAL COMPONENTS ===

// GET Driver Standings (for Drivers page, Podium, Standings table)
app.get("/api/driver-standings", (req, res) => {
    const sql = `
        SELECT 
            d.Driver_ID, 
            d.FirstName, 
            d.LastName, 
            d.Nationality,
            d.DOB,
            d.Championships,
            d.CurrentPoints AS Points,
            d.DriverNumber AS Number,
            t.Name AS TeamName
        FROM Driver d
        LEFT JOIN Contract c ON d.Driver_ID = c.Driver_ID 
            AND (c.End_Date IS NULL OR c.End_Date >= CURDATE())
        LEFT JOIN Team t ON c.Team_ID = t.Team_ID
        ORDER BY d.CurrentPoints DESC, d.Championships DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching driver standings:", err);
            return res.status(500).json({ error: "Database error fetching driver standings" });
        }
        res.json(results);
    });
});

// GET Team Standings (for Teams page, Team Standings table)
app.get("/api/team-standings", (req, res) => {
    const sql = `
        SELECT 
            t.Team_ID,
            t.Name,
            (SELECT Engine FROM Cars WHERE Cars.Team_ID = t.Team_ID LIMIT 1) AS Engine,
            COALESCE(SUM(d.CurrentPoints), 0) AS TotalPoints
        FROM Team t
        LEFT JOIN Contract con ON t.Team_ID = con.Team_ID 
            AND (con.End_Date IS NULL OR con.End_Date >= CURDATE())
        LEFT JOIN Driver d ON con.Driver_ID = d.Driver_ID
        GROUP BY t.Team_ID, t.Name
        ORDER BY TotalPoints DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching team standings:", err);
            return res.status(500).json({ error: "Database error fetching team standings" });
        }
        res.json(results);
    });
});

// GET Races (for Races page and Homepage)
app.get("/api/races", (req, res) => {
    const sql = `
        SELECT 
            Race_ID, 
            Name, 
            Location, 
            RaceDate,
            Details
        FROM Race 
        ORDER BY RaceDate ASC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching races:", err);
            return res.status(500).json({ error: "Database error fetching races" });
        }
        res.json(results);
    });
});

// === ADMIN PANEL API (for 'Driver' table) ===

// 1. GET all drivers (from your 'Driver' table)
app.get("/api/drivers", (req, res) => {
    const sql = `
        SELECT 
            d.Driver_ID,
            d.FirstName,
            d.LastName,
            d.Nationality,
            d.DOB,
            d.Championships,
            d.CurrentPoints,
            t.Name AS TeamName
        FROM Driver d
        LEFT JOIN Contract c ON d.Driver_ID = c.Driver_ID 
            AND (c.End_Date IS NULL OR c.End_Date >= CURDATE())
        LEFT JOIN Team t ON c.Team_ID = t.Team_ID
        ORDER BY d.Driver_ID
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching drivers:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// 2. ADD a new driver (to your 'Driver' table)
app.post("/api/drivers", (req, res) => {
    const { FirstName, LastName, Nationality, DOB, Championships, CurrentPoints } = req.body;

    if (!FirstName || !LastName || !Nationality || !DOB) {
        return res.status(400).json({ error: "First name, last name, nationality, and DOB are required" });
    }

    const sql = `
        INSERT INTO Driver 
        (FirstName, LastName, Nationality, DOB, Championships, CurrentPoints) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        FirstName,
        LastName,
        Nationality,
        DOB,
        Championships || 0,
        CurrentPoints || 0
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding driver:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ 
            Driver_ID: result.insertId, 
            FirstName, 
            LastName, 
            Nationality, 
            DOB, 
            Championships: Championships || 0,
            CurrentPoints: CurrentPoints || 0
        });
    });
});

// 3. DELETE a driver (from your 'Driver' table)
app.delete("/api/drivers/:id", (req, res) => {
    const { id } = req.params; 
    const sql = "DELETE FROM Driver WHERE Driver_ID = ?"; 

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting driver:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }
        res.status(200).json({ message: "Driver deleted successfully" });
    });
});

// 4. UPDATE a driver
app.put("/api/drivers/:id", (req, res) => {
    const { id } = req.params;
    const { FirstName, LastName, Nationality, DOB, Championships, CurrentPoints } = req.body;

    if (!FirstName || !LastName || !Nationality || !DOB) {
        return res.status(400).json({ error: "All required fields must be provided" });
    }

    const sql = `
        UPDATE Driver 
        SET FirstName = ?, LastName = ?, Nationality = ?, DOB = ?, 
            Championships = ?, CurrentPoints = ? 
        WHERE Driver_ID = ?
    `;
    
    const values = [
        FirstName,
        LastName,
        Nationality,
        DOB,
        Championships || 0,
        CurrentPoints || 0,
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating driver:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }
        res.status(200).json({ 
            Driver_ID: id, 
            FirstName, 
            LastName, 
            Nationality, 
            DOB, 
            Championships: Championships || 0,
            CurrentPoints: CurrentPoints || 0
        });
    });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Backend is running" });
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log(`Test the API at http://localhost:${port}/api/health`);
});