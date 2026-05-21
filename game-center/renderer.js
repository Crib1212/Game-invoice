// ================= renderer.js =================

const { ipcRenderer } = require("electron");

let sessions = [];
let products = [];
let sales = [];

let role = "cashier";

let countdownMap = {};
let countdownElements = {};

// ================= PAGE =================

function showPage(id){

  document.querySelectorAll(".page")
    .forEach(p => p.style.display="none");

  document.getElementById(id).style.display="block";

}

// ================= LOGIN =================

function login(){

  const pin =
    document.getElementById("pinInput").value;

  if(!pin){
    return alert("Enter password");
  }

  ipcRenderer.send("login", pin);

}

ipcRenderer.on("login-result",(e,data)=>{

  role = data.role;

  document.getElementById("roleDisplay")
    .innerText = "Role: " + role;

  document.getElementById("adminControls").style.display =
    role === "admin"
      ? "block"
      : "none";

});

// ================= PASSWORD =================

function changePassword(){

  const oldPassword =
    document.getElementById("oldPassword").value;

  const newPassword =
    document.getElementById("newPassword").value;

  const confirmPassword =
    document.getElementById("confirmPassword").value;

  if(!oldPassword || !newPassword || !confirmPassword){
    return alert("Fill all fields");
  }

  if(newPassword !== confirmPassword){
    return alert("Password mismatch");
  }

  ipcRenderer.send("change-password",{
    oldPassword,
    newPassword
  });

}

