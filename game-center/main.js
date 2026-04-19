const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./db");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1300,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

// ================= IPC =================
ipcMain.handle("save-session", (_, data) => db.saveSessionWithReceipt(data));
ipcMain.handle("get-sessions", () => db.getSessions());
ipcMain.handle("get-receipts", () => db.getReceipts());
ipcMain.handle("save-sale", (_, data) => db.saveSale(data));
ipcMain.handle("get-sales", () => db.getSales());