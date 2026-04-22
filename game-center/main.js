const { app, BrowserWindow, ipcMain } = require("electron");
const db = require("./db");

let mainWindow;
const fs = require("fs");
const path = require("path");

// ================= CREATE WINDOW =================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile("index.html");

  // 🔥 Prevent background slowdown
  mainWindow.webContents.setBackgroundThrottling(false);
}

app.whenReady().then(createWindow);

// ================= SAFE REPLY =================
function safeReply(e, channel, data) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  e.reply(channel, data);
}

// ================= LOGIN (🔥 FIX ADDED) =================
ipcMain.on("login", (e, pin) => {

  const role = (pin === "1234") ? "admin" : "cashier";

  safeReply(e, "login-result", { role });

});

// ================= INVOICE =================
function nextInvoice(cb) {
  db.get("SELECT invoiceCounter FROM meta WHERE id = 1", (err, row) => {

    let next = (row?.invoiceCounter || 0) + 1;

    db.run(
      "UPDATE meta SET invoiceCounter = ? WHERE id = 1",
      [next],
      () => cb(next)
    );
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
      safeReply(e, "saved", true);
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
      safeReply(e, "saved", true);
    });

  });

});

// ================= GET DATA (ANTI-FREEZE) =================
ipcMain.on("get-data", (e) => {

  db.all(
    "SELECT * FROM sessions ORDER BY id DESC LIMIT 200",
    [],
    (err1, sessions) => {

      db.all(
        "SELECT * FROM purchases ORDER BY id DESC LIMIT 200",
        [],
        (err2, purchases) => {

          safeReply(e, "data", {
            sessions: sessions || [],
            purchases: purchases || []
          });

        }
      );

    }
  );

});

// ================= FACTORY RESET =================
ipcMain.on("factory-reset-db", (e) => {

  try {

    const dbPath = path.join(__dirname, "pos.db");

    // 🔥 Tell renderer to pause rendering
    safeReply(e, "factory-reset-result", {
      success: false,
      message: "Resetting database..."
    });

    // 🔥 Close DB safely
    db.close((err) => {

      if (err) {
        safeReply(e, "factory-reset-result", {
          success: false,
          message: err.message
        });
        return;
      }

      try {
        // 🔥 Delete DB file
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
        }

        // 🔥 Relaunch clean app
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 300);

      } catch (err2) {
        safeReply(e, "factory-reset-result", {
          success: false,
          message: err2.message
        });
      }

    });

  } catch (err) {
    safeReply(e, "factory-reset-result", {
      success: false,
      message: err.message
    });
  }

});