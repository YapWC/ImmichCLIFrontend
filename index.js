const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process');
const path = require('node:path')
const pty =  require('node-pty');

const index_html= 'index.html';
const uplaod_html = 'upload.html'
const immich_cli_file = path.join(__dirname, 'node_modules', '.bin', 'immich');

let mainWindow;
let file_folder_path = "/Users/yapch/Desktop/Orico_2Bay_NAS_MetaCube.jpeg";

try {
	require('electron-reloader')(module);
} catch {}

const createWindow = (html_file, width = 1300, height = 950) => {
  const win = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile(html_file)

  return win
}

app.whenReady().then(() => {
  mainWindow = createWindow(index_html)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(index_html)
    }
  })
})

app.on('window-all-closed', () => {
  const ptyProcess = pty.spawn(immich_cli_file, ['logout'])
  ptyProcess.onData((data) => {
    process.stdout.write(data);
  });

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle("login:submit", (event, args) => {
  const { url, key } = args;
  const ptyProcess = pty.spawn(immich_cli_file, ['login', url, key])
  ptyProcess.onData((data) => {
    process.stdout.write(data);
  });
  ptyProcess.onExit(({ exitCode, signal }) => {
    if (exitCode === 0) {
      // Process login successfully
      mainWindow.loadFile(uplaod_html);
    } else {
      // Non-zero exit code indicates an error
      dialog.showMessageBoxSync({message: `Login Error either URL or API Key does not match. Try Again.`})
    }
  })
})

ipcMain.handle("upload:submit", (event, args) => {
  const { isDryRun, isAlbum, isRecursive } = args;
  
  const dry_run = isDryRun ? "--dry-run" : "";
  const album = isAlbum ? "--album" : "";
  const recursive = isRecursive ? "--recursive" : "";
  
  console.log(`Dry Run: ${dry_run}  Album: ${album}  Recursive: ${recursive}`)
  
  const ptyProcess = pty.spawn(immich_cli_file, ['upload', dry_run, album, recursive, ...file_folder_path])
  ptyProcess.onData((data) => {
    process.stdout.write(data);
    event.sender.send('output-message', data);
  });
  
})

ipcMain.handle("open-dialog-for-file-folder", (event) => {
  file_folder_path = dialog.showOpenDialogSync({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
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


