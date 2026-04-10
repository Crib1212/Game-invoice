const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./gamecenter.db');

db.serialize(() => {

  // USERS
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  // SESSIONS
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT,
      station TEXT,
      start_time TEXT,
      end_time TEXT,
      end_time_real TEXT,
      amount INTEGER,
      status TEXT
    )
  `);

  // SETTINGS (IMPORTANT FIX)
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // DEFAULT RATE (₦50 per 5 mins)
  db.run(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES ('rate_per_5min', '50')
  `);

  // DEFAULT ADMIN PASSWORD = 1234
  db.run(`
    INSERT OR IGNORE INTO users (username, password, role)
    VALUES ('admin', '1234', 'admin')
  `);
});

module.exports = db;