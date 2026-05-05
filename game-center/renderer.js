const { ipcRenderer } = require("electron");

let sessions = [];
let purchases = [];

let filterStart = null;
let filterEnd = null;

let hiddenTables = {};

let isRendering = false;
let renderTimer = null;
let isTyping = false;

// 🔥 COUNTDOWN SYSTEM (STABLE)
let countdownMap = {};
let countdownElements = {};

// ================= INPUT DETECT =================
document.addEventListener("focusin", (e) => {
  if (e.target.tagName === "INPUT") isTyping = true;
});

document.addEventListener("focusout", (e) => {
  if (e.target.tagName === "INPUT") isTyping = false;
});

// ================= LOGIN =================
function login() {
  const pin = document.getElementById("pinInput").value;
  if (!pin) return alert("Enter PIN");
  ipcRenderer.send("login", pin);
}

// ================= ADMIN LOGIN RESPONSE =================
ipcRenderer.on("login-result", (e, data) => {

  document.getElementById("roleDisplay").innerText =
    "Role: " + data.role;

  const adminBox = document.getElementById("adminControls");

  if (adminBox) {
    adminBox.style.display =
      data.role === "admin" ? "block" : "none";
  }
});

// ================= SESSION =================
function startSession() {

  if (isTyping) return;

  const station = document.getElementById("station").value;
  const pricePerGame = Number(document.getElementById("pricePerGame").value);
  const gameMinutes = Number(document.getElementById("gameMinutes").value);
  const customerMinutes = Number(document.getElementById("customerMinutes").value);

  if (!station || !pricePerGame || !gameMinutes || !customerMinutes) {
    return alert("Fill all session fields");
  }

  const startTime = Date.now();
  const endTime = startTime + customerMinutes * 60000;

  const amount = (customerMinutes / gameMinutes) * pricePerGame;

  ipcRenderer.send("save-session", {
    invoice: Date.now(),
    station,
    startTime,
    endTime,
    customerMinutes,
    pricePerGame,
    gameMinutes,
    amount,
    date: new Date().toISOString().split("T")[0]
  });

  document.getElementById("station").value = "";
  document.getElementById("customerMinutes").value = "";
}

// ================= PURCHASE =================
function addPurchase() {

  if (isTyping) return;

  const customer = document.getElementById("customerName").value;
  const item = document.getElementById("itemName").value;
  const price = Number(document.getElementById("purchasePrice").value);
  const qty = Number(document.getElementById("qty").value);

  if (!customer || !item || !price || !qty) {
    return alert("Fill all purchase fields");
  }

  ipcRenderer.send("save-purchase", {
    invoice: Date.now(),
    customer,
    item,
    price,
    qty,
    total: price * qty,
    date: new Date().toISOString().split("T")[0]
  });

  document.getElementById("customerName").value = "";
  document.getElementById("itemName").value = "";
  document.getElementById("purchasePrice").value = "";
  document.getElementById("qty").value = "";
}

// ================= LOAD =================
function load() {
  ipcRenderer.send("get-data");
}

ipcRenderer.on("saved", () => load());

ipcRenderer.on("data", (e, data) => {
  sessions = data.sessions || [];
  purchases = data.purchases || [];

  rebuildCountdownMap();
  buildSummary();

  if (!isTyping) safeRender();
});

// ================= FILTER =================
function applyDateFilter() {
  filterStart = document.getElementById("startDate").value;
  filterEnd = document.getElementById("endDate").value;
  safeRender();
}

function clearFilter() {
  filterStart = null;
  filterEnd = null;
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  safeRender();
}

// ================= HELPERS =================
function formatTime(t) {
  return new Date(t).toLocaleTimeString();
}

// ================= COUNTDOWN MAP =================
function rebuildCountdownMap() {
  countdownMap = {};
  sessions.forEach(s => {
    countdownMap[s.invoice] = s.endTime;
  });
}

// ================= SAFE RENDER =================
function safeRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 100);
}

