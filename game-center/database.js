const sqlite3 = require('sqlite3').verbose();
<<<<<<< HEAD

const db = new sqlite3.Database('./gamecenter.db');
=======
const path = require('path');

// Detect if app is packaged
const isDev = process.env.NODE_ENV !== 'production';

// Use correct path
let dbPath;

if (isDev) {
  // Development (your folder)
  dbPath = path.join(__dirname, 'gamecenter.db');
} else {
  // Production (installed app)
  const { app } = require('electron');
  dbPath = path.join(app.getPath('userData'), 'gamecenter.db');
}

console.log("DB Path:", dbPath);

const db = new sqlite3.Database(dbPath);
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8

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
      amount REAL,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

<<<<<<< HEAD
  // default admin
=======
  // Default admin
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
  db.run(`
    INSERT OR IGNORE INTO users (username,password,role)
    VALUES ('admin','admin','admin')
  `);

<<<<<<< HEAD
  // default rate
  db.run(`
    INSERT OR IGNORE INTO settings (key,value)
    VALUES ('rate_per_5min','50')
=======
  // Default rate
  db.run(`
    INSERT OR IGNORE INTO settings (key,value)
    VALUES ('rate_per_10min','300')
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
  `);

});

module.exports = db;