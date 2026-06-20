const DEFAULTS = { enabled: true, autoHide: true, hideDelay: 5 };

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("popupContainer");
  const listView = document.getElementById("listView");
  const settingsView = document.getElementById("settingsView");

  // Navigation: Go to settings
  const openSettings = () => {
    loadSettings();
    container.classList.add("show-settings");
  };

  const closeSettings = () => {
    container.classList.remove("show-settings");
  };

  // Bind settings toggle to row and three dots
  const sbRow = document.getElementById("superbookRow");
  if (sbRow) {
    sbRow.addEventListener("click", (e) => {
      // Don't open if clicked on specific icon action buttons directly (like pin)
      if (e.target.closest(".action-pin-btn")) return;
      openSettings();
    });
  }

  const sbMenuBtn = document.getElementById("superbookMenuBtn");
  if (sbMenuBtn) {
    sbMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent duplicate trigger from row click
      openSettings();
    });
  }

  // Navigation: Go back
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", closeSettings);
  }

  // Navigation: Close popup
  const closeBtns = [
    document.getElementById("closeBtn"),
    document.getElementById("settingsCloseBtn"),
  ];
  closeBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", () => window.close());
    }
  });

  // Footer: Manage extensions (opens settings popup at top-right)
  const manageBtn = document.getElementById("manageBtn");
  if (manageBtn) {
    manageBtn.addEventListener("click", () => {
      if (typeof chrome !== "undefined" && chrome.windows && chrome.windows.create) {
        const w = 400;
        const h = 460;
        chrome.windows.create({
          url: "options.html",
          type: "popup",
          width: w,
          height: h,
          left: window.screen.availWidth - w - 20,
          top: 20,
        });
      } else if (chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open("options.html", "SuperBook Settings", "width=400,height=460");
      }
    });
  }

  // Load settings from chrome storage
  function loadSettings() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(DEFAULTS, (items) => {
        document.getElementById("enabled").checked = items.enabled;
        document.getElementById("autoHide").checked = items.autoHide;
        document.getElementById("hideDelay").value = items.hideDelay;
      });
    } else {
      // Fallback local storage mock for standalone visual preview testing
      document.getElementById("enabled").checked = localStorage.getItem("sb_enabled") !== "false";
      document.getElementById("autoHide").checked = localStorage.getItem("sb_autoHide") !== "false";
      document.getElementById("hideDelay").value = localStorage.getItem("sb_hideDelay") || "5";
    }
  }

  // Show visual toast saved alert
  function showToast() {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2000);
    }
  }

  // Save settings logic
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const settings = {
        enabled: document.getElementById("enabled").checked,
        autoHide: document.getElementById("autoHide").checked,
        hideDelay: Number(document.getElementById("hideDelay").value),
      };

      const origText = saveBtn.textContent;
      saveBtn.textContent = "Saved!";
      saveBtn.classList.add("saved");

      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set(settings, () => {
          showToast();
          // Inform active tabs about status change immediately
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  action: "toggleExtension",
                  enabled: settings.enabled,
                }).catch(() => {});
              }
            });
          });

          setTimeout(() => {
            saveBtn.textContent = origText;
            saveBtn.classList.remove("saved");
          }, 1500);
        });
      } else {
        // Fallback local storage sync mock
        localStorage.setItem("sb_enabled", settings.enabled);
        localStorage.setItem("sb_autoHide", settings.autoHide);
        localStorage.setItem("sb_hideDelay", settings.hideDelay);
        showToast();
        setTimeout(() => {
          saveBtn.textContent = origText;
          saveBtn.classList.remove("saved");
        }, 1500);
      }
    });
  }

  // Initial load
  loadSettings();
});
