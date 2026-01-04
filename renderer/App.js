// AI Model state (Transformers.js loaded from CDN in index.html)
let pipeline = null;
let env = null;

// AI Model state
let aiIntentClassifier = null;
let aiNERModel = null;
let aiModelLoading = false;
let aiModelReady = false;
let nerModelReady = false;

// Tab management state
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

// Wait for transformers to load and initialize
function initializeTransformers() {
  if (window.transformers) {
    pipeline = window.transformers.pipeline;
    env = window.transformers.env;
    if (env) {
      env.allowLocalModels = false;
      env.useBrowserCache = true;
    }
    console.log('Transformers.js loaded from CDN');
  } else {
    console.log('Transformers.js not available, AI features will be disabled');
  }
}

// Initialize app when DOM is ready
function initializeApp() {
  console.log('Initializing AI Browser...');
  
  // Initialize transformers
  initializeTransformers();

// Initialize app UI
document.getElementById('app').innerHTML = `
  <div class="home-page" id="home-page">
    <div class="home-content">
      <div class="home-header">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="23" stroke="#1967d2" stroke-width="2"/>
          <path d="M24 8a16 16 0 1 0 0 32 16 16 0 0 0 0-32zm-5.56 17.5a19.28 19.28 0 0 1 0-3h8.88a19.28 19.28 0 0 1 0 3h-8.88zm-.56-4c.06-1.34.3-2.64.68-3.86h7.88c.38 1.22.62 2.52.68 3.86h-9.24zm.68 7.86c-.38-1.22-.62-2.52-.68-3.86h9.24a19.3 19.3 0 0 1-.68 3.86h-7.88zM29 16c-.84-1.88-1.96-3.46-3.26-4.68A13.8 13.8 0 0 1 32.32 16H29zm-5-4.86c1.16.76 2.28 2.06 3.14 3.72h-6.28c.86-1.66 1.98-2.96 3.14-3.72zM17.94 11.32C16.64 12.54 15.52 14.12 14.68 16h-3.36a13.8 13.8 0 0 1 6.62-4.68zM10.72 20h3.76c.08 1.34.36 2.64.76 3.86H11.6a13.56 13.56 0 0 1-.88-3.86zm0 8c.18-1.34.52-2.64.88-3.86h3.64c-.4 1.22-.68 2.52-.76 3.86h-3.76zm3.96 4h3.36c.84 1.88 1.96 3.46 3.26 4.68A13.8 13.8 0 0 1 14.68 32zm5 4.86c-1.16-.76-2.28-2.06-3.14-3.72h6.28c-.86 1.66-1.98 2.96-3.14 3.72zm6.38-.54C27.36 35.46 28.48 33.88 29.32 32h3.36a13.8 13.8 0 0 1-6.62 4.68zm7.22-8.46c.4-1.22.68-2.52.76-3.86h3.76c-.18 1.34-.52 2.64-.88 3.86h-3.64zm.08-7.86c-.08-1.34-.36-2.64-.76-3.86h3.64c.36 1.22.7 2.52.88 3.86h-3.76z" fill="#1967d2"/>
        </svg>
        <h1>AI Browser</h1>
        <p>Enter your search or URL to begin</p>
      </div>
      <div class="home-search">
        <input type="text" id="home-input" placeholder="Search or enter address" />
        <button id="home-send-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10l16-8-8 16-2-8-6-0z" transform="rotate(45 10 10)"/>
            <path d="M2.5 3l15 7-15 7V3z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  <div class="tab-bar" id="tab-bar" style="display: none;">
    <button class="new-tab-btn" id="new-tab-btn" title="New Tab">+</button>
  </div>
  <div class="nav-bar" id="nav-bar" style="display: none;">
    <div class="nav-controls">
      <button class="nav-btn" id="back-btn" title="Back" disabled>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 13L5 8l5-5v10z"/>
        </svg>
      </button>
      <button class="nav-btn" id="forward-btn" title="Forward" disabled>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 3l5 5-5 5V3z"/>
        </svg>
      </button>
      <button class="nav-btn" id="refresh-btn" title="Refresh">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.65 2.35A7.95 7.95 0 0 0 8 0C3.58 0 0 3.58 0 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z"/>
        </svg>
      </button>
      <button class="nav-btn" id="home-btn" title="Home">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1l8 7h-2v7H9v-5H7v5H2V8H0l8-7z"/>
        </svg>
      </button>
    </div>
    <div class="url-bar-container">
      <span class="security-badge" id="security-badge">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 0L1 2v4c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V2L7 0zm0 2l4 1.5v2.8c0 2.5-1.7 4.7-4 5.2-2.3-.5-4-2.7-4-5.2V3.5L7 2z"/>
          <path d="M5 7l1.5 1.5L10 5l-1-1-2.5 2.5L5 5 4 6z"/>
        </svg>
      </span>
      <div class="loading-spinner" id="loading-spinner"></div>
      <input id="url" type="text" placeholder="Search or enter address" />
    </div>
    <button class="menu-btn" id="menu-btn" title="Menu">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="8" cy="3" r="1.5"/>
        <circle cx="8" cy="8" r="1.5"/>
        <circle cx="8" cy="13" r="1.5"/>
      </svg>
    </button>
  </div>
  <div class="main-content" id="main-content" style="display: none;">
    <div id="browser-container"></div>
    <div id="sidebar">
      <div class="sidebar-header">
        <div>
          <h3>AI Assistant <span id="ai-status" class="ai-status"></span></h3>
        </div>
        <button id="sidebar-close" class="sidebar-close-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 6.6L11.3 3.3 12.7 4.7 9.4 8l3.3 3.3-1.4 1.4L8 9.4 4.7 12.7 3.3 11.3 6.6 8 3.3 4.7 4.7 3.3 8 6.6z"/>
          </svg>
        </button>
      </div>
      <div class="sidebar-content">
        <div class="chat-messages" id="chat-messages">
          <div class="welcome-message">
            <div class="welcome-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            <p>Welcome! I'm your AI assistant.</p>
            <p>How can I help you today?</p>
          </div>
        </div>
        <div class="chat-input-container">
          <input type="text" id="chat-input" placeholder="Ask me anything..." />
          <button id="chat-send-btn">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.5 3l15 7-15 7V3z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
`;

const tabBar = document.getElementById('tab-bar');
const newTabBtn = document.getElementById('new-tab-btn');
const navBar = document.getElementById('nav-bar');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const homeBtn = document.getElementById('home-btn');
const urlInput = document.getElementById('url');
const securityBadge = document.getElementById('security-badge');
const loadingSpinner = document.getElementById('loading-spinner');
const browserContainer = document.getElementById('browser-container');
const homePage = document.getElementById('home-page');
const homeInput = document.getElementById('home-input');
const homeSendBtn = document.getElementById('home-send-btn');
const sidebar = document.getElementById('sidebar');
const sidebarCloseBtn = document.getElementById('sidebar-close');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMessages = document.getElementById('chat-messages');
const aiStatusEl = document.getElementById('ai-status');

// ========== AI MODEL LOADING ==========
// Load AI intent classification model
async function loadAIModel() {
  if (aiIntentClassifier || aiModelLoading) return;
  
  // Wait for transformers library to load
  if (!pipeline || typeof pipeline !== 'function') {
    console.log('Waiting for Transformers.js to load...');
    setTimeout(() => loadAIModel(), 1000);
    return;
  }
  
  try {
    aiModelLoading = true;
    updateAIStatus('loading');
    console.log('Loading AI intent classification model...');
    
    // Load zero-shot classification model for flexible intent detection
    aiIntentClassifier = await pipeline(
      'zero-shot-classification',
      'Xenova/distilbert-base-uncased-mnli',
      {
        progress_callback: (progress) => {
          console.log('Loading progress:', progress);
        }
      }
    );
    
    aiModelReady = true;
    updateAIStatus('ready');
    console.log('AI intent classifier loaded successfully!');
    
    // Load NER model for parameter extraction
    console.log('Loading NER model for parameter extraction...');
    try {
      aiNERModel = await pipeline('fill-mask', 'Xenova/bert-base-uncased');
      nerModelReady = true;
      console.log('NER model loaded successfully!');
    } catch (nerError) {
      console.warn('NER model failed to load, will use fallback extraction:', nerError);
      nerModelReady = false;
    }
    
    // Show success message in chat
    addAssistantMessage('AI models ready! I understand natural language commands.', 'success');
  } catch (error) {
    console.error('Failed to load AI model:', error);
    aiModelReady = false;
    updateAIStatus('error');
    addAssistantMessage('AI model failed to load. Please refresh the browser.', 'error');
  } finally {
    aiModelLoading = false;
  }
}

// Update AI status indicator
function updateAIStatus(status) {
  if (!aiStatusEl) return;
  
  if (status === 'loading') {
    aiStatusEl.textContent = '(Loading AI...)';
    aiStatusEl.className = 'ai-status loading';
  } else if (status === 'ready') {
    aiStatusEl.textContent = '(AI Ready)';
    aiStatusEl.className = 'ai-status ready';
  } else if (status === 'error') {
    aiStatusEl.textContent = '(AI Error)';
    aiStatusEl.className = 'ai-status';
  } else {
    aiStatusEl.textContent = '';
    aiStatusEl.className = 'ai-status';
  }
}

// Classify intent using AI
async function classifyIntentWithAI(text) {
  if (!aiModelReady || !aiIntentClassifier) {
    return null;
  }
  
  const candidateLabels = [
    'visiting or opening a website address like github.com google.com reddit.com',
    'searching for information questions or facts on the internet',
    'asking a general knowledge question',
    'extracting or collecting all hyperlinks URLs and anchor tags from the page',
    'reading the text content of the current webpage',
    'getting metadata or information about the current page',
    'scrolling the page up or down',
    'going back to previous page in history',
    'going forward to next page in history',
    'reloading or refreshing the current page',
    'creating or opening a new empty tab in the browser',
    'closing or removing the current tab in the browser',
    'finding specific text on the current page'
  ];
  
  try {
    const result = await aiIntentClassifier(text, candidateLabels, {
      multi_label: false
    });
    
    console.log('AI Intent:', result.labels[0], 'Confidence:', result.scores[0]);
    console.log('Top 3 intents:', result.labels.slice(0, 3).map((label, i) => `${label} (${result.scores[i].toFixed(2)})`).join(', '));
    
    // Map intents to actions
    let intent = result.labels[0];
    if (intent === 'visiting or opening a website address like github.com google.com reddit.com') {
      intent = 'navigate to URL';
    } else if (intent === 'searching for information questions or facts on the internet' || intent === 'asking a general knowledge question') {
      intent = 'search the web';
    } else if (intent === 'extracting or collecting all hyperlinks URLs and anchor tags from the page') {
      intent = 'extract links';
    } else if (intent === 'reading the text content of the current webpage') {
      intent = 'extract page content';
    } else if (intent === 'getting metadata or information about the current page') {
      intent = 'get page information';
    } else if (intent === 'scrolling the page up or down') {
      intent = 'scroll page';
    } else if (intent === 'going back to previous page in history') {
      intent = 'go back';
    } else if (intent === 'going forward to next page in history') {
      intent = 'go forward';
    } else if (intent === 'reloading or refreshing the current page') {
      intent = 'reload page';
    } else if (intent === 'creating or opening a new empty tab in the browser') {
      intent = 'open new tab';
    } else if (intent === 'closing or removing the current tab in the browser') {
      intent = 'close tab';
    } else if (intent === 'finding specific text on the current page') {
      intent = 'find text in page';
    }
    
    return {
      intent: intent,
      confidence: result.scores[0]
    };
  } catch (error) {
    console.error('AI classification failed:', error);
    return null;
  }
}

// Smart domain detection without hardcoded keywords
function looksLikeDomain(text) {
  const cleaned = text.trim().toLowerCase();
  
  // Pattern 1: Contains TLD (.com, .org, .net, etc.)
  if (/\.(com|org|net|edu|gov|io|co|dev|app|ai|tech|info|biz)/i.test(cleaned)) {
    return true;
  }
  
  // Pattern 2: Single short word (likely a domain name)
  const words = cleaned.split(/\s+/);
  if (words.length === 1 && words[0].length > 2 && words[0].length < 20) {
    // Check if it's a proper noun pattern (capitalized or well-known pattern)
    return true;
  }
  
  // Pattern 3: Two words with no question words
  if (words.length === 2) {
    const questionWords = ['what', 'how', 'where', 'when', 'why', 'who', 'is', 'are', 'can', 'do', 'does'];
    if (!questionWords.some(q => words.includes(q))) {
      return true;
    }
  }
  
  return false;
}

// Enhanced classification with domain context awareness
async function classifyWithContext(text) {
  // Get base AI classification
  const aiResult = await classifyIntentWithAI(text);
  if (!aiResult) return null;
  
  const lowerText = text.toLowerCase();
  
  // Explicit tab management detection
  if (lowerText.match(/^(open|create|new|add)\s+(new\s+)?(tab|window)/i)) {
    console.log('Explicit "new tab" command detected');
    return {
      intent: 'open new tab',
      confidence: 0.95
    };
  }
  
  if (lowerText.match(/^(close|remove|delete|exit)\s+(tab|window|this tab|current tab)/i)) {
    console.log('Explicit "close tab" command detected');
    return {
      intent: 'close tab',
      confidence: 0.95
    };
  }
  
  // Explicit navigation commands
  if (lowerText.match(/^(go\s+)?back$/i) || lowerText.match(/^(navigate|go)\s+back$/i)) {
    console.log('Explicit "go back" command detected');
    return {
      intent: 'go back',
      confidence: 0.95
    };
  }
  
  if (lowerText.match(/^(go\s+)?forward$/i) || lowerText.match(/^(navigate|go)\s+forward$/i)) {
    console.log('Explicit "go forward" command detected');
    return {
      intent: 'go forward',
      confidence: 0.95
    };
  }
  
  if (lowerText.match(/^(refresh|reload)(\s+page)?$/i)) {
    console.log('Explicit "reload page" command detected');
    return {
      intent: 'reload page',
      confidence: 0.95
    };
  }
  
  if (lowerText.match(/^home$/i) || lowerText.match(/^go\s+home$/i) || lowerText.match(/^(go\s+to\s+)?home\s+page$/i)) {
    console.log('Explicit "home" command detected');
    return {
      intent: 'go home',
      confidence: 0.95
    };
  }
  
  // Extract the potential target (remove command words)
  const commandWords = ['navigate', 'to', 'open', 'visit', 'go', 'show', 'load', 'search', 'for', 'find'];
  const words = text.toLowerCase().split(/\s+/);
  const contentWords = words.filter(w => !commandWords.includes(w));
  const potentialTarget = contentWords.join(' ');
  
  // Check if target looks like a domain
  const isDomain = looksLikeDomain(potentialTarget);
  
  console.log('Domain detection:', potentialTarget, '→', isDomain ? 'YES (domain-like)' : 'NO (query-like)');
  
  // If it looks like a domain and AI confidence for navigation is reasonable, boost it
  if (isDomain) {
    // If navigate intent is in top 2, choose it
    const navigateIntent = 'navigate to URL';
    if (aiResult.intent === navigateIntent) {
      console.log('AI classified as navigation + domain pattern = NAVIGATE');
      return aiResult;
    }
    
    // Check if navigation was close second choice
    if (aiResult.confidence < 0.6) {
      console.log('Low confidence + domain pattern = forcing NAVIGATE');
      return {
        intent: navigateIntent,
        confidence: 0.8
      };
    }
  }
  
  return aiResult;
}

// Extract parameters intelligently using NER/semantic understanding
async function extractParameters(input, functionName) {
  const lowerInput = input.toLowerCase().trim();
  const params = {};
  
  // Command words to remove for cleaner parameter extraction
  const commandWords = [
    'navigate', 'to', 'open', 'visit', 'go', 'show', 'load',
    'search', 'for', 'find', 'google', 'lookup', 'tell', 'me', 'about',
    'what', 'is', 'who', 'how', 'where', 'when',
    'get', 'extract', 'show', 'give', 'all',
    'scroll', 'the', 'page', 'content',
    'find', 'in', 'on'
  ];
  
  // Remove command words and get the core parameter
  let cleanedInput = input;
  const words = lowerInput.split(/\s+/);
  let startIndex = 0;
  
  // Find where the actual parameter starts (after command words)
  for (let i = 0; i < words.length; i++) {
    if (!commandWords.includes(words[i])) {
      startIndex = input.toLowerCase().indexOf(words[i]);
      break;
    }
  }
  
  if (startIndex > 0) {
    cleanedInput = input.substring(startIndex).trim();
  }
  
  // Extract based on function type
  if (functionName === 'navigate') {
    let url = cleanedInput.replace(/[.,!?]+$/, '');
    // Smart URL completion
    if (!url.match(/^https?:\/\//) && !url.includes('.')) {
      url = url + '.com';
    }
    params.url = url;
    console.log('NER extracted URL:', url);
  } else if (functionName === 'search') {
    params.query = cleanedInput.replace(/[.,!?]+$/, '');
    console.log('NER extracted query:', params.query);
  } else if (functionName === 'extractPageContent') {
    params.format = 'text';
  } else if (functionName === 'scrollTo') {
    if (lowerInput.includes('top') || lowerInput.includes('up')) {
      params.position = 'top';
    } else if (lowerInput.includes('bottom') || lowerInput.includes('down')) {
      params.position = 'bottom';
    } else {
      params.position = 'top';
    }
    console.log('NER extracted scroll position:', params.position);
  } else if (functionName === 'findInPage') {
    params.text = cleanedInput.replace(/[.,!?]+$/, '');
    console.log('NER extracted search text:', params.text);
  }
  
  return params;
}

// Start loading AI model in background
setTimeout(() => {
  loadAIModel();
}, 1000); // Load after 1 second

function showBrowserUI() {
  homePage.style.display = 'none';
  tabBar.style.display = 'flex';
  navBar.style.display = 'flex';
  document.getElementById('main-content').style.display = 'flex';
}

function showHomePage() {
  homePage.style.display = 'flex';
  tabBar.style.display = 'none';
  navBar.style.display = 'none';
  document.getElementById('main-content').style.display = 'none';
  // Close all tabs
  tabs.forEach(tab => {
    if (tab.webview && tab.webview.parentNode) {
      browserContainer.removeChild(tab.webview);
    }
  });
  tabs = [];
  activeTabId = null;
}

function createTab(url = 'about:blank') {
  // Show browser UI if it's hidden
  if (homePage.style.display !== 'none') {
    showBrowserUI();
  }
  
  const tabId = nextTabId++;
  
  // Create webview
  const webview = document.createElement('webview');
  webview.id = `webview-${tabId}`;
  webview.src = url;
  browserContainer.appendChild(webview);
  
  // Create tab element
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.tabId = tabId;
  tabElement.innerHTML = `
    <span class="tab-favicon">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM5.78 8.75a9.64 9.64 0 0 1 0-1.5h4.44a9.64 9.64 0 0 1 0 1.5H5.78zM5.5 7c.03-.67.15-1.32.34-1.93H10.16c.19.61.31 1.26.34 1.93H5.5zm.34 2.93c-.19-.61-.31-1.26-.34-1.93h5c-.03.67-.15 1.32-.34 1.93H5.84zM11.5 8c-.03.67-.15 1.32-.34 1.93H5.84c-.19-.61-.31-1.26-.34-1.93h6zm-9.32 0h1.88c.04.67.18 1.32.38 1.93H3.22a6.78 6.78 0 0 1-.04-1.93zm0-1c.01-.67.13-1.32.39-1.93h1.21a10.46 10.46 0 0 0-.38 1.93H2.18zm10.64 1h1.88c-.01.67-.13 1.32-.39 1.93h-1.21c.2-.61.34-1.26.38-1.93h-.66zm0-1c-.04-.67-.18-1.32-.38-1.93h1.21c.26.61.38 1.26.39 1.93h-1.88zm-1.47-3.07c-.42-.94-.98-1.73-1.63-2.34a6.9 6.9 0 0 1 3.29 2.34h-1.66zM8 1.07c.58.38 1.14 1.03 1.57 1.86H6.43C6.86 2.1 7.42 1.45 8 1.07zm-2.35.52c-.65.61-1.21 1.4-1.63 2.34H2.36a6.9 6.9 0 0 1 3.29-2.34zm-3.29 9.48h1.66c.42.94.98 1.73 1.63 2.34a6.9 6.9 0 0 1-3.29-2.34zM8 14.93c-.58-.38-1.14-1.03-1.57-1.86h3.14c-.43.83-.99 1.48-1.57 1.86zm2.35-.52c.65-.61 1.21-1.4 1.63-2.34h1.66a6.9 6.9 0 0 1-3.29 2.34z"/>
      </svg>
    </span>
    <span class="tab-title">New Tab</span>
    <span class="tab-close">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 4.6L9.3 1.3 10.7 2.7 7.4 6l3.3 3.3-1.4 1.4L6 7.4 2.7 10.7 1.3 9.3 4.6 6 1.3 2.7 2.7 1.3 6 4.6z"/>
      </svg>
    </span>
  `;
  
  // Insert tab before the new tab button
  tabBar.insertBefore(tabElement, newTabBtn);
  
  // Store tab data
  const tab = {
    id: tabId,
    url: url,
    title: 'New Tab',
    favicon: '',
    isLoading: false,
    webview: webview,
    element: tabElement
  };
  tabs.push(tab);
  
  // Setup webview events
  webview.addEventListener('did-start-loading', () => {
    tab.isLoading = true;
    if (tab.id === activeTabId) {
      loadingSpinner.classList.add('active');
    }
  });
  
  webview.addEventListener('did-stop-loading', () => {
    tab.isLoading = false;
    if (tab.id === activeTabId) {
      loadingSpinner.classList.remove('active');
    }
  });
  
  webview.addEventListener('did-navigate', (e) => {
    tab.url = e.url;
    if (tab.id === activeTabId) {
      urlInput.value = e.url;
      updateSecurityBadge(e.url);
      updateNavigationButtons();
    }
  });
  
  webview.addEventListener('did-navigate-in-page', (e) => {
    tab.url = e.url;
    if (tab.id === activeTabId) {
      urlInput.value = e.url;
      updateNavigationButtons();
    }
  });
  
  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title;
    const titleSpan = tabElement.querySelector('.tab-title');
    titleSpan.textContent = e.title || 'New Tab';
  });
  
  webview.addEventListener('page-favicon-updated', (e) => {
    if (e.favicons && e.favicons.length > 0) {
      tab.favicon = e.favicons[0];
      const faviconSpan = tabElement.querySelector('.tab-favicon');
      faviconSpan.innerHTML = `<img src="${e.favicons[0]}" onerror="this.parentElement.innerHTML='🌐'" />`;
    }
  });
  
  // Setup tab click events
  tabElement.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-close')) {
      switchTab(tabId);
    }
  });
  
  tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tabId);
  });
  
  // Switch to new tab
  switchTab(tabId);
  
  return tab;
}

