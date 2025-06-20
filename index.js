const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const pty =  require('node-pty');

let isDebug = false;

const index_html= 'index.html';
const uplaod_html = 'upload.html'

let mainWindow;
let file_path = '';
let folder_path = '';

try {
	require('electron-reloader')(module);
} catch {}

function getNodePath() {
  if (app.isPackaged) {
    switch (process.platform) {
      case 'darwin':
        return path.join(process.resourcesPath, "node", "macos", "node")
      case 'win32':
        return path.join(process.resourcesPath, "node", "windows", "node.exe")
      case 'linux':
        return path.join(process.resourcesPath, "node", "linux", "node")
    }
  } else {
    switch (process.platform) {
      case 'darwin':
        return path.join(__dirname, "resources", "node", "macos", "node")
      case 'win32':
        return path.join(__dirname, "resources", "node", "windows", "node.exe")
      case 'linux':
        return path.join(__dirname, "resources", "node", "linux", "node")
    }
  }
}
const nodePath = getNodePath();
console.log(process.resource)

function getImmichCliPath() {
    if (app.isPackaged) {
        // In packaged app
        return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@immich', 'cli', 'dist', 'index.js');
    } else {
        // In development
        return path.join(__dirname, 'node_modules', '@immich', 'cli', 'dist', 'index.js');
    }
}
const immich_cli_file = getImmichCliPath();

const createWindow = (html_file, width = 1300, height = 950) => {
  const win = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile(html_file)
  if (isDebug) {
    win.webContents.openDevTools()
  }

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
  const ptyProcess = pty.spawn(nodePath, [immich_cli_file, 'logout'])
  ptyProcess.onData((data) => {
    process.stdout.write(data);
  });

  // Wait for the logout process to complete only then quit
  ptyProcess.onExit((exitCode) => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });
})

ipcMain.handle("login:submit", (event, args) => {
  const { url, key } = args;
  const ptyProcess = pty.spawn(nodePath, [immich_cli_file, 'login', url, key])
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

let activePtyProcess;
ipcMain.handle("upload:submit", (event, args) => {
  const { isDryRun, isAlbum, isRecursive, isCancel } = args;
  const dry_run = isDryRun ? "--dry-run" : "";
  const album = isAlbum ? "--album" : "";
  const recursive = isRecursive ? "--recursive" : "";

  if (isCancel) {
    try {
      activePtyProcess.kill()
      process.stdout.write(`Killed Active ptyProcess and Upload Cancelled\n`)
      return 0;
    } catch (e) {
      console.error(`Error to Kill Active ptyProcess: ${e}`)
      return 1;
    }
  }
  
  console.log(`Dry Run: ${dry_run}  Album: ${album}  Recursive: ${recursive}`)

  let uploadPath;
  if (file_path) {
    uploadPath = file_path
    file_path = ''
  } else if (folder_path) {
    uploadPath = folder_path
    folder_path = ''
  } else {
    dialog.showMessageBoxSync({message: `No file or folder path provided. Try Again`})
    return 1;
  }

  ptyProcess = pty.spawn(nodePath, [immich_cli_file,'upload', dry_run, album, recursive, ...uploadPath])
  // To preserve the process even after the next call
  activePtyProcess = ptyProcess;
  console.log(`Process ID: ${ptyProcess.pid}`)
  ptyProcess.onData((data) => {
    process.stdout.write(data);
    event.sender.send('output-message', data);
  });

  ptyProcess.onExit((e) => {
    process.stdout.write(`Upload Exited in index.js: exitCode ${e.exitCode}\n`);
    event.sender.send('output-message', e.exitCode)
  })
})

ipcMain.handle("open-dialog-for-file", (event) => {
  file_path = dialog.showOpenDialogSync({ properties: ['openFile', 'multiSelections'] })
  console.log(file_path)
  return file_path
})

ipcMain.handle("open-dialog-for-folder", (event) => {
  // For no in Electron 36.3.1 version users are facing folder path
  // note returned on MacOS so the below will be temporarily disabled
  // Source: https://github.com/electron/electron/issues/47248
  //folder_path = dialog.showOpenDialogSync({ properties: ['openDirectory', 'multiSelections'] })
  // Tempory solution
  folder_path = dialog.showOpenDialogSync({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
  console.log(folder_path)
  return folder_path
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

const triggerAllowLocalNetworkAccessPrompt = async () => {
  try {
    const response = await fetch("https://www.google.com/robots.txt");
    if (response.ok) {
      console.log("Internet connection is available.");
    } else {
      console.log("Internet connection is not available.");
    }
  } catch (error) {
    console.error("Error checking connectivity:", error);
  }
}
triggerAllowLocalNetworkAccessPrompt()

// This log will appear in terminal not in web console
console.log("index.js Loaded")