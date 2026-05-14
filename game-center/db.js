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
        INSERT INTO admin(id,password)
        VALUES(1,'1234')
      `);

    }

  }
);

// ================= COUNTER (UNIFIED INVOICE SYSTEM) =================

db.run(`
  CREATE TABLE IF NOT EXISTS counter(
    id INTEGER PRIMARY KEY,
    value INTEGER
  )
`);

db.get(
  "SELECT * FROM counter WHERE id=1",
  (err,row)=>{

    if(!row){

      db.run(`
        INSERT INTO counter(id,value)
        VALUES(1,0)
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

// ================= INVOICE HELPER =================
// This ensures BOTH sessions and sales use SAME number series

db.get(
  "SELECT value FROM counter WHERE id=1",
  (err,row)=>{

    if(err) return;

    if(!row){

      db.run(`
        INSERT INTO counter(id,value)
        VALUES(1,0)
      `);

    }

  }
);

// Export helper function
module.exports = {

  db,

  getNextInvoice: function(callback){

    db.get(
      "SELECT value FROM counter WHERE id=1",
      (err,row)=>{

        let next =
          (row?.value || 0) + 1;

        db.run(
          "UPDATE counter SET value=? WHERE id=1",
          [next],
          ()=> callback(next)
        );

      }
    );

  }

};