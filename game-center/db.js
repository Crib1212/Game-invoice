// ================= db.js =================

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./pos.db");

// ================= ADMIN =================

db.run(`
  CREATE TABLE IF NOT EXISTS admin(
    id INTEGER PRIMARY KEY,
    password TEXT
  )
`);

db.get(
  "SELECT * FROM admin WHERE id=1",
  (err, row) => {

    if (!row) {

      db.run(`
        INSERT INTO admin(id, password)
        VALUES(1, '1234')
      `);

    }

  }
);

// ================= COUNTER =================
// FIXED: unified invoice system (SAFE + CONSISTENT)

db.run(`
  CREATE TABLE IF NOT EXISTS counter(
    id INTEGER PRIMARY KEY,
    currentNumber INTEGER
  )
`);

db.get(
  "SELECT * FROM counter WHERE id=1",
  (err, row) => {

    if (!row) {

      db.run(`
        INSERT INTO counter(id, currentNumber)
        VALUES(1, 0)
      `);

    }

  }
);

// ================= SESSIONS =================

db.run(`
  CREATE TABLE IF NOT EXISTS sessions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice TEXT,
    station TEXT,
    pricePerGame REAL,
    gameMinutes INTEGER,
    customerMinutes INTEGER,
    amount REAL,
    startTime INTEGER,
    endTime INTEGER,
    date TEXT
  )
`);

// ================= PRODUCTS =================

db.run(`
  CREATE TABLE IF NOT EXISTS products(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    costPrice REAL DEFAULT 0,
    price REAL,
    qty INTEGER
  )
`);

// ================= SALES =================

db.run(`
  CREATE TABLE IF NOT EXISTS sales(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice TEXT,
    product TEXT,
    qty INTEGER,
    price REAL DEFAULT 0,
    costPrice REAL DEFAULT 0,
    profit REAL DEFAULT 0,
    total REAL,
    date TEXT
  )
`);

// ================= INVOICE HELPER =================

function getNextInvoice(callback) {

  db.get(
    "SELECT currentNumber FROM counter WHERE id=1",
    (err, row) => {

      let next = (row?.currentNumber || 0) + 1;

      db.run(
        "UPDATE counter SET currentNumber=? WHERE id=1",
        [next],
        () => callback(next)
      );

    }
  );

}

// ================= EXPORT =================

module.exports = {
  db,
  getNextInvoice
};