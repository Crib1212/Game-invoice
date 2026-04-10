const db = require('./database');

let currentUser = null;
let LIVE = null;

// ================= LOGIN =================
function login() {

  const username = document.getElementById("username").value;

  db.get(
    "SELECT * FROM users WHERE username=?",
    [username],
    (err, user) => {

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

      startLiveMode();
    }
  );
}

// ================= RATE =================
function getRate(cb) {
  db.get("SELECT value FROM settings WHERE key='rate_per_5min'", (e,r)=>{
    cb(Number(r.value));
  });
}

// ================= RECEIPT =================
function receipt(cb){
  db.get("SELECT COUNT(*) c FROM sessions",(e,r)=>{
    cb("WSG-"+String(r.c+1).padStart(4,'0'));
  });
}

// ================= START SESSION =================
function startSession() {

  const station = document.getElementById("station").value;
  const duration = Number(document.getElementById("duration").value);

  getRate(rate => {

    const amount = (duration/5)*rate;

    const start = new Date();
    const end = new Date(start.getTime()+duration*60000);

    receipt(r => {

      db.run(`
        INSERT INTO sessions
        (receipt_no,station,start_time,end_time,amount,status)
        VALUES (?,?,?,?,?,?)
      `,[
        r, station,
        start.toLocaleTimeString(),
        end.toLocaleTimeString(),
        amount,
        "Active"
      ]);

    });

  });
}

// ================= LIVE MODE =================
function startLiveMode() {

  if (LIVE) clearInterval(LIVE);

  LIVE = setInterval(() => {

    autoExpire();
    loadSessions();
    getIncome();

  }, 1000);
}
setInterval(() => {
  getStationSummary();
}, 3000);

// ================= AUTO EXPIRE =================
function autoExpire() {

  const now = new Date();

  db.all("SELECT * FROM sessions",(e,rows)=>{

    rows.forEach(r=>{

      const end = new Date(`1970-01-01T${r.end_time}`);

      if(now >= end && r.status === "Active") {

        db.run("UPDATE sessions SET status='Ended' WHERE id=?",[r.id]);
      }

    });

  });

}

// ================= LOAD =================
function loadSessions() {

  const table = document.getElementById("sessions");
  table.innerHTML = "";

  db.all("SELECT * FROM sessions ORDER BY id DESC",(e,rows)=>{

    rows.forEach(r=>{

      let tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${r.receipt_no}</td>
        <td>${r.station}</td>
        <td>${r.start_time}</td>
        <td>${r.end_time}</td>
        <td>${r.status}</td>
        <td><button onclick="endSession(${r.id})">End</button></td>
      `;

      table.appendChild(tr);
    });

  });
}

// ================= END =================
function endSession(id){
  db.run("UPDATE sessions SET status='Ended' WHERE id=?",[id]);
}

// ================= INCOME =================
function getIncome(){

  db.all("SELECT amount FROM sessions",(e,r)=>{

    let total = 0;

    r.forEach(x=> total += Number(x.amount||0));

    document.getElementById("income").innerText =
      "Income: ₦"+total;
  });
}

// ================= RATE UPDATE =================
function setRate(){
  const rate = document.getElementById("rate").value;

  db.run("UPDATE settings SET value=? WHERE key='rate_per_5min'",[rate]);
}
function getStationSummary() {

  db.all("SELECT * FROM sessions", [], (err, rows) => {

    let stationMap = {};

    rows.forEach(r => {

      if (!stationMap[r.station]) {
        stationMap[r.station] = {
          total: 0,
          count: 0,
          active: 0
        };
      }

      stationMap[r.station].total += Number(r.amount || 0);
      stationMap[r.station].count += 1;

      if (r.status === "Active") {
        stationMap[r.station].active += 1;
      }
    });

    renderStationSummary(stationMap);
  });
}

function renderStationSummary(data) {

  let html = "<h3>📊 Station Report</h3>";

  for (let station in data) {

    html += `
      <div style="background:#222;padding:10px;margin:5px;">
        <h4>${station}</h4>
        💰 Total: ₦${data[station].total}<br>
        🎮 Sessions: ${data[station].count}<br>
        🟢 Active: ${data[station].active}
      </div>
    `;
  }

  document.getElementById("stationReport").innerHTML = html;
}