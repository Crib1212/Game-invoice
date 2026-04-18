const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const DB = require("./db");

let db;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  db = new DB();
  createWindow();
});

// ================= RATE =================
ipcMain.handle("set-rate", (e, rate, type) => {
  return new Promise((resolve, reject) => {
    db.setRate(rate, type, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
});

ipcMain.handle("get-rate", () => {
  return new Promise((resolve, reject) => {
    db.getRate((err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
});

// ================= SESSION =================
ipcMain.handle("start-session", (e, data) => {
  return new Promise((resolve, reject) => {
    db.startSession(data, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
});

ipcMain.handle("get-sessions", () => {
  return new Promise((resolve, reject) => {
    db.getSessions((err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle("end-session", (e, id) => {
  return new Promise((resolve, reject) => {
    db.endSession(id, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
});

// ================= REPORT =================
ipcMain.handle("daily-report", () => {
  return new Promise((resolve, reject) => {
    db.getDailyReport((err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
});