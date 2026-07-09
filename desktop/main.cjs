const { app, BrowserWindow, shell } = require("electron");

const DEV_URL = process.env.HERDFLOW_DESKTOP_URL || "http://127.0.0.1:4173/marketplace";
const PROD_URL = "https://herdflow-h619.onrender.com/marketplace";

function getStartUrl() {
  return app.isPackaged ? PROD_URL : DEV_URL;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#0f172a",
    title: "HerdFlow",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.loadURL(getStartUrl());
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
