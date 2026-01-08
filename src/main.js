const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const { functionRegistry } = require('./functionRegistry');
const FunctionOrchestrator = require('./functionOrchestrator');
const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const { spawn } = require('child_process');

// Initialize function orchestrator
const orchestrator = new FunctionOrchestrator(functionRegistry);

let mainWindow = null;
let modelServer = null;
let pythonProcess = null;
let modelReady = false;

// Start Python inference server for custom model
function startPythonInferenceServer() {
  const isDev = !app.isPackaged;
  const scriptPath = isDev
    ? path.join(__dirname, '..', 'model-training', 'inference_server.py')
    : path.join(process.resourcesPath, 'model-training', 'inference_server.py');
  
  console.log('Starting Python inference server...');
  pythonProcess = spawn('python3', [scriptPath], {
    cwd: path.dirname(scriptPath)
  });
  
  pythonProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          if (message.status === 'ready') {
            modelReady = true;
            console.log('✓ Custom intent classifier model loaded');
          } else if (message.status === 'loading') {
            console.log('Loading custom model...');
          } else if (message.status === 'error') {
            console.error('Python model error:', message.message);
          }
        } catch (e) {
          console.log('Python output:', line);
        }
      }
    });
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error('Python stderr:', data.toString());
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`Python inference server exited with code ${code}`);
    modelReady = false;
  });
}

// IPC handler for intent classification using custom model
ipcMain.handle('classify-intent', async (event, text) => {
  if (!modelReady || !pythonProcess) {
    return {
      error: 'Model not ready',
      fallback: true
    };
  }
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ error: 'Classification timeout', fallback: true });
    }, 5000);
    
    const responseHandler = (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.status === 'success') {
              clearTimeout(timeout);
              pythonProcess.stdout.removeListener('data', responseHandler);
              resolve({ results: response.results });
            } else if (response.status === 'error') {
              clearTimeout(timeout);
              pythonProcess.stdout.removeListener('data', responseHandler);
              resolve({ error: response.message, fallback: true });
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });
    };
    
    pythonProcess.stdout.on('data', responseHandler);
    pythonProcess.stdin.write(JSON.stringify({ text }) + '\n');
  });
});

// Start local HTTP server for model files
function startModelServer() {
  const modelApp = express();
  modelApp.use(cors());
  
  // In production (packaged), models are in extraResources
  // In development, models are in ./models/
  const isDev = !app.isPackaged;
  const modelsPath = isDev 
    ? path.join(__dirname, '..', 'models')
    : path.join(process.resourcesPath, 'models');
  
  modelApp.use('/models', express.static(modelsPath));
  
  modelServer = modelApp.listen(config.modelServer.port, config.modelServer.host, () => {
    console.log(`Model server running on ${config.modelServer.url}`);
    console.log('Models path:', modelsPath);
    console.log('Mode:', isDev ? 'Development' : 'Production');
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: config.app.window.width,
    height: config.app.window.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allow loading local ES modules
    }
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  
  // Store reference for cleanup
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handler to get function registry
ipcMain.handle('get-function-registry', async () => {
  try {
    // Return just the function names and metadata, not the handlers
    const registry = {};
    for (const [name, func] of Object.entries(functionRegistry)) {
      registry[name] = {
        name: func.name,
        description: func.description,
        category: func.category
      };
    }
    return registry;
  } catch (error) {
    console.error('Error getting function registry:', error);
    return {};
  }
});

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

app.whenReady().then(() => {
  startModelServer();
  startPythonInferenceServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (modelServer) {
    modelServer.close();
  }
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
