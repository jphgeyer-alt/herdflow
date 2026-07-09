const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("node:path");

const PROD_URL = "https://www.herdflow.co.za";
const START_URL = process.env.HERDFLOW_DESKTOP_URL || PROD_URL;

function isAllowedNavigation(url) {
  try {
    const target = new URL(url);
    const allowed = new URL(START_URL);
    return target.host === allowed.host;
  } catch {
    return false;
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#0f172a",
    title: "HerdFlow",
    icon: path.join(__dirname, "..", "resources", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  window.loadURL(START_URL);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
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
}
