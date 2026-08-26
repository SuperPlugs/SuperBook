const wordInput = document.getElementById("wordInput");
const output = document.getElementById("output");
const cursor = document.getElementById("cursor");
const statusIndicator = document.getElementById("statusIndicator");

// Word history management
let wordHistory = [];
const MAX_HISTORY_SIZE = 10;

// Load word history from storage
chrome.storage.local.get(["wordHistory"], (result) => {
  wordHistory = result.wordHistory || [];
});

// Check extension status
chrome.storage.sync.get(["enabled"], (result) => {
  const enabled = result.enabled !== false;
  statusIndicator.className = `status-indicator ${
    enabled ? "status-enabled" : "status-disabled"
  }`;
  statusIndicator.textContent = `● ${enabled ? "online" : "offline"}`;
});

// Focus input on load
wordInput.focus();

// Handle cursor visibility
wordInput.addEventListener("focus", () => {
  cursor.style.display = "none";
});

wordInput.addEventListener("blur", () => {
  cursor.style.display = "inline-block";
});

// Handle input events
wordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const word = wordInput.value.trim();
    if (word) {
      lookupWord(word);
      wordInput.value = "";
    }
  } else if (e.key === "Escape") {
    wordInput.value = "";
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    navigateHistory(-1);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    navigateHistory(1);
  }
});

// History navigation
let historyIndex = -1;
function navigateHistory(direction) {
  if (wordHistory.length === 0) return;

  historyIndex += direction;

  if (historyIndex < 0) {
    historyIndex = -1;
    wordInput.value = "";
  } else if (historyIndex >= wordHistory.length) {
    historyIndex = wordHistory.length - 1;
  } else {
    wordInput.value = wordHistory[historyIndex];
  }
}

