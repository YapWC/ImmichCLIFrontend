const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('openDialog', {
  file: () => ipcRenderer.invoke('open-dialog-for-file'),
  folder: () => ipcRenderer.invoke('open-dialog-for-folder')
})

contextBridge.exposeInMainWorld('immich', {
  login: (url, key) => ipcRenderer.invoke('login:submit', { url, key }),
  upload: (isDryRun, isAlbum, isRecursive, isCancel, processID) => ipcRenderer.invoke('upload:submit', {isDryRun, isAlbum, isRecursive, isCancel, processID}),
  cancel: () => ipcRenderer.invoke('upload:cancel'),
  receiveMessage: (callback) => ipcRenderer.on('output-message', (event, message) => callback(message))
})

console.log('preload loaded')