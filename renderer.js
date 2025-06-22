includeHTML('_title.html', 'title-placeholder');

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
  let originalUploadTextContent;
  if (uploadButton) {
    originalUploadTextContent = uploadButton.textContent
    uploadButton.addEventListener('click', async () => {
      const isDryRun = document.getElementById('dry-run').checked;
      console.log(isDryRun)
      const isAlbum = document.getElementById('album').checked;
      //const isRecursive = document.getElementById('recursive').checked; Disable temporarily
      const isRecursive = false;
      let isCancel = false;
      if (uploadButton.textContent === 'Cancel') {
        isCancel = true
        console.log(`Cancel Called`)
      }
      await window.immich.upload(isDryRun, isAlbum, isRecursive, isCancel);
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
      if (typeof message === 'number') { // message is exitCode number
        uploadComplete(uploadButton, originalUploadTextContent, message)
      } else {
        console.log(`Received Message: ${message}`)
        window.term.write(message)
        uploadButton.textContent = 'Cancel'
      }
    })
  }
});

function uploadComplete(button, textContent, exitCode) {
  switch (exitCode) {
    case 0:
      console.log(`Upload Completed Successfully! exitCode: ${exitCode}`)
      window.term.write(`Completed!`)
      break;
    case 1:
      console.log(`Upload Failed! exitCode: ${exitCode}`)
      window.term.write(`Failed!`)
      break;
  }
  button.textContent = textContent
}

// Function to load fixed content into a placeholder in html files
function includeHTML(filePath, placeholderId) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            document.getElementById(placeholderId).innerHTML = data;
        })
        .catch(error => {
            console.error('Error fetching HTML:', error);
            document.getElementById(placeholderId).innerHTML = `<p style="color:red;">Could not load ${filePath}</p>`;
        });
}

console.log("renderer.js Loaded")