// Dictionary API lookup
async function lookupWord(word) {
  // Add word to history
  addToHistory(word);

  const commandLine = document.createElement("div");
  commandLine.className = "output-line command-line";
  commandLine.textContent = `dict@lookup:~$ define "${word}"`;
  output.appendChild(commandLine);

  // Show loading
  const loadingLine = document.createElement("div");
  loadingLine.className = "output-line loading";
  loadingLine.innerHTML =
    '<span>Searching dictionary<span class="loading-dots"></span></span>';
  output.appendChild(loadingLine);

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word.toLowerCase()
      )}`
    );

    // Remove loading line
    loadingLine.remove();

    if (!response.ok) {
      throw new Error("Word not found");
    }

    const data = await response.json();
    displayDefinition(data[0]);
  } catch (error) {
    loadingLine.remove();
    displayError(word);
  }

  // Scroll to bottom
  output.scrollTop = output.scrollHeight;
}

function displayDefinition(entry) {
  // Word title
  const wordTitle = document.createElement("div");
  wordTitle.className = "output-line word-title";
  wordTitle.textContent = `📖 ${entry.word.toUpperCase()}`;
  output.appendChild(wordTitle);

  // Phonetic
  if (entry.phonetic || (entry.phonetics && entry.phonetics[0])) {
    const phonetic = document.createElement("div");
    phonetic.className = "output-line phonetic";
    phonetic.textContent = `🔊 ${
      entry.phonetic || entry.phonetics[0].text || ""
    }`;
    output.appendChild(phonetic);
  }

  // Meanings
  entry.meanings.forEach((meaning, index) => {
    // Part of speech
    const pos = document.createElement("div");
    pos.className = "output-line part-of-speech";
    pos.textContent = `[${meaning.partOfSpeech.toUpperCase()}]`;
    output.appendChild(pos);

    // Definitions
    meaning.definitions.slice(0, 3).forEach((def, defIndex) => {
      const definition = document.createElement("div");
      definition.className = "output-line definition";
      definition.textContent = `${defIndex + 1}. ${def.definition}`;
      output.appendChild(definition);

      // Example
      if (def.example) {
        const example = document.createElement("div");
        example.className = "output-line example";
        example.textContent = `   "${def.example}"`;
        output.appendChild(example);
      }
    });

    // Synonyms
    if (meaning.synonyms && meaning.synonyms.length > 0) {
      const synonymsLabel = document.createElement("div");
      synonymsLabel.className = "output-line synonyms";
      synonymsLabel.textContent = "synonyms:";
      output.appendChild(synonymsLabel);

      const synonymsList = document.createElement("div");
      synonymsList.className = "output-line synonyms-list";
      synonymsList.textContent = meaning.synonyms.slice(0, 5).join(", ");
      output.appendChild(synonymsList);
    }

    // Add spacing between meanings
    if (index < entry.meanings.length - 1) {
      const spacer = document.createElement("div");
      spacer.className = "output-line";
      spacer.innerHTML = "&nbsp;";
      output.appendChild(spacer);
    }
  });

  // Add final spacing
  const spacer = document.createElement("div");
  spacer.className = "output-line";
  spacer.innerHTML = "&nbsp;";
  output.appendChild(spacer);
}

function displayError(word) {
  const errorLine = document.createElement("div");
  errorLine.className = "output-line error";
  errorLine.textContent = `❌ Error: No definition found for "${word}"`;
  output.appendChild(errorLine);

  const spacer = document.createElement("div");
  spacer.className = "output-line";
  spacer.innerHTML = "&nbsp;";
  output.appendChild(spacer);
}

// Add word to history
function addToHistory(word) {
  // Remove word if it already exists (to move it to front)
  const index = wordHistory.indexOf(word);
  if (index > -1) {
    wordHistory.splice(index, 1);
  }

  // Add to beginning of array
  wordHistory.unshift(word);

  // Limit history size
  if (wordHistory.length > MAX_HISTORY_SIZE) {
    wordHistory = wordHistory.slice(0, MAX_HISTORY_SIZE);
  }

  // Save to storage
  chrome.storage.local.set({ wordHistory });

  // Reset history navigation index
  historyIndex = -1;
}

// Show word history
function showHistory() {
  // Show loading state
  const loadingLine = document.createElement("div");
  loadingLine.className = "output-line loading";
  loadingLine.innerHTML =
    '<span>Loading history<span class="loading-dots"></span></span>';
  output.appendChild(loadingLine);

  // Simulate loading delay for better UX
  setTimeout(() => {
    loadingLine.remove();

    if (wordHistory.length === 0) {
      const noHistoryLine = document.createElement("div");
      noHistoryLine.className = "output-line";
      noHistoryLine.innerHTML =
        '<span style="color: #9ca3af;">No words in history yet.</span>';
      output.appendChild(noHistoryLine);
      return;
    }

    const historyTitle = document.createElement("div");
    historyTitle.className = "output-line";
    historyTitle.innerHTML =
      '<span style="color: #4ade80; font-weight: 600;">📚 Recent Words:</span>';
    output.appendChild(historyTitle);

    wordHistory.slice(0, 5).forEach((word, index) => {
      const historyItem = document.createElement("div");
      historyItem.className = "output-line";
      historyItem.style.paddingLeft = "16px";
      historyItem.innerHTML = `<span style="color: #60a5fa;">${
        index + 1
      }.</span> <span style="color: #e5e5e5; cursor: pointer;" onclick="wordInput.value='${word}'; wordInput.focus();">${word}</span>`;
      output.appendChild(historyItem);
    });

    const spacer = document.createElement("div");
    spacer.className = "output-line";
    spacer.innerHTML = "&nbsp;";
    output.appendChild(spacer);
  }, 150);
}

function clearOutput() {
  output.innerHTML = `
        <div class="output-line">
          <span style="color: #4ade80;">Terminal cleared.</span>
        </div>
        <div class="output-line">
          &nbsp;
        </div>
      `;
  wordInput.focus();
}

// Auto-focus when clicking anywhere in terminal
document.addEventListener("click", (e) => {
  if (!e.target.matches("button, a, input")) {
    wordInput.focus();
  }
});
