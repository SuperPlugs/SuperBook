/**
 * SuperBook Chrome Extension - Popup Script
 * Terminal-style interface for dictionary lookups
 */

// This popup now uses the terminal interface directly
// The main functionality is built into the HTML file
// This script just handles initial setup and extension status

document.addEventListener("DOMContentLoaded", () => {
  console.log("Dictionary Terminal popup loaded");

  // Update status indicator based on extension state
  chrome.storage.sync.get(["enabled"], (result) => {
    const enabled = result.enabled !== false;
    const statusIndicator = document.getElementById("statusIndicator");
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${
        enabled ? "status-enabled" : "status-disabled"
      }`;
      statusIndicator.textContent = `● ${enabled ? "online" : "offline"}`;
    }
  });

  // Listen for storage changes to update status
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && changes.enabled) {
      const enabled = changes.enabled.newValue;
      const statusIndicator = document.getElementById("statusIndicator");
      if (statusIndicator) {
        statusIndicator.className = `status-indicator ${
          enabled ? "status-enabled" : "status-disabled"
        }`;
        statusIndicator.textContent = `● ${enabled ? "online" : "offline"}`;
      }
    }
  });

  // Focus the input field
  const wordInput = document.getElementById("wordInput");
  if (wordInput) {
    wordInput.focus();
  }
});
