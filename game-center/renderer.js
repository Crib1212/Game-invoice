const db = require('./database');

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
  });
}

// ================= RECEIPT =================
function receipt(cb) {
  db.get("SELECT COUNT(*) as c FROM sessions", (e, r) => {
    cb("GC-" + String((r?.c || 0) + 1).padStart(4, "0"));
  });
}

// ================= START SESSION =================
function startSession() {

  const station = document.getElementById("station").value.trim();
  const duration = Number(document.getElementById("duration").value);

  if (!station || !duration) return;

  getRate(rate => {

    const amount = (duration / 10) * rate;

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
      loadDailyReport();
      updateIncome();
    });
  });
}

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

    rows.forEach(r => {
      const end = new Date(r.end_time).getTime();

      if (now >= end && r.status === "Active") {
        db.run("UPDATE sessions SET status='Ended' WHERE id=?", [r.id]);
      }
    });

  });
}

// ================= LOAD SESSIONS =================
function loadSessions() {

  const table = document.getElementById("sessions");

  db.all("SELECT * FROM sessions ORDER BY id DESC", (e, rows) => {

    let html = "";

    rows.forEach(r => {

      const end = new Date(r.end_time).getTime();
      const date = new Date(r.start_time).toLocaleDateString();

      html += `
        <tr data-end="${end}">

          <td>${r.receipt_no}</td>
          <td>${r.station}</td>
          <td>${new Date(r.start_time).toLocaleTimeString()}</td>
          <td>${new Date(r.end_time).toLocaleTimeString()}</td>

          <td>${date}</td>

          <td>
            <span style="padding:3px 6px;color:white;background:${r.status==='Active'?'green':'red'}">
              ${r.status}
            </span>
          </td>

          <td class="countdown">--</td>

          <td>
            <button onclick="endSession(${r.id})">End</button>
          </td>

        </tr>
      `;
    });

    table.innerHTML = html;
  });
}

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

// ================= END SESSION =================
function endSession(id) {
  db.run("UPDATE sessions SET status='Ended' WHERE id=?", [id], loadSessions);
}

// ================= INCOME =================
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
  });
}

// ================= RATE =================
function setRate() {
  const rate = document.getElementById("rate").value;

  db.run(
    "UPDATE settings SET value=? WHERE key='rate_per_10min'",
    [rate]
  );
}