ipcRenderer.on("password-result",(e,data)=>{

  alert(data.message);

  document.getElementById("oldPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";

});

// ================= SESSION =================

function startSession(){

  const station =
    document.getElementById("station").value.trim();

  const pricePerGame =
    Number(document.getElementById("pricePerGame").value);

  const gameMinutes =
    Number(document.getElementById("gameMinutes").value);

  const customerMinutes =
    Number(document.getElementById("customerMinutes").value);

  if(!station || !pricePerGame || !gameMinutes || !customerMinutes){
    return alert("Fill all fields");
  }

  const amount =
    (customerMinutes / gameMinutes) * pricePerGame;

  const startTime =
    Date.now();

  const endTime =
    startTime + customerMinutes * 60000;

  ipcRenderer.send("save-session",{

    station,
    pricePerGame,
    gameMinutes,
    customerMinutes,
    amount,
    startTime,
    endTime,
    date:new Date().toISOString().split("T")[0]

  });

  document.getElementById("station").value = "";
  document.getElementById("pricePerGame").value = "";
  document.getElementById("gameMinutes").value = "";
  document.getElementById("customerMinutes").value = "";

}

// ================= PRODUCT =================

function addProduct(){

  const name =
    document.getElementById("productName").value.trim();

  const costPrice =
    Number(document.getElementById("productCostPrice").value);

  const sellingPrice =
    Number(document.getElementById("productPrice").value);

  const qty =
    Number(document.getElementById("productQty").value);

  if(!name || !costPrice || !sellingPrice || !qty){
    return alert("Fill all fields");
  }

  ipcRenderer.send("add-product",{
    name,
    costPrice,
    price:sellingPrice,
    qty
  });

  document.getElementById("productName").value = "";
  document.getElementById("productCostPrice").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productQty").value = "";

}

// ================= SELL PRODUCT =================

function sellProduct(id){

  const qtyInput =
    document.getElementById("qty-" + id);

  const qty =
    Number(qtyInput.value);

  if(!qty || qty <= 0){
    return alert("Enter quantity");
  }

  ipcRenderer.send("sell-product",{
    id,
    qty
  });

  qtyInput.value = "";

}

// ================= LOAD =================

function loadData(){

  ipcRenderer.send("get-data");

}

ipcRenderer.on("saved",()=>{

  loadData();

});

ipcRenderer.on("data",(e,data)=>{

  sessions = data.sessions || [];
  products = data.products || [];
  sales = data.sales || [];

  renderSessions();
  renderProducts();
  renderSales();
  renderSummary();

});

ipcRenderer.on("error",(e,msg)=>{

  alert(msg);

});

// ================= SESSION RENDER =================

function renderSessions(){

  const box =
    document.getElementById("sessionContainer");

  countdownMap = {};

  if(sessions.length === 0){

    box.innerHTML =
      "<div class='card'><h3>No sessions</h3></div>";

    return;

  }

  let html = "";

  sessions.forEach(s=>{

    countdownMap[s.invoice] =
      s.endTime;

    html += `
      <div class="sessionCard">

        <h3>🎮 ${s.station}</h3>

        <button
          onclick="printSessionReceipt(${s.invoice})"
        >
          🖨 Print
        </button>

        <p>Invoice: ${s.invoice}</p>

        <p>Amount: ₦${Number(s.amount).toFixed(2)}</p>

        <p>Minutes: ${s.customerMinutes}</p>

        <p>Date: ${s.date}</p>

        <h2
          class="cd"
          data-id="${s.invoice}"
        >
          --:--
        </h2>

      </div>
    `;

  });

  box.innerHTML = html;

  countdownElements = {};

  document.querySelectorAll(".cd")
    .forEach(el=>{

      countdownElements[el.dataset.id] = el;

    });

}

// ================= PRODUCT RENDER =================

function renderProducts(){

  const box =
    document.getElementById("productContainer");

  if(products.length === 0){

    box.innerHTML =
      "<div class='card'><h3>No products</h3></div>";

    return;

  }

  let html = `
    <table>

      <tr>

        <th>Name</th>

        <th>Cost</th>

        <th>Selling</th>

        <th>Qty</th>

        <th>Status</th>

        <th>Action</th>

      </tr>
  `;

  products.forEach(p=>{

    html += `
      <tr>

        <td>${p.name}</td>

        <td>
          ₦${Number(p.costPrice || 0).toFixed(2)}
        </td>

        <td>
          ₦${Number(p.price || 0).toFixed(2)}
        </td>

        <td>${p.qty}</td>

        <td>
          ${p.qty <= 0 ? "OUT" : "OK"}
        </td>

        <td>

          <input
            id="qty-${p.id}"
            type="number"
            min="1"
            placeholder="Qty"
            style="width:70px"
          >

          <button
            onclick="sellProduct(${p.id})"
            ${p.qty <= 0 ? "disabled" : ""}
          >
            Sell
          </button>

        </td>

      </tr>
    `;

  });

  html += `
    </table>
  `;

  box.innerHTML = html;

}

// ================= SALES RENDER =================

function renderSales(){

  const box =
    document.getElementById("salesHistory");

  if(sales.length === 0){

    box.innerHTML =
      "<div class='card'><h3>No sales</h3></div>";

    return;

  }

  let html = `
    <table>

      <tr>

        <th>Invoice</th>

        <th>Product</th>

        <th>Qty</th>

        <th>Sell</th>

        <th>Cost</th>

        <th>Profit</th>

        <th>Total</th>

        <th>Date</th>

        <th>Print</th>

      </tr>
  `;

  sales.forEach(s=>{

    html += `
      <tr>

        <td>${s.invoice}</td>

        <td>${s.product}</td>

        <td>${s.qty}</td>

        <td>
          ₦${Number(s.price || 0).toFixed(2)}
        </td>

        <td>
          ₦${Number(s.costPrice || 0).toFixed(2)}
        </td>

        <td>
          ₦${Number(s.profit || 0).toFixed(2)}
        </td>

        <td>
          ₦${Number(s.total || 0).toFixed(2)}
        </td>

        <td>${s.date}</td>

        <td>

          <button
            onclick="printSaleReceipt(${s.invoice})"
          >
            🖨
          </button>

        </td>

      </tr>
    `;

  });

  html += `
    </table>
  `;

  box.innerHTML = html;

}

// ================= SUMMARY =================

function renderSummary(){

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
      padding:10px;
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
      width:80mm;
      padding:10px;
    ">

      <center>

        <h2>
          🏪 GAME CENTER POS
        </h2>

        <h3>
          SALES RECEIPT
        </h3>

      </center>

      <hr>

      <p>

        <b>Company:</b>

        GAME CENTER

      </p>

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

        <b>Cost Price:</b>

        ₦${Number(s.costPrice || 0).toFixed(2)}

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