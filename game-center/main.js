const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./db");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

/* ================= SESSION ================= */
ipcMain.handle("start-session", (_, data) => db.startSession(data));
ipcMain.handle("end-session", (_, id) => db.endSession(id));
ipcMain.handle("get-sessions", () => db.getSessions());

/* ================= SALES ================= */
ipcMain.handle("add-sale", (_, data) => db.addSale(data));
ipcMain.handle("get-sales", () => db.getSales());