const { app, BrowserWindow } = require('electron')
const { autoUpdater } = require("electron-updater")
let win

function createWindow () {
  win = new BrowserWindow({
    width: 1080,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    },
    frame: false,
    // transparent: true,
  })

  win.setMenuBarVisibility(false)

  win.loadFile('app/index.html')

  win.on('closed', function () {
    win = null
  })

  win.on('ready-to-show', function () {
    sendStatusToWindow(JSON.stringify({type:'userData', path: app.getPath('userData') }))
  })

  autoUpdater.checkForUpdatesAndNotify()
}

let messages = []
function sendStatusToWindow(text) {
  messages.push(messages)
  if(win){
    messages.forEach((message)=>{ win.webContents.send('message', text) })
    messages = []
  }
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...')
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.')
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.')
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err)
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
  sendStatusToWindow(log_message)
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded')
})

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (win === null) createWindow()
})
