const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

  saveSession: (data) => ipcRenderer.invoke("save-session", data),

  saveSale: (data) => ipcRenderer.invoke("save-sale", data),

  getAll: () => ipcRenderer.invoke("get-all")

});