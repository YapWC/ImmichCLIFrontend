const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process');
const path = require('node:path')

const index_html= 'index.html';
const uplaod_html = 'upload.html'

let mainWindow;
let file_folder_path = "/Users/yapch/Desktop/Orico_2Bay_NAS_MetaCube.jpeg";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')

  return win
}

app.whenReady().then(() => {
  mainWindow = createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  const cli = spawn("immich", ["logout"]);
  console_logs_data(cli);

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle("login:submit", (event, args) => {
  const { url, key } = args;
  const cli = spawn("immich", ["login", url, key] );
  console_logs_data(cli);

  mainWindow.loadFile('upload.html');
})

ipcMain.handle("upload:submit", (event, args) => {
  const { isDryRun, isAlbum, isRecursive } = args;
  
  const dry_run = isDryRun ? "--dry-run" : "";
  const album = isAlbum ? "--album" : "";
  const recursive = isRecursive ? "--recursive" : "";
  
  const cli = spawn("immich", ["upload", dry_run, album, recursive, file_folder_path] );
  console.log(`Dry Run: ${dry_run}  Album: ${album}  Recursive: ${recursive}`)
  console_logs_data(cli);
  
})

ipcMain.handle("open-dialog-for-file", (event) => {
  file_folder_path = dialog.showOpenDialogSync({ properties: ['openFile', 'multiSelections'] })
  console.log(file_folder_path)
  return file_folder_path
})

function console_logs_data(cli) {
  // Log stdout data
  cli.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  // Log stderr data
  cli.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
}


