// ================= db.js =================

const sqlite3 =
  require("sqlite3").verbose();

const db =
  new sqlite3.Database("./pos.db");

// ================= ADMIN =================

db.run(`
  CREATE TABLE IF NOT EXISTS admin(

    id INTEGER PRIMARY KEY,
    password TEXT

  )
`);

db.get(
  "SELECT * FROM admin WHERE id=1",
  (err,row)=>{

    if(!row){

      db.run(`
        INSERT INTO admin(
          id,
          password
        )

        VALUES(
          1,
          '1234'
        )
      `);

    }
  }
);

// ================= SESSIONS =================

db.run(`
  CREATE TABLE IF NOT EXISTS sessions(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    invoice INTEGER,

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

    price REAL,

    qty INTEGER

  )
`);

// ================= SALES =================

db.run(`
  CREATE TABLE IF NOT EXISTS sales(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    invoice INTEGER,

    product TEXT,

    qty INTEGER,

    total REAL,

    date TEXT

  )
`);

module.exports = db;