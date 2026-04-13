const db = require('./database');

<<<<<<< HEAD
let currentUser = null;
let LIVE = null;

// ================= LOGIN =================
function login() {
  const username = document.getElementById("username").value;

  db.get("SELECT * FROM users WHERE username=?", [username], (err, user) => {
    if (!user) {
      document.getElementById("error").innerText = "User not found";
      return;
    }

    currentUser = user;

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";

    if (user.role === "admin") {
      document.getElementById("adminPanel").style.display = "block";
    }

    loadSessions();
    startLiveMode();
  });
}

// ================= RATE =================
function getRate(cb) {
  db.get("SELECT value FROM settings WHERE key='rate_per_5min'", (e, r) => {
    cb(Number(r.value || 50));
=======
let LIVE = null;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {

  const station = document.getElementById("station");
  const duration = document.getElementById("duration");

  // ENTER KEY SUPPORT
  station.addEventListener("keydown", e => {
    if (e.key === "Enter") startSession();
  });

  duration.addEventListener("keydown", e => {
    if (e.key === "Enter") startSession();
  });

  loadSessions();
  loadDailyReport();
  startLive();
});

// ================= RATE =================
function getRate(cb) {
  db.get("SELECT value FROM settings WHERE key='rate_per_10min'", (e, r) => {
    cb(Number(r?.value || 50));
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
  });
}

// ================= RECEIPT =================
function receipt(cb) {
<<<<<<< HEAD
  db.get("SELECT COUNT(*) c FROM sessions", (e, r) => {
    cb("WSG-" + String(r.c + 1).padStart(4, "0"));
=======
  db.get("SELECT COUNT(*) as c FROM sessions", (e, r) => {
    cb("GC-" + String((r?.c || 0) + 1).padStart(4, "0"));
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
  });
}

// ================= START SESSION =================
function startSession() {
<<<<<<< HEAD
  const station = document.getElementById("station").value;
=======

  const station = document.getElementById("station").value.trim();
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
  const duration = Number(document.getElementById("duration").value);

  if (!station || !duration) return;

  getRate(rate => {

<<<<<<< HEAD
    const amount = (duration / 5) * rate;
=======
    const amount = (duration / 10) * rate;
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8

    const start = new Date();
    const end = new Date(start.getTime() + duration * 60000);

    receipt(r => {
<<<<<<< HEAD
=======

>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
      db.run(`
        INSERT INTO sessions
        (receipt_no, station, start_time, end_time, amount, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        r,
        station,
        start.toISOString(),
        end.toISOString(),
        amount,
        "Active"
      ]);

      loadSessions();
<<<<<<< HEAD
=======
      loadDailyReport();
      updateIncome();
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
    });
  });
}

<<<<<<< HEAD
// ================= LIVE MODE =================
function startLiveMode() {
  if (LIVE) clearInterval(LIVE);

  LIVE = setInterval(() => {
    updateLiveStatus();
    updateUIOnly();
  }, 1000);
}

// ================= LIVE STATUS ENGINE =================
function updateLiveStatus() {
  const now = Date.now();

  db.all("SELECT * FROM sessions", (e, rows) => {
=======
// ================= LIVE ENGINE =================
function startLive() {

  if (LIVE) clearInterval(LIVE);

  LIVE = setInterval(() => {
    expireSessions();
    updateCountdown();
    updateIncome();
  }, 1000);
}

// ================= AUTO EXPIRE =================
function expireSessions() {

  const now = Date.now();

  db.all("SELECT id, end_time, status FROM sessions", (e, rows) => {

>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
    rows.forEach(r => {
      const end = new Date(r.end_time).getTime();

      if (now >= end && r.status === "Active") {
        db.run("UPDATE sessions SET status='Ended' WHERE id=?", [r.id]);
      }
    });
<<<<<<< HEAD
  });
}

// ================= UI UPDATE (NO BLINK) =================
function updateUIOnly() {
  getIncome();
  loadSessions(false);
}

// ================= LOAD SESSIONS =================
function loadSessions(full = true) {
  const table = document.getElementById("sessions");

  if (full) table.innerHTML = "";
=======

  });
}

// ================= LOAD SESSIONS =================
function loadSessions() {

  const table = document.getElementById("sessions");
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8

  db.all("SELECT * FROM sessions ORDER BY id DESC", (e, rows) => {

    let html = "";

    rows.forEach(r => {

<<<<<<< HEAD
      const now = Date.now();
      const end = new Date(r.end_time).getTime();

      const remaining = Math.max(0, end - now);

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const isActive = r.status === "Active";

      html += `
        <tr>
=======
      const end = new Date(r.end_time).getTime();
      const date = new Date(r.start_time).toLocaleDateString();

      html += `
        <tr data-end="${end}">

>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
          <td>${r.receipt_no}</td>
          <td>${r.station}</td>
          <td>${new Date(r.start_time).toLocaleTimeString()}</td>
          <td>${new Date(r.end_time).toLocaleTimeString()}</td>

<<<<<<< HEAD
          <td>
            <span style="
              padding:4px 8px;
              border-radius:5px;
              color:white;
              background:${isActive ? 'green' : 'red'};
            ">
=======
          <td>${date}</td>

          <td>
            <span style="padding:3px 6px;color:white;background:${r.status==='Active'?'green':'red'}">
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
              ${r.status}
            </span>
          </td>

<<<<<<< HEAD
          <td style="color:orange;font-weight:bold;">
            ${isActive ? `${minutes}m ${seconds}s` : "ENDED"}
          </td>
=======
          <td class="countdown">--</td>
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8

          <td>
            <button onclick="endSession(${r.id})">End</button>
          </td>
<<<<<<< HEAD
=======

>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
        </tr>
      `;
    });

    table.innerHTML = html;
  });
}

<<<<<<< HEAD
=======
// ================= COUNTDOWN =================
function updateCountdown() {

  const now = Date.now();

  document.querySelectorAll("tr[data-end]").forEach(row => {

    const end = Number(row.dataset.end);
    const cell = row.querySelector(".countdown");

    if (!cell) return;

    const diff = end - now;

    if (diff <= 0) {
      cell.innerText = "ENDED";
      return;
    }

    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    cell.innerText = `${m}m ${s}s`;
  });
}

>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
// ================= END SESSION =================
function endSession(id) {
  db.run("UPDATE sessions SET status='Ended' WHERE id=?", [id], loadSessions);
}

// ================= INCOME =================
<<<<<<< HEAD
function getIncome() {
  db.all("SELECT amount FROM sessions", (e, rows) => {
    let total = 0;
    rows.forEach(r => total += Number(r.amount || 0));

    document.getElementById("income").innerText =
      "Income: ₦" + total;
=======
function updateIncome() {

  db.all("SELECT amount FROM sessions", (e, rows) => {

    let total = 0;

    rows.forEach(r => total += Number(r.amount || 0));

    document.getElementById("income").innerText = "Income: ₦" + total;
  });
}

// ================= DAILY REPORT =================
function loadDailyReport() {

  db.all("SELECT * FROM sessions", (e, rows) => {

    let map = {};

    rows.forEach(r => {

      const date = new Date(r.start_time).toISOString().split("T")[0];

      if (!map[date]) {
        map[date] = { total: 0, count: 0 };
      }

      map[date].total += Number(r.amount || 0);
      map[date].count++;
    });

    let html = "";

    Object.keys(map).sort().reverse().forEach(date => {

      html += `
        <div style="padding:10px;margin:5px;background:#222;color:white;border-radius:6px;">
          <b>📅 ${date}</b><br>
          🎮 Sessions: ${map[date].count}<br>
          💰 Total: ₦${map[date].total}<br>

          <button onclick="viewDay('${date}')">
            View Details
          </button>
        </div>
      `;
    });

    document.getElementById("dailyReport").innerHTML = html;
  });
}

// ================= VIEW DAY DETAILS =================
function viewDay(date) {

  db.all("SELECT * FROM sessions", (e, rows) => {

    let filtered = rows.filter(r =>
      new Date(r.start_time).toISOString().split("T")[0] === date
    );

    let total = 0;
    let html = `<h3>📅 ${date} Breakdown</h3>`;

    filtered.forEach(r => {
      total += Number(r.amount || 0);

      html += `
        <div style="padding:5px;border-bottom:1px solid #444;">
          🎮 ${r.station} | ₦${r.amount} | ${r.status}
        </div>
      `;
    });

    html += `<h3>💰 TOTAL: ₦${total}</h3>`;

    document.getElementById("dailyReport").innerHTML = html;
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
  });
}

// ================= RATE =================
function setRate() {
  const rate = document.getElementById("rate").value;

  db.run(
<<<<<<< HEAD
    "UPDATE settings SET value=? WHERE key='rate_per_5min'",
    [rate]
  );
}

// ================= STATION REPORT =================
function getStationSummary() {
  db.all("SELECT * FROM sessions", (e, rows) => {

    let map = {};

    rows.forEach(r => {
      if (!map[r.station]) {
        map[r.station] = { total: 0, count: 0 };
      }

      map[r.station].total += Number(r.amount || 0);
      map[r.station].count++;
    });

    let html = "";

    for (let s in map) {
      html += `
        <div style="background:#222;padding:10px;margin:5px;border-radius:6px;">
          <b>${s}</b><br>
          💰 ₦${map[s].total}<br>
          🎮 ${map[s].count} sessions
        </div>
      `;
    }

    document.getElementById("stationReport").innerHTML = html;
  });
=======
    "UPDATE settings SET value=? WHERE key='rate_per_10min'",
    [rate]
  );
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
}