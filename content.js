// Utility: get % from chrome.storage.sync (async + fallback)
function getCurrentMinAttendance(callback) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['attendance_min_selected'], function(res) {
      let v = res.attendance_min_selected;
      callback(parseFloat(v) || 0.85);
    });
  } else {
    callback(0.85);
  }
}

// Main block as a rerunnable function:
function updateAttendanceUI(minAttendance) {
  const table = document.getElementById("masterGridTable");
  if (!table) return;

  // Remove headers previously added by this script
  ["attn-lecture","attn-status"].forEach(key => {
    const th = table.querySelector('th[data-added="'+key+'"]');
    if (th) th.remove();
    table.querySelectorAll('td[data-added="'+key+'"]').forEach(td=>td.remove());
  });

  const attnText = `as per ${Math.round(minAttendance * 100)}%`;
  const toggleTip = "Present count: 1 for 50 mins class, or 2 for 100 mins class";
  const ALL_LECTURE_MODE_KEY = "lecture_mode__ALL__";
  const headerRow = table.querySelector("tr");
  if (!headerRow) return;

  // ADD HEADERS
  const lectureModeTH = document.createElement("th");
  lectureModeTH.setAttribute("data-added","attn-lecture");
  lectureModeTH.style.textAlign = "center";
  lectureModeTH.style.width = "52px";
  lectureModeTH.style.minWidth = "44px";
  lectureModeTH.style.padding = "0";
  lectureModeTH.title = toggleTip;
  lectureModeTH.innerHTML = `
    <span style="font-size:1.25em;font-weight:bold;line-height:1;cursor:pointer;" title="${toggleTip}">⌚️</span>
    <div style="display:flex;align-items:center;justify-content:center;gap:2px;margin-top:2px;">
      <span style="font-size:11px;font-weight:bold;cursor:pointer;" id="allLabel1x" title="${toggleTip}">1x</span>
      <div id="allToggle" style="width:16px;height:11px;position:relative;background:#ccc;border-radius:10px;cursor:pointer;" title="${toggleTip}">
        <div id="allKnob" style="width:7px;height:7px;position:absolute;top:2px;left:2px;border-radius:50%;background:#fff;transition:left 0.18s;"></div>
      </div>
      <span style="font-size:11px;font-weight:bold;cursor:pointer;" id="allLabel2x" title="${toggleTip}">2x</span>
    </div>
  `;
  headerRow.appendChild(lectureModeTH);

  const statusTH = document.createElement("th");
  statusTH.setAttribute("data-added","attn-status");
  statusTH.style.textAlign = "center";
  statusTH.style.maxWidth = "220px";
  statusTH.style.whiteSpace = "normal";
  statusTH.innerHTML = `
    <div style="font-size:1.08em;font-weight:bold;line-height:1.1;">Attendance Status</div>
    <div style="font-size:11px;font-weight:bold;color:#195edc;margin-top:2px;">${attnText}</div>
  `;
  headerRow.appendChild(statusTH);

  // Per-row logic
  const getInt = (cell) => parseInt(cell?.textContent.trim(), 10) || 0;
  const rows = table.querySelectorAll("tr");
  const modeObjs = [];
  for (let i = 1; i < rows.length; ++i) {
    const row = rows[i];
    const cells = row.querySelectorAll("td");
    if (!cells.length) continue;
    const subject = cells[2]?.textContent.trim() || "";
    const subjectKey = subject?.toLowerCase().replace(/\s+/g, "_");
    if (!subjectKey || subject.toLowerCase().includes("paid")
     || subject.toLowerCase().includes("session")
     || !isNaN(Date.parse(subject))) continue;

    const delivered = getInt(cells[5]);   // total lectures
    const attended = getInt(cells[6]);    // attended
    const usedDuty = getInt(cells[8]);    // used duty leave
    const usedMedical = getInt(cells[9]); // used medical leave
    const totalApprovedDuty = getInt(cells[11]);
    const totalApprovedMedical = getInt(cells[12]);
    if (delivered === 0) continue;

    // LECTURE DURATION CELL
    const localStorageKey = `lecture_mode_${subjectKey}`;
    let modeValue = 2; // default to 2x
    if (localStorage.getItem(localStorageKey) !== null) {
      modeValue = localStorage.getItem(localStorageKey) === "2" ? 2 : 1;
    } else {
      const allMode = Number(localStorage.getItem(ALL_LECTURE_MODE_KEY));
      if ([1, 2].includes(allMode)) {
        modeValue = allMode;
      } else {
        modeValue = 2;
      }
    }

    const modeTD = document.createElement("td");
    modeTD.setAttribute("data-added","attn-lecture");
    if (cells[0]) modeTD.style.backgroundColor = window.getComputedStyle(cells[0]).backgroundColor;
    modeTD.style.textAlign = "center";
    modeTD.style.padding = "0";
    modeTD.style.width = "44px";
    modeTD.style.overflow = "hidden";
    const rowToggleBar = document.createElement("div");
    rowToggleBar.style.display = "flex";
    rowToggleBar.style.alignItems = "center";
    rowToggleBar.style.justifyContent = "center";
    rowToggleBar.style.gap = "2px";
    const label1x = document.createElement("span");
    label1x.textContent = "1";
    label1x.title = toggleTip;
    label1x.style.fontWeight = "bold";
    label1x.style.fontSize = "11px";
    label1x.style.cursor = "pointer";
    const toggle = document.createElement("div");
    toggle.title = toggleTip;
    toggle.style.width = "16px";
    toggle.style.height = "11px";
    toggle.style.borderRadius = "10px";
    toggle.style.backgroundColor = "#ccc";
    toggle.style.position = "relative";
    toggle.style.cursor = "pointer";
    const knob = document.createElement("div");
    knob.style.width = "7px";
    knob.style.height = "7px";
    knob.style.borderRadius = "50%";
    knob.style.backgroundColor = "#fff";
    knob.style.position = "absolute";
    knob.style.top = "2px";
    knob.style.left = "2px";
    knob.style.transition = "left 0.17s";
    toggle.appendChild(knob);
    const label2x = document.createElement("span");
    label2x.textContent = "2";
    label2x.title = toggleTip;
    label2x.style.fontWeight = "bold";
    label2x.style.fontSize = "11px";
    label2x.style.cursor = "pointer";
    rowToggleBar.append(label1x, toggle, label2x);
    modeTD.appendChild(rowToggleBar);
    row.appendChild(modeTD);

    // ATTENDANCE STATUS CELL
    const statusTD = document.createElement("td");
    statusTD.setAttribute("data-added","attn-status");
    statusTD.style.textAlign = "center";
    statusTD.style.fontWeight = "bold";
    statusTD.style.fontSize = "1.14em";
    statusTD.style.maxWidth = "220px";
    statusTD.style.overflowWrap = "anywhere";
    statusTD.style.whiteSpace = "normal";
    statusTD.style.padding = "8px 3px";
    statusTD.style.lineHeight = "1.16";
    if (cells[0]) statusTD.style.backgroundColor = window.getComputedStyle(cells[0]).backgroundColor;
    row.appendChild(statusTD);

    // BASE attended includes only physical attendance + already-applied leaves
    const baseAttended = attended + usedDuty + usedMedical;

    const remainingApproved = Math.max(0,
      (totalApprovedDuty + totalApprovedMedical) - (usedDuty + usedMedical)
    );

    const TRIGGER_THRESHOLD = 0.65;
    const MAX_RELIEF_PERCENT = 0.75;

    function computeAppliedLeavesAndAttended() {
      const basePercent = baseAttended / delivered;
      if (basePercent >= TRIGGER_THRESHOLD || remainingApproved <= 0) {
        return { appliedLeaves: 0, finalAttended: baseAttended };
      }
      const neededToReachCap = Math.ceil(Math.max(0, MAX_RELIEF_PERCENT * delivered - baseAttended));
      const appliedLeaves = Math.min(remainingApproved, neededToReachCap);
      const finalAttended = baseAttended + appliedLeaves;
      return { appliedLeaves, finalAttended };
    }

    const { appliedLeaves, finalAttended } = computeAppliedLeavesAndAttended();

    function updateStatus() {
      const factor = modeValue;
      const effDelivered = Math.floor(delivered / factor);
      const effAttended = Math.floor(finalAttended / factor);
      const bunkable = Math.floor(effAttended / minAttendance - effDelivered);
      let status;
      if (bunkable > 0) {
        status = `😎 Bunk ${bunkable} safely`;
        statusTD.style.color = "#17860a";
      } else if (bunkable === 0) {
        status = `😬 At limit!`;
        statusTD.style.color = "#be7800";
      } else {
        const need = Math.ceil((minAttendance * effDelivered - effAttended) / (1 - minAttendance));
        status = `🚨 Attend ${need} to recover`;
        statusTD.style.color = "#d10019";
      }
      if (appliedLeaves > 0) {
        statusTD.textContent = `${status} (Applied ${appliedLeaves} approved leave${appliedLeaves>1?'s':''} — capped to ${Math.round(MAX_RELIEF_PERCENT*100)}%)`;
      } else {
        statusTD.textContent = status;
      }
    }

    function renderToggleUI() {
      if (modeValue === 2) {
        knob.style.left = "7px";
        toggle.style.backgroundColor = "#66bb6a";
      } else {
        knob.style.left = "2px";
        toggle.style.backgroundColor = "#ccc";
      }
      updateStatus();
    }

    function setMode(val, doSave = true) {
      modeValue = val;
      renderToggleUI();
      if (doSave) localStorage.setItem(localStorageKey, val);
    }

    toggle.addEventListener("click", () => setMode(modeValue === 1 ? 2 : 1, true));
    label1x.addEventListener("click", () => setMode(1, true));
    label2x.addEventListener("click", () => setMode(2, true));
    renderToggleUI();
    modeObjs.push({ set: setMode, get: () => modeValue, key: localStorageKey });
  }

  // --- ALL TOGGLE HANDLER ---
  setTimeout(() => {
    const allToggle = document.getElementById("allToggle");
    const allKnob = document.getElementById("allKnob");
    const allLabel1x = document.getElementById("allLabel1x");
    const allLabel2x = document.getElementById("allLabel2x");
    if (!allToggle || !allKnob || !allLabel1x || !allLabel2x) return;
    let allVal = Number(localStorage.getItem("lecture_mode__ALL__"));
    if (![1, 2].includes(allVal)) allVal = 2; // default global toggle = 2x
    function renderAllUI(val) {
      if (val === 2) {
        allKnob.style.left = "7px";
        allToggle.style.backgroundColor = "#66bb6a";
      } else {
        allKnob.style.left = "2px";
        allToggle.style.backgroundColor = "#ccc";
      }
    }
    function setAll(val) {
      allVal = val;
      localStorage.setItem("lecture_mode__ALL__", allVal);
      for (const m of modeObjs) m.set(val, true);
      renderAllUI(allVal);
    }
    allToggle.addEventListener("click", () => setAll(allVal === 1 ? 2 : 1));
    allLabel1x.addEventListener("click", () => setAll(1));
    allLabel2x.addEventListener("click", () => setAll(2));
    renderAllUI(allVal);
  }, 30);
}

// ---- On initial load
getCurrentMinAttendance(function(minAttendance) {
  updateAttendanceUI(minAttendance);
});

// ---- Listen for live updates from popup (no reload needed)
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "UPDATE_ATTENDANCE_PERCENTAGE") {
      updateAttendanceUI(parseFloat(msg.value) || 0.85);
    }
  });
}
