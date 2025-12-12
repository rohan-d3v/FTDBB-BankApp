function updateStatusTime() {
  const nodes = document.querySelectorAll('[data-role="status-time"]');
  if (!nodes.length) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  nodes.forEach((node) => {
    node.textContent = `${hh}:${mm}`;
  });
}

function initBackButtons() {
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      history.back();
    });
  });
}

function initKycSelection() {
  const options = document.querySelectorAll("[data-kyc-option]");
  if (!options.length) return;
  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      options.forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
    });
  });
}

function initQualitySelector() {
  const pills = document.querySelectorAll("[data-quality]");
  const frame = document.querySelector("[data-camera-frame]");
  const status = document.querySelector("[data-quality-status]");
  if (!pills.length || !frame || !status) return;

  const messages = {
    good: "Readable, may need re-check",
    better: "Clear and recommended",
    best: "Optimal clarity — fastest verification",
  };

  const applyQuality = (value) => {
    pills.forEach((p) => p.classList.toggle("selected", p.dataset.quality === value));
    frame.classList.remove("good", "better", "best");
    frame.classList.add(value);
    status.textContent = messages[value] || "";
  };

  pills.forEach((pill) => {
    pill.addEventListener("click", () => applyQuality(pill.dataset.quality));
  });

  // Default to Better
  applyQuality("better");

  const rescan = document.querySelector("[data-rescan]");
  if (rescan) {
    rescan.addEventListener("click", (e) => {
      e.preventDefault();
      frame.classList.remove("flash");
      void frame.offsetWidth; // reset animation
      frame.classList.add("flash");
    });
  }
}

function initGoalChips() {
  const chips = document.querySelectorAll("[data-goal-chip]");
  if (!chips.length) return;
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
    });
  });
}

function initRiskSegments() {
  const segments = document.querySelectorAll("[data-risk-option]");
  if (!segments.length) return;
  segments.forEach((segment) => {
    segment.addEventListener("click", () => {
      segments.forEach((s) => s.classList.remove("selected"));
      segment.classList.add("selected");
    });
  });
}

function initConnectDemo() {
  const connectBtn = document.querySelector("[data-connect]");
  const continueBtn = document.querySelector("[data-connect-continue]");
  const statusEl = document.querySelector("[data-connect-status]");
  const skipBtn = document.querySelector("[data-connect-skip]");

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      localStorage.setItem("openBankingConnected", "false");
    });
  }

  if (!connectBtn) return;

  const setConnected = () => {
    connectBtn.textContent = "Connected ✓";
    connectBtn.setAttribute("aria-pressed", "true");
    connectBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = "Connected securely";
    }
    if (continueBtn) {
      continueBtn.removeAttribute("disabled");
    }
    localStorage.setItem("openBankingConnected", "true");
  };

  connectBtn.addEventListener("click", () => {
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Connecting…';
    if (statusEl) statusEl.textContent = "Connecting…";
    setTimeout(setConnected, 1000);
  });
}

function initCompletionSummary() {
  const statusEl = document.querySelector("[data-open-banking-status]");
  if (!statusEl) return;
  const connected = localStorage.getItem("openBankingConnected") === "true";
  statusEl.textContent = connected ? "Open Banking: Connected" : "Open Banking: Skipped";
}

document.addEventListener("DOMContentLoaded", () => {
  updateStatusTime();
  setInterval(updateStatusTime, 30_000);
  initBackButtons();
  initKycSelection();
  initQualitySelector();
  initGoalChips();
  initRiskSegments();
  initConnectDemo();
  initCompletionSummary();
});
