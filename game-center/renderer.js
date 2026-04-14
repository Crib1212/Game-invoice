const db = require('./database');

let LIVE = null;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {

  const station = document.getElementById("station");
  const duration = document.getElementById("duration");

  if (station) {
    station.addEventListener("keydown", e => {
      if (e.key === "Enter") startSession();
    });
  }

  if (duration) {
    duration.addEventListener("keydown", e => {
      if (e.key === "Enter") startSession();
    });
  }

  loadSessions();
  updateIncome();
  loadDailyReport();
  loadStationReport();
  startLive();
});

// ================= RATE =================
function getRate(cb) {
  db.get("SELECT value FROM settings WHERE key='rate_per_10min'", (e, r) => {

    let data = { rate: 50, rateType: 10 };

    try {
      if (r?.value) data = JSON.parse(r.value);
    } catch (err) {}

    cb(data);
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

  getRate(data => {

    const rate = data.rate;
    const rateType = data.rateType;

    // ✅ FIXED CALCULATION
    const amount = (duration / rateType) * rate;

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
      loadStationReport();
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

    // TIME ENDED
    if (diff <= 0) {
      cell.innerText = "ENDED";
      cell.style.color = "orange";   // 🔴 ended text
      cell.style.fontWeight = "bold";
      return;
    }

    // COUNTDOWN ACTIVE
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    cell.innerText = `${m}m ${s}s`;

    cell.style.color = "orange";   // ⚪ countdown text
    cell.style.fontWeight = "bold";
  });
}
// ================= END SESSION =================
function endSession(id) {
  db.run("UPDATE sessions SET status='Ended' WHERE id=?", [id], () => {
    loadSessions();
    updateIncome();
    loadDailyReport();
    loadStationReport();
  });
}

// ================= INCOME =================
function updateIncome() {

  db.all("SELECT amount FROM sessions", (e, rows) => {

    let total = 0;
    rows.forEach(r => total += Number(r.amount || 0));

    document.getElementById("income").innerText = "Income: ₦" + total;
  });
}

// ================= DAILY REPORT (TOGGLE PANEL READY) =================
function loadDailyReport() {

  db.all("SELECT * FROM sessions", (e, rows) => {

    const map = {};

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
          💰 Total: ₦${map[date].total}
        </div>
      `;
    });

    const el = document.getElementById("dailyReport");
    if (el) el.innerHTML = html;
  });
}

// ================= STATION REPORT =================
function loadStationReport() {

  db.all("SELECT * FROM sessions", (e, rows) => {

    const map = {};

    rows.forEach(r => {

      if (!map[r.station]) {
        map[r.station] = { total: 0, count: 0 };
      }

      map[r.station].total += Number(r.amount || 0);
      map[r.station].count++;
    });

    let html = "";

    Object.keys(map).forEach(station => {

      html += `
        <div style="padding:10px;margin:5px;background:#1e1e1e;color:white;border-radius:6px;">
          <b>🎮 ${station}</b><br>
          📊 Sessions: ${map[station].count}<br>
          💰 Total: ₦${map[station].total}
        </div>
      `;
    });

    const el = document.getElementById("stationReport");
    if (el) el.innerHTML = html;
  });
}

// ================= RATE =================
function setRate() {
  const rate = Number(document.getElementById("rate").value);
  const rateType = Number(document.getElementById("rateType").value);

  if (!rate || !rateType) {
    showMsg("❌ Enter valid rate");
    return;
  }

  db.run(
    "UPDATE settings SET value=? WHERE key='rate_per_10min'",
    [JSON.stringify({ rate, rateType })],
    (err) => {
      if (err) return showMsg("❌ Failed to set rate");

      showMsg(`✅ Rate set: ₦${rate} per ${rateType} minutes`);
    }
  );
}

// ================= DAILY TOGGLE (FROM HTML BUTTON) =================
function toggleDailyReportPanel() {

  const panel = document.getElementById("dailyReportPanel");

  if (!panel) return;

  panel.style.display =
    panel.style.display === "none" ? "block" : "none";

  if (panel.style.display === "block") {
    loadDailyReport();
  }
}
function toggleStationReportPanel() {

  const panel = document.getElementById("stationReportPanel");

  if (!panel) return;

  panel.style.display =
    panel.style.display === "none" ? "block" : "none";

  if (panel.style.display === "block") {
    loadStationReport();
  }
}
function showMsg(text) {
  const box = document.getElementById("msgBox");
  if (!box) return;

  box.innerText = text;

  setTimeout(() => {
    box.innerText = "";
  }, 3000);
}