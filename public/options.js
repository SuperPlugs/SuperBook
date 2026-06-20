const DEFAULTS = { enabled: true, autoHide: true, hideDelay: 5 };

document.addEventListener("DOMContentLoaded", () => {
  function loadSettings() {
    chrome.storage.sync.get(DEFAULTS, (items) => {
      document.getElementById("enabled").checked = items.enabled;
      document.getElementById("autoHide").checked = items.autoHide;
      document.getElementById("hideDelay").value = items.hideDelay;
    });
  }

  function showToast() {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  document.getElementById("closeBtn").addEventListener("click", () => window.close());

  document.getElementById("saveBtn").addEventListener("click", () => {
    const settings = {
      enabled: document.getElementById("enabled").checked,
      autoHide: document.getElementById("autoHide").checked,
      hideDelay: Number(document.getElementById("hideDelay").value),
    };

    const btn = document.getElementById("saveBtn");
    const orig = btn.textContent;
    btn.textContent = "Saved!";
    btn.classList.add("saved");

    chrome.storage.sync.set(settings, () => {
      showToast();
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: "toggleExtension",
              enabled: settings.enabled,
            }).catch(() => {});
          }
        }
      });
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove("saved");
      }, 1500);
    });
  });

  loadSettings();
});
