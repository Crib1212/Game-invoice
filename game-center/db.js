const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db.sqlite");

/* ================= TABLES ================= */
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    receipt TEXT,
    station TEXT,
    customer TEXT,
    duration INTEGER,
    startTime INTEGER,
    endTime INTEGER,
    status TEXT,
    total REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY,
    customer TEXT,
    item TEXT,
    price REAL,
    qty INTEGER,
    total REAL,
    time INTEGER
  )`);
});

/* ================= SESSIONS ================= */
exports.startSession = (s) => {
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO sessions VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        s.id,
        s.receipt,
        s.station,
        s.customer,
        s.duration,
        s.startTime,
        s.endTime,
        "active",
        s.total
      ],
      () => resolve({ ok: true })
    );
  });
};

exports.endSession = (id) => {
  return new Promise((resolve) => {
    db.run(
      `UPDATE sessions SET status='completed' WHERE id=?`,
      [id],
      () => resolve({ ok: true })
    );
  });
};

exports.getSessions = () => {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM sessions ORDER BY startTime DESC`, (err, rows) => {
      resolve(rows);
    });
  });
};

/* ================= SALES ================= */
exports.addSale = (s) => {
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO sales VALUES (?,?,?,?,?,?,?)`,
      [
        s.id,
        s.customer,
        s.item,
        s.price,
        s.qty,
        s.total,
        s.time
      ],
      () => resolve({ ok: true })
    );
  });
};

exports.getSales = () => {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM sales ORDER BY time DESC`, (err, rows) => {
      resolve(rows);
    });
  });
};