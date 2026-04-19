const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "gamecenter.db")
);

// ================= TABLES =================
db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station TEXT,
      customer TEXT,
      startTime INTEGER,
      endTime INTEGER,
      duration INTEGER,
      total INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receiptNo TEXT,
      station TEXT,
      customer TEXT,
      startTime INTEGER,
      endTime INTEGER,
      duration INTEGER,
      total INTEGER,
      createdAt INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item TEXT,
      price INTEGER,
      qty INTEGER,
      customer TEXT,
      total INTEGER,
      time INTEGER
    )
  `);
});

// ================= SESSION + RECEIPT =================
function saveSessionWithReceipt(data) {
  return new Promise((resolve, reject) => {
    const receiptNo = "RC-" + Date.now();

    db.run(
      `INSERT INTO sessions (station, customer, startTime, endTime, duration, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.station,
        data.customer,
        data.startTime,
        data.endTime,
        data.duration,
        data.total
      ],
      function (err) {
        if (err) return reject(err);

        db.run(
          `INSERT INTO receipts
           (receiptNo, station, customer, startTime, endTime, duration, total, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            receiptNo,
            data.station,
            data.customer,
            data.startTime,
            data.endTime,
            data.duration,
            data.total,
            Date.now()
          ],
          function (err2) {
            if (err2) reject(err2);
            else resolve({ receiptNo });
          }
        );
      }
    );
  });
}

// ================= GET DATA =================
function getSessions() {
  return new Promise((res, rej) => {
    db.all(`SELECT * FROM sessions ORDER BY id DESC`, [], (e, r) =>
      e ? rej(e) : res(r)
    );
  });
}

function getReceipts() {
  return new Promise((res, rej) => {
    db.all(`SELECT * FROM receipts ORDER BY id DESC`, [], (e, r) =>
      e ? rej(e) : res(r)
    );
  });
}

function saveSale(data) {
  return new Promise((res, rej) => {
    db.run(
      `INSERT INTO sales (item, price, qty, customer, total, time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.item,
        data.price,
        data.qty,
        data.customer,
        data.total,
        data.time
      ],
      function (e) {
        e ? rej(e) : res(this.lastID);
      }
    );
  });
}

function getSales() {
  return new Promise((res, rej) => {
    db.all(`SELECT * FROM sales ORDER BY id DESC`, [], (e, r) =>
      e ? rej(e) : res(r)
    );
  });
}

module.exports = {
  saveSessionWithReceipt,
  getSessions,
  getReceipts,
  saveSale,
  getSales
};