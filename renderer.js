document.addEventListener('DOMContentLoaded', () => {
  const connectButton = document.getElementById('connect-immich');
  if (connectButton) {
    connectButton.addEventListener('click', async () => {
      const url = document.getElementById('immich-url').value;
      const key = document.getElementById('immich-api-key').value;
      const isLogin = await window.immich.login(url, key);
    });
  }

  const uploadButton = document.getElementById('immich-upload')
  if (uploadButton) {
    uploadButton.addEventListener('click', async () => {
      const isDryRun = document.getElementById('dry-run').checked;
      console.log(isDryRun)
      const isAlbum = document.getElementById('album').checked;
      //const isRecursive = document.getElementById('recursive').checked; Disable temporarily
      const isRecursive = false;
      const isUpload = await window.immich.upload(isDryRun, isAlbum, isRecursive);
    });
  }

  const filePathButton = document.getElementById('file-selection-button')
  const folderPathButton = document.getElementById('folder-selection-button')
  const outputPathField = document.getElementById('output-path-field')
  if (filePathButton && folderPathButton) {
    filePathButton.addEventListener('click', async () => {
      const filePath = await window.openDialog.file();
      outputPathField.value = filePath;
    })
    folderPathButton.addEventListener('click', async () => {
      const folderPath = await window.openDialog.folder();
      outputPathField.value = folderPath;
    })
  }
  
  const terminalField = document.getElementById('terminal')
  if (terminalField) {
    window.immich.receiveMessage((message) => {
    console.log(`This is the Message for Frontend Temrinal Output: ${message}`)
    window.term.write(message)
  })
  }
});

console.log("renderer.js Loaded")