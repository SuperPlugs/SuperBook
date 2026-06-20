// SuperBook Content Script
// Adds a hover button above selected words that, when clicked, shows a tooltip with the definition

console.log("SuperBook content script loaded");

let hoverButtonEl = null;
let tooltipEl = null;
let hideHoverTimeout = null;
let isInteracting = false;
let enabled = true;
let autoHide = true;
let hideDelay = 5;
let hideTooltipTimeout = null;
let lastSelectionRect = null;
let isInitialized = false;

const FETCH_TIMEOUT = 5000;
const MAX_RETRIES = 2;

function initializeSuperBook() {
  // Prevent duplicate initialization
  if (isInitialized) {
    console.log("SuperBook already initialized, skipping...");
    return;
  }
  isInitialized = true;
  document.addEventListener("mouseup", onMouseUpOrKeySelection, true);
  document.addEventListener("keyup", onMouseUpOrKeySelection, true);
  document.addEventListener("selectionchange", onSelectionChange);
  window.addEventListener("scroll", onScrollReposition, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      removeTooltip();
      hideHoverButton();
    }
  });

  try {
    chrome.runtime.sendMessage({ action: "getSettings" }, (res) => {
      if (res) {
        if (typeof res.enabled !== "undefined") enabled = !!res.enabled;
        if (typeof res.autoHide !== "undefined") autoHide = !!res.autoHide;
        if (typeof res.hideDelay !== "undefined") hideDelay = res.hideDelay;
      }
    });
  } catch (_) {}

  try {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.action === "toggleExtension") {
        enabled = !!message.enabled;
        if (!enabled) {
          hideHoverButton();
          removeTooltip();
        }
      }
      if (message && message.action === "showSettings") {
        showSettingsPanel();
      }
    });
  } catch (_) {}

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync") {
        if (changes.enabled) enabled = !!changes.enabled.newValue;
        if (changes.autoHide) autoHide = !!changes.autoHide.newValue;
        if (changes.hideDelay) hideDelay = changes.hideDelay.newValue;
        if (!enabled) {
          hideHoverButton();
          removeTooltip();
        }
      }
    });
  } catch (_) {}
}

function onSelectionChange() {
  clearTimeout(hideHoverTimeout);
  hideHoverTimeout = setTimeout(() => {
    updateHoverFromCurrentSelection();
  }, 80);
}

function onMouseUpOrKeySelection() {
  const selection = window.getSelection();
  if (!selection) return hideHoverButton();
  updateHoverFromCurrentSelection();
}

function isValidSelection(selection) {
  if (!enabled) return false;
  if (!selection || selection.isCollapsed) return false;

  const anchorNode = selection.anchorNode && selection.anchorNode.parentElement;
  if (
    anchorNode &&
    anchorNode.closest("input, textarea, [contenteditable=true]")
  )
    return false;

  const text = selection.toString().trim();
  if (!text) return false;
  if (text.split(/\s+/).length !== 1) return false;
  if (text.length < 2) return false;
  return true;
}

function updateHoverFromCurrentSelection() {
  const selection = window.getSelection();
  if (!isValidSelection(selection)) {
    hideHoverButton();
    lastSelectionRect = null;
    return;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    hideHoverButton();
    lastSelectionRect = null;
    return;
  }
  lastSelectionRect = rect;
  const x = rect.left + rect.width / 2 + window.scrollX;
  const y = rect.top + window.scrollY;
  showHoverButton({ x, y }, selection.toString().trim());
}

function onScrollReposition() {
  if (!hoverButtonEl || hoverButtonEl.style.display === "none") return;
  if (!lastSelectionRect) return hideHoverButton();
  const rect = lastSelectionRect;
  const x = rect.left + rect.width / 2 + window.scrollX;
  const y = rect.top + window.scrollY;
  positionHoverButton({ x, y });
}

function createHoverButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "superbook-hover-btn";
  btn.setAttribute("aria-label", "Show definition");

  const logo = document.createElement("img");
  logo.alt = "SuperBook";
  logo.width = 18;
  logo.height = 18;
  logo.draggable = false;
  // Use extension icon as logo
  try {
    const iconUrl = chrome.runtime.getURL("icons/icon48.png");
    if (iconUrl) {
      logo.src = iconUrl;
      logo.onerror = () => {
        console.warn("Failed to load SuperBook icon, using fallback");
        logo.style.backgroundColor = "#4ade80";
        logo.style.borderRadius = "50%";
      };
    } else {
      logo.style.backgroundColor = "#4ade80";
      logo.style.borderRadius = "50%";
    }
  } catch (e) {
    logo.style.backgroundColor = "#4ade80";
    logo.style.borderRadius = "50%";
  }
  btn.appendChild(logo);

  btn.addEventListener("mousedown", (e) => {
    isInteracting = true;
    e.preventDefault();
  });

  btn.addEventListener("click", () => {
    const word = btn.dataset.word || "";
    const bx = Number(btn.dataset.x || 0);
    const by = Number(btn.dataset.y || 0);
    showTooltip(word, { x: bx, y: by });
    setTimeout(() => {
      isInteracting = false;
    }, 50);
  });

  document.documentElement.appendChild(btn);
  return btn;
}

//Auto hide function
function startAutoHide() {
  clearTimeout(hideTooltipTimeout);
  if (autoHide && hideDelay > 0) {
    hideTooltipTimeout = setTimeout(function() {
      removeTooltip();
    }, hideDelay * 1000);
  }
}

function showHoverButton(position, word) {
  if (!hoverButtonEl) {
    hoverButtonEl = createHoverButton();
  }

  positionHoverButton(position);
  hoverButtonEl.style.display = "flex";
  hoverButtonEl.dataset.word = word;
  hoverButtonEl.dataset.x = String(position.x);
  hoverButtonEl.dataset.y = String(position.y);
}

function positionHoverButton(position) {
  const offsetY = 10;
  hoverButtonEl.style.left = `${Math.round(position.x - 16)}px`;
  hoverButtonEl.style.top = `${Math.round(position.y - offsetY - 32)}px`;
}

function hideHoverButton() {
  if (isInteracting) return;
  if (hoverButtonEl) hoverButtonEl.style.display = "none";
}

function removeTooltip() {
  clearTimeout(hideTooltipTimeout);
  if (tooltipEl && tooltipEl.parentNode) {
    tooltipEl.parentNode.removeChild(tooltipEl);
  }
  tooltipEl = null;
}

