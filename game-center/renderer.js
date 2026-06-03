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

<<<<<<< HEAD
  return `${m}:${s.toString().padStart(2, "0")}`;
}
=======
  let sessionTotal = 0;
  let salesTotal = 0;
  let profitTotal = 0;

  sessions.forEach(s=>{

    sessionTotal +=
      Number(s.amount || 0);

  });

  sales.forEach(s=>{

    salesTotal +=
      Number(s.total || 0);

    profitTotal +=
      Number(s.profit || 0);

  });

  const grand =
    sessionTotal + salesTotal;

  document.getElementById("income").innerText =
    "Income: ₦" + grand.toFixed(2);

  const profitDisplay =
    document.getElementById("profitDisplay");

  if(profitDisplay){

    profitDisplay.innerText =
      "Profit: ₦" + profitTotal.toFixed(2);

  }

  const grouped = {};

  sessions.forEach(s=>{

    if(!grouped[s.date]){

      grouped[s.date] = {
        sessions: [],
        sales: []
      };

    }

    grouped[s.date].sessions.push(s);

  });

  sales.forEach(s=>{

    if(!grouped[s.date]){

      grouped[s.date] = {
        sessions: [],
        sales: []
      };

    }

    grouped[s.date].sales.push(s);

  });

  let html = `

    <h2>📊 REPORT</h2>

    <h3>
      Sessions Income:
      ₦${sessionTotal.toFixed(2)}
    </h3>

    <h3>
      Product Sales:
      ₦${salesTotal.toFixed(2)}
    </h3>

    <h3>
      Total Profit:
      ₦${profitTotal.toFixed(2)}
    </h3>

    <h1>
      Total Income:
      ₦${grand.toFixed(2)}
    </h1>

    <hr>
  `;

  Object.keys(grouped)
    .sort()
    .reverse()
    .forEach(date=>{

      const day =
        grouped[date];

      const total =
        [...day.sessions, ...day.sales]
          .reduce((a,b)=>
            a + Number(b.amount || b.total || 0),0);

      const dailyProfit =
        day.sales.reduce((a,b)=>
          a + Number(b.profit || 0),0);

      html += `
        <div class="card">

          <h3
            onclick="toggleReport(this)"
            style="
              cursor:pointer;
            "
          >

            📅 ${date}

            — ₦${total.toFixed(2)}

          </h3>

          <div style="display:none">

            <h4>🎮 Sessions</h4>

            ${
              day.sessions.map(s=>`

                <p>

                  ${s.station}

                  -

                  ₦${Number(s.amount).toFixed(2)}

                </p>

              `).join("")
            }

            <h4>💰 Sales</h4>

            ${
              day.sales.map(s=>`

                <p>

                  ${s.product}

                  x${s.qty}

                  =

                  ₦${Number(s.total).toFixed(2)}

                  |

                  Profit:

                  ₦${Number(s.profit).toFixed(2)}

                </p>

              `).join("")
            }

            <hr>

            <p>

              <b>
                Daily Profit:
              </b>

              ₦${dailyProfit.toFixed(2)}

            </p>

          </div>

        </div>
      `;

    });

  document.getElementById("summaryPanel")
    .innerHTML = html;

}

// ================= TOGGLE REPORT =================

function toggleReport(el){

  const div =
    el.nextElementSibling;

  div.style.display =
    div.style.display === "none"
      ? "block"
      : "none";

}

// ================= SESSION RECEIPT =================

function printSessionReceipt(invoice){

  const s =
    sessions.find(x => x.invoice == invoice);

  if(!s) return;

  const win =
    window.open(
      "",
      "_blank",
      "width=350,height=700"
    );

  win.document.write(`
    <html>

    <body style="
      font-family:monospace;
      width:80mm;
      padding:8px;
    ">

      <center>

        <h2>
          🎮 GAME CENTER POS
        </h2>

        <h3>
          SESSION RECEIPT
        </h3>

      </center>

      <hr>

      <p>
        <b>Station:</b>
        ${s.station}
      </p>

      <p>
        <b>Invoice:</b>
        ${s.invoice}
      </p>

      <p>
        <b>Start:</b>
        ${new Date(s.startTime).toLocaleString()}
      </p>

      <p>
        <b>End:</b>
        ${new Date(s.endTime).toLocaleString()}
      </p>

      <p>
        <b>Minutes:</b>
        ${s.customerMinutes}
      </p>

      <p>
        <b>Amount:</b>
        ₦${Number(s.amount).toFixed(2)}
      </p>

      <p>
        <b>Date:</b>
        ${s.date}
      </p>

      <hr>

      <center>

        <b>
          THANK YOU
        </b>

      </center>

      <script>
        window.print()
      </script>

    </body>

    </html>
  `);

}

// ================= SALES RECEIPT =================

function printSaleReceipt(invoice){

  const s =
    sales.find(x => x.invoice == invoice);

  if(!s) return;

  const win =
    window.open(
      "",
      "_blank",
      "width=350,height=700"
    );

  win.document.write(`
    <html>

    <body style="
      font-family:monospace;
      width:70mm;
      padding:13px;
      font-size:20px;
      line-height:0.7;
    ">

      <center>

        <h2>
         🎮 WITTY UNISEX SALON AND GAMES
        </h2>

        <h3>
          SALES RECEIPT
        </h3>

      </center>

      <hr>


      <p>

        <b>Invoice:</b>

        ${s.invoice}

      </p>

      <p>

        <b>Product:</b>

        ${s.product}

      </p>

      <hr>

      <p>

        <b>Selling Price:</b>

        ₦${Number(s.price || 0).toFixed(2)}

      </p>

      <p>

        <b>Quantity:</b>

        ${s.qty}

      </p>

      <p>

        <b>Total:</b>

        ₦${Number(s.total || 0).toFixed(2)}

      </p>

      <hr>

      <p>

        <b>Date:</b>

        ${s.date}

      </p>

      <p>

        <b>Cashier:</b>

        System

      </p>

      <hr>

      <center>

        <b>
          THANK YOU
        </b>

      </center>

      <script>
        window.print()
      </script>

    </body>

    </html>
  `);

}

// ================= RESET =================

function factoryReset(){

  if(role !== "admin"){
    return alert("Admin only");
  }

  if(!confirm("Reset everything?")){
    return;
  }

  ipcRenderer.send("factory-reset");

}

// ================= COUNTDOWN =================

setInterval(()=>{

  const now =
    Date.now();

  for(let id in countdownMap){

    const el =
      countdownElements[id];

    if(!el) continue;

    const diff =
      countdownMap[id] - now;

    if(diff <= 0){

      el.innerText =
        "EXPIRED";

      continue;

    }

    const m =
      Math.floor(diff / 60000);

    const s =
      Math.floor((diff % 60000)/1000);

    el.innerText =
      m +
      ":" +
      s.toString().padStart(2,"0");

  }

},1000);

// ================= START =================

loadData();
>>>>>>> bc76d892656ef540ccd73c502baff3f71115c723
