//Defines the database, creates the tables.

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mydb.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database opened successfully');
    // Initialize tables
  }
});

// Create a Users table
db.run(`
 CREATE TABLE IF NOT EXISTS users (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name TEXT,
   company TEXT,
   email TEXT,
   phone TEXT
 )
`);

// Create a Skills table
db.run(`
 CREATE TABLE IF NOT EXISTS skills (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   user_id INTEGER,
   skill TEXT,
   rating INTEGER,
   FOREIGN KEY (user_id) REFERENCES users(id)
 )
`);

module.exports = db;