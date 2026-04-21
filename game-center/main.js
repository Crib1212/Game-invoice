const { app, BrowserWindow, ipcMain } = require("electron");
const db = require("./db");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

// ================= INVOICE =================
function nextInvoice(cb) {
  db.get("SELECT invoiceCounter FROM meta WHERE id = 1", (err, row) => {
    let next = (row?.invoiceCounter || 0) + 1;
    db.run("UPDATE meta SET invoiceCounter = ? WHERE id = 1", [next]);
    cb(next);
  });
}

// ================= SESSION =================
ipcMain.on("save-session", (e, data) => {
  nextInvoice((inv) => {

    db.run(`
      INSERT INTO sessions
      (invoice, station, startTime, endTime, customerMinutes, pricePerGame, gameMinutes, amount, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inv,
      data.station,
      data.startTime,
      data.endTime,
      data.customerMinutes,
      data.pricePerGame,
      data.gameMinutes,
      data.amount,
      data.date
    ], () => {
      e.reply("saved");
    });

  });
});

// ================= PURCHASE =================
ipcMain.on("save-purchase", (e, data) => {
  nextInvoice((inv) => {

    const now = Date.now();

    db.run(`
      INSERT INTO purchases
      (invoice, customer, item, startTime, endTime, price, qty, total, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inv,
      data.customer,
      data.item,
      now,
      now,
      data.price,
      data.qty,
      data.total,
      data.date
    ], () => {
      e.reply("saved");
    });

  });
});

// ================= GET DATA =================
ipcMain.on("get-data", (e) => {
  db.all("SELECT * FROM sessions", [], (e1, sessions) => {
    db.all("SELECT * FROM purchases", [], (e2, purchases) => {
      e.reply("data", { sessions, purchases });
    });
  });
});