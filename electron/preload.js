const { contextBridge, ipcRenderer } = require('electron');

// White-listed channels.
const ipc = {
  'render': {
      // From render to main.
      'send': [
          'window:minimize', // Channel names
          'window:maximize',
          'window:restore',
          'window:close'
      ],
      // From main to render.
      'receive': [],
      // From render to main and back again.
      'sendReceive': []
  }
};

// Expose the `selectFolderPath` function to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolderPath: async () => {
    const result = await ipcRenderer.invoke('open-folder-dialog');
    return result;
  },
  downloadFile: async (fileUrl) => {
    ipcRenderer.send('download-file', fileUrl);
  },
  'ipcRenderer': ipcRenderer,
  downloadFile: async (fileData) => {
    ipcRenderer.send('download-file', fileData);
    return new Promise((resolve, reject) => {
      ipcRenderer.once('download-file-complete', (event, error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
  getAutoDownloadSetting: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.invoke('getAutoDownloadSetting')
        .then((autoDownloadEnabled) => {
          resolve(autoDownloadEnabled);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  updateAutoDownloadSetting: async (autoDownloadEnabled) => {
    await ipcRenderer.invoke('auto-download', { autoDownloadEnabled });
  },
  getFolderPath: async () => {
    try {
      const folderPath = await ipcRenderer.invoke('getFolderPath');
      return folderPath;
    } catch (error) {
      console.error('Error retrieving folder path:', error);
      throw error;
    }
    
  },
  send: (channel, args) => {
    let validChannels = ipc.render.send;
    if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, args);
    }
},
// From main to render.
receive: (channel, listener) => {
    let validChannels = ipc.render.receive;
    if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`.
        ipcRenderer.on(channel, (event, ...args) => listener(...args));
    }
},
// From render to main and back again.
invoke: (channel, args) => {
    let validChannels = ipc.render.sendReceive;
    if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, args);
    }
  }
});