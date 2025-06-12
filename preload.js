const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('openDialog', {
  file_folder: () => ipcRenderer.invoke('open-dialog-for-file-folder')
})

contextBridge.exposeInMainWorld('immich', {
  login: (url, key) => ipcRenderer.invoke('login:submit', { url, key }),
  upload: (isDryRun, isAlbum, isRecursive) => ipcRenderer.invoke('upload:submit', {isDryRun, isAlbum, isRecursive}),
  receiveMessage: (callback) => ipcRenderer.on('output-message', (event, message) => callback(message))
})

console.log('preload loaded')