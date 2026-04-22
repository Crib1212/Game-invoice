const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// ================= DB PATH =================
const dbPath = path.join(__dirname, "pos.db");

// ================= CONNECT =================
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// ================= PERFORMANCE MODE =================
db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`PRAGMA synchronous = NORMAL;`);

// ================= INIT =================
db.serialize(() => {

  // ================= META =================
  db.run(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY,
      invoiceCounter INTEGER DEFAULT 0
    )
  `, err => {
    if (err) console.error("Meta table error:", err.message);
  });

  db.run(`
    INSERT OR IGNORE INTO meta (id, invoiceCounter)
    VALUES (1, 0)
  `);

  // ================= SESSIONS =================
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
  `, err => {
    if (err) console.error("Sessions table error:", err.message);
  });

  // ================= PURCHASES =================
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
  `, err => {
    if (err) console.error("Purchases table error:", err.message);
  });

});

// ================= SAFE CLOSE =================
db.safeClose = function (callback) {
  this.close((err) => {
    if (err) {
      console.error("❌ Error closing DB:", err.message);
    } else {
      console.log("🛑 Database closed safely");
    }
    if (callback) callback();
  });
};

module.exports = db;