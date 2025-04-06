const db = require('./db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS farmer_inputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      soil_pH REAL,
      soil_moisture REAL,
      temperature REAL,
      rainfall REAL,
      crop_preference TEXT,
      budget INTEGER
    )
  `);

  console.log("Database initialized");
});