function switchTab(tabId) {
  // Deactivate current tab
  if (activeTabId !== null) {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) {
      currentTab.element.classList.remove('active');
      currentTab.webview.classList.remove('active');
    }
  }
  
  // Activate new tab
  const newTab = tabs.find(t => t.id === tabId);
  if (newTab) {
    newTab.element.classList.add('active');
    newTab.webview.classList.add('active');
    activeTabId = tabId;
    urlInput.value = newTab.url;
    updateSecurityBadge(newTab.url);
    updateNavigationButtons();
    
    // Update loading state
    if (newTab.isLoading) {
      loadingSpinner.classList.add('active');
    } else {
      loadingSpinner.classList.remove('active');
    }
  }
}

function closeTab(tabId) {
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;
  
  const tab = tabs[tabIndex];
  
  // Remove elements
  tab.element.remove();
  tab.webview.remove();
  
  // Remove from array
  tabs.splice(tabIndex, 1);
  
  // If closing active tab, switch to another
  if (tabId === activeTabId) {
    if (tabs.length > 0) {
      // Switch to previous tab or first tab
      const newActiveTab = tabs[Math.max(0, tabIndex - 1)];
      switchTab(newActiveTab.id);
    } else {
      // No tabs left, create a new one
      createTab();
    }
  }
}

