const { ipcRenderer } = require("electron");

let sessions = [];
let purchases = [];

// 🔥 CONTROL FLAGS
let isRendering = false;
let renderTimer = null;
let isTyping = false;

// ================= DETECT INPUT FOCUS =================
document.addEventListener("focusin", (e) => {
  if (e.target.tagName === "INPUT") {
    isTyping = true;
  }
});

document.addEventListener("focusout", (e) => {
  if (e.target.tagName === "INPUT") {
    isTyping = false;
  }
});

// ================= LOGIN =================
function login() {

  const pinInput = document.getElementById("pinInput");
  if (!pinInput) return;

  const pin = pinInput.value;

  if (!pin) {
    alert("Enter PIN");
    return;
  }

  ipcRenderer.send("login", pin);
}

// ================= RECEIVE LOGIN =================
ipcRenderer.on("login-result", (e, data) => {

  const roleDisplay = document.getElementById("roleDisplay");
  if (roleDisplay) {
    roleDisplay.innerText = "Role: " + data.role;
  }

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.style.display =
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

  if (isTyping) return;

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

  // 🔥 DO NOT RENDER IF USER IS TYPING
  if (!isTyping) {
    safeRender();
  }
});

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

  renderTimer = setTimeout(() => {
    render();
  }, 100);
}

// ================= RENDER =================
function render() {

  if (isRendering) return;
  isRendering = true;

  const table = document.getElementById("table");

  let html = "";
  let sessionTotal = 0;
  let purchaseTotal = 0;

  const combined = [];

  for (let s of sessions) {
    sessionTotal += s.amount;

    combined.push({
      type: "SESSION",
      invoice: s.invoice,
      name: s.station,
      start: s.startTime,
      end: s.endTime,
      date: s.date,
      amount: s.amount
    });
  }

  for (let p of purchases) {
    purchaseTotal += p.total;

    combined.push({
      type: "PURCHASE",
      invoice: p.invoice,
      name: p.customer,
      start: p.startTime,
      end: null,
      date: p.date,
      amount: p.total
    });
  }

  combined.sort((a, b) => a.invoice - b.invoice);

  for (let item of combined) {

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

    html += `
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
  }

  table.innerHTML = html;

  const grand = sessionTotal + purchaseTotal;

  document.getElementById("income").innerText = "Income: ₦" + grand;

  updateSummary(sessionTotal, purchaseTotal, grand);

  isRendering = false;
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

  const all = [];

  sessions.forEach(s => {
    all.push({ invoice: s.invoice, type: "SESSION", amount: s.amount, date: s.date });
  });

  purchases.forEach(pu => {
    all.push({ invoice: pu.invoice, type: "PURCHASE", amount: pu.total, date: pu.date });
  });

  all.sort((a, b) => a.invoice - b.invoice);

  let html = "<h3>📄 Invoice Report</h3>";

  for (let i of all) {
    html += `<p>${i.invoice} | ${i.type} | ₦${i.amount} | ${i.date}</p>`;
  }

  p.innerHTML = html;
}

function factoryReset() {

  if (!confirm("⚠️ This will DELETE ALL DATA permanently.")) return;

  // 🔥 SHOW LOADING MESSAGE FIRST
  document.body.innerHTML = "<h2 style='color:red;text-align:center;margin-top:50px;'>Resetting system...</h2>";

  // 🔥 THEN SEND RESET COMMAND
  ipcRenderer.send("factory-reset-db");
}
// ================= LIVE UPDATE =================
setInterval(() => {
  if (!isTyping) {
    ipcRenderer.send("get-data");
  }
}, 5000);

// ================= INIT =================
load();