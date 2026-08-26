/**
 * SuperBook Chrome Extension - Popup Script
 * Terminal-style interface for dictionary lookups
 */

// This popup now uses the terminal interface directly
// The main functionality is built into the HTML file
// This script just handles initial setup and extension status

document.addEventListener('DOMContentLoaded', () => {
  console.log('Dictionary Terminal popup loaded');
  
  // Update status indicator based on extension state
  chrome.storage.sync.get(['enabled'], (result) => {
    const enabled = result.enabled !== false;
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${enabled ? 'status-enabled' : 'status-disabled'}`;
      statusIndicator.textContent = `● ${enabled ? 'online' : 'offline'}`;
    }
  });
  
  // Listen for storage changes to update status
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.enabled) {
      const enabled = changes.enabled.newValue;
      const statusIndicator = document.getElementById('statusIndicator');
      if (statusIndicator) {
        statusIndicator.className = `status-indicator ${enabled ? 'status-enabled' : 'status-disabled'}`;
        statusIndicator.textContent = `● ${enabled ? 'online' : 'offline'}`;
      }
    }
  });
  
  // Focus the input field
  const wordInput = document.getElementById('wordInput');
  if (wordInput) {
    wordInput.focus();
  }

  const aiMode = document.getElementById('aiMode');
  const configureAi = document.getElementById('configureAi');
  const removeAiKey = document.getElementById('removeAiKey');
  const aiMessage = document.getElementById('aiMessage');
  const keyDialog = document.getElementById('keyDialog');
  const geminiKey = document.getElementById('geminiKey');
  const refreshAi = () => chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
    if (chrome.runtime.lastError || !settings) return;
    aiMode.checked = !!settings.aiMode;
    configureAi.textContent = settings.hasGeminiKey ? 'Update API key' : 'Configure API key';
    removeAiKey.disabled = !settings.hasGeminiKey;
  });
  refreshAi();
  configureAi.addEventListener('click', () => {
    geminiKey.value = '';
    keyDialog.showModal();
  });
  document.getElementById('keyForm').addEventListener('submit', (event) => {
    if (event.submitter?.id !== 'saveKey') return;
    event.preventDefault();
    const key = geminiKey.value.trim();
    chrome.runtime.sendMessage({ action: 'saveGeminiKey', key }, (result) => {
      if (!result?.ok) { aiMessage.textContent = 'Invalid API key.'; return; }
      keyDialog.close();
      chrome.storage.sync.set({ aiMode: true });
      aiMessage.textContent = 'AI Mode enabled.';
      refreshAi();
    });
  });
  aiMode.addEventListener('change', () => {
    if (aiMode.checked) {
      chrome.runtime.sendMessage({ action: 'getAiStatus' }, (status) => {
        if (!status?.hasGeminiKey) { aiMode.checked = false; configureAi.click(); return; }
        chrome.storage.sync.set({ aiMode: true });
      });
    } else chrome.storage.sync.set({ aiMode: false });
  });
  removeAiKey.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'removeGeminiKey' }, () => { aiMode.checked = false; aiMessage.textContent = 'API key removed.'; refreshAi(); }));
});