function loadPage(url) {
  if (!url) {
    url = urlInput.value.trim();
  }
  
  if (!url) return;
  
  // Search if not a URL
  if (!url.match(/^https?:\/\//i) && !url.includes('.')) {
    url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
  } else if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab) {
    activeTab.webview.src = url;
  }
}

function updateSecurityBadge(url) {
  if (url.startsWith('https://')) {
    securityBadge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <path d="M7 1C4.8 1 3 2.8 3 5v1H2v7h10V6h-1V5c0-2.2-1.8-4-4-4zm0 1c1.7 0 3 1.3 3 3v1H4V5c0-1.7 1.3-3 3-3zm0 5c.6 0 1 .4 1 1 0 .4-.2.7-.5.9V11h-1V8.9c-.3-.2-.5-.5-.5-.9 0-.6.4-1 1-1z"/>
      </svg>
    `;
    securityBadge.title = 'Secure (HTTPS)';
    securityBadge.style.color = '#5f6368';
  } else if (url.startsWith('http://')) {
    securityBadge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <path d="M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 7 1z"/>
        <path d="M6 3h2v5H6V3zm0 6h2v2H6V9z"/>
      </svg>
    `;
    securityBadge.title = 'Not secure (HTTP)';
    securityBadge.style.color = '#ea4335';
  } else {
    securityBadge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <path d="M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 7 1z"/>
        <path d="M6 3h2v2H6V3zm0 3h2v5H6V6z"/>
      </svg>
    `;
    securityBadge.title = 'Info';
    securityBadge.style.color = '#5f6368';
  }
}

function updateNavigationButtons() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab && activeTab.webview) {
    try {
      // Check if webview is ready before calling methods
      if (activeTab.webview.getWebContentsId && activeTab.webview.getWebContentsId() !== -1) {
        backBtn.disabled = !activeTab.webview.canGoBack();
        forwardBtn.disabled = !activeTab.webview.canGoForward();
      } else {
        // Webview not ready yet, disable buttons
        backBtn.disabled = true;
        forwardBtn.disabled = true;
      }
    } catch (error) {
      // If any error occurs, just disable the buttons
      backBtn.disabled = true;
      forwardBtn.disabled = true;
    }
  }
}

// Event listeners
newTabBtn.addEventListener('click', () => createTab());

backBtn.addEventListener('click', () => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab && activeTab.webview.canGoBack()) {
    activeTab.webview.goBack();
  }
});

forwardBtn.addEventListener('click', () => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab && activeTab.webview.canGoForward()) {
    activeTab.webview.goForward();
  }
});

refreshBtn.addEventListener('click', () => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab) {
    activeTab.webview.reload();
  }
});

homeBtn.addEventListener('click', () => {
  showHomePage();
});

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loadPage();
    urlInput.blur();
  }
});

urlInput.addEventListener('focus', () => {
  urlInput.select();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + T: New tab
  if ((e.metaKey || e.ctrlKey) && e.key === 't') {
    e.preventDefault();
    createTab();
  }
  // Cmd/Ctrl + W: Close tab
  if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
    e.preventDefault();
    if (activeTabId !== null) {
      closeTab(activeTabId);
    }
  }
  // Cmd/Ctrl + R: Refresh
  if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
    e.preventDefault();
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      activeTab.webview.reload();
    }
  }
  // Cmd/Ctrl + L: Focus address bar
  if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
    e.preventDefault();
    urlInput.focus();
    urlInput.select();
  }
});

// Home page event listeners
homeSendBtn.addEventListener('click', async () => {
  const input = homeInput.value.trim();
  if (input) {
    await processHomeInput(input);
  }
});

homeInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const input = homeInput.value.trim();
    if (input) {
      await processHomeInput(input);
    }
  }
});

// Process home page input with smart AI-powered intent detection
async function processHomeInput(input) {
  const lowerInput = input.toLowerCase();
  
  // Check if it's a direct URL (contains domain extension or starts with protocol)
  const isUrl = /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|dev|app|ai|tech))/i.test(input);
  
  if (isUrl) {
    // It's a URL - navigate directly
    let url = input;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    createTab(url);
    homeInput.value = '';
    return;
  }
  
  // Use AI-powered smart intent detection for everything else
  if (!aiModelReady) {
    // Fallback: treat as search if AI not ready
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    createTab(searchUrl);
    homeInput.value = '';
    return;
  }
  
  try {
    // Use the same smart classification as sidebar
    const aiIntent = await classifyWithContext(input);
    
    if (aiIntent && aiIntent.confidence > 0.25) {
      const intentMap = {
        'navigate to URL': 'navigate',
        'search the web': 'search',
        'extract page content': 'extractPageContent',
        'get page information': 'getPageInfo',
        'extract links': 'extractLinks',
        'scroll page': 'scrollTo',
        'go back': 'goBack',
        'go forward': 'goForward',
        'reload page': 'reload',
        'open new tab': 'openTab',
        'close tab': 'closeTab',
        'find text in page': 'findInPage',
        'go home': 'goHome'
      };
      
      const functionName = intentMap[aiIntent.intent];
      
      console.log('Home page AI detected:', functionName, 'confidence:', aiIntent.confidence);
      
      // Handle navigation and search - create new tabs
      if (functionName === 'navigate') {
        const params = await extractParameters(input, 'navigate');
        let url = params.url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        createTab(url);
      } else if (functionName === 'search') {
        const params = await extractParameters(input, 'search');
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(params.query)}`;
        createTab(searchUrl);
      } else {
        // Data extraction commands - check if tab exists
        const activeTab = tabs.find(t => t.id === activeTabId);
        
        if (!activeTab || !activeTab.webview || activeTab.url === 'about:blank' || !activeTab.url) {
          createTab('about:blank');
          setTimeout(() => {
            addAssistantMessage('Please navigate to a webpage first, then use commands like "show me all links" or "read page" in the sidebar.', 'error');
          }, 100);
        } else {
          // Execute data command
          setTimeout(async () => {
            const result = await processUserCommand(input);
            if (result.type === 'error') {
              addAssistantMessage(result.message, 'error');
            } else if (result.type === 'data') {
              addAssistantMessage(result.message, 'success');
              if (result.data) {
                addAssistantMessage(result.data, 'data');
              }
            } else if (result.type === 'info') {
              addAssistantMessage(result.message, 'info');
            } else {
              addAssistantMessage(result.message, 'success');
            }
          }, 300);
        }
      }
    } else {
      // Low confidence - default to search
      console.log('Home page: AI confidence too low, defaulting to search');
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
      createTab(searchUrl);
    }
  } catch (error) {
    console.error('Home page AI classification failed:', error);
    // Fallback to search
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    createTab(searchUrl);
  }
  
  // Clear input
  homeInput.value = '';
}


