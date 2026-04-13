const { app, BrowserWindow } = require('electron');
<<<<<<< HEAD

function createWindow() {
=======
const path = require('path');

function createWindow() {

>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
<<<<<<< HEAD
=======

  // 🔥 THIS WILL SHOW ERRORS
  
>>>>>>> 5ba73347045d449102872e9325a2d3aedb8f01e8
}

app.whenReady().then(createWindow);