// ================= MAIN RENDER =================
function render() {

  if (isRendering) return;
  isRendering = true;

  const container = document.getElementById("tableContainer");

  let grouped = {};
  let sessionTotal = 0;
  let purchaseTotal = 0;
  let dailyTotals = {};

  // ================= SESSIONS =================
  sessions.forEach(s => {

    if (filterStart && s.date < filterStart) return;
    if (filterEnd && s.date > filterEnd) return;

    sessionTotal += s.amount;
    dailyTotals[s.date] = (dailyTotals[s.date] || 0) + s.amount;

    if (!grouped[s.date]) grouped[s.date] = [];

    grouped[s.date].push({
      ...s,
      type: "SESSION",
      name: s.station
    });
  });

  // ================= PURCHASES =================
  purchases.forEach(p => {

    if (filterStart && p.date < filterStart) return;
    if (filterEnd && p.date > filterEnd) return;

    purchaseTotal += p.total;
    dailyTotals[p.date] = (dailyTotals[p.date] || 0) + p.total;

    if (!grouped[p.date]) grouped[p.date] = [];

    grouped[p.date].push({
      ...p,
      type: "PURCHASE",
      name: p.customer
    });
  });

  const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  let html = "";

  for (let date of dates) {

    const id = date.replace(/-/g, "_");
    const hidden = hiddenTables[id];

    html += `
      <div style="border:1px solid #444;margin-bottom:10px;padding:10px;">

        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3>📅 ${date}</h3>

          <div>
            <button onclick="printDaily('${date}')">🖨 Print Day</button>
            <button onclick="toggleTable('${id}')">
              ${hidden ? "Expand" : "Collapse"}
            </button>
          </div>
        </div>

        <div style="display:${hidden ? 'none' : 'block'}">

          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Type</th>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Countdown</th>
                <th>Minutes</th>
                <th>Amount</th>
                <th>Print</th>
              </tr>
            </thead>

            <tbody>
    `;

    grouped[date].forEach(item => {

      const isSession = item.type === "SESSION";

      html += `
        <tr>
          <td>${item.invoice}</td>
          <td>${item.type}</td>
          <td>${item.name}</td>
          <td>${item.startTime ? formatTime(item.startTime) : "-"}</td>
          <td>${isSession ? formatTime(item.endTime) : "-"}</td>
          <td>${isSession ? "Active" : "Done"}</td>
          <td class="cd" data-id="${item.invoice}">--:--</td>
          <td>${item.customerMinutes || "-"}</td>
          <td>₦${item.amount || item.total}</td>

          <!-- ✅ PRINT BUTTON RESTORED -->
          <td>
            <button onclick='printReceipt(${JSON.stringify(item)})'>🖨</button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // CACHE COUNTDOWN ELEMENTS
  countdownElements = {};
  document.querySelectorAll(".cd").forEach(el => {
    countdownElements[el.getAttribute("data-id")] = el;
  });

  document.getElementById("income").innerText =
    "Income: ₦" + (sessionTotal + purchaseTotal);

  isRendering = false;
}

// ================= TOGGLE =================
function toggleTable(id) {
  hiddenTables[id] = !hiddenTables[id];
  safeRender();
}

// ================= COUNTDOWN ENGINE =================
setInterval(() => {

  const now = Date.now();

  for (let id in countdownMap) {

    const el = countdownElements[id];
    if (!el) continue;

    const diff = countdownMap[id] - now;

    if (diff <= 0) {
      el.innerText = "EXPIRED";
      continue;
    }

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    el.innerText = `${mins}:${secs.toString().padStart(2, "0")}`;
  }

}, 1000);

// ================= SUMMARY =================
function toggleSummary() {
  const p = document.getElementById("summaryPanel");
  p.style.display = p.style.display === "block" ? "none" : "block";
}

function buildSummary() {

  let sessionTotal = 0;
  let purchaseTotal = 0;
  let dailyTotals = {};

  sessions.forEach(s => {
    sessionTotal += s.amount;
    dailyTotals[s.date] = (dailyTotals[s.date] || 0) + s.amount;
  });

  purchases.forEach(p => {
    purchaseTotal += p.total;
    dailyTotals[p.date] = (dailyTotals[p.date] || 0) + p.total;
  });

  const grand = sessionTotal + purchaseTotal;

  let html = `
    <h3>📊 Summary</h3>
    <p>Session Total: ₦${sessionTotal}</p>
    <p>Purchase Total: ₦${purchaseTotal}</p>
    <h2>Grand Total: ₦${grand}</h2>
    <hr>
  `;

  Object.keys(dailyTotals)
    .sort((a,b) => new Date(b) - new Date(a))
    .forEach(date => {
      html += `<p>${date} : ₦${dailyTotals[date]}</p>`;
    });

  document.getElementById("summaryPanel").innerHTML = html;
}

// ================= PRINT =================
function printReceipt(item) {

  const win = window.open("", "", "width=380,height=650");

  const isSession = item.type === "SESSION";

  win.document.write(`
    <html>
    <body style="font-family:monospace;text-align:center;padding:10px">

      <h2>Witty Unisex Salon and Games</h2>
      <hr>

      <p><b>Invoice:</b> ${item.invoice}</p>
      <p><b>Name:</b> ${item.name}</p>

      ${isSession ? `
        <p><b>Start:</b> ${formatTime(item.startTime)}</p>
        <p><b>End:</b> ${formatTime(item.endTime)}</p>
        <p><b>Minutes:</b> ${item.customerMinutes}</p>
      ` : `
        <p><b>Item:</b> ${item.item}</p>
        <p><b>Qty:</b> ${item.qty}</p>
      `}

      <p><b>Amount:</b> ₦${item.amount || item.total}</p>
      <p><b>Date:</b> ${item.date}</p>

      <hr>
      <p>Thank you</p>

      <script>window.onload = () => window.print();</script>

    </body>
    </html>
  `);

  win.document.close();
}

function printDaily(date) {

  const win = window.open("", "", "width=500,height=700");

  let total = 0;

  let rows = sessions.concat(purchases)
    .filter(x => x.date === date)
    .map(i => {
      const amount = i.amount || i.total;
      total += amount;
      return `<p>${i.invoice} - ₦${amount}</p>`;
    }).join("");

  win.document.write(`
    <h2>${date}</h2>
    ${rows}
    <h3>Total: ₦${total}</h3>
    <script>window.onload = () => window.print();</script>
  `);

  win.document.close();
}

// ================= RESET =================
function factoryReset() {
  if (!confirm("Delete ALL data permanently?")) return;
  ipcRenderer.send("factory-reset-db");
}

// ================= INIT =================
load();