async function showTooltip(word, position) {
  removeTooltip();

  tooltipEl = document.createElement("div");
  tooltipEl.className = "superbook-tooltip";
  tooltipEl.style.left = `${Math.min(
    position.x + 8,
    window.scrollX + document.documentElement.clientWidth - 320
  )}px`;
  tooltipEl.style.top = `${Math.max(position.y - 8, window.scrollY + 8)}px`;

  const content = document.createElement("div");
  content.className = "superbook-definition";
  content.innerHTML = `<span class="superbook-loading">Looking up "${escapeHtml(
    word
  )}"</span>`;
  tooltipEl.appendChild(content);
  document.documentElement.appendChild(tooltipEl);

  let retries = 0;

  const fetchDefinition = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
          word.toLowerCase()
        )}`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 404) throw new Error("Word not found");
        throw new Error("Server returned error");
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Malformed response from server");
      }

      if (!Array.isArray(data) || !data[0] || !data[0].meanings) {
        throw new Error("Invalid API response");
      }

      const entry = data[0];
      const meaning = entry.meanings[0];
      const def = meaning.definitions[0];

      content.innerHTML = "";
      const parts = [];
      if (entry.word)
        parts.push(
          `<div class="superbook-word">${escapeHtml(entry.word)}</div>`
        );
      if (entry.phonetic || (entry.phonetics && entry.phonetics[0])) {
        const ph = entry.phonetic || entry.phonetics?.[0]?.text || "";
        if (ph)
          parts.push(
            `<div class="superbook-pronunciation">${escapeHtml(ph)}</div>`
          );
      }
      if (meaning.partOfSpeech)
        parts.push(
          `<div class="superbook-definition"><strong>${escapeHtml(
            meaning.partOfSpeech
          )}</strong></div>`
        );
      if (def.definition)
        parts.push(
          `<div class="superbook-definition">${escapeHtml(
            def.definition
          )}</div>`
        );
      if (def.example)
        parts.push(
          `<div class="superbook-definition" style="opacity:.8;font-style:italic">"${escapeHtml(
            def.example
          )}"</div>`
        );

      content.innerHTML = parts.join("");
      tooltipEl.classList.add("show");
      startAutoHide();
    } catch (err) {
      clearTimeout(timeout);
      console.error(err);

      let msg;
      if (err.name === "AbortError")
        msg = "Request timed out. Please try again.";
      else if (err instanceof TypeError)
        msg = "Network error. Please check your connection.";
      else if (typeof err.message === "string") msg = err.message;
      else msg = "Something went wrong. Please try again.";

      content.innerHTML = `<span class="superbook-definition" style="color:#ef4444">${escapeHtml(
        msg
      )}</span>`;

      // Only show retry button if we haven't exceeded max retries
      if (retries < MAX_RETRIES) {
        const retryBtn = document.createElement("button");
        retryBtn.textContent = "Retry";
        retryBtn.className = "superbook-retry-btn";
        retryBtn.onclick = async () => {
          retries++;
          // Remove the retry button before retrying
          if (retryBtn.parentNode) {
            retryBtn.parentNode.removeChild(retryBtn);
          }
          content.innerHTML = `<span class="superbook-loading">Retrying (${retries}/${MAX_RETRIES})...</span>`;
          await fetchDefinition();
        };
        content.appendChild(retryBtn);
      } else {
        // Show final failure message after max retries
        const finalMsg = document.createElement("div");
        finalMsg.className = "superbook-definition";
        finalMsg.style.color = "#ef4444";
        finalMsg.textContent =
          "Failed after multiple attempts. Please try again later.";
        content.appendChild(finalMsg);
      }

      tooltipEl.classList.add("show");
      startAutoHide();
    }
  };

  await fetchDefinition();

  const onDocClick = (ev) => {
    const target = ev.target;
    if (!tooltipEl) return;
    if (
      tooltipEl.contains(target) ||
      (hoverButtonEl && hoverButtonEl.contains(target))
    )
      return;
    removeTooltip();
    document.removeEventListener("click", onDocClick, true);
  };
  document.addEventListener("click", onDocClick, true);
}

// Settings overlay panel
let settingsPanelEl = null;

