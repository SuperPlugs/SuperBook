/**
 * SuperBook  Chrome Extension - Background Script
 * Handles extension lifecycle and storage
 */

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("SuperBook extension installed");

    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      autoHide: true,
      hideDelay: 5,
    });
  } else if (details.reason === "update") {
    console.log("SuperBook extension updated");
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Toggle extension on/off for current tab
    chrome.storage.sync.get(["enabled"], (result) => {
      const newState = !(result && result.enabled);
    chrome.storage.sync.set({ enabled: newState });

    // Update icon to reflect state
    updateIcon(newState);

    // Send message to content script
    chrome.tabs
      .sendMessage(tab.id, {
        action: "toggleExtension",
        enabled: newState,
      })
      .catch(() => {
        // Ignore errors if content script is not loaded
      });
  });
});

// Update extension icon based on state
function updateIcon(enabled) {
  // Chrome action.setIcon accepts either a single path or an object keyed by size.
  // Use sizes 16/24/32 to satisfy environments that validate specific buckets.
  // Use sizes that match the actual image files included in the extension.
  // Keys must match the image dimensions expected by the browser (e.g. "16", "48", "128").
  const baseActive = {
    "16": chrome.runtime.getURL("icons/icon16.png"),
    "48": chrome.runtime.getURL("icons/icon48.png"),
    "128": chrome.runtime.getURL("icons/icon128.png"),
  };
  const baseDisabled = {
    "16": chrome.runtime.getURL("icons/icon16.png"),
    "48": chrome.runtime.getURL("icons/icon48.png"),
    "128": chrome.runtime.getURL("icons/icon128.png"),
  };

  const iconPath = enabled ? baseActive : baseDisabled;

  // Set icon and surface any runtime.lastError in the callback for easier debugging
  chrome.action.setIcon({ path: iconPath }, () => {
    if (chrome.runtime.lastError) {
      console.warn("SuperBook: Failed to set icon -", chrome.runtime.lastError.message);
    }
  });

  chrome.action.setTitle({
    title: enabled
      ? "SuperBook (Enabled)"
      : "SuperBook (Disabled)",
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSettings") {
    chrome.storage.sync.get(["enabled", "autoHide", "hideDelay"], (result) => {
      sendResponse({
        enabled: result ? result.enabled !== false : true,
        autoHide: result ? result.autoHide !== false : true,
        hideDelay: result && result.hideDelay ? result.hideDelay : 5,
      });
    });
    return true; // Keep message channel open for async response
  }
});

// Initialize icon state on startup
chrome.storage.sync.get(["enabled"], (result) => {
  updateIcon(result ? result.enabled !== false : true);
});
