const { ipcRenderer } = require("electron");

let sessions = [];
let purchases = [];

let filterStart = null;
let filterEnd = null;

let hiddenTables = {};

let isRendering = false;
let renderTimer = null;
let isTyping = false;

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
    customer,
    item,
    price,
    qty,
    total: price * qty,
    date: new Date().toISOString().split("T")[0]
  });
}

// ================= LOAD =================
function load() {
  ipcRenderer.send("get-data");
}

ipcRenderer.on("saved", () => load());

ipcRenderer.on("data", (e, data) => {
  sessions = data.sessions || [];
  purchases = data.purchases || [];
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

function countdown(end) {
  const diff = end - Date.now();
  if (diff <= 0) return "EXPIRED";
  return Math.floor(diff / 60000) + "m " +
         Math.floor((diff % 60000) / 1000) + "s";
}

// ================= SAFE RENDER =================
function safeRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 120);
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
      <div style="border:1px solid #444;margin-bottom:15px;padding:10px;">

        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3>📅 ${date}</h3>

          <div>
            <button onclick="printDaily('${date}')">🖨 Print Day</button>
            <button onclick="toggleTable('${id}')">
              ${hidden ? "Expand" : "Collapse"}
            </button>
          </div>
        </div>

        <div id="table_${id}" style="display:${hidden ? 'none' : 'block'}">

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
                <th>Amount</th>
                <th>Print</th>
              </tr>
            </thead>

            <tbody>
    `;

    grouped[date].forEach(item => {

      let status = "-";
      let cd = "-";
      let end = "-";

      if (item.type === "SESSION") {
        cd = countdown(item.endTime);
        status = cd === "EXPIRED" ? "Expired" : "Active";
        end = formatTime(item.endTime);
      } else {
        status = "Done";
      }

      html += `
        <tr>
          <td>${item.invoice}</td>
          <td>${item.type}</td>
          <td>${item.name}</td>
          <td>${item.startTime ? formatTime(item.startTime) : "-"}</td>
          <td>${end}</td>
          <td>${status}</td>
          <td>${cd}</td>
          <td>₦${item.amount || item.total}</td>
          <td><button onclick='printReceipt(${JSON.stringify(item)})'>🖨</button></td>
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

  document.getElementById("income").innerText =
    "Income: ₦" + (sessionTotal + purchaseTotal);

  updateSummary(sessionTotal, purchaseTotal, sessionTotal + purchaseTotal, dailyTotals);

  isRendering = false;
}

// ================= TOGGLE FIX =================
function toggleTable(id) {
  hiddenTables[id] = !hiddenTables[id];
  safeRender();
}

// ================= SUMMARY =================
function toggleSummary() {
  const p = document.getElementById("summaryPanel");
  p.style.display = p.style.display === "none" ? "block" : "none";
}

function updateSummary(s, p, g, dailyTotals) {

  let html = "";

  Object.keys(dailyTotals)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach(date => {
      html += `<p>${date} : ₦${dailyTotals[date]}</p>`;
    });

  document.getElementById("summaryPanel").innerHTML = `
    <h3>Summary</h3>
    <p>Session: ₦${s}</p>
    <p>Purchase: ₦${p}</p>
    <h2>Total: ₦${g}</h2>
    <hr>
    ${html}
  `;
}

// ================= FULL SESSION PRINT (BOLD FIX) =================
function printReceipt(item) {

  const win = window.open("", "", "width=380,height=650");

  const isSession = item.type === "SESSION";

  win.document.write(`
    <html>
    <head>
      <style>
        body { font-family: monospace; text-align:center; padding:10px; }
        .b { font-weight:bold; font-size:16px; margin:5px 0; }
        hr { border:1px dashed #000; }
      </style>
    </head>
    <body>

      <h2 class="b">🎮 GAME CENTER POS</h2>
      <hr>

      <div class="b">INVOICE: ${item.invoice}</div>
      <div class="b">TYPE: ${item.type}</div>
      <div class="b">NAME: ${item.name}</div>

      <hr>
  `);

  if (isSession) {

    win.document.write(`
      <div class="b">START TIME: ${new Date(item.startTime).toLocaleTimeString()}</div>
      <div class="b">END TIME: ${new Date(item.endTime).toLocaleTimeString()}</div>
      <div class="b">CUSTOMER MINUTES: ${item.customerMinutes}</div>
    `);

  } else {

    win.document.write(`
      <div class="b">ITEM: ${item.item}</div>
      <div class="b">QTY: ${item.qty}</div>
    `);
  }

  win.document.write(`
      <hr>
      <div class="b">AMOUNT: ₦${item.amount || item.total}</div>
      <div class="b">DATE: ${item.date}</div>

      <hr>
      <div class="b">THANK YOU 🙏</div>

      <script>window.onload = () => window.print();</script>

    </body>
    </html>
  `);

  win.document.close();
}

// ================= DAILY PRINT =================
function printDaily(date) {

  const win = window.open("", "", "width=500,height=700");

  let total = 0;

  let rows = sessions.concat(purchases)
    .filter(x => x.date === date)
    .map(i => {
      total += i.amount || i.total;
      return `<p>${i.invoice} - ₦${i.amount || i.total}</p>`;
    }).join("");

  win.document.write(`
    <h2>${date}</h2>
    ${rows}
    <h3>Total: ₦${total}</h3>
    <script>window.onload = () => window.print();</script>
  `);

  win.document.close();
}

// ================= AUTO REFRESH =================
setInterval(() => {
  if (!isTyping) ipcRenderer.send("get-data");
}, 5000);

setInterval(() => {
  if (!isTyping) safeRender();
}, 1000);

load();