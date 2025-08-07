document.addEventListener('DOMContentLoaded', function() {
  function getSavedPerc(cb) {
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['attendance_min_selected'], res => {
        cb(res.attendance_min_selected || "0.85");
      });
    } else {
      cb("0.85");
    }
  }
  function setSavedPerc(val) {
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({attendance_min_selected: val});
    }
  }

  const btns = Array.from(document.querySelectorAll('.perc-btn'));
  function selectBtn(value) {
    btns.forEach(btn => {
      if (btn.getAttribute("data-attn") === value) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });
  }
  // On load -- restore
  getSavedPerc(function(saved) {
    selectBtn(saved);
  });

  btns.forEach(btn => btn.addEventListener('click', function() {
    const val = btn.getAttribute("data-attn");
    setSavedPerc(val);
    selectBtn(val);
    document.getElementById("popupSaveStatus").textContent = `Saved: ${Math.round(val*100)}%`;
    setTimeout(() => {
      document.getElementById("popupSaveStatus").textContent = "";
    }, 1100);
    // Real-time update for content.js (live tab)
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "UPDATE_ATTENDANCE_PERCENTAGE", value: val },
          function(response) {
            if (chrome.runtime.lastError) {
              // not on Chalkpad/no listener - ignore error
            }
          }
        );
      });
    }
  }));
});
