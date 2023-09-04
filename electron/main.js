const {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} = require("electron");
const path = require("path");
const fs = require("fs");
const express = require('express');
const render = express();
const { shell } = require('electron');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

async function createWindow() {

  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    icon: path.join(__dirname, '../icons/icon.ico'),
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution // turn off remote
      preload: path.join(__dirname, "preload.js") // use a preload script
    }
  });

  // Load app
  win.loadURL("http://localhost:4050/");

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}


app.on("ready", createWindow);

render.set('views', (path.join(__dirname, "../src/")));
render.set('view engine', 'ejs');
render.use(express.static('./'));


render.get('/', (req, res) => {
  res.render('app');
});
// Define routes


// Load configuration from JSON file
let config = {};

console.log('\resources\app.asar\config\config.json');

function loadConfig() {
  try {
    const configFile = fs.readFileSync('\resources\app.asar\config\config.json');
    config = JSON.parse(configFile);
    // Set default value for autoDownloadEnabled if it doesn't exist in the config
  } catch (err) {
    console.error('Error loading config file:', err);
  }
}


// Save configuration to JSON file
function saveConfig() {
  fs.writeFileSync('\resources\app.asar\config\config.json', JSON.stringify(config, null, 2), 'utf-8');
}

// Handle open-folder-dialog event from renderer process
ipcMain.handle('open-folder-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    return folderPath;
  } else {
    return null;
  }
});

// Endpoint to update the folder path
render.put('/folder-path', express.json(), (req, res) => {
  const { folderPath } = req.body;
  config.folderPath = folderPath;

  // Save updated configuration to JSON file
  saveConfig();

  res.json({ success: true });
  console.log('successfully');
});

render.put('/auto-download', express.json(), (req, res) => {
  const { autoDownloadEnabled } = req.body;
  config.autoDownloadEnabled = autoDownloadEnabled;

  // Save updated configuration to JSON file
  saveConfig();

  res.json({ success: true });
  
});

ipcMain.handle('auto-download', async (event, { autoDownloadEnabled }) => {
  try {
    await updateAutoDownloadSetting(autoDownloadEnabled);
    return { success: true };
  } catch (error) {
    console.error('Error updating auto download setting:', error);
    throw error;
  }
});

ipcMain.on('window:minimize', () => {
  win.minimize();
})

ipcMain.handle('window:maximize', () => {
  window.maximize();
})

ipcMain.handle('window:restore', () => {
  window.restore();
})

ipcMain.handle('window:close', () => {
  window.close();
})

// Function to update the auto download setting
async function updateAutoDownloadSetting(autoDownloadEnabled) {
  try {
    // Update the auto download setting in the configuration object
    config.autoDownloadEnabled = autoDownloadEnabled;

    // Save the updated configuration to the JSON file
    saveConfig();

    // Return a success response
    return { success: true };
  } catch (error) {
    // Handle any errors that occur during the update process
    console.error('Error updating auto download setting:', error);
    throw error;
  }
}

// Load the initial configuration
loadConfig();

// Handle file download request from the renderer process
ipcMain.on('download-file', async (event, fileData) => {
  const { fileName, imageDataURL } = fileData;
  const savePath = path.join(config.folderPath, fileName);

  try {
    const buffer = Buffer.from(imageDataURL.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    fs.writeFileSync(savePath, buffer);
    console.log('File downloaded successfully.');

    event.reply('download-file-complete', null); // Send success response to the renderer process
  } catch (error) {
    console.error('Error downloading file:', error);

    event.reply('download-file-complete', error.message); // Send error response to the renderer process
  }
});

function readAutoDownloadSetting() {
  // Read the configuration from the config.json file
  const configData = fs.readFileSync('\resources\app.asar\config\config.json', 'utf-8');
  const config = JSON.parse(configData);

  // Return the autoDownloadEnabled value
  return config.autoDownloadEnabled;
}

ipcMain.handle('getAutoDownloadSetting', (event) => {
  // Read the autoDownloadEnabled value from storage (e.g., config.json)
  const autoDownloadEnabled = readAutoDownloadSetting();

  // Return the value to the renderer process
  return autoDownloadEnabled;
});

ipcMain.handle('getFolderPath', () => {
  return config.folderPath;
});



// Start the server
const port = 4050;
 // Choose the desired port number
render.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

