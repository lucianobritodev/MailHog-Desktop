"use strict";

const { app, Tray, Menu, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn, spawnSync } = require('child_process')
const { resolve } = require('path');
const fs = require('fs');
const nodeNotifier = require('node-notifier')

const home      = process.env.HOME;
const host      = "127.0.0.1";
const port      = "8025";
const url       = `http://${host}:${port}`;
const base_path = `${home}/.config/mailhog-desktop/mailhog`;

let mainTray = {};
let mainWindow = {};
let lastPidMailhog = [];

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
      label: "About",
      click: () => about()
    },
    {
      label: "Help",
      click: () => help()
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => quit()
    }
  ]);

  tray.setIgnoreDoubleClickEvents(true)
  tray.setToolTip('MailHog Desktop')
  tray.setContextMenu(contextMenu);

  tray.on('click', event => {
    contextMenu.popup({positioningItem: 0})
  });

}


function about() {

  mainWindow.setSize(820, 580, true);
  mainWindow.center();
  mainWindow.loadFile(resolve(__dirname, '..', 'assets', 'model', 'about.html'));
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);

  console.log(app.getVersion()) 
}


function help() {
  shell.openExternal('https://github.com/mailhog/MailHog');
}


function downloadMailhog() {

  try {
    if(fs.existsSync(base_path)) {

      if (fs.existsSync(`${base_path}/mhsendmail`)
        && fs.existsSync(`${base_path}/MailHog_linux_amd64`)) {
          return;
      }

      spawnSync('rm', [ '-Rf', `${base_path}` ]);
    }
  
    fs.mkdirSync(base_path, { recursive: true });
  
    spawn(`wget`, [ 
      '-c',
      'https://raw.githubusercontent.com/lucianobritodev/MailHog-Desktop/master/src/app/bin/mhsendmail',
      '-O',
      `${base_path}/mhsendmail`
    ]);
  
    spawn(`wget`, [ 
      '-c',
      'https://raw.githubusercontent.com/lucianobritodev/MailHog-Desktop/master/src/app/bin/MailHog_linux_amd64',
      '-O',
      `${base_path}/MailHog_linux_amd64`
    ]);
  
    spawnSync('bash', [ '-c', `chmod +x ${base_path}/*` ]);
  
  } catch (error) {
    console.log(error)
  }
  
}


function startMailhog() {
  
  if(executando()) {
    stopMailhog();
  }

  let _process = spawn(`${base_path}/MailHog_linux_amd64`);
  
  lastPidMailhog.push(_process.pid);
  
  setTimeout(() => {
    if(executando()) {
      notifier('Aplicação iniciada!');
      openInConsole();
    }  
  }, 2000);

}


function stopMailhog() {

  if(executando()) {
    spawn('kill', [ lastPidMailhog.join(' ') ]);

    lastPidMailhog = [];
    notifier('Aplicação encerrada!');
  }

}


function openInConsole() {

  if(!executando()) {
    startMailhog();
  }

  setTimeout(() => {
    shell.openExternal(url);
  }, 2000)

}


function showWindowSendMail() {

  if(!executando()) {
    return notifier('Servidor SMTP não está em execução!');
  }

  mainWindow.setSize(800, 670, true);
  mainWindow.center();
  mainWindow.loadFile(resolve(__dirname, '..', 'assets', 'model', 'mail.html'));
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);

}


function sendMail(data) {

  const email = `From: ${data.name} <${data.from}> \nTo: Test <${data.to}> \nSubject: ${data.subject} \n\n${data.body}`
  fs.writeFileSync("/tmp/mail.txt", email);
  spawn('bash', [ '-c', `${ base_path}/mhsendmail ${data.to} < /tmp/mail.txt` ]);

}


function hideWindow() {
  mainWindow.hide();
}


function quit() {
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
  return !!(lastPidMailhog.length != 0 && lastPidMailhog != null);
}


if (app.dock) app.dock.hide();
if (!app.requestSingleInstanceLock()) quit();

app.disableHardwareAcceleration();

app.whenReady().then(() => {

  downloadMailhog();

  mainWindow = buildBrowserWindow();
  mainTray = new Tray(resolve(__dirname, '..', 'assets', 'icons', 'iconTemplate.png'));
  render(mainTray);

  mainWindow.on('close', e => {
    e.preventDefault();
    hideWindow();
  });

  ipcMain.on('send-mail', (event, data) => {
    sendMail(data);
    event.sender.send('mail-sended');
  });

  ipcMain.on('window-hide', event => {
    mainWindow.hide();
  });

  ipcMain.on('open-author', event => {
    shell.openExternal('https://github.com/lucianobritodev');
  });

  ipcMain.on('open-project', event => {
    shell.openExternal('https://github.com/lucianobritodev/MailHog-Desktop');
  });

  ipcMain.on('open-mailhog', event => {
    shell.openExternal('https://github.com/mailhog/MailHog');
  });

});
