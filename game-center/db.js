const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("pos.db");

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY,
      invoiceCounter INTEGER
    )
  `);

  db.run(`INSERT OR IGNORE INTO meta (id, invoiceCounter) VALUES (1, 0)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice INTEGER,
      station TEXT,
      startTime INTEGER,
      endTime INTEGER,
      customerMinutes INTEGER,
      pricePerGame INTEGER,
      gameMinutes INTEGER,
      amount INTEGER,
      date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice INTEGER,
      customer TEXT,
      item TEXT,
      startTime INTEGER,
      endTime INTEGER,
      price INTEGER,
      qty INTEGER,
      total INTEGER,
      date TEXT
    )
  `);

});

module.exports = db;