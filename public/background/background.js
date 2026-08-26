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
      hideDelay: 5000,
      aiMode: false,
    });
  } else if (details.reason === "update") {
    console.log("SuperBook extension updated");
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Toggle extension on/off for current tab
  chrome.storage.sync.get(["enabled"], (result) => {
    const newState = !result.enabled;
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
    16: chrome.runtime.getURL("icons/icon16.png"),
    48: chrome.runtime.getURL("icons/icon48.png"),
    128: chrome.runtime.getURL("icons/icon128.png"),
  };
  const baseDisabled = {
    16: chrome.runtime.getURL("icons/icon16.png"),
    48: chrome.runtime.getURL("icons/icon48.png"),
    128: chrome.runtime.getURL("icons/icon128.png"),
  };

  const iconPath = enabled ? baseActive : baseDisabled;

  // Set icon and surface any runtime.lastError in the callback for easier debugging
  chrome.action.setIcon({ path: iconPath }, () => {
    if (chrome.runtime.lastError) {
      console.warn(
        "SuperBook: Failed to set icon -",
        chrome.runtime.lastError.message,
      );
    }
  });

  chrome.action.setTitle({
    title: enabled ? "SuperBook (Enabled)" : "SuperBook (Disabled)",
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "getSettings") {
    chrome.storage.sync.get(
      ["enabled", "autoHide", "hideDelay", "aiMode"],
      (result) => {
        chrome.storage.local.get(["geminiApiKey"], (local) => {
          sendResponse({
            enabled: result.enabled !== false, // Default to true
            autoHide: result.autoHide !== false, // Default to true
            hideDelay: result.hideDelay || 5000, // Default to 5 seconds
            aiMode:
              result.aiMode === true &&
              typeof local.geminiApiKey === "string" &&
              local.geminiApiKey.length > 0,
            hasGeminiKey:
              typeof local.geminiApiKey === "string" &&
              local.geminiApiKey.length > 0,
          });
        });
      },
    );
    return true; // Keep message channel open for async response
  }

  if (message && message.action === "getAiStatus") {
    chrome.storage.local.get(["geminiApiKey"], (local) => {
      sendResponse({
        hasGeminiKey:
          typeof local.geminiApiKey === "string" &&
          local.geminiApiKey.length > 0,
      });
    });
    return true;
  }

  if (message && message.action === "saveGeminiKey") {
    const key = typeof message.key === "string" ? message.key.trim() : "";
    if (key.length < 20 || key.length > 256)
      return sendResponse({ ok: false, error: "Invalid API key" });
    chrome.storage.local.set({ geminiApiKey: key }, () =>
      sendResponse({ ok: !chrome.runtime.lastError }),
    );
    return true;
  }

  if (message && message.action === "removeGeminiKey") {
    chrome.storage.local.remove("geminiApiKey", () => {
      chrome.storage.sync.set({ aiMode: false }, () =>
        sendResponse({ ok: !chrome.runtime.lastError }),
      );
    });
    return true;
  }

  if (message && message.action === "getContextualMeaning") {
    const word = typeof message.word === "string" ? message.word.trim() : "";
    const context =
      typeof message.context === "string" ? message.context.trim() : "";
    if (
      !/^[\p{L}][\p{L}'-]{1,63}$/u.test(word) ||
      !context ||
      context.length > 2000
    ) {
      return sendResponse({
        ok: false,
        error: "Invalid contextual meaning request",
      });
    }
    chrome.storage.local.get(["geminiApiKey"], async (local) => {
      const key = local.geminiApiKey;
      if (typeof key !== "string" || !key)
        return sendResponse({ ok: false, error: "missing-key" });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a contextual dictionary assistant.\n\nSelected word:\n${word}\n\nContext:\n${context}\n\nExplain what "${word}" means specifically in this context. Keep it concise, use plain text, and say if genuinely ambiguous.`,
                    },
                  ],
                },
              ],
            }),
          },
        );
        if (response.status === 401 || response.status === 403)
          return sendResponse({ ok: false, error: "invalid-key" });
        if (response.status === 429)
          return sendResponse({ ok: false, error: "rate-limit" });
        if (!response.ok) return sendResponse({ ok: false, error: "provider" });
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text !== "string" || !text.trim() || text.length > 2000)
          return sendResponse({ ok: false, error: "malformed" });
        sendResponse({ ok: true, text: text.trim() });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error?.name === "AbortError" ? "timeout" : "network",
        });
      } finally {
        clearTimeout(timeout);
      }
    });
    return true;
  }

  if (message && message.action === "getDictionaryMeaning") {
    const word =
      typeof message.word === "string" ? message.word.trim().toLowerCase() : "";
    if (!/^[\p{L}][\p{L}'-]{1,63}$/u.test(word))
      return sendResponse({ ok: false, error: "invalid-word" });
    const lookup = async (url, parse) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;
        return parse(await response.json());
      } catch (_) {
        return null;
      } finally {
        clearTimeout(timeout);
      }
    };
    (async () => {
      const primary = await lookup(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        (data) =>
          Array.isArray(data) && data[0]?.meanings?.length ? data[0] : null,
      );
      if (primary)
        return { ok: true, data: primary, provider: "Free Dictionary" };
      const fallback = await lookup(
        `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`,
        (data) =>
          data?.[0]?.defs?.[0]
            ? {
                word,
                meanings: [
                  {
                    partOfSpeech: data[0].defs[0].slice(0, 1),
                    definitions: [{ definition: data[0].defs[0].slice(2) }],
                  },
                ],
              }
            : null,
      );
      if (fallback)
        return { ok: true, data: fallback, provider: "Datamuse fallback" };
      return {
        ok: false,
        error: "Dictionary service unavailable. Please try again.",
      };
    })().then(sendResponse);
    return true;
  }
});

const GEMINI_MODEL = "gemini-3.1-flash-lite";

// Initialize icon state on startup
chrome.storage.sync.get(["enabled"], (result) => {
  updateIcon(result.enabled !== false);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== "sync" || !changes.aiMode) return;
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.id)
        chrome.tabs
          .sendMessage(tab.id, {
            action: "aiModeChanged",
            enabled: changes.aiMode.newValue === true,
          })
          .catch(() => {});
    }),
  );
});
