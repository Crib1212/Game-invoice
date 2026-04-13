const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Detect environment (Electron safe)
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

let dbPath;

if (isDev) {
  // Development mode
  dbPath = path.join(__dirname, 'gamecenter.db');
} else {
  // Production mode (Electron installed app)
  const { app } = require('electron');
  dbPath = path.join(app.getPath('userData'), 'gamecenter.db');
}

console.log("📦 Database Path:", dbPath);

// Create database
const db = new sqlite3.Database(dbPath);

// ================= INIT TABLES =================
db.serialize(() => {

  // USERS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  // SESSIONS TABLE (core gaming records)
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT,
      station TEXT,
      start_time TEXT,
      end_time TEXT,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'Active'
    )
  `);

  // SETTINGS TABLE (rate, config etc)
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // ================= DEFAULT ADMIN =================
  db.run(`
    INSERT OR IGNORE INTO users (username, password, role)
    VALUES ('admin', 'admin', 'admin')
  `);

  // ================= DEFAULT RATE =================
  db.run(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES ('rate_per_10min', '50')
  `);

});

module.exports = db;