var convert = {
  // (A) PROPERTIES
  hFiles: null, // html file picker
  hFormat: null, // html format select
  hCanvas: null, // html canvas
  ctx: null, // canvas context

  // (B) INIT
  init: function () {
    // (B1) GET HTML ELEMENTS
    convert.hFiles = document.getElementById("file");
    convert.hFormat = document.getElementById("format");
    convert.hCanvas = document.getElementById("canvas");
    convert.ctx = convert.hCanvas.getContext("2d");
    convert.fileContainer = document.getElementById("filecontainer");

    // (B2) LISTEN TO FILE PICKER
    convert.hFiles.addEventListener("change", convert.read);
  },

  // (C) READ SELECTED IMAGE
  read: function () {
    for (var i = 0; i < convert.hFiles.files.length; i++) {
      var file = convert.hFiles.files[i];
      var progressBar = convert.createProgressBar(file);
      convert.readFile(file, progressBar);
    }
  },

  // (D) READ FILE
  readFile: function (file, progressBar) {
    var reader = new FileReader();
    reader.onload = function () {
      convert.draw(reader.result, file, progressBar);
    };
    reader.onprogress = function (event) {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        progressBar.style.width = percentComplete + "%";
      }
    };
    reader.readAsDataURL(file);
  },

  // (E) DRAW SELECTED IMAGE ON CANVAS
  draw: function (result, file, progressBar) {
    let img = new Image();
    img.onload = () => {
      convert.hCanvas.width = img.width;
      convert.hCanvas.height = img.height;
      convert.ctx.drawImage(img, 0, 0);
      convert.go(file, progressBar);
    };
    img.src = result;
  },

  // (F) CONVERT & "FORCE DOWNLOAD"
  go: function (file, progressBar) {
    let f = convert.hFormat.value;
    let fn = file.name.split(".")[0];
    const imageDataURL = convert.hCanvas.toDataURL(`image/${f}`);
    if (f === "jpeg") {
      f = "jpg";
    }
    const fileName = `${fn}.${f}`;
  
    if (autoDownloadCheckbox.checked === true) {
      // Perform automatic download without showing the save window
      electronAPI.downloadFile({ fileName, imageDataURL })
        .then(() => {
          // Update the state element when the download is complete
          const stateIcon = progressBar.parentNode.querySelector(".state .material-icons-round");
          stateIcon.innerHTML = "done_all";
        })
        .catch((error) => {
          console.error('Error downloading file:', error);
        });
    } else {
      // Show the save window for manual download
      const a = document.createElement("a");
      a.href = imageDataURL;
      a.download = fileName;
      a.click();
      a.remove();
  
      // Update the state element when the download is complete
      const stateIcon = progressBar.parentNode.querySelector(".state .material-icons-round");
      stateIcon.innerHTML = "done_all";
    }
  },
  

  // (G) CREATE PROGRESS BAR
  createProgressBar: function (file) {
    var uploading = document.createElement("div");
    uploading.className = "uploading";

    var name = document.createElement("div");
    name.className = "name";
    name.innerHTML = '<p>' + file.name.split(".")[0] + '</p>';

    var progressBar = document.createElement("div");
    progressBar.id = "progressbar";

    var state = document.createElement("div");
    state.className = "state";
    state.innerHTML = '<span class="material-icons-round">close</span>';

    var separator = document.createElement("div");
    separator.className = "separator";
    separator.innerHTML =
      '<span class="material-icons-round">minimize</span>';

    var download = document.createElement("div");
    download.className = "download";
    download.innerHTML =
      '<span class="material-icons">sim_card_download</span>';

    uploading.appendChild(name);
    uploading.appendChild(progressBar);
    uploading.appendChild(state);
    uploading.appendChild(separator);
    uploading.appendChild(download);
    convert.fileContainer.prepend(uploading);

    return progressBar;
  },
};

window.addEventListener("load", convert.init);

// Settings button //

const dialogContainer = document.getElementById('settings');
const settingsBtn = document.querySelector('.settingsbtn');
const mask = document.querySelector('.mask');
const closesettingsBtn = document.getElementById('close-settings');

settingsBtn.addEventListener('click', () => {
  dialogContainer.classList.add('active');
  mask.classList.add('active');
  document.addEventListener('click', handleClickOutsideDialog);
});

