function resetOnReload() {
  try {
    let isReload = false;
    if (performance.getEntriesByType) {
      const entries = performance.getEntriesByType("navigation");
      if (entries && entries.length) {
        isReload = entries[0].type === "reload";
      }
    }
    if (!isReload && performance.navigation) {
      isReload = performance.navigation.type === performance.navigation.TYPE_RELOAD;
    }
    if (isReload) {
      localStorage.clear();
      sessionStorage.clear();
      const path = window.location.pathname || "";
      if (!path.endsWith("/index.html") && !path.endsWith("index.html") && !path.endsWith("/")) {
        window.location.replace("index.html");
      }
    }
  } catch {
    // ignore detection errors
  }
}

resetOnReload();

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
  const hint = document.querySelector("[data-kyc-hint]");
  const continueBtn = document.querySelector("[data-kyc-continue]");
  if (!options.length) return;

  const messages = {
    best: "Passport is the fastest option and usually verifies in under a minute.",
    better: "Driving licence is fully supported but may take a little longer to verify.",
    good: "National ID works too, but we might request extra details if the scan isn't clear.",
  };

  const selectOption = (opt) => {
    options.forEach((o) => o.classList.remove("selected"));
    opt.classList.add("selected");
    if (hint) {
      const tier = opt.dataset.kycTier;
      const text = messages[tier] || "";
      hint.textContent = text;
      hint.classList.toggle("has-text", Boolean(text));
    }
    if (continueBtn) {
      continueBtn.classList.remove("is-disabled");
      continueBtn.setAttribute("aria-disabled", "false");
      continueBtn.setAttribute("tabindex", "0");
    }
  };

  options.forEach((opt) => {
    opt.addEventListener("click", () => selectOption(opt));
  });

  if (hint) {
    hint.textContent = "";
    hint.classList.remove("has-text");
  }

  if (continueBtn) {
    continueBtn.classList.add("is-disabled");
    continueBtn.setAttribute("aria-disabled", "true");
    continueBtn.setAttribute("tabindex", "-1");
    continueBtn.addEventListener("click", (event) => {
      if (continueBtn.classList.contains("is-disabled")) {
        event.preventDefault();
      }
    });
  }
}

function initCaptureFlow() {
  const captureBtn = document.querySelector("[data-capture-trigger]");
  const continueBtn = document.querySelector("[data-capture-continue]");
  const frame = document.querySelector("[data-camera-frame]");
  const rescanBtn = document.querySelector("[data-rescan]");
  const frameText = document.querySelector("[data-frame-text]");
  if (!captureBtn || !continueBtn || !frame) return;
  const storage = window.sessionStorage || window.localStorage;

  const setCaptured = (captured) => {
    continueBtn.classList.toggle("is-disabled", !captured);
    continueBtn.setAttribute("aria-disabled", String(!captured));
    continueBtn.setAttribute("tabindex", captured ? "0" : "-1");
    frame.classList.toggle("captured", captured);
    captureBtn.classList.toggle("captured", captured);
    captureBtn.setAttribute("aria-pressed", String(captured));
    if (frameText) {
      frameText.textContent = captured ? "Placeholder ID" : "Align your ID inside the frame";
      frameText.classList.toggle("placeholder", captured);
    }
    storage.setItem("documentCaptureCompleted", String(captured));
  };

  captureBtn.addEventListener("click", () => {
    frame.classList.remove("flash");
    void frame.offsetWidth;
    frame.classList.add("flash");
    setCaptured(true);
  });

  continueBtn.addEventListener("click", (event) => {
    if (continueBtn.classList.contains("is-disabled")) {
      event.preventDefault();
    }
  });

  if (rescanBtn) {
    rescanBtn.addEventListener("click", () => {
      frame.classList.remove("flash", "captured");
      captureBtn.classList.remove("captured");
      setCaptured(false);
    });
  }

  const storedState = storage.getItem("documentCaptureCompleted") === "true";
  setCaptured(storedState);
}

