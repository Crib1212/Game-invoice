const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./gamecenter.db');

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT,
      station TEXT,
      start_time TEXT,
      end_time TEXT,
      amount INTEGER,
      status TEXT
    )
  `);

});

// DEFAULT ADMIN
db.get("SELECT * FROM users WHERE username='admin'", (err, row) => {
  if (!row) {
    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ["admin", "1234", "admin"]
    );
    console.log("Admin created: admin / 1234");
  }
});

module.exports = db;