let sessions = [];

/* ================= START SESSION ================= */
async function startSession() {
  const station = document.getElementById("station").value;
  const customer = document.getElementById("customer").value || "Walk-in";
  const duration = parseInt(document.getElementById("duration").value);

  const now = Date.now();

  const session = {
    id: now,
    receipt: "R-" + now,
    station,
    customer,
    duration,
    startTime: now,
    endTime: now + duration * 60000,
    total: duration * 10
  };

  await window.api.startSession(session);
  load();
}

/* ================= ADD SALE ================= */
async function addSale() {
  const customer = document.getElementById("manualCustomer").value || "Walk-in";
  const item = document.getElementById("item").value;
  const price = parseFloat(document.getElementById("price").value);
  const qty = parseInt(document.getElementById("qty").value);

  await window.api.addSale({
    id: Date.now(),
    customer,
    item,
    price,
    qty,
    total: price * qty,
    time: Date.now()
  });

  load();
}

/* ================= LOAD ================= */
async function load() {
  const now = Date.now();

  sessions = await window.api.getSessions();

  const live = sessions.filter(s => s.status === "active");
  const sales = await window.api.getSales();

  /* LIVE SESSIONS */
  document.getElementById("live").innerHTML = live.map(s => {
    const diff = s.endTime - now;

    if (diff <= 0) {
      window.api.endSession(s.id);
    }

    const m = Math.max(0, Math.floor(diff / 60000));
    const sec = Math.max(0, Math.floor((diff % 60000) / 1000));

    return `
      <div>
        ${s.station} | ${s.customer} | ${m}:${sec}
      </div>
    `;
  }).join("");

  /* SALES */
  document.getElementById("sales").innerHTML = sales.map(s => {
    return `
      <div>
        ${s.customer} - ${s.item} x${s.qty} = ₦${s.total}
      </div>
    `;
  }).join("");
}

/* LIVE LOOP */
setInterval(load, 1000);
load();