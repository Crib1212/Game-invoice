let sessions = [];
let manualSales = [];
let rate = 0;
let rateType = 10;

// ================= RATE =================
function setRate() {
  const inputRate = document.getElementById("rate").value;
  const type = document.getElementById("rateType").value;

  if (!inputRate) return alert("Enter rate first");

  rate = Number(inputRate);
  rateType = Number(type);

  alert(`Rate set: ₦${rate} per ${rateType} min`);
}

// ================= START SESSION =================
function startSession() {
  const station = document.getElementById("station").value;
  const customer = document.getElementById("customer").value;
  const duration = Number(document.getElementById("duration").value);

  if (!station || !customer || !duration) {
    return alert("Fill all session fields");
  }

  const now = new Date();
  const end = new Date(now.getTime() + duration * 60000);

  const session = {
    id: Date.now(),
    station,
    customer,
    start: now,
    end,
    duration,
    status: "Running",
  };

  sessions.push(session);
  renderSessions();
}

// ================= RENDER SESSIONS =================
function renderSessions() {
  const tbody = document.getElementById("sessions");
  tbody.innerHTML = "";

  sessions.forEach((s) => {
    const remaining = Math.max(0, Math.floor((s.end - new Date()) / 1000));

    if (remaining <= 0 && s.status === "Running") {
      s.status = "Ended";
    }

    const row = `
      <tr>
        <td>${s.id}</td>
        <td>${s.station}</td>
        <td>${formatTime(s.start)}</td>
        <td>${formatTime(s.end)}</td>
        <td>${s.status}</td>
        <td>${formatCountdown(remaining)}</td>
        <td>
          <button onclick="endSession(${s.id})">End</button>
        </td>
      </tr>
    `;

    tbody.innerHTML += row;
  });
}

// ================= END SESSION =================
function endSession(id) {
  const session = sessions.find((s) => s.id === id);
  if (!session) return;

  session.status = "Ended";
  session.end = new Date();

  renderSessions();
}

// ================= COUNTDOWN LOOP =================
setInterval(() => {
  renderSessions();
}, 1000);

// ================= MANUAL SALES =================
function addManualSale() {
  const name = document.getElementById("itemName").value;
  const price = Number(document.getElementById("itemPrice").value);
  const qty = Number(document.getElementById("itemQty").value);

  if (!name || !price || !qty) {
    return alert("Fill manual sale fields");
  }

  const sale = {
    id: Date.now(),
    name,
    price,
    qty,
    total: price * qty,
  };

  manualSales.push(sale);
  renderManual();
}

// ================= MANUAL RENDER =================
function renderManual() {
  const list = document.getElementById("manualList");
  const totalBox = document.getElementById("manualTotal");

  list.innerHTML = "";

  let total = 0;

  manualSales.forEach((s) => {
    total += s.total;

    list.innerHTML += `
      <div>
        ${s.name} - ₦${s.price} x ${s.qty} = ₦${s.total}
      </div>
    `;
  });

  totalBox.innerText = `Total: ₦${total}`;
}

// ================= REPORT PANELS =================
function toggleDailyReportPanel() {
  const panel = document.getElementById("dailyReportPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";

  const totalSales =
    manualSales.reduce((sum, s) => sum + s.total, 0);

  panel.innerHTML = `
    <h4>Daily Report</h4>
    <p>Total Manual Sales: ₦${totalSales}</p>
    <p>Total Sessions: ${sessions.length}</p>
  `;
}

function toggleStationReportPanel() {
  const panel = document.getElementById("stationReportPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";

  let report = "";

  sessions.forEach((s) => {
    report += `<p>${s.station} - ${s.status}</p>`;
  });

  panel.innerHTML = `
    <h4>Today's Sessions</h4>
    ${report}
  `;
}

// ================= HELPERS =================
function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString();
}

function formatCountdown(seconds) {
  if (seconds <= 0) return "00:00";

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `${m}:${s.toString().padStart(2, "0")}`;
}