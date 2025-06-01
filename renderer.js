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
      const isRecursive = document.getElementById('recursive').checked;
      const isUpload = await window.immich.upload(isDryRun, isAlbum, isRecursive);
    });
  }

  const pathButton = document.getElementById('file-folder-selection-button')
  const outputPathField = document.getElementById('output-path-field')
  if (pathButton) {
    pathButton.addEventListener('click', async () => {
      const fileFolderPath = await window.openDialog.file_folder();
      outputPathField.value = fileFolderPath;
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