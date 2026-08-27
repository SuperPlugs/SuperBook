const wordInput = document.getElementById("wordInput");
const output = document.getElementById("output");
const statusIndicator = document.getElementById("statusIndicator");
const historyBtn = document.getElementById("historyBtn");
const clearBtn = document.getElementById("clearBtn");
const aiMode = document.getElementById("aiMode");
const configureAi = document.getElementById("configureAi");
const removeAiKey = document.getElementById("removeAiKey");
const aiMessage = document.getElementById("aiMessage");
const keyDialog = document.getElementById("keyDialog");
const keyForm = document.getElementById("keyForm");
const geminiKey = document.getElementById("geminiKey");
const extensionStorage = typeof chrome !== "undefined" && chrome.storage ? chrome.storage : null;

const MAX_HISTORY_SIZE = 10;
let wordHistory = [];
let historyIndex = -1;

function line(className, text) {
  const element = document.createElement("div");
  element.className = `output-line${className ? ` ${className}` : ""}`;
  element.textContent = text;
  return element;
}

function setStatus(enabled) {
  statusIndicator.className = `status-indicator ${enabled ? "status-enabled" : "status-disabled"}`;
  statusIndicator.textContent = `● ${enabled ? "online" : "offline"}`;
}

function scrollOutput() {
  output.scrollTop = output.scrollHeight;
}

function addToHistory(word) {
  wordHistory = [word, ...wordHistory.filter((item) => item.toLowerCase() !== word.toLowerCase())].slice(0, MAX_HISTORY_SIZE);
  historyIndex = -1;
  extensionStorage?.local.set({ wordHistory });
}

function navigateHistory(direction) {
  if (!wordHistory.length) return;
  historyIndex = Math.max(-1, Math.min(wordHistory.length - 1, historyIndex + direction));
  wordInput.value = historyIndex === -1 ? "" : wordHistory[historyIndex];
  wordInput.setSelectionRange(wordInput.value.length, wordInput.value.length);
}

function appendDefinition(entry, container) {
  container.append(line("word-title", entry.word || "Definition"));
  const phonetic = entry.phonetic || entry.phonetics?.find((item) => item.text)?.text;
  if (phonetic) container.append(line("phonetic", phonetic));

  (entry.meanings || []).forEach((meaning) => {
    if (meaning.partOfSpeech) container.append(line("part-of-speech", meaning.partOfSpeech));
    (meaning.definitions || []).slice(0, 3).forEach((item, index) => {
      container.append(line("definition", `${index + 1}. ${item.definition}`));
      if (item.example) container.append(line("example", `“${item.example}”`));
    });
    if (meaning.synonyms?.length) {
      container.append(line("synonyms", "Synonyms"));
      container.append(line("synonyms-list", meaning.synonyms.slice(0, 5).join(", ")));
    }
  });
}

function lookupWord(word) {
  addToHistory(word);
  const result = document.createElement("section");
  result.className = "lookup-result";
  result.append(line("command-line", `Lookup · ${word}`));
  const loading = line("loading", "Searching dictionary");
  loading.append(Object.assign(document.createElement("span"), { className: "loading-dots" }));
  result.append(loading);
  output.append(result);
  scrollOutput();

  chrome.runtime.sendMessage({ action: "getDictionaryMeaning", word }, (response) => {
    loading.remove();
    if (chrome.runtime.lastError || !response?.ok) {
      result.append(line("error", response?.error || "Dictionary service unavailable. Please try again."));
    } else {
      appendDefinition(response.data, result);
    }
    scrollOutput();
  });
}

function showHistory() {
  const section = document.createElement("section");
  section.className = "lookup-result";
  section.append(line("part-of-speech", "Recent words"));
  if (!wordHistory.length) section.append(line("welcome-copy", "No words in history yet."));
  wordHistory.slice(0, 5).forEach((word) => {
    const row = line("", "");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-word";
    button.textContent = word;
    button.addEventListener("click", () => {
      wordInput.value = word;
      wordInput.focus();
    });
    row.append(button);
    section.append(row);
  });
  output.append(section);
  scrollOutput();
}

function clearOutput() {
  output.replaceChildren(line("welcome-title", "Ready for another word."));
  wordInput.focus();
}

function refreshAiSettings() {
  if (typeof chrome === "undefined" || !chrome.runtime) return;
  chrome.runtime.sendMessage({ action: "getSettings" }, (settings) => {
    if (chrome.runtime.lastError || !settings) return;
    aiMode.checked = !!settings.aiMode;
    configureAi.textContent = settings.hasGeminiKey ? "Update key" : "Configure key";
    removeAiKey.disabled = !settings.hasGeminiKey;
  });
}

wordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const word = wordInput.value.trim();
    if (word) lookupWord(word);
    wordInput.value = "";
  } else if (event.key === "Escape") {
    wordInput.value = "";
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    navigateHistory(1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    navigateHistory(-1);
  }
});

historyBtn.addEventListener("click", showHistory);
clearBtn.addEventListener("click", clearOutput);
configureAi.addEventListener("click", () => {
  geminiKey.value = "";
  keyDialog.showModal();
});
keyForm.addEventListener("submit", (event) => {
  if (event.submitter?.id !== "saveKey") return;
  event.preventDefault();
  chrome.runtime.sendMessage({ action: "saveGeminiKey", key: geminiKey.value.trim() }, (result) => {
    if (!result?.ok) {
      aiMessage.textContent = "Enter a valid Gemini API key.";
      return;
    }
    extensionStorage?.sync.set({ aiMode: true });
    keyDialog.close();
    aiMessage.textContent = "Context mode enabled.";
    refreshAiSettings();
  });
});
aiMode.addEventListener("change", () => {
  if (!aiMode.checked) {
    extensionStorage?.sync.set({ aiMode: false });
    return;
  }
  chrome.runtime.sendMessage({ action: "getAiStatus" }, (status) => {
    if (!status?.hasGeminiKey) {
      aiMode.checked = false;
      keyDialog.showModal();
    } else {
      extensionStorage?.sync.set({ aiMode: true });
    }
  });
});
removeAiKey.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "removeGeminiKey" }, () => {
    aiMessage.textContent = "API key removed.";
    refreshAiSettings();
  });
});

if (extensionStorage) {
  extensionStorage.local.get(["wordHistory"], (result) => {
    wordHistory = Array.isArray(result.wordHistory) ? result.wordHistory.slice(0, MAX_HISTORY_SIZE) : [];
  });
  extensionStorage.sync.get(["enabled"], (result) => setStatus(result.enabled !== false));
  extensionStorage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && changes.enabled) setStatus(changes.enabled.newValue !== false);
    if (namespace === "sync" && changes.aiMode) aiMode.checked = changes.aiMode.newValue === true;
  });
}

refreshAiSettings();
wordInput.focus();
