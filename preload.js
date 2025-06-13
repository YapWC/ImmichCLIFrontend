const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('openDialog', {
  file: () => ipcRenderer.invoke('open-dialog-for-file'),
  folder: () => ipcRenderer.invoke('open-dialog-for-folder')
})

contextBridge.exposeInMainWorld('immich', {
  login: (url, key) => ipcRenderer.invoke('login:submit', { url, key }),
  upload: (isDryRun, isAlbum, isRecursive) => ipcRenderer.invoke('upload:submit', {isDryRun, isAlbum, isRecursive}),
  receiveMessage: (callback) => ipcRenderer.on('output-message', (event, message) => callback(message))
})

console.log('preload loaded')