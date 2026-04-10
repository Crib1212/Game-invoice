
const db = require('./database');
const printReceipt = require('./printer');

const RATE_PER_MINUTE = 10;

let currentUser = null;


// ================= LOGIN =================
function login() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, user) => {

      if (!user) {
        document.getElementById("error").innerText = "Invalid login!";
        return;
      }

      currentUser = user;

      document.getElementById("loginPage").style.display = "none";
      document.getElementById("app").style.display = "block";

      loadSessions();
      getDailyIncome();
    }
  );
}


// ================= RECEIPT =================
function generateReceipt(cb) {

  db.get("SELECT COUNT(*) as count FROM sessions", (err, row) => {

    const next = (row?.count || 0) + 1;

    cb("WSG-" + String(next).padStart(4, "0"));
  });
}


// ================= START SESSION =================
function startSession() {

  const station = document.getElementById("station").value;
  const duration = Number(document.getElementById("duration").value);

  if (!station || !duration) {
    alert("Fill all fields");
    return;
  }

  const start = new Date();
  const end = new Date(start.getTime() + duration * 60000);

  const amount = duration * RATE_PER_MINUTE;

  generateReceipt((receipt) => {

    db.run(`
      INSERT INTO sessions 
      (receipt_no, station, start_time, end_time, amount, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      receipt,
      station,
      start.toLocaleTimeString(),
      end.toLocaleTimeString(),
      amount,
      "Active"
    ]);

    printReceipt({
      receipt,
      station,
      start: start.toLocaleTimeString(),
      end: end.toLocaleTimeString(),
      amount
    });

    document.getElementById("output").innerText =
`Receipt: ${receipt}
Station: ${station}
Duration: ${duration} min
Amount: ₦${amount}`;

    loadSessions();
    getDailyIncome();
  });
}


// ================= LOAD DASHBOARD =================
function loadSessions() {

  const table = document.getElementById("sessions");
  table.innerHTML = "";

  db.all("SELECT * FROM sessions ORDER BY id DESC", [], (err, rows) => {

    rows.forEach(row => {

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${row.receipt_no}</td>
        <td>${row.station}</td>
        <td>${row.start_time}</td>
        <td>${row.end_time}</td>
        <td>${row.status}</td>
        <td>
          <button onclick="endSession(${row.id})">End</button>
          <button onclick="extendSession(${row.id},30)">+30m</button>
          <button onclick="extendSession(${row.id},60)">+1h</button>
        </td>
      `;

      table.appendChild(tr);
    });
  });
}


// ================= END SESSION =================
function endSession(id) {

  db.run(
    "UPDATE sessions SET status='Ended' WHERE id=?",
    [id],
    loadSessions
  );
}


// ================= EXTEND SESSION =================
function extendSession(id, minutes) {

  db.get("SELECT * FROM sessions WHERE id=?", [id], (err, row) => {

    if (!row) return;

    const newAmount = Number(row.amount) + (minutes * RATE_PER_MINUTE);
    const newEnd = new Date(new Date().getTime() + minutes * 60000);

    db.run(
      "UPDATE sessions SET amount=?, status='Active' WHERE id=?",
      [newAmount, id],
      loadSessions
    );
  });
}


// ================= INCOME =================
function getDailyIncome() {

  db.all("SELECT amount FROM sessions", [], (err, rows) => {

    let total = 0;

    rows.forEach(r => total += Number(r.amount || 0));

    document.getElementById("income").innerText =
      "💰 Today's Income: ₦" + total;
  });
}
function loadAnalytics() {

  db.all("SELECT * FROM sessions", [], (err, rows) => {

    let totalIncome = 0;
    let active = 0;
    let ended = 0;

    let stationCount = {};

    rows.forEach(r => {

      totalIncome += Number(r.amount || 0);

      if (r.status === "Active") active++;
      if (r.status === "Ended") ended++;

      stationCount[r.station] = (stationCount[r.station] || 0) + 1;
    });

    let mostUsed = Object.keys(stationCount).reduce((a, b) =>
      stationCount[a] > stationCount[b] ? a : b, "N/A"
    );

    document.getElementById("analytics").innerHTML = `
      💰 Total Income: ₦${totalIncome}<br>
      🟢 Active Sessions: ${active}<br>
      🔴 Ended Sessions: ${ended}<br>
      🎮 Most Used Station: ${mostUsed}
    `;
  });
}
function backupData() {

  db.all("SELECT * FROM sessions", [], (err, sessions) => {

    db.all("SELECT * FROM users", [], (err2, users) => {

      const backup = {
        sessions,
        users,
        date: new Date().toISOString()
      };

      const fs = require("fs");

      fs.writeFileSync("backup.json", JSON.stringify(backup, null, 2));

      alert("Backup created: backup.json");
    });
  });
}
function restoreData() {

  const fs = require("fs");

  try {

    const data = JSON.parse(fs.readFileSync("backup.json"));

    // CLEAR OLD DATA FIRST
    db.run("DELETE FROM sessions");
    db.run("DELETE FROM users");

    // RESTORE USERS
    data.users.forEach(u => {
      db.run(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [u.username, u.password, u.role]
      );
    });

    // RESTORE SESSIONS
    data.sessions.forEach(s => {
      db.run(`
        INSERT INTO sessions 
        (receipt_no, station, start_time, end_time, amount, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        s.receipt_no,
        s.station,
        s.start_time,
        s.end_time,
        s.amount,
        s.status
      ]);
    });

    alert("Restore successful!");

    loadSessions();
    loadAnalytics();

  } catch (e) {
    alert("Restore failed: invalid file");
  }
}
function printDailyReport() {

  db.all("SELECT * FROM sessions", [], (err, rows) => {

    const today = new Date().toDateString();

    let totalIncome = 0;
    let totalSessions = 0;
    let active = 0;
    let ended = 0;
    let stationMap = {};

    rows.forEach(r => {

      if (new Date(r.start_time).toDateString() === today) {

        totalSessions++;
        totalIncome += Number(r.amount || 0);

        if (r.status === "Active") active++;
        if (r.status === "Ended") ended++;

        stationMap[r.station] = (stationMap[r.station] || 0) + 1;
      }
    });

    let stationText = "";

    for (let s in stationMap) {
      stationText += `${s}: ${stationMap[s]} sessions\n`;
    }

    const report = {
      date: today,
      totalIncome,
      totalSessions,
      active,
      ended,
      stationText
    };

    const printReceipt = require('./printer');

    printReceipt({
      receipt: "DAILY REPORT",
      station: "ALL STATIONS",
      start: today,
      end: today,
      amount: totalIncome,
      extra: `
TOTAL SESSIONS: ${totalSessions}
ACTIVE: ${active}
ENDED: ${ended}

STATION USAGE:
${stationText}
      `
    });

  });
}