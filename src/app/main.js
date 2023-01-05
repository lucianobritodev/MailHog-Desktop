"use strict";

const fs = require('fs');
const { app, Tray, Menu, BrowserWindow, ipcMain } = require('electron');
const { spawn, spawnSync } = require('child_process')
const { resolve, join } = require('path');
const nodeNotifier = require('node-notifier')

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
      label: "Send mail test",
      click: () => showWindowSendMail()
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
  tray.on('click', () => tray.popUpContextMenu());
}

function startMailhog() {
  
  if(executando()) {
    stopMailhog()
  }

  let _process = spawn(`${__dirname}/bin/MailHog_linux_amd64`, {
    shell: false,
    encoding: 'utf8'
  });
  
  lastPidMailhog = _process.pid
  
  setTimeout(() => {
    if(executando()) {
      notifier('Aplicação iniciada!');
      openInConsole();
    }  
  }, 2000);

}

function stopMailhog() {

  if(executando()) {
    spawn('kill', [ lastPidMailhog ], {
      shell: false,
      encoding: 'utf8'
    })

    lastPidMailhog = null;
    notifier('Aplicação encerrada!')
  }

}

function openInConsole() {

  if(!executando()) {
    startMailhog();
  }

  setTimeout(() => {
    spawn('xdg-open', [ url ], {
      shell: false,
      encoding: 'utf8'
    });
  }, 2000)

}

function showWindowSendMail() {

  if(lastPidMailhog == null || lastPidMailhog == '') {
    return notifier('Aplicação não está em execução!');
  }

  mainWindow.loadFile(resolve(__dirname, '..', 'assets', 'model', 'mail.html'))
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);

}

function sendMail(data) {

  const email = `From: ${data.name} <${data.from}> \nTo: Test <${data.to}> \nSubject: ${data.subject} \n\n${data.body}`

  fs.writeFileSync(join(__dirname, "../assets/model/mail.txt"), email);

  spawn('bash', [ '-c', `${ __dirname}/bin/mhsendmail ${data.to} < ${join(__dirname, "../assets/model/mail.txt")}` ], {
    shell: false,
    encoding: 'utf8'
  });

}

function close() {
  mainWindow = null;
  app.exit(0);
}

function notifier(notification) {
  return nodeNotifier.notify({
    title: 'MailHog',
    message: notification,
    wait: true,
    time: 5000,
    timeout: false
  });
}

function buildBrowserWindow() {
  return new BrowserWindow({
    width: 800,
    height: 670,
    show: false,
    frame: true,
    transparent: true,
    movable: true,
    modal: true,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
}

function executando() {
  return !!(lastPidMailhog != null && lastPidMailhog != '');
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
  });

  ipcMain.on('send-mail', (event, data) => {
    sendMail(data);
    event.sender.send('mail-sended');
  });

  ipcMain.on('window-hide', event => {
    mainWindow.hide();
  });

});