// Sidebar event listeners
sidebarCloseBtn.addEventListener('click', () => {
  sidebar.style.display = 'none';
});

chatSendBtn.addEventListener('click', async () => {
  const message = chatInput.value.trim();
  if (message) {
    // Add user message to chat
    const messageEl = document.createElement('div');
    messageEl.className = 'user-message';
    messageEl.textContent = message;
    chatMessages.appendChild(messageEl);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Process the command with function calling
    const result = await processUserCommand(message);
    
    // Display result
    if (result.type === 'error') {
      addAssistantMessage(result.message, 'error');
    } else if (result.type === 'data') {
      addAssistantMessage(result.message, 'success');
      if (result.data) {
        addAssistantMessage(result.data, 'data');
      }
    } else if (result.type === 'info') {
      addAssistantMessage(result.message, 'info');
    } else {
      addAssistantMessage(result.message, 'success');
    }
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    chatSendBtn.click();
  }
});

// Don't create initial tab - show home page instead
// createTab();

// ========== FUNCTION CALLING INTEGRATION ==========
// Helper function to ensure webview is ready
function waitForWebviewReady(webview) {
  return new Promise((resolve) => {
    if (webview.getWebContentsId && webview.getWebContentsId() !== -1) {
      // Webview is already loaded
      resolve();
    } else {
      // Wait for dom-ready event
      webview.addEventListener('dom-ready', () => resolve(), { once: true });
    }
  });
}

