// ================= STATE =================
let liveSessions = {};
let currentRate = 100;
let rateType = 10;

// ================= RATE =================
function setRate() {
  const rate = parseInt(document.getElementById("rate").value);
  const type = parseInt(document.getElementById("rateType").value);

  currentRate = rate;
  rateType = type;

  document.getElementById("currentRateLabel").innerText =
    `₦${rate} per ${type} min`;
}

// ================= START =================
function startSession() {
  const station = document.getElementById("station").value;
  const customer = document.getElementById("customer").value;

  if (!station || !customer) return;

  liveSessions[station] = {
    station,
    customer,
    startTime: Date.now(),
    pauseTime: 0,
    paused: false,
    pauseStart: null
  };
}

// ================= PAUSE =================
function pauseSession(station) {
  const s = liveSessions[station];
  if (!s || s.paused) return;

  s.paused = true;
  s.pauseStart = Date.now();
}

// ================= RESUME =================
function resumeSession(station) {
  const s = liveSessions[station];
  if (!s || !s.paused) return;

  s.pauseTime += Date.now() - s.pauseStart;
  s.paused = false;
}

// ================= TIME =================
function getSeconds(s) {
  const now = s.paused ? s.pauseStart : Date.now();

  return Math.floor((now - s.startTime - s.pauseTime) / 1000);
}

// ================= BILL =================
function getBill(s) {
  const mins = Math.ceil(getSeconds(s) / 60);
  return Math.ceil((mins / rateType) * currentRate);
}

// ================= CLOSE + SAVE RECEIPT =================
async function closeSession(station) {
  const s = liveSessions[station];

  const data = {
    station: s.station,
    customer: s.customer,
    startTime: s.startTime,
    endTime: Date.now(),
    duration: Math.ceil(getSeconds(s) / 60),
    total: getBill(s)
  };

  const res = await window.api.saveSession(data);

  alert("Receipt: " + res.receiptNo);

  delete liveSessions[station];
}

// ================= LIVE UI =================
function renderLive() {
  const grid = document.getElementById("activeGrid");
  grid.innerHTML = "";

  Object.keys(liveSessions).forEach((k) => {
    const s = liveSessions[k];

    const div = document.createElement("div");

    div.innerHTML = `
      <h3>${s.station}</h3>
      <p>${s.customer}</p>
      <p>${Math.ceil(getSeconds(s)/60)} min</p>
      <p>₦${getBill(s)}</p>

      <button onclick="pauseSession('${k}')">Pause</button>
      <button onclick="resumeSession('${k}')">Resume</button>
      <button onclick="closeSession('${k}')">Close</button>
    `;

    grid.appendChild(div);
  });
}

// ================= RECEIPTS =================
async function loadReceipts() {
  const data = await window.api.getReceipts();

  const panel = document.getElementById("receiptPanel");
  panel.innerHTML = "<h3>Receipts</h3>";

  data.forEach(r => {
    panel.innerHTML += `
      <div>
        <b>${r.receiptNo}</b><br>
        ${r.station} - ${r.customer}<br>
        ₦${r.total}<br>
        ${new Date(r.createdAt).toLocaleString()}
      </div><hr>
    `;
  });
}

// ================= LOOP =================
setInterval(() => {
  renderLive();
}, 1000);