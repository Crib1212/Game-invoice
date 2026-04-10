const db = require('./database');

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
  });
}

// ================= RECEIPT =================
function receipt(cb) {
  db.get("SELECT COUNT(*) c FROM sessions", (e, r) => {
    cb("WSG-" + String(r.c + 1).padStart(4, "0"));
  });
}

// ================= START SESSION =================
function startSession() {
  const station = document.getElementById("station").value;
  const duration = Number(document.getElementById("duration").value);

  if (!station || !duration) return;

  getRate(rate => {

    const amount = (duration / 5) * rate;

    const start = new Date();
    const end = new Date(start.getTime() + duration * 60000);

    receipt(r => {
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
    });
  });
}

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
    rows.forEach(r => {
      const end = new Date(r.end_time).getTime();

      if (now >= end && r.status === "Active") {
        db.run("UPDATE sessions SET status='Ended' WHERE id=?", [r.id]);
      }
    });
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

  db.all("SELECT * FROM sessions ORDER BY id DESC", (e, rows) => {

    let html = "";

    rows.forEach(r => {

      const now = Date.now();
      const end = new Date(r.end_time).getTime();

      const remaining = Math.max(0, end - now);

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const isActive = r.status === "Active";

      html += `
        <tr>
          <td>${r.receipt_no}</td>
          <td>${r.station}</td>
          <td>${new Date(r.start_time).toLocaleTimeString()}</td>
          <td>${new Date(r.end_time).toLocaleTimeString()}</td>

          <td>
            <span style="
              padding:4px 8px;
              border-radius:5px;
              color:white;
              background:${isActive ? 'green' : 'red'};
            ">
              ${r.status}
            </span>
          </td>

          <td style="color:orange;font-weight:bold;">
            ${isActive ? `${minutes}m ${seconds}s` : "ENDED"}
          </td>

          <td>
            <button onclick="endSession(${r.id})">End</button>
          </td>
        </tr>
      `;
    });

    table.innerHTML = html;
  });
}

// ================= END SESSION =================
function endSession(id) {
  db.run("UPDATE sessions SET status='Ended' WHERE id=?", [id], loadSessions);
}

// ================= INCOME =================
function getIncome() {
  db.all("SELECT amount FROM sessions", (e, rows) => {
    let total = 0;
    rows.forEach(r => total += Number(r.amount || 0));

    document.getElementById("income").innerText =
      "Income: ₦" + total;
  });
}

// ================= RATE =================
function setRate() {
  const rate = document.getElementById("rate").value;

  db.run(
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
}