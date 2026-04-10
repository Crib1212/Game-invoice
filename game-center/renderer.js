const db = require('./database');

let currentUser = null;

// ---------- LOGIN ----------
function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;

  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [u, p],
    (err, user) => {

      if (!user) {
        document.getElementById("error").innerText = "Invalid login";
        return;
      }

      currentUser = user;

      document.getElementById("loginPage").style.display = "none";
      document.getElementById("app").style.display = "block";

      if (user.role === "admin") {
        document.getElementById("adminPanel").style.display = "block";
      }

      loadSessions();
      getIncome();
    }
  );
}

// ---------- GET RATE ----------
function getRate(cb) {
  db.get("SELECT value FROM settings WHERE key='rate_per_5min'", (e, r) => {
    cb(Number(r?.value || 50));
  });
}

// ---------- RECEIPT ----------
function receipt(cb) {
  db.get("SELECT COUNT(*) as c FROM sessions", (e, r) => {
    cb("WSG-" + String((r?.c || 0) + 1).padStart(4, "0"));
  });
}

// ---------- START SESSION ----------
function startSession() {

  const station = document.getElementById("station").value;
  const minutes = Number(document.getElementById("duration").value);

  if (!station || !minutes) return alert("Fill all fields");

  getRate(rate => {

    const amount = (minutes / 5) * rate;

    const start = new Date();
    const end = new Date(start.getTime() + minutes * 60000);

    receipt(no => {

      db.run(`
        INSERT INTO sessions 
        (receipt_no, station, start_time, end_time, end_time_real, amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        no,
        station,
        start.toLocaleTimeString(),
        end.toLocaleTimeString(),
        end.toISOString(),
        amount,
        "Active"
      ]);

      loadSessions();
      getIncome();
    });
  });
}

// ---------- LOAD ----------
function loadSessions() {

  const table = document.getElementById("sessions");
  table.innerHTML = "";

  db.all("SELECT * FROM sessions ORDER BY id DESC", (e, rows) => {

    rows.forEach(r => {

      const now = new Date();
      const end = new Date(r.end_time_real);

      const status = now >= end ? "Expired" : r.status;

      table.innerHTML += `
        <tr>
          <td>${r.receipt_no}</td>
          <td>${r.station}</td>
          <td>${r.start_time}</td>
          <td>${r.end_time}</td>
          <td>${status}</td>
          <td>
            <button onclick="endSession(${r.id})">End</button>
            <button onclick="extendSession(${r.id},30)">+30</button>
          </td>
        </tr>
      `;
    });
  });
}

// ---------- END ----------
function endSession(id) {
  db.run(
    "UPDATE sessions SET status='Ended' WHERE id=?",
    [id],
    loadSessions
  );
}

// ---------- EXTEND ----------
function extendSession(id, mins) {

  db.get("SELECT * FROM sessions WHERE id=?", [id], (e, r) => {

    const newEnd = new Date(new Date(r.end_time_real).getTime() + mins * 60000);

    db.run(
      "UPDATE sessions SET end_time_real=? WHERE id=?",
      [newEnd.toISOString(), id],
      loadSessions
    );
  });
}

// ---------- INCOME ----------
function getIncome() {

  db.all("SELECT amount FROM sessions", (e, rows) => {

    let total = 0;
    rows.forEach(r => total += Number(r.amount || 0));

    document.getElementById("income").innerText =
      "💰 Income: ₦" + total;
  });
}

// ---------- ADMIN ----------
function changePassword() {

  const p = document.getElementById("newPassword").value;

  db.run(
    "UPDATE users SET password=? WHERE username='admin'",
    [p],
    () => alert("Password updated")
  );
}

function setRate() {

  const r = document.getElementById("rate").value;

  db.run(
    "INSERT OR REPLACE INTO settings (key,value) VALUES ('rate_per_5min',?)",
    [r],
    () => alert("Rate updated")
  );
}