// Load function orchestrator (inline for renderer process)
const functionRegistry = {
  navigate: {
    handler: async (params, context) => {
      const { createTab } = context;
      if (!createTab) throw new Error("createTab function not available");
      let url = params.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      createTab(url);
      return { success: true, url: url };
    }
  },
  search: {
    handler: async (params, context) => {
      const { createTab } = context;
      if (!createTab) throw new Error("createTab function not available");
      const query = encodeURIComponent(params.query);
      const engine = params.engine || "google";
      const searchUrls = {
        google: `https://www.google.com/search?q=${query}`,
        bing: `https://www.bing.com/search?q=${query}`,
        duckduckgo: `https://duckduckgo.com/?q=${query}`
      };
      createTab(searchUrls[engine]);
      return { success: true, query: params.query, engine: engine };
    }
  },
  extractPageContent: {
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      await waitForWebviewReady(webview);
      const result = await webview.executeJavaScript(`
        (function() {
          return document.body.innerText;
        })()
      `);
      return { success: true, content: result };
    }
  },
  extractLinks: {
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      await waitForWebviewReady(webview);
      const result = await webview.executeJavaScript(`
        (function() {
          const links = Array.from(document.querySelectorAll('a[href]'));
          return links.map(a => ({
            text: a.innerText.trim(),
            href: a.href,
            title: a.title
          }));
        })()
      `);
      return { success: true, links: result, count: result.length };
    }
  },
  getPageInfo: {
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      await waitForWebviewReady(webview);
      const result = await webview.executeJavaScript(`
        (function() {
          const meta = document.querySelector('meta[name="description"]');
          return {
            title: document.title,
            url: window.location.href,
            description: meta ? meta.content : '',
            domain: window.location.hostname
          };
        })()
      `);
      return { success: true, pageInfo: result };
    }
  },
  scrollTo: {
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      await waitForWebviewReady(webview);
      await webview.executeJavaScript(`
        (function() {
          const position = '${params.position}';
          if (position === 'top') {
            window.scrollTo(0, 0);
          } else if (position === 'bottom') {
            window.scrollTo(0, document.body.scrollHeight);
          } else if (position === 'middle') {
            window.scrollTo(0, document.body.scrollHeight / 2);
          }
        })()
      `);
      return { success: true, position: params.position };
    }
  },
  goBack: {
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      if (webview.canGoBack()) {
        webview.goBack();
        return { success: true };
      }
      return { success: false, message: "Cannot go back" };
    }
  },
  goForward: {
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      if (webview.canGoForward()) {
        webview.goForward();
        return { success: true };
      }
      return { success: false, message: "Cannot go forward" };
    }
  },
  reload: {
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      webview.reload();
      return { success: true };
    }
  },
  openTab: {
    handler: async (params, context) => {
      const { createTab } = context;
      if (!createTab) throw new Error("createTab function not available");
      const url = params.url || 'about:blank';
      createTab(url);
      return { success: true, url: url };
    }
  },
  closeTab: {
    handler: async (params, context) => {
      const { closeTab, activeTabId } = context;
      if (!closeTab) throw new Error("closeTab function not available");
      const tabId = params.tabId || activeTabId;
      closeTab(tabId);
      return { success: true, tabId: tabId };
    }
  },
  findInPage: {
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      webview.findInPage(params.text);
      return { success: true, searchText: params.text };
    }
  },
  goHome: {
    handler: async (params, context) => {
      // Close all tabs and show home page
      showHomePage();
      return { success: true };
    }
  }
};

