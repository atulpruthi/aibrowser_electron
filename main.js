const { app, BrowserWindow, ipcMain } = require('electron');
const { functionRegistry } = require('./functionRegistry');
const FunctionOrchestrator = require('./functionOrchestrator');

// Initialize function orchestrator
const orchestrator = new FunctionOrchestrator(functionRegistry);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: __dirname + '/preload.js',
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.loadFile('renderer/index.html');
  
  // Store reference for cleanup
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handler for function execution
ipcMain.handle('execute-function', async (event, userInput) => {
  try {
    console.log('Received function request:', userInput);
    
    // Note: Context will be passed from renderer, but function execution
    // happens in renderer process since it needs access to webviews
    // Main process just coordinates
    
    // For now, send back to renderer for execution
    return {
      success: true,
      shouldExecuteInRenderer: true,
      userInput: userInput
    };
  } catch (error) {
    console.error('Function execution error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
