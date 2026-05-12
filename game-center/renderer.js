// ================= renderer.js =================

const { ipcRenderer } = require("electron");

let sessions = [];
let products = [];
let sales = [];

let role = "cashier";

let filterStart = null;
let filterEnd = null;

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

  ipcRenderer.send("login", pin);
}

ipcRenderer.on("login-result",(e,data)=>{

  role = data.role;

  document.getElementById("roleDisplay")
    .innerText = "Role: " + role;

  if(role === "admin"){
    document.getElementById("adminControls")
      .style.display = "block";
  }else{
    document.getElementById("adminControls")
      .style.display = "none";
  }

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
});

// ================= SESSION =================

function startSession(){

  const station =
    document.getElementById("station").value;

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

  const startTime = Date.now();

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

}

// ================= PRODUCT =================

function addProduct(){

  const name =
    document.getElementById("productName").value;

  const price =
    Number(document.getElementById("productPrice").value);

  const qty =
    Number(document.getElementById("productQty").value);

  if(!name || !price || !qty){
    return alert("Fill all fields");
  }

  ipcRenderer.send("add-product",{
    name,
    price,
    qty
  });

}

// ================= SELL PRODUCT =================

function sellProduct(id){

  ipcRenderer.send("sell-product",id);

}

// ================= FILTER =================

function applyFilter(){

  filterStart =
    document.getElementById("startDate").value;

  filterEnd =
    document.getElementById("endDate").value;

  renderSessions();

}

function clearFilter(){

  filterStart = null;
  filterEnd = null;

  renderSessions();

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

// ================= SESSION RENDER =================

function renderSessions(){

  const box =
    document.getElementById("sessionContainer");

  let html = "";

  countdownMap = {};

  sessions.forEach(s=>{

    if(filterStart && s.date < filterStart) return;
    if(filterEnd && s.date > filterEnd) return;

    countdownMap[s.invoice] = s.endTime;

    html += `
      <div class="sessionCard">

        <div class="top">

          <h3>
            🎮 ${s.station}
          </h3>

          <button onclick="printReceipt(${s.invoice})">
            🖨 Print
          </button>

        </div>

        <p>Invoice: ${s.invoice}</p>
        <p>Amount: ₦${s.amount}</p>
        <p>Minutes: ${s.customerMinutes}</p>
        <p>Date: ${s.date}</p>

        <h2 class="cd"
            data-id="${s.invoice}">
          --:--
        </h2>

      </div>
    `;
  });

  box.innerHTML = html;

  countdownElements = {};

  document.querySelectorAll(".cd")
    .forEach(el=>{

      countdownElements[
        el.dataset.id
      ] = el;

    });

}

// ================= PRODUCT RENDER =================

function renderProducts(){

  const box =
    document.getElementById("productContainer");

  let html = `
    <table>

      <tr>
        <th>Name</th>
        <th>Price</th>
        <th>Qty</th>
        <th>Status</th>
        <th>Sell</th>
      </tr>
  `;

  products.forEach(p=>{

    html += `
      <tr>

        <td>${p.name}</td>
        <td>₦${p.price}</td>
        <td>${p.qty}</td>

        <td>
          ${
            p.qty <= 0
            ? "<span class='out'>OUT OF STOCK</span>"
            : "Available"
          }
        </td>

        <td>
          <button onclick="sellProduct(${p.id})">
            Sell
          </button>
        </td>

      </tr>
    `;
  });

  html += "</table>";

  box.innerHTML = html;
}

// ================= SALES =================

function renderSales(){

  const box =
    document.getElementById("salesHistory");

  let html = `
    <table>

      <tr>
        <th>Invoice</th>
        <th>Product</th>
        <th>Qty</th>
        <th>Total</th>
        <th>Date</th>
      </tr>
  `;

  sales.forEach(s=>{

    html += `
      <tr>

        <td>${s.invoice}</td>
        <td>${s.product}</td>
        <td>${s.qty}</td>
        <td>₦${s.total}</td>
        <td>${s.date}</td>

      </tr>
    `;
  });

  html += "</table>";

  box.innerHTML = html;
}

// ================= SUMMARY =================

function renderSummary(){

  let sessionTotal = 0;
  let salesTotal = 0;

  sessions.forEach(s=>{
    sessionTotal += Number(s.amount || 0);
  });

  sales.forEach(s=>{
    salesTotal += Number(s.total || 0);
  });

  const grand =
    sessionTotal + salesTotal;

  document.getElementById("income")
    .innerText =
      "Income: ₦" + grand;

  document.getElementById("summaryPanel")
    .innerHTML = `

      <h2>Session Total: ₦${sessionTotal}</h2>

      <h2>Sales Total: ₦${salesTotal}</h2>

      <h1>Grand Total: ₦${grand}</h1>

    `;
}

// ================= PRINT =================

function printReceipt(invoice){

  const s =
    sessions.find(x=>x.invoice === invoice);

  if(!s) return;

  const win =
    window.open("","","width=300,height=700");

  win.document.write(`

    <html>

    <body style="
      font-family:monospace;
      width:80mm;
      padding:10px;
    ">

      <center>

      <h2>GAME CENTER POS</h2>

      <hr>

      <p>Receipt No: ${s.invoice}</p>

      <p>Station: ${s.station}</p>

      <p>Minutes: ${s.customerMinutes}</p>

      <p>Amount: ₦${s.amount}</p>

      <p>
        Start:
        ${new Date(s.startTime).toLocaleString()}
      </p>

      <p>
        End:
        ${new Date(s.endTime).toLocaleString()}
      </p>

      <hr>

      <h3>THANK YOU</h3>

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

  if(!confirm("Delete all data?")) return;

  ipcRenderer.send("factory-reset");

}

// ================= COUNTDOWN =================

setInterval(()=>{

  const now = Date.now();

  for(let id in countdownMap){

    const el =
      countdownElements[id];

    if(!el) continue;

    const diff =
      countdownMap[id] - now;

    if(diff <= 0){

      el.innerHTML =
        "<span class='expired'>EXPIRED</span>";

      continue;
    }

    const mins =
      Math.floor(diff / 60000);

    const secs =
      Math.floor((diff % 60000) / 1000);

    el.innerText =
      mins + ":" +
      secs.toString().padStart(2,"0");
  }

},1000);

loadData();