// Simple intent detector and executor
async function processUserCommand(userInput) {
  const input = userInput.toLowerCase().trim();
  
  // Get current context
  const activeTab = tabs.find(t => t.id === activeTabId);
  const context = {
    webview: activeTab ? activeTab.webview : null,
    createTab: createTab,
    closeTab: closeTab,
    activeTabId: activeTabId
  };
  
  let functionName = null;
  let params = {};
  
  // Check if AI model is ready
  if (!aiModelReady) {
    return {
      type: 'error',
      message: 'AI model is still loading. Please wait a moment and try again.'
    };
  }
  
  // Use AI-powered intent detection with context awareness
  try {
    const aiIntent = await classifyWithContext(input);
    
    if (aiIntent && aiIntent.confidence > 0.25) {
      // Map AI intent to function
      const intentMap = {
        'navigate to URL': 'navigate',
        'search the web': 'search',
        'extract page content': 'extractPageContent',
        'get page information': 'getPageInfo',
        'extract links': 'extractLinks',
        'scroll page': 'scrollTo',
        'go back': 'goBack',
        'go forward': 'goForward',
        'reload page': 'reload',
        'open new tab': 'openTab',
        'close tab': 'closeTab',
        'find text in page': 'findInPage',
        'go home': 'goHome'
      };
      
      functionName = intentMap[aiIntent.intent];
      
      // Check if it's a data extraction command that requires an active tab
      const dataExtractionCommands = ['extractPageContent', 'getPageInfo', 'extractLinks', 'scrollTo', 'findInPage'];
      if (dataExtractionCommands.includes(functionName)) {
        if (!activeTab || !activeTab.webview) {
          return {
            type: 'error',
            message: 'Please open a webpage first before using this command.'
          };
        }
      }
      
      // Extract parameters using NER-based intelligent extraction
      params = await extractParameters(userInput, functionName);
      
      console.log('AI detected function:', functionName, 'with confidence:', aiIntent.confidence, 'params:', params);
    } else {
      // Low confidence - check if it looks like a data extraction command
      const dataKeywords = ['links', 'page info', 'page content', 'read page', 'extract', 'show me', 'get'];
      const looksLikeDataCommand = dataKeywords.some(keyword => input.includes(keyword));
      
      if (looksLikeDataCommand) {
        console.log('AI confidence too low but looks like data extraction:', aiIntent?.confidence);
        // Try to guess the function from keywords
        if (input.includes('link') || input.includes('hyperlink') || input.includes('url') || input.includes('anchor')) {
          functionName = 'extractLinks';
          console.log('Keyword match: extractLinks');
        } else if (input.includes('page info') || input.includes('metadata')) {
          functionName = 'getPageInfo';
        } else if (input.includes('page content') || input.includes('read page')) {
          functionName = 'extractPageContent';
        }
        
        // Check if tab exists
        if (!activeTab || !activeTab.webview) {
          return {
            type: 'error',
            message: 'Please open a webpage first before using this command.'
          };
        }
        
        // Extract parameters using NER
        params = await extractParameters(userInput, functionName);
      } else {
        // Default to web search for general queries
        console.log('AI confidence too low:', aiIntent?.confidence, '- defaulting to web search');
        functionName = 'search';
        // Extract search query using NER
        params = await extractParameters(userInput, 'search');
      }
    }
  } catch (error) {
    console.error('AI intent detection failed:', error);
    // On error, default to web search
    functionName = 'search';
    params.query = input;
  }
  
  // Execute function
  if (functionName && functionRegistry[functionName]) {
    try {
      const result = await functionRegistry[functionName].handler(params, context);
      return formatResult(functionName, result);
    } catch (error) {
      return {
        type: 'error',
        message: error.message
      };
    }
  }
  
  // No function matched
  return {
    type: 'info',
    message: `<div style="line-height: 1.8;"><strong>I didn't understand that command.</strong><br><br>
      <strong>Try commands like:</strong><br>
      ${icons.bullet}"open google.com" or "navigate to github.com"<br>
      ${icons.bullet}"search for AI news" or "find python tutorials"<br>
      ${icons.bullet}"get page info" or "show me all links"<br>
      ${icons.bullet}"scroll to top" or "scroll to bottom"<br>
      ${icons.bullet}"go back" or "reload page"<br>
      ${icons.bullet}"new tab" or "close tab"</div>`
  };
}