const handleClickOutsideDialog = (event) => {
  if (!dialogContainer.contains(event.target) && !settingsBtn.contains(event.target)) {
    dialogContainer.classList.remove('active');
    mask.classList.remove('active');
    document.removeEventListener('click', handleClickOutsideDialog);
  }
};

settingsBtn.addEventListener('click', (event) => {
  event.stopPropagation();
});

closesettingsBtn.addEventListener('click', () => {
  dialogContainer.classList.remove('active');
  mask.classList.remove('active');
});

// Folder path button

function handleButtonClick() {
  electronAPI.selectFolderPath()
    .then((folderPath) => {
      if (folderPath) {
        updateFolderPath(folderPath);
        folderPathElement.textContent = folderPath;
      }
    })
    .catch((error) => {
      console.error('Error selecting folder path:', error);
    });
}

// Add event listener to button
document.querySelector('.location').addEventListener('click', handleButtonClick);
const folderPathElement = document.getElementById('folderPath');

electronAPI.getFolderPath()
  .then((folderPath) => {
    folderPathElement.textContent = folderPath;
  })
  .catch((error) => {
    // Handle any errors that occur while retrieving the folderPath value
    console.error('Error retrieving folder path:', error);
  });

// Function to update the folder path
async function updateFolderPath(newPath) {
  try {
    const response = await fetch('/folder-path', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderPath: newPath })
    });
    autoDownloadCheckbox.disabled = !folderPath;
    errormsg.textContent = '';
    if (response.ok) {
      console.log('Folder path updated successfully');
    } else {
      console.error('Error updating folder path:', response.statusText);
    }
  } catch (error) {
    console.error('Error updating folder path:', error);
  }
}

// Function to update the checkbox state based on the folder path availability
async function updateCheckboxState() {
  const autoDownloadCheckbox = document.querySelector('#autoDownloadCheckbox');
  const folderPath = await electronAPI.getFolderPath(); // Assuming this function retrieves the folder path
  let errormsg = document.getElementById('errormsg');
  // Enable/disable the checkbox based on the folder path availability
  autoDownloadCheckbox.disabled = !folderPath;
  if (!folderPath) {
    errormsg.textContent = 'Please select a download folder to enable auto download';
  }
}

// Update the checkbox state initially when the page loads
updateCheckboxState();

// Event listener for the checkbox change event
const autoDownloadCheckbox = document.querySelector('#autoDownloadCheckbox');
  autoDownloadCheckbox.addEventListener('change', () => {
  const autoDownloadEnabled = autoDownloadCheckbox.checked;
  updateAutoDownloadSetting(autoDownloadEnabled);
});

// Function to update the auto download setting
async function updateAutoDownloadSetting(autoDownloadEnabled) {
  try {
    await electronAPI.updateAutoDownloadSetting(autoDownloadEnabled);
    console.log('Auto download setting updated successfully');
  } catch (error) {
    console.error('Error updating auto download setting:', error);
  }
}

electronAPI.getAutoDownloadSetting()
  .then((autoDownloadEnabled) => {
    // Handle the autoDownloadEnabled value
    // Set the checkbox state or perform any other actions based on the value
    autoDownloadCheckbox.checked = autoDownloadEnabled;
  })
  
  .catch((error) => {
    console.error('Error retrieving autoDownloadEnabled value:', error);
  });


var myDrop = document.querySelector('.mask');
var inputFile = document.getElementById('file');

function displayDropZone() {
   myDrop.classList.add('drop')
}
function hideDropZone() {
  myDrop.classList.remove('drop')
}
function allowDrag(ev) {
   if (true) {
      ev.dataTransfer.dropEffect = 'copy';
      ev.preventDefault();
   }
}
function handleDrop(ev) {
   ev.preventDefault();
   hideDropZone();
   
   var files = ev.dataTransfer.files;

   if (files.length > 0) {
     // Update the value of the input element
     inputFile.files = files;
 
     // Trigger the change event
     inputFile.dispatchEvent(new Event('change'));
   }
}
window.addEventListener('dragenter', function(ev) {
   displayDropZone();
});
myDrop.addEventListener('dragenter', allowDrag);
myDrop.addEventListener('dragover', allowDrag);
myDrop.addEventListener('dragleave', function(e) {
   hideDropZone();
});
myDrop.addEventListener('drop', handleDrop);

document.getElementById('minimize').addEventListener('click', () => {
  electronAPI.send('window:minimize');
});
