// Tab management state
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

// Initialize app
document.getElementById('app').innerHTML = `
  <div class="tab-bar" id="tab-bar">
    <button class="new-tab-btn" id="new-tab-btn" title="New Tab">+</button>
  </div>
  <div class="nav-bar">
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
  <div id="browser-container"></div>
`;

const tabBar = document.getElementById('tab-bar');
const newTabBtn = document.getElementById('new-tab-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const homeBtn = document.getElementById('home-btn');
const urlInput = document.getElementById('url');
const securityBadge = document.getElementById('security-badge');
const loadingSpinner = document.getElementById('loading-spinner');
const browserContainer = document.getElementById('browser-container');

function createTab(url = 'https://www.google.com') {
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
    <span class="tab-favicon">🌐</span>
    <span class="tab-title">New Tab</span>
    <span class="tab-close">×</span>
  `;
  
  // Insert tab before the new tab button
  tabBar.insertBefore(tabElement, newTabBtn);
  
  // Store tab data
  const tab = {
    id: tabId,
    url: url,
    title: 'New Tab',
    favicon: '🌐',
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
    backBtn.disabled = !activeTab.webview.canGoBack();
    forwardBtn.disabled = !activeTab.webview.canGoForward();
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
  loadPage('https://www.google.com');
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

// Create initial tab
createTab();
