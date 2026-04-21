const { ipcRenderer } = require("electron");

let sessions = [];
let purchases = [];

// ================= SESSION =================
function startSession() {

  const station = document.getElementById("station").value;
  const pricePerGame = Number(document.getElementById("pricePerGame").value);
  const gameMinutes = Number(document.getElementById("gameMinutes").value);
  const customerMinutes = Number(document.getElementById("customerMinutes").value);

  if (!station || !pricePerGame || !gameMinutes || !customerMinutes) {
    alert("Fill all session fields");
    return;
  }

  const start = Date.now();
  const end = start + customerMinutes * 60000;
  const amount = (customerMinutes / gameMinutes) * pricePerGame;

  ipcRenderer.send("save-session", {
    station,
    startTime: start,
    endTime: end,
    customerMinutes,
    pricePerGame,
    gameMinutes,
    amount,
    date: new Date().toLocaleDateString()
  });

  document.getElementById("station").value = "";
  document.getElementById("customerMinutes").value = "";
}

// ================= PURCHASE =================
function addPurchase() {

  const customer = document.getElementById("customerName").value;
  const item = document.getElementById("itemName").value;
  const price = Number(document.getElementById("purchasePrice").value);
  const qty = Number(document.getElementById("qty").value);

  if (!customer || !item || !price || !qty) {
    alert("Fill all purchase fields");
    return;
  }

  ipcRenderer.send("save-purchase", {
    customer,
    item,
    price,
    qty,
    total: price * qty,
    date: new Date().toLocaleDateString()
  });

  document.getElementById("customerName").value = "";
  document.getElementById("itemName").value = "";
  document.getElementById("purchasePrice").value = "";
}

// ================= LOAD =================
function load() {
  ipcRenderer.send("get-data");
}

ipcRenderer.on("saved", () => {
  load();
});

ipcRenderer.on("data", (e, data) => {
  sessions = data.sessions;
  purchases = data.purchases;
  render();
});

// ================= HELPERS =================
function formatTime(t) {
  return new Date(t).toLocaleTimeString();
}

function countdown(end) {
  const diff = end - Date.now();
  if (diff <= 0) return "EXPIRED";
  return Math.floor(diff / 60000) + "m " + Math.floor((diff % 60000) / 1000) + "s";
}

// ================= RENDER =================
function render() {

  const table = document.getElementById("table");
  table.innerHTML = "";

  let sessionTotal = 0;
  let purchaseTotal = 0;

  const combined = [];

  sessions.forEach(s => {
    combined.push({
      type: "SESSION",
      invoice: s.invoice,
      name: s.station,
      start: s.startTime,
      end: s.endTime,
      date: s.date,
      amount: s.amount
    });
    sessionTotal += s.amount;
  });

  purchases.forEach(p => {
    combined.push({
      type: "PURCHASE",
      invoice: p.invoice,
      name: p.customer,
      start: p.startTime,
      end: null,
      date: p.date,
      amount: p.total
    });
    purchaseTotal += p.total;
  });

  combined.sort((a, b) => a.invoice - b.invoice);

  combined.forEach(item => {

    let status = "-";
    let cd = "-";
    let end = "-";

    if (item.type === "SESSION") {
      cd = countdown(item.end);
      status = cd === "EXPIRED" ? "Expired" : "Active";
      end = formatTime(item.end);
    } else {
      status = "Completed";
    }

    table.innerHTML += `
      <tr>
        <td>${item.invoice}</td>
        <td>${item.type}</td>
        <td>${item.name}</td>
        <td>${formatTime(item.start)}</td>
        <td>${end}</td>
        <td>${item.date}</td>
        <td>${status}</td>
        <td>${cd}</td>
        <td>₦${item.amount}</td>
      </tr>
    `;
  });

  const grand = sessionTotal + purchaseTotal;

  document.getElementById("income").innerText = "Income: ₦" + grand;

  updateSummary(sessionTotal, purchaseTotal, grand);
}

// ================= SUMMARY =================
function toggleSummary() {
  const p = document.getElementById("summaryPanel");
  p.style.display = p.style.display === "none" ? "block" : "none";
}

function updateSummary(s, p, g) {
  document.getElementById("summaryPanel").innerHTML = `
    <h3>📊 Summary</h3>
    <p>Session Total: ₦${s}</p>
    <p>Purchase Total: ₦${p}</p>
    <hr>
    <h3 style="color:#00ff88;">Grand Total: ₦${g}</h3>
  `;
}

// ================= REPORT =================
function toggleReport() {

  const p = document.getElementById("reportPanel");
  p.style.display = p.style.display === "none" ? "block" : "none";

  let combined = [];

  sessions.forEach(s => {
    combined.push({ invoice: s.invoice, type: "SESSION", amount: s.amount, date: s.date });
  });

  purchases.forEach(pu => {
    combined.push({ invoice: pu.invoice, type: "PURCHASE", amount: pu.total, date: pu.date });
  });

  combined.sort((a, b) => a.invoice - b.invoice);

  let html = "<h3>📄 Invoice Report</h3>";

  combined.forEach(i => {
    html += `<p>${i.invoice} | ${i.type} | ₦${i.amount} | ${i.date}</p>`;
  });

  p.innerHTML = html;
}

// ================= LIVE =================
setInterval(render, 1000);
load();