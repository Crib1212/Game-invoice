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

  // default admin
  db.run(`
    INSERT OR IGNORE INTO users (username,password,role)
    VALUES ('admin','admin','admin')
  `);

  // default rate
  db.run(`
    INSERT OR IGNORE INTO settings (key,value)
    VALUES ('rate_per_5min','50')
  `);

});

module.exports = db;