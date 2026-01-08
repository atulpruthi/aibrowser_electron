const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPageText: () => ipcRenderer.invoke('get-page-text'),
  
  // Function calling API
  executeFunction: (userInput) => ipcRenderer.invoke('execute-function', userInput),
  
  // Get function registry from main process
  getFunctionRegistry: () => ipcRenderer.invoke('get-function-registry'),
  
  // Custom model intent classification
  classifyIntent: (text) => ipcRenderer.invoke('classify-intent', text),
  
  // Listen for function execution results
  onFunctionResult: (callback) => ipcRenderer.on('function-result', callback)
});

