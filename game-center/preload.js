const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  saveSession: (data) => ipcRenderer.invoke("save-session", data),
  getSessions: () => ipcRenderer.invoke("get-sessions"),
  getReceipts: () => ipcRenderer.invoke("get-receipts"),
  saveSale: (data) => ipcRenderer.invoke("save-sale", data),
  getSales: () => ipcRenderer.invoke("get-sales")
});