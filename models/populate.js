//When run, this file extracts the data from the JSON and inserts it into the database.
const fs = require('fs');
const db = require('./db');
const path = require('path');

// Path to your JSON file
const filePath = path.join(__dirname, 'data.json');

// Read JSON file
fs.readFile(filePath, 'utf-8', (err, data) => {
  if (err) {
    console.error('Error reading JSON file:', err);
    return;
  }

  // Parse JSON data
  const jsonData = JSON.parse(data);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    jsonData.forEach(user => {
      const { name, company, email, phone, skills } = user;

      // Insert user to db, get userID
      db.run('INSERT INTO users (name, company, email, phone) VALUES (?, ?, ?, ?)', [name, company, email, phone], function (userResult) {
        const userId = this.lastID;

        skills.forEach(skill => {
          // Insert skill to db with the obtained userID
          db.run('INSERT INTO skills (user_id, skill, rating) VALUES (?, ?, ?)', [userId, skill.skill, skill.rating], function (skillResult) {
            console.log(`Inserted skill for user ${userId}: ${skill.skill}`);
          });
        });
      });
    });

    // Commit changes and close the db
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error committing transaction:', err);
      } else {
        console.log('Data successfully inserted into the database.');
      }

      // Close the db
      db.close();
    });
  });
});
