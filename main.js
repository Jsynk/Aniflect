const {app, BrowserWindow} = require('electron')
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 640,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    },
    frame: false,
    // transparent: true,
  })

  mainWindow.setMenuBarVisibility(false)

  mainWindow.loadFile('app/index.html')

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})