function initSelfieCaptureFlow() {
  const captureBtn = document.querySelector("[data-selfie-trigger]");
  const continueBtn = document.querySelector("[data-selfie-continue]");
  const frame = document.querySelector("[data-selfie-frame]");
  const resetBtn = document.querySelector("[data-selfie-reset]");
  const textEl = document.querySelector("[data-selfie-text]");
  if (!captureBtn || !continueBtn || !frame) return;
  const storage = window.sessionStorage || window.localStorage;

  const setCaptured = (captured) => {
    continueBtn.classList.toggle("is-disabled", !captured);
    continueBtn.setAttribute("aria-disabled", String(!captured));
    continueBtn.setAttribute("tabindex", captured ? "0" : "-1");
    frame.classList.toggle("captured", captured);
    captureBtn.classList.toggle("captured", captured);
    captureBtn.setAttribute("aria-pressed", String(captured));
    if (textEl) {
      textEl.textContent = captured ? "Placeholder selfie" : "Center your face";
      textEl.classList.toggle("placeholder", captured);
    }
    storage.setItem("selfieCaptureCompleted", String(captured));
  };

  captureBtn.addEventListener("click", () => {
    setCaptured(true);
  });

  continueBtn.addEventListener("click", (event) => {
    if (continueBtn.classList.contains("is-disabled")) {
      event.preventDefault();
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setCaptured(false);
    });
  }

  const storedState = storage.getItem("selfieCaptureCompleted") === "true";
  setCaptured(storedState);
}
function initGoalChips() {
  const chips = document.querySelectorAll("[data-goal-chip]");
  if (!chips.length) return;
  const storageKey = "selectedGoals";

  const normalize = (value) => (value || "").trim().toLowerCase();
  const getId = (chip) => normalize(chip.dataset.goalId || chip.textContent.trim());
  const defaultIds = Array.from(chips)
    .filter((chip) => chip.hasAttribute("data-goal-default"))
    .map(getId);

  const fallbackIds = () => {
    if (defaultIds.length) return defaultIds;
    return chips.length ? [getId(chips[0])] : [];
  };

  const applySelection = (ids) => {
    chips.forEach((chip) => {
      const chipId = getId(chip);
      const fallbackText = normalize(chip.textContent);
      const isSelected = ids.some((id) => id === chipId || id === fallbackText);
      chip.classList.toggle("selected", isSelected);
    });
  };

  const persistSelection = (ids) => {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  };

  const loadSelection = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          applySelection(parsed);
          return;
        }
      } catch {
        // ignore invalid data
      }
    }
    const defaults = fallbackIds();
    if (defaults.length) {
      applySelection(defaults);
      persistSelection(defaults);
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      const selectedIds = Array.from(chips)
        .filter((c) => c.classList.contains("selected"))
        .map(getId);
      if (!selectedIds.length) {
        const defaults = fallbackIds();
        applySelection(defaults);
        persistSelection(defaults);
      } else {
        persistSelection(selectedIds);
      }
    });
  });

  loadSelection();
}

function initRiskSegments() {
  const segments = document.querySelectorAll("[data-risk-option]");
  if (!segments.length) return;
  const storageKey = "selectedRisk";

  const normalize = (value) => (value || "").trim().toLowerCase();
  const getId = (segment) => normalize(segment.dataset.riskId || segment.textContent.trim());
  const defaultSegment =
    Array.from(segments).find((seg) => seg.hasAttribute("data-risk-default")) || segments[0];

  const applySelection = (id) => {
    const normalizedId = normalize(id);
    segments.forEach((segment) => {
      const segId = getId(segment);
      const label = normalize(segment.textContent);
      const isActive = segId === normalizedId || label === normalizedId;
      segment.classList.toggle("selected", isActive);
    });
  };

  const persistSelection = (id) => {
    if (id) {
      localStorage.setItem(storageKey, id);
    }
  };

  const loadSelection = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      applySelection(stored);
    } else if (defaultSegment) {
      const id = getId(defaultSegment);
      applySelection(id);
      persistSelection(id);
    }
  };

  segments.forEach((segment) => {
    segment.addEventListener("click", () => {
      const id = getId(segment);
      applySelection(id);
      persistSelection(id);
    });
  });

  loadSelection();
}

