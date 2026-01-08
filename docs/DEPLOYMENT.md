# AI Browser - Deployment Guide

## Standalone Installation Package

Your AI browser can be packaged as a standalone installer that includes:
- ✅ Electron app executable
- ✅ Embedded HTTP server (localhost:3737)
- ✅ AI models (intent-classifier)
- ✅ All dependencies (node_modules)
- ✅ No external requirements

Users simply download and run the installer - no server setup needed!

## Setup: Install electron-builder

```bash
npm install --save-dev electron-builder
```

## Update package.json

Add build configuration:

```json
{
  "name": "ai-browser",
  "version": "1.0.0",
  "description": "AI-powered browser with intelligent navigation",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:mac": "electron-builder --mac",
    "build:win": "electron-builder --win",
    "build:linux": "electron-builder --linux",
    "build:all": "electron-builder -mwl"
  },
  "build": {
    "appId": "com.aibrowser.app",
    "productName": "AI Browser",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!**/*.py",
      "!**/*.md",
      "!dist",
      "!node_modules/@xenova/transformers/.cache/**"
    ],
    "extraResources": [
      {
        "from": "models/intent-classifier",
        "to": "models/intent-classifier"
      }
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "icon": "build/icon.icns",
      "target": [
        "dmg",
        "zip"
      ]
    },
    "win": {
      "icon": "build/icon.ico",
      "target": [
        "nsis",
        "portable"
      ]
    },
    "linux": {
      "icon": "build/icon.png",
      "target": [
        "AppImage",
        "deb"
      ],
      "category": "Network"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  },
  "keywords": ["browser", "ai", "electron"],
  "author": "Your Name",
  "license": "ISC",
  "devDependencies": {
    "electron": "^39.2.7",
    "electron-builder": "^24.13.3"
  },
  "dependencies": {
    "@xenova/transformers": "^2.17.2",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

## Update main.js for Production

The models need to load from the correct path in production:

```javascript
const path = require('path');
const isDev = !app.isPackaged;

function startModelServer() {
  const modelApp = express();
  modelApp.use(cors());
  
  // In production, models are in app.asar or extraResources
  const modelsPath = isDev 
    ? path.join(__dirname, 'models')
    : path.join(process.resourcesPath, 'models');
  
  modelApp.use('/models', express.static(modelsPath));
  
  modelServer = modelApp.listen(3737, () => {
    console.log('Model server running on http://localhost:3737');
    console.log('Models path:', modelsPath);
  });
}
```

## Build Commands

### For macOS (creates .dmg and .zip)
```bash
npm run build:mac
```

Output: `dist/AI Browser-1.0.0.dmg`

### For Windows (creates installer and portable)
```bash
npm run build:win
```

Output: 
- `dist/AI Browser Setup 1.0.0.exe` (installer)
- `dist/AI Browser 1.0.0.exe` (portable)

### For Linux (creates AppImage and .deb)
```bash
npm run build:linux
```

Output:
- `dist/AI Browser-1.0.0.AppImage`
- `dist/ai-browser_1.0.0_amd64.deb`

### For All Platforms
```bash
npm run build:all
```

## What Gets Bundled

Your standalone installer includes:

1. **Application Code**
   - main.js, renderer/, preload.js
   - aiModelManager.js, functionOrchestrator.js
   - All JavaScript files

2. **Embedded Server**
   - Express server (auto-starts on port 3737)
   - CORS middleware
   - Serves models locally

3. **AI Models** (in extraResources)
   - models/intent-classifier/model.safetensors (128 MB)
   - tokenizer files
   - config.json

4. **Dependencies**
   - @xenova/transformers
   - express, cors
   - Electron runtime

5. **NOT Included**
   - Python files (.py)
   - Training scripts
   - Documentation (.md)
   - Development files

## How Users Install

### macOS
1. Download `AI Browser-1.0.0.dmg`
2. Double-click to open
3. Drag app to Applications folder
4. Launch from Applications
5. Server starts automatically on localhost:3737

### Windows
1. Download `AI Browser Setup 1.0.0.exe`
2. Run installer
3. Choose installation directory
4. Launch from Start Menu or Desktop
5. Server starts automatically on localhost:3737

### Linux
1. Download `AI Browser-1.0.0.AppImage`
2. Make executable: `chmod +x AI\ Browser-1.0.0.AppImage`
3. Run: `./AI\ Browser-1.0.0.AppImage`
4. Server starts automatically on localhost:3737

## Size Estimates

- **Base App**: ~150 MB (Electron + dependencies)
- **AI Model**: ~128 MB (quantized intent classifier)
- **Total Size**: ~280-300 MB (compressed DMG/installer: ~200 MB)

## Auto-Update Support

Add auto-update capability (optional):

```bash
npm install electron-updater
```

In main.js:
```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

Requires publishing releases to GitHub or update server.

## Code Signing (Recommended)

### macOS
```bash
# Sign the app
npm run build:mac -- --mac --sign

# Notarize for macOS Gatekeeper
# Requires Apple Developer account
```

### Windows
```bash
# Sign with certificate
npm run build:win -- --win --sign
```

Without signing:
- macOS: Users see "unidentified developer" warning
- Windows: SmartScreen may warn users

## Distribution

1. **Direct Download**
   - Host installers on your website
   - Users download and install

2. **GitHub Releases**
   - Upload to GitHub releases
   - Users download from GitHub

3. **App Stores** (requires more setup)
   - Mac App Store (requires review)
   - Microsoft Store (requires review)
   - Snap Store (Linux)

## Testing the Build

Before distributing:

```bash
# Build for your platform
npm run build:mac  # or build:win, build:linux

# Find the app in dist/
cd dist

# macOS: Open the .dmg and test
open "AI Browser-1.0.0.dmg"

# Windows: Run the installer
# "AI Browser Setup 1.0.0.exe"

# Linux: Run the AppImage
chmod +x AI\ Browser-1.0.0.AppImage
./AI\ Browser-1.0.0.AppImage
```

Test checklist:
- ✅ App launches successfully
- ✅ Model loads from localhost:3737
- ✅ Intent classification works
- ✅ No errors in console
- ✅ Browser functions work

## Environment Variables

The app automatically detects:
- **Development**: `npm start` - loads from `./models/`
- **Production**: Packaged app - loads from `process.resourcesPath/models/`

No configuration needed by users!

## Troubleshooting

### Build fails with "Cannot find module"
- Run `npm install` before building
- Check that all imports are correct

### Models not found in production
- Verify `extraResources` in package.json
- Check `process.resourcesPath` path in logs

### App won't start on macOS
- May need code signing
- User needs to right-click → Open first time

### Large file size
- Models are 128 MB - expected
- Consider compressing in installer (NSIS/DMG does this automatically)

### Port 3737 already in use
- App checks and uses next available port
- Update code to handle this gracefully

## Summary

Your AI browser will be a **completely standalone application**:

✅ **Users install like any normal app**
- No Python installation required
- No server setup needed
- No command line usage

✅ **Localhost server is embedded**
- Automatically starts with the app
- Runs on port 3737 (or next available)
- Serves AI models locally

✅ **Models are bundled**
- Intent classifier included in app
- No downloads at runtime
- Works offline after first launch

✅ **Cross-platform**
- macOS: .dmg installer
- Windows: .exe installer
- Linux: AppImage, .deb

Ready to package? Run:
```bash
npm install --save-dev electron-builder
npm run build:mac  # or build:win, build:linux
```