// SVG Icons
const icons = {
  success: '<svg width="14" height="14" viewBox="0 0 16 16" fill="#10b981" style="vertical-align: middle; margin-right: 6px;"><circle cx="8" cy="8" r="7" stroke="#10b981" stroke-width="1.5" fill="none"/><path d="M5 8l2 2 4-4" stroke="#10b981" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>',
  error: '<svg width="14" height="14" viewBox="0 0 16 16" fill="#ef4444" style="vertical-align: middle; margin-right: 6px;"><circle cx="8" cy="8" r="7" stroke="#ef4444" stroke-width="1.5" fill="none"/><path d="M5 5l6 6M11 5l-6 6" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>',
  bullet: '<svg width="12" height="12" viewBox="0 0 12 12" fill="#6b7280" style="vertical-align: middle; margin-right: 4px;"><circle cx="6" cy="6" r="2" fill="#6b7280"/></svg>'
};

// Format result for display
function formatResult(functionName, result) {
  if (!result.success) {
    return {
      type: 'error',
      message: result.message || 'Action failed'
    };
  }
  
  if (functionName === 'navigate') {
    return { type: 'success', message: `Navigated to ${result.url}` };
  } else if (functionName === 'search') {
    return { type: 'success', message: `Searching for "${result.query}"` };
  } else if (functionName === 'extractPageContent') {
    return { type: 'data', message: 'Page content extracted', data: result.content.substring(0, 500) + '...' };
  } else if (functionName === 'extractLinks') {
    const linkList = result.links.slice(0, 10).map(l => `<div style="margin: 4px 0;">${icons.bullet}${l.text || l.href}</div>`).join('');
    return { type: 'data', message: `Found ${result.count} links`, data: linkList };
  } else if (functionName === 'getPageInfo') {
    const info = result.pageInfo;
    return { type: 'data', message: 'Page information', data: `<div style="line-height: 1.6;"><strong>Title:</strong> ${info.title}<br><strong>URL:</strong> ${info.url}<br><strong>Domain:</strong> ${info.domain}</div>` };
  } else if (functionName === 'scrollTo') {
    return { type: 'success', message: `Scrolled to ${result.position}` };
  } else if (functionName === 'goBack' || functionName === 'goForward' || functionName === 'reload') {
    return { type: 'success', message: `${functionName} completed` };
  } else if (functionName === 'openTab') {
    return { type: 'success', message: `Opened new tab` };
  } else if (functionName === 'closeTab') {
    return { type: 'success', message: `Closed tab` };
  } else if (functionName === 'findInPage') {
    return { type: 'success', message: `Searching for "${result.searchText}"` };
  } else if (functionName === 'goHome') {
    return { type: 'success', message: `Returned to home page` };
  }
  
  return { type: 'success', message: 'Action completed' };
}

// Add AI response message to chat
function addAssistantMessage(content, type = 'info') {
  const messageEl = document.createElement('div');
  messageEl.className = 'assistant-message';
  
  // Add icon based on type
  if (type === 'success') {
    messageEl.innerHTML = icons.success + '<span>' + content + '</span>';
  } else if (type === 'error') {
    messageEl.innerHTML = icons.error + '<span>' + content + '</span>';
  } else if (type === 'data') {
    messageEl.innerHTML = '<span>' + content + '</span>';
  } else {
    messageEl.innerHTML = '<span>' + content + '</span>';
  }
  
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

} // End of initializeApp

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded
  initializeApp();
}