function initConnectDemo() {
  const connectBtn = document.querySelector("[data-connect]");
  const continueBtn = document.querySelector("[data-connect-continue]");
  const statusEl = document.querySelector("[data-connect-status]");
  const skipBtn = document.querySelector("[data-connect-skip]");
  const spinnerEl = document.querySelector("[data-connect-spinner]");
  const bankOptions = document.querySelectorAll("[data-bank-option]");
  const modal = document.querySelector("[data-connect-modal]");

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      localStorage.setItem("openBankingConnected", "false");
    });
  }

  const closeModal = () => {
    if (modal) {
      modal.hidden = true;
    }
  };

  const openModal = () => {
    if (modal) {
      modal.hidden = false;
    }
  };

  const setConnected = () => {
    if (connectBtn) {
      connectBtn.textContent = "Connected ✓";
      connectBtn.setAttribute("aria-pressed", "true");
      connectBtn.disabled = false;
      connectBtn.style.display = "none";
    }
    if (statusEl) {
      statusEl.textContent = "Connected securely";
    }
    if (spinnerEl) {
      spinnerEl.style.display = "none";
    }
    if (continueBtn) {
      continueBtn.classList.remove("is-disabled");
    }
    localStorage.setItem("openBankingConnected", "true");
  };

  const handleBankSelect = (option) => {
    bankOptions.forEach((opt) => opt.classList.remove("selected"));
    option.classList.add("selected");
    openModal();
    setTimeout(() => {
      closeModal();
      setConnected();
    }, 2000);
  };

  if (bankOptions.length) {
    bankOptions.forEach((option) => {
      option.addEventListener("click", () => handleBankSelect(option));
    });
  }

  if (!connectBtn) return;

  connectBtn.addEventListener("click", () => {
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Connecting…';
    if (statusEl) statusEl.textContent = "Connecting…";
    if (spinnerEl) spinnerEl.style.display = "inline-block";
    setTimeout(setConnected, 1000);
  });
}

function initCompletionSummary() {
  const statusEl = document.querySelector("[data-open-banking-status]");
  if (!statusEl) return;
  const connected = localStorage.getItem("openBankingConnected") === "true";
  statusEl.textContent = connected ? "Open Banking: Connected" : "Open Banking: Skipped";
}

function initConsentFlow() {
  const requiredChecks = document.querySelectorAll("[data-consent-required]");
  const continueBtn = document.querySelector("[data-consent-continue]");
  if (!requiredChecks.length || !continueBtn) return;

  const updateButtonState = () => {
    const allChecked = Array.from(requiredChecks).every((checkbox) => checkbox.checked);
    const isDisabled = !allChecked;
    continueBtn.classList.toggle("is-disabled", isDisabled);
    continueBtn.setAttribute("aria-disabled", String(isDisabled));
    continueBtn.setAttribute("tabindex", isDisabled ? "-1" : "0");
  };

  requiredChecks.forEach((checkbox) => {
    checkbox.addEventListener("change", updateButtonState);
  });

  continueBtn.addEventListener("click", (event) => {
    if (continueBtn.classList.contains("is-disabled")) {
      event.preventDefault();
    }
  });

  updateButtonState();
}

function initAccountForm() {
  const fields = document.querySelectorAll("[data-account-field]");
  const continueBtn = document.querySelector("[data-account-continue]");
  if (!fields.length || !continueBtn) return;

  const updateButtonState = () => {
    const allFilled = Array.from(fields).every((field) => field.value.trim().length > 0);
    const isDisabled = !allFilled;
    continueBtn.classList.toggle("is-disabled", isDisabled);
    continueBtn.setAttribute("aria-disabled", String(isDisabled));
    continueBtn.setAttribute("tabindex", isDisabled ? "-1" : "0");
  };

  fields.forEach((field) => {
    field.addEventListener("input", updateButtonState);
    field.addEventListener("change", updateButtonState);
  });

  window.addEventListener("pageshow", updateButtonState);

  continueBtn.addEventListener("click", (event) => {
    if (continueBtn.classList.contains("is-disabled")) {
      event.preventDefault();
    }
  });

  updateButtonState();
}

function initAddressForm() {
  const fields = document.querySelectorAll("[data-address-field]");
  const continueBtn = document.querySelector("[data-address-continue]");
  if (!fields.length || !continueBtn) return;

  const updateButtonState = () => {
    const allFilled = Array.from(fields).every((field) => field.value.trim().length > 0);
    const isDisabled = !allFilled;
    continueBtn.classList.toggle("is-disabled", isDisabled);
    continueBtn.setAttribute("aria-disabled", String(isDisabled));
    continueBtn.setAttribute("tabindex", isDisabled ? "-1" : "0");
  };

  fields.forEach((field) => {
    field.addEventListener("input", updateButtonState);
    field.addEventListener("change", updateButtonState);
  });

  window.addEventListener("pageshow", updateButtonState);

  continueBtn.addEventListener("click", (event) => {
    if (continueBtn.classList.contains("is-disabled")) {
      event.preventDefault();
    }
  });

  updateButtonState();
}

document.addEventListener("DOMContentLoaded", () => {
  updateStatusTime();
  setInterval(updateStatusTime, 30_000);
  initBackButtons();
  initKycSelection();
  initCaptureFlow();
  initSelfieCaptureFlow();
  initGoalChips();
  initRiskSegments();
  initConnectDemo();
  initCompletionSummary();
  initConsentFlow();
  initAccountForm();
  initAddressForm();
});
