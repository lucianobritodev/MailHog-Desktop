"use strict";

const { app, Tray, Menu, BrowserWindow } = require('electron');
const { spawn } = require('child_process')
const { resolve, dirname } = require('path');

const host = "127.0.0.1";
const port = "8025";
const url = `http://${host}:${port}`;

let mainTray = {};
let mainWindow = {};
let lastPidMailhog = null;

function render(tray = mainTray) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Start SMTP Server",
      click: () => startMailhog()
    },
    {
      label: "Stop SMTP Server",
      click: () => stopMailhog()
    },
    {
      type: 'separator'
    },
    {
      label: "Open console",
      click: () => openInConsole()
    },
    {
      label: "Send mail",
      click: () => sendMail()
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => close()
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', tray.popUpContextMenu);
}

function startMailhog() {
  let _process = spawn(`${__dirname}/bin/MailHog_linux_amd64`, {
    shell: false,
    encoding: 'utf8'
  })

  lastPidMailhog = _process.pid
}

function stopMailhog() {
  spawn('kill', [`${lastPidMailhog}`], {
    shell: false,
    encoding: 'utf8'
  })
}

function openInConsole() {

  if(lastPidMailhog != null) {
    spawn(`xdg-open ${url}`, {
      shell: false,
      encoding: 'utf8'
    })
  }

}

function sendMail() {

  mainWindow.loadFile(resolve(__dirname, '..', 'assets', 'model', 'mail.html'))
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);

}


function close() {
  mainWindow = null;
  app.exit(0);
}

function buildBrowserWindow() {
  return new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    frame: true,
    transparent: true,
    movable: true,
    modal: false,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
}


if (!app.requestSingleInstanceLock())
  close();

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  mainWindow = buildBrowserWindow();
  mainTray = new Tray(resolve(__dirname, '..', 'assets', 'icons', 'iconTemplate.png'));
  render(mainTray);

  mainWindow.on('close', e => {
    e.preventDefault();
    mainWindow.hide();
  })

});