function createSettingsPanel() {
  if (settingsPanelEl) {
    settingsPanelEl.style.display = 'block';
    return settingsPanelEl;
  }

  const panel = document.createElement('div');
  panel.className = 'superbook-settings-overlay';
  panel.innerHTML = `
    <div class="superbook-settings-panel">
      <div class="superbook-settings-header">
        <span class="superbook-settings-title">SuperBook Settings</span>
        <button class="superbook-settings-close">&times;</button>
      </div>
      <div class="superbook-settings-body">
        <div class="superbook-settings-section">
          <h3>General</h3>
          <div class="superbook-settings-row">
            <div>
              <label>Enable Extension</label>
              <span class="superbook-settings-desc">Turn SuperBook on or off</span>
            </div>
            <label class="superbook-toggle">
              <input type="checkbox" id="sb-settings-enabled">
              <span class="superbook-toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="superbook-settings-section">
          <h3>Tooltip</h3>
          <div class="superbook-settings-row">
            <div>
              <label>Auto-Hide Tooltip</label>
              <span class="superbook-settings-desc">Automatically hide after a few seconds</span>
            </div>
            <label class="superbook-toggle">
              <input type="checkbox" id="sb-settings-autohide">
              <span class="superbook-toggle-slider"></span>
            </label>
          </div>
          <div class="superbook-settings-row">
            <div>
              <label>Hide Delay</label>
              <span class="superbook-settings-desc">How long before the tooltip hides</span>
            </div>
            <input type="number" id="sb-settings-delay" min="1" max="15" value="5">
          </div>
        </div>
        <button id="sb-settings-save">Save Settings</button>
      </div>
    </div>
  `;

  panel.querySelector('.superbook-settings-close').addEventListener('click', hideSettingsPanel);
  panel.addEventListener('click', (e) => {
    if (e.target === panel) hideSettingsPanel();
  });
  panel.querySelector('#sb-settings-save').addEventListener('click', saveSettingsPanel);

  document.documentElement.appendChild(panel);
  settingsPanelEl = panel;

  // Inject styles
  if (!document.getElementById('superbook-settings-styles')) {
    const style = document.createElement('style');
    style.id = 'superbook-settings-styles';
    style.textContent = `
      .superbook-settings-overlay {
        position: fixed;
        top: 0;
        right: 0;
        width: 300px;
        height: 400px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .superbook-settings-panel {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 0 0 0 12px;
        box-shadow: -4px 4px 24px rgba(0,0,0,0.5);
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .superbook-settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #2a2a2a;
      }
      .superbook-settings-title {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
      }
      .superbook-settings-close {
        background: none;
        border: none;
        color: #6b7280;
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
      }
      .superbook-settings-close:hover { color: #fff; }
      .superbook-settings-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }
      .superbook-settings-section { margin-bottom: 16px; }
      .superbook-settings-section h3 {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #9ca3af;
        margin: 0 0 12px 0;
      }
      .superbook-settings-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #2a2a2a;
        gap: 12px;
      }
      .superbook-settings-row:last-child { border-bottom: none; padding-bottom: 0; }
      .superbook-settings-row:first-child { padding-top: 0; }
      .superbook-settings-row label {
        font-size: 13px;
        font-weight: 500;
        color: #e5e5e5;
        display: block;
      }
      .superbook-settings-desc {
        font-size: 11px;
        color: #6b7280;
        display: block;
        margin-top: 2px;
      }
      .superbook-settings-row input[type="number"] {
        width: 60px;
        padding: 4px 8px;
        background: #2a2a2a;
        color: #fff;
        border: 1px solid #3a3a3a;
        border-radius: 6px;
        font-size: 13px;
        text-align: center;
        outline: none;
        flex-shrink: 0;
      }
      .superbook-settings-row input[type="number"]:focus { border-color: #4ade80; }
      .superbook-toggle {
        position: relative;
        width: 36px;
        height: 20px;
        flex-shrink: 0;
      }
      .superbook-toggle input { opacity: 0; width: 0; height: 0; }
      .superbook-toggle-slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background: #374151;
        border-radius: 20px;
        transition: 0.2s;
      }
      .superbook-toggle-slider::before {
        content: "";
        position: absolute;
        width: 14px;
        height: 14px;
        left: 3px;
        bottom: 3px;
        background: #fff;
        border-radius: 50%;
        transition: 0.2s;
      }
      .superbook-toggle input:checked + .superbook-toggle-slider { background: #4ade80; }
      .superbook-toggle input:checked + .superbook-toggle-slider::before { transform: translateX(16px); }
      #sb-settings-save {
        width: 100%;
        background: #4ade80;
        color: #000;
        border: none;
        padding: 8px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
        margin-top: 8px;
      }
      #sb-settings-save:hover { background: #22c55e; }
    `;
    document.head.appendChild(style);
  }

  return panel;
}

function loadSettingsPanel() {
  try {
    chrome.storage.sync.get(['enabled', 'autoHide', 'hideDelay'], (res) => {
      const enabled = res && res.enabled !== false;
      const autoHide = res && res.autoHide !== false;
      const hideDelay = res && res.hideDelay ? res.hideDelay : 5;
      const enabledEl = document.getElementById('sb-settings-enabled');
      const autoHideEl = document.getElementById('sb-settings-autohide');
      const delayEl = document.getElementById('sb-settings-delay');
      if (enabledEl) enabledEl.checked = enabled;
      if (autoHideEl) autoHideEl.checked = autoHide;
      if (delayEl) delayEl.value = hideDelay;
    });
  } catch (_) {}
}

function saveSettingsPanel() {
  const enabled = document.getElementById('sb-settings-enabled')?.checked ?? true;
  const autoHide = document.getElementById('sb-settings-autohide')?.checked ?? true;
  const hideDelay = parseInt(document.getElementById('sb-settings-delay')?.value || '5', 10);
  try {
    chrome.storage.sync.set({ enabled, autoHide, hideDelay }, () => {
      const btn = document.getElementById('sb-settings-save');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Saved!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      }
    });
  } catch (_) {}
}

function showSettingsPanel() {
  const panel = createSettingsPanel();
  panel.style.display = 'block';
  loadSettingsPanel();
}

function hideSettingsPanel() {
  if (settingsPanelEl) settingsPanelEl.style.display = 'none';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSuperBook);
} else {
  initializeSuperBook();
}
