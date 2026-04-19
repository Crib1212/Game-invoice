const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  startSession: (d) => ipcRenderer.invoke("start-session", d),
  endSession: (id) => ipcRenderer.invoke("end-session", id),
  getSessions: () => ipcRenderer.invoke("get-sessions"),

  addSale: (d) => ipcRenderer.invoke("add-sale", d),
  getSales: () => ipcRenderer.invoke("get-sales")
});