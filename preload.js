const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPageText: () => ipcRenderer.invoke('get-page-text'),
  
  // Function calling API
  executeFunction: (userInput) => ipcRenderer.invoke('execute-function', userInput),
  
  // Listen for function execution results
  onFunctionResult: (callback) => ipcRenderer.on('function-result', callback)
});

