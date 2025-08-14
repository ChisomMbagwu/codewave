// REQUIRE express, UUID, SQL AND CREATE PORT

const express = require("express");
const uuid = require("uuid").v4;
const mysql = require("mysql2");
const PORT = 8080;

// INSTANTIATE EXPRESS
const app = express()
app.use (express.json());

// TO CONNECT THE DATABASE TO MYSQL
const database = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "chichi2022",
    database: "codewave"
});

// DATABASE ERROR MESSAGE
database.connect((error) => {
    if (error) {
        console.log("Error connecting to database", error.message);
    } else {
        console.log("Database connected successfully");
    }
});

// CREATING A STUDENT TABLE
database.query(
    `CREATE TABLE IF NOT EXISTS students
     (id VARCHAR(100) PRIMARY KEY NOT NULL, 
     full_name VARCHAR (255) NOT NULL, 
     stack ENUM ("frontend", "backend", "fullstack") NOT NULL, 
     email VARCHAR (100) UNIQUE NOT NULL)`,
    (error) => {
        if (error) {
            console.log("Error creating students table", error.message)

        } else {
            console.log("Students table created successfully or exists")
        }
    });

    // CREATING THE SCORES TABLE
  database.query(
  `CREATE TABLE IF NOT EXISTS scores(
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    student_id VARCHAR(255),
    punctuality_score INT NOT NULL,
    assignment_score INT NOT NULL,
    total_score INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
  (err) => {
    if (err) {
      console.log("Error creating scores table", err.message)

    } else {
      console.log("Scores table ready");
    }
  });

        // INSERTING STUDENT DATA INTO THE STUDENTS TABLE
app.post("/student", (req, res) => {
const {full_name, stack, email} = req.body
database.query(`INSERT INTO students (id, full_name, stack, email)VALUES (?, ?, ?, ?)`, 
    [uuid(), full_name, stack, email], (error,data) => {
if (error) {
    res.status(500).json ({
    message: "Error inserting student",
    error: error.message
    })
    
} else {
    res.status(200).json ({
        message: "Student record created successfully",
        data: data
    })
}})
});

// Get all students
app.get("/student", (req, res) => {
 database.query(`SELECT * FROM students`, (error, data) => {
        if (error) {
            res.status(500).json({ 
                message: "Error getting all students", 
                error: error.message 
            });
        } else {
            res.status(200).json({
                message: "All students",
                data: data,
            });
        }
    }
    );
});

// // Get a single student by ID
app.get("/student/:id", (req, res) => {
  const { id } = req.params;

database.query(`SELECT * FROM students WHERE id = ?`, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ message: "Error fetching student", error: err.message });
        } else if (rows.length === 0) {
            res.status(404).json({ message: `Student with ID: ${id} not found` });
        } else {
            res.status(200).json({ message: "Student found", data: rows[0] });
        }
    });
});

// // Update a student's stack
app.put("/student/:id", (req, res) => {
    const { id } = req.params;
    const { stack, email, full_name } = req.body;
  
    database.query(`UPDATE students SET stack = ?, email = ?, full_name = ? WHERE id = ?`, 
    [stack, email, full_name, id], (error, row) => {
      if (error) {
        res.status(500).json({ message: "Error updating student", error: error.message });
      } else if (row.affectedRows === 0) {
        res.status(404).json({ message: `Student with ID: ${id} not found` });
      } else {
        res.status(200).json({ message: "Student updated successfully" });
      }
    });
});

// // Delete a student
app.delete("/student/:id", (req, res) => {
    const { id } = req.params;
  
    database.query(`DELETE FROM students WHERE id = ?`, [id], (error, result) => {
      if (error) {
        res.status(500).json({ message: "Error deleting student", error: error.message });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ message: `Student with ID: ${id} not found` });
      } else {
        res.status(200).json({ message: "Student deleted successfully" });
      }
    });
});

// // Adding a score to the scores table
app.post("/score", (req, res) => {
    const { student_id, punctuality_score, assignment_score } = req.body;
    const total_score = punctuality_score + assignment_score;
  
    database.query(
      `INSERT INTO scores(id, student_id, punctuality_score, assignment_score, total_score) VALUES (?,?,?,?,?)`,
      [uuid(), student_id, punctuality_score, assignment_score, total_score],
      (err, data) => {
        if (err) {
          res.status(500).json({ message: "Error inserting score", error: err.message });
        } else {
          res.status(200).json({ message: "Score inserted successfully" });
        }
      }
    );
});

// // Get all scores
app.get("/scores", (req, res) => {
    database.query(`SELECT * FROM scores`, (err, data) => {
      if (err) {
        res.status(500).json({ message: "Error fetching scores", error: err.message });
      } else {
        res.status(200).json({ message: "All scores", data });
      }
    });
});

// // LEFT JOIN
app.get("/students-scores", (req, res) => {
  database.query(
    `SELECT students.full_name, students.stack, students.email, scores.punctuality_score, scores.assignment_score, scores.total_score 
     FROM students 
     LEFT JOIN scores ON students.id = scores.student_id`,
    (err, data) => {
      if (err) {
        res.status(500).json({ message: "Error performing LEFT JOIN", error: err.message });
      } else {
        res.status(200).json({ message: "Students with scores (LEFT JOIN)", data });
      }
    }
  );
});

// // RIGHT JOIN
app.get("/scores-students", (req, res) => {
  database.query(
    `SELECT students.full_name, students.stack, students.email, scores.punctuality_score, scores.assignment_score, scores.total_score 
     FROM students 
     RIGHT JOIN scores ON students.id = scores.student_id`,
    (err, data) => {
      if (err) {
        res.status(500).json({ message: "Error performing RIGHT JOIN", error: err.message });
      } else {
        res.status(200).json({ message: "Scores with students (RIGHT JOIN)", data });
      }
    }
  );
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
