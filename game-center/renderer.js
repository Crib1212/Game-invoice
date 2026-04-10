
const db = require('./database');
const printReceipt = require('./printer');

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
    }
  );
}


// ================= RECEIPT =================
function generateReceiptNumber(cb) {
  db.get("SELECT COUNT(*) as count FROM sessions", (err, row) => {
    const next = (row?.count || 0) + 1;
    cb("WSG-" + String(next).padStart(4, "0"));
  });
}


// ================= START SESSION =================
function startSession() {

  const station = document.getElementById("station").value;
  const duration = Number(document.getElementById("duration").value);
  const amount = Number(document.getElementById("amount").value);

  if (!station || !duration || !amount) {
    alert("Fill all fields");
    return;
  }

  const start = new Date();
  const end = new Date(start.getTime() + duration * 60000);

  generateReceiptNumber((receipt) => {

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

    loadSessions();

    document.getElementById("output").innerText =
      `Receipt: ${receipt}
Station: ${station}
Start: ${start.toLocaleTimeString()}
End: ${end.toLocaleTimeString()}
Amount: ₦${amount}`;
  });
}


// ================= LOAD SESSIONS =================
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

    let newEnd = new Date();

    db.run(
      "UPDATE sessions SET status='Active' WHERE id=?",
      [id],
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
      "💰 Total Income: ₦" + total;
  });
}