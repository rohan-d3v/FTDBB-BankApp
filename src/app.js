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

function initSignInFlow() {
  const form = document.querySelector("[data-auth-form]");
  if (!form) return;

  const emailInput = form.querySelector("[data-auth-email]");
  const continueBtn = form.querySelector("[data-auth-continue]");
  const emailError = form.querySelector("[data-email-error]");
  const primaryActions = form.querySelector("[data-primary-actions]");
  const altActions = form.querySelector("[data-alt-actions]");
  const sendOtpBtn = form.querySelector("[data-send-otp]");
  const biometricsBtn = form.querySelector("[data-bio]");
  const registeredModal = document.querySelector("[data-registered-modal]");
  const registeredAccept = document.querySelector("[data-registered-accept]");
  const otpModal = document.querySelector("[data-otp-modal]");
  const otpDigits = otpModal ? Array.from(otpModal.querySelectorAll("[data-otp-digit]")) : [];
  const otpVerifyBtn = otpModal ? otpModal.querySelector("[data-otp-verify]") : null;
  const bioModal = document.querySelector("[data-bio-modal]");
  const bioStatus = document.querySelector("[data-bio-status]");
  const successModal = document.querySelector("[data-success-modal]");
  const successTick = document.querySelector("[data-success-tick]");
  const modals = document.querySelectorAll("[data-auth-modal]");

  if (!emailInput || !continueBtn) return;

  let authOptionsRevealed = false;
  let biometricsTimer = null;

  const updateContinueAvailability = () => {
    const hasValue = Boolean(emailInput.value.trim());
    continueBtn.disabled = !hasValue;
    continueBtn.classList.toggle("is-disabled", !hasValue);
    continueBtn.setAttribute("aria-disabled", String(!hasValue));
  };

  const clearBiometricsTimer = () => {
    if (biometricsTimer) {
      clearTimeout(biometricsTimer);
      biometricsTimer = null;
    }
    if (bioStatus) {
      bioStatus.textContent = "Authenticating…";
    }
  };

  const openModal = (modal) => {
    if (!modal) return;
    modal.removeAttribute("hidden");
  };

  const closeModal = (modal) => {
    if (!modal) return;
    if (modal.hasAttribute("hidden")) return;
    modal.setAttribute("hidden", "true");
    if (modal === bioModal) {
      clearBiometricsTimer();
    }
    if (modal === registeredModal) {
      revealAuthOptions();
    }
    if (modal === successModal && successTick) {
      successTick.classList.remove("animate");
    }
  };

  const showEmailError = (show) => {
    if (!emailError) return;
    emailError.hidden = !show;
  };

  const revealAuthOptions = () => {
    if (authOptionsRevealed) return;
    authOptionsRevealed = true;
    emailInput.value = emailInput.value.trim();
    emailInput.disabled = true;
    emailInput.classList.add("is-locked");
    if (primaryActions) {
      primaryActions.hidden = true;
    }
    continueBtn.classList.add("is-disabled");
    continueBtn.setAttribute("aria-disabled", "true");
    continueBtn.disabled = true;
    if (altActions) {
      altActions.hidden = false;
    }
  };

  const focusDigit = (index) => {
    if (!otpDigits.length) return;
    const target = otpDigits[index];
    if (target) {
      target.focus();
      target.select();
    }
  };

  const resetOtpInputs = () => {
    otpDigits.forEach((input) => {
      input.value = "";
    });
  };

  const startSuccessFlow = () => {
    closeModal(otpModal);
    closeModal(bioModal);
    openModal(successModal);
    if (successTick) {
      successTick.classList.remove("animate");
      // restart animation
      void successTick.offsetWidth;
      successTick.classList.add("animate");
    }
    try {
      localStorage.setItem("neuraLoggedIn", "true");
    } catch {
      // ignore storage failures
    }
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  };

  continueBtn.addEventListener("click", () => {
    if (continueBtn.disabled) return;
    const emailValue = emailInput.value.trim();
    if (!emailValue) {
      showEmailError(true);
      return;
    }
    showEmailError(false);
    openModal(registeredModal);
  });

  emailInput.addEventListener("input", () => {
    if (emailInput.value.trim()) {
      showEmailError(false);
    }
    updateContinueAvailability();
  });

  if (registeredAccept) {
    registeredAccept.addEventListener("click", () => {
      closeModal(registeredModal);
    });
  }

  modals.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      const closer = event.target && event.target.closest("[data-close-modal]");
      if (closer) {
        event.preventDefault();
        closeModal(modal);
      }
    });
  });

  if (sendOtpBtn && otpModal) {
    sendOtpBtn.addEventListener("click", () => {
      resetOtpInputs();
      openModal(otpModal);
      setTimeout(() => {
        focusDigit(0);
      }, 50);
    });
  }

  if (otpDigits.length) {
    otpDigits.forEach((input, index) => {
      input.addEventListener("input", (event) => {
        const digit = event.target.value.replace(/\D/g, "").slice(-1);
        event.target.value = digit;
        if (digit && index < otpDigits.length - 1) {
          focusDigit(index + 1);
        }
      });

      input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !event.target.value && index > 0) {
          focusDigit(index - 1);
        }
        if (event.key === "ArrowLeft" && index > 0) {
          event.preventDefault();
          focusDigit(index - 1);
        }
        if (event.key === "ArrowRight" && index < otpDigits.length - 1) {
          event.preventDefault();
          focusDigit(index + 1);
        }
      });

      input.addEventListener("paste", (event) => {
        const clipboard = event.clipboardData || window.clipboardData;
        const pasted = clipboard ? clipboard.getData("text") : "";
        if (!pasted) return;
        const digits = pasted.replace(/\D/g, "").slice(0, otpDigits.length).split("");
        if (!digits.length) return;
        event.preventDefault();
        otpDigits.forEach((field, idx) => {
          field.value = digits[idx] || "";
        });
        const nextIndex =
          digits.length >= otpDigits.length ? otpDigits.length - 1 : digits.length;
        focusDigit(Math.max(0, nextIndex));
      });
    });
  }

  if (otpVerifyBtn) {
    otpVerifyBtn.addEventListener("click", () => {
      closeModal(otpModal);
      startSuccessFlow();
    });
  }

  const triggerBiometrics = () => {
    if (!bioModal) return;
    clearBiometricsTimer();
    openModal(bioModal);
    if (bioStatus) {
      bioStatus.textContent = "Authenticating…";
    }
    biometricsTimer = window.setTimeout(() => {
      closeModal(bioModal);
      startSuccessFlow();
    }, 800);
  };

  if (biometricsBtn) {
    biometricsBtn.addEventListener("click", triggerBiometrics);
  }

  updateContinueAvailability();
}

function initBottomNav() {
  const nav = document.querySelector("[data-bottom-nav]");
  if (!nav) return;
  const current = (window.location.pathname || "").split("/").pop() || "";
  const forced = nav.dataset.navActive || "";
  const normalized = forced || current || "dashboard.html";
  const items = nav.querySelectorAll("[data-nav-target]");
  items.forEach((item) => {
    const target = item.dataset.navTarget || "";
    const isActive = normalized === target || (!normalized && target === "dashboard.html");
    item.classList.toggle("active", isActive);
    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

function initSpendAnalyserModal() {
  const modal = document.querySelector("[data-spend-modal]");
  const openers = document.querySelectorAll("[data-spend-modal-open]");
  if (!modal || !openers.length) return;
  const closers = modal.querySelectorAll("[data-close-modal]");

  const openModal = () => modal.removeAttribute("hidden");
  const closeModal = () => modal.setAttribute("hidden", "true");

  openers.forEach((opener) => {
    opener.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  closers.forEach((closer) => {
    closer.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal();
    });
  });

  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.hasAttribute && target.hasAttribute("data-close-modal")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hasAttribute("hidden")) {
      closeModal();
    }
  });
}

function initWealthRefresh() {
  const btn = document.querySelector("[data-refresh]");
  if (!btn) return;
  const label = btn.querySelector("[data-refresh-label]");
  const spinner = btn.querySelector("[data-refresh-spinner]");

  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-loading")) return;
    btn.classList.add("is-loading");
    if (label) label.textContent = "Refreshing…";

    setTimeout(() => {
      btn.classList.remove("is-loading");
      if (spinner) spinner.style.display = "none";
      if (label) label.textContent = "Refreshed";
      setTimeout(() => {
        if (spinner) spinner.style.display = "";
        if (label) label.textContent = "Refresh";
      }, 900);
    }, 600);
  });
}

function initChatbot() {
  const form = document.querySelector("[data-chat-form]");
  const input = document.querySelector("[data-chat-input]");
  const log = document.querySelector("[data-chat-log]");
  if (!form || !input || !log) return;

  const quickReplies = document.querySelectorAll("[data-quick-reply]");

  const scrollToBottom = () => {
    log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  };

  const appendMessage = (text, sender = "assistant", extras = null) => {
    const messageEl = document.createElement("div");
    messageEl.className = `chat-message ${sender}`;

    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";
    avatar.textContent = sender === "assistant" ? "🤖" : "👤";
    messageEl.appendChild(avatar);

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    const paragraph = document.createElement("div");
    paragraph.textContent = text;
    bubble.appendChild(paragraph);

    if (extras && extras.bullets && extras.bullets.length) {
      const list = document.createElement("ul");
      list.className = "chat-list";
      extras.bullets.forEach((tip) => {
        const li = document.createElement("li");
        li.textContent = tip;
        list.appendChild(li);
      });
      bubble.appendChild(list);
    }

    if (extras && extras.cta) {
      const cta = document.createElement("a");
      cta.className = "button secondary chat-cta";
      cta.href = extras.cta.href;
      cta.textContent = extras.cta.label;
      bubble.appendChild(cta);
    }

    messageEl.appendChild(bubble);
    log.appendChild(messageEl);
    scrollToBottom();
  };

  const buildResponse = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes("send") || lower.includes("international") || lower.includes("abroad")) {
      return {
        text:
          "I can route your transfer through the cheapest partner based on FX + fees. Want me to open the international flow?",
        cta: { label: "Open International Transfer", href: "intl-start.html" },
      };
    }
    if (lower.includes("invest")) {
      return {
        text:
          "Based on your profile, I'd suggest 65% global equities, 25% bonds, 10% cash buffer. Ready to rebalance?",
        cta: { label: "Go to Smart Invest", href: "smart-invest.html" },
      };
    }
    if (lower.includes("spend") || lower.includes("subscription")) {
      return {
        text: "Here are quick wins to trim spend:",
        bullets: ["Flag 2 duplicate streaming plans", "Set £200 essentials cap", "Swap to cashback card"],
        cta: { label: "Open Insights", href: "insights.html" },
      };
    }
    return {
      text: "I can simulate bills, optimise FX, or suggest investment moves. Try asking about transfers or goals.",
    };
  };

  const handleSend = (message) => {
    const clean = (message || "").trim();
    if (!clean) return;
    appendMessage(clean, "user");
    input.value = "";
    setTimeout(() => {
      const response = buildResponse(clean);
      appendMessage(response.text, "assistant", response);
    }, 400);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSend(input.value);
  });

  quickReplies.forEach((chip) => {
    chip.addEventListener("click", () => {
      const value = chip.dataset.quickReply || chip.textContent;
      input.value = value;
      handleSend(value);
    });
  });
}

function initIntlStart() {
  const form = document.querySelector("[data-intl-form]");
  if (!form) return;
  const amountInput = form.querySelector("[data-intl-amount]");
  const countrySelect = form.querySelector("[data-intl-country]");
  const currencyOutput = form.querySelector("[data-intl-currency]");
  const speedGroup = form.querySelector("[data-intl-speed-group]");
  const noteInput = form.querySelector("[data-intl-note]");
  const errorEl = form.querySelector("[data-intl-error]");
  const submitBtn = form.querySelector("[data-intl-submit]");

  const currencyMap = {
    US: "USD",
    EU: "EUR",
    India: "INR",
    UAE: "AED",
  };

  const selectSpeed = (speed) => {
    const buttons = speedGroup ? speedGroup.querySelectorAll("[data-intl-speed]") : [];
    buttons.forEach((btn) => {
      const isSelected = btn.dataset.intlSpeed === speed;
      btn.classList.toggle("selected", isSelected);
      btn.setAttribute("aria-pressed", String(isSelected));
    });
    localStorage.setItem("intl_speed", speed);
  };

  const loadInitial = () => {
    const storedAmount = localStorage.getItem("intl_amount_gbp") || "250";
    const storedCountry = localStorage.getItem("intl_country") || "US";
    const storedSpeed = localStorage.getItem("intl_speed") || "balanced";
    amountInput.value = storedAmount;
    countrySelect.value = storedCountry;
    currencyOutput.value = currencyMap[storedCountry] || "USD";
    selectSpeed(storedSpeed);
  };

  const updateCurrency = () => {
    const val = countrySelect.value;
    currencyOutput.value = currencyMap[val] || "USD";
  };

  countrySelect.addEventListener("change", () => {
    updateCurrency();
    localStorage.setItem("intl_country", countrySelect.value);
  });

  if (speedGroup) {
    speedGroup.querySelectorAll("[data-intl-speed]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectSpeed(btn.dataset.intlSpeed || "balanced");
      });
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = parseFloat(amountInput.value || "0");
    if (!amount || amount <= 0) {
      if (errorEl) errorEl.hidden = false;
      return;
    }
    if (errorEl) errorEl.hidden = true;
    localStorage.setItem("intl_amount_gbp", amountInput.value);
    localStorage.setItem("intl_country", countrySelect.value);
    const selectedSpeed = speedGroup
      ? (speedGroup.querySelector(".selected") && speedGroup.querySelector(".selected").dataset.intlSpeed) || "balanced"
      : "balanced";
    localStorage.setItem("intl_speed", selectedSpeed);
    if (noteInput) localStorage.setItem("intl_note", noteInput.value || "");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Finding route…";
    }
    setTimeout(() => {
      window.location.href = "intl-summary.html";
    }, 400);
  });

  loadInitial();
}

function initAccordion() {
  const accordion = document.querySelector("[data-accordion]");
  if (!accordion) return;
  const toggle = accordion.querySelector("[data-accordion-toggle]");
  const body = accordion.querySelector("[data-accordion-body]");
  if (!toggle || !body) return;
  toggle.addEventListener("click", () => {
    const isHidden = body.hasAttribute("hidden");
    body.hidden = !isHidden;
    toggle.querySelector("span").textContent = isHidden ? "⌃" : "›";
  });
}

function initFxAlertModal() {
  const modal = document.querySelector("[data-fx-alert-modal]");
  if (!modal) return;
  const openBtn = document.querySelector("[data-fx-alert-open]");
  const saveBtn = modal.querySelector("[data-fx-save]");
  const statusEl = modal.querySelector("[data-fx-status]");
  const input = modal.querySelector("[data-fx-input]");
  const closers = modal.querySelectorAll("[data-close-modal]");

  const closeModal = () => {
    modal.setAttribute("hidden", "true");
  };

  const openModal = () => {
    modal.removeAttribute("hidden");
    if (statusEl) statusEl.textContent = "";
  };

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      openModal();
    });
  }

  closers.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target && event.target.hasAttribute && event.target.hasAttribute("data-close-modal")) {
      closeModal();
    }
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const rate = input ? input.value.trim() : "";
      localStorage.setItem("fx_alert_rate", rate);
      if (statusEl) statusEl.textContent = rate ? `Alert saved for ${rate}` : "Alert saved";
      setTimeout(closeModal, 500);
    });
  }
}

function initIntlSummary() {
  const summary = document.querySelector("[data-intl-summary]");
  if (!summary) return;
  const sendEl = summary.querySelector("[data-intl-send]");
  const receiveEl = summary.querySelector("[data-intl-receive]");
  const arrivalEl = summary.querySelector("[data-intl-arrival]");
  const feeEl = summary.querySelector("[data-intl-fee]");
  const rateEl = summary.querySelector("[data-intl-rate]");
  const sendNowBtn = document.querySelector("[data-intl-send-now]");
  const successModal = document.querySelector("[data-intl-success-modal]");
  const successTick = successModal ? successModal.querySelector("[data-success-tick]") : null;
  const closers = successModal ? successModal.querySelectorAll("[data-close-modal]") : [];
  const routeCards = document.querySelectorAll("[data-route-option]");
  const speed = localStorage.getItem("intl_speed") || "balanced";
  const amount = parseFloat(localStorage.getItem("intl_amount_gbp") || "250");
  const country = localStorage.getItem("intl_country") || "US";
  const currencyMap = { US: "USD", EU: "EUR", India: "INR", UAE: "AED" };
  const currency = currencyMap[country] || "USD";

  const computeRoute = (mode) => {
    if (mode === "cheapest") {
      return { fee: 1.6, rate: 1.248, arrival: "Tomorrow (by 10am)", noteA: "Lowest cost, slower" };
    }
    if (mode === "fastest") {
      return { fee: 3.6, rate: 1.245, arrival: "Instant (30 mins)", noteA: "Fastest path via card rails" };
    }
    return { fee: 2.15, rate: 1.252, arrival: "Today (2 hours)", noteA: "Balanced cost vs speed" };
  };

  const applySummary = () => {
    const { fee, rate, arrival, noteA } = computeRoute(speed);
    const received = ((amount - fee) * rate).toFixed(2);
    if (sendEl) sendEl.textContent = `£${amount.toFixed(2)}`;
    if (receiveEl) receiveEl.textContent = `${currencySymbol()}${received}`;
    if (arrivalEl) arrivalEl.textContent = arrival;
    if (feeEl) feeEl.textContent = `£${fee.toFixed(2)}`;
    if (rateEl) rateEl.textContent = rate.toFixed(3);

    const setText = (selector, text) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = text;
    };

    setText("[data-route-a-fee]", `Fee: £${fee.toFixed(2)}`);
    setText("[data-route-a-rate]", `Rate: ${rate.toFixed(3)}`);
    setText("[data-route-a-arrival]", `Arrival: ${arrival}`);
    setText("[data-route-a-note]", noteA || "Best overall cost");

    setText("[data-route-b-fee]", "Fee: £3.60");
    setText("[data-route-b-rate]", "Rate: 1.245");
    setText("[data-route-b-arrival]", "Arrival: Instant (30 mins)");
    setText("[data-route-b-note]", "Higher fee but instant");

    setText("[data-route-c-fee]", "Fee: £7.80");
    setText("[data-route-c-rate]", "Rate: 1.232");
    setText("[data-route-c-arrival]", "Arrival: 2-3 days");
    setText("[data-route-c-note]", "Highest fee and slowest");
  };

  const currencySymbol = () => {
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    if (currency === "INR") return "₹";
    if (currency === "AED") return "د.إ";
    return "$";
  };

  routeCards.forEach((card) => {
    card.addEventListener("click", () => {
      routeCards.forEach((c) => c.classList.remove("recommended"));
      card.classList.add("recommended");
    });
  });

  const closeSuccess = () => {
    if (successModal) successModal.setAttribute("hidden", "true");
  };

  const openSuccess = () => {
    if (successModal) {
      successModal.removeAttribute("hidden");
      if (successTick) {
        setTimeout(() => successTick.classList.add("animate"), 40);
      }
    }
  };

  closers.forEach((btn) => {
    btn.addEventListener("click", closeSuccess);
  });

  if (successModal) {
    successModal.addEventListener("click", (event) => {
      if (event.target && event.target.hasAttribute && event.target.hasAttribute("data-close-modal")) {
        closeSuccess();
      }
    });
  }

  if (sendNowBtn) {
    sendNowBtn.addEventListener("click", () => {
      openSuccess();
      setTimeout(() => {
        window.location.href = "payments.html";
      }, 900);
    });
  }

  applySummary();
}

function initSendDomestic() {
  const recipients = document.querySelectorAll("[data-recipient]");
  const amountInput = document.querySelector("[data-pay-amount]");
  const noteInput = document.querySelector("[data-pay-note]");
  const quickBtns = document.querySelectorAll("[data-pay-add]");
  const continueBtn = document.querySelector("[data-pay-continue]");
  const errorEl = document.querySelector("[data-pay-error]");
  if (!recipients.length || !amountInput || !continueBtn) return;

  const setRecipient = (name) => {
    recipients.forEach((btn) => {
      const isSelected = btn.dataset.recipient === name;
      btn.classList.toggle("selected", isSelected);
      btn.setAttribute("aria-pressed", String(isSelected));
    });
    localStorage.setItem("pay_recipient", name);
  };

  const selectedOrFirst = () => {
    const selected = Array.from(recipients).find((btn) => btn.classList.contains("selected"));
    return selected ? selected.dataset.recipient : recipients[0].dataset.recipient;
  };

  recipients.forEach((btn) => {
    btn.addEventListener("click", () => setRecipient(btn.dataset.recipient));
  });

  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const increment = parseFloat(btn.dataset.payAdd || "0") || 0;
      const current = parseFloat(amountInput.value || "0") || 0;
      const total = (current + increment).toFixed(2);
      amountInput.value = total;
    });
  });

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      const amount = parseFloat(amountInput.value || "0");
      if (!amount || amount <= 0) {
        if (errorEl) errorEl.hidden = false;
        return;
      }
      if (errorEl) errorEl.hidden = true;
      const recipient = selectedOrFirst();
      setRecipient(recipient);
      localStorage.setItem("pay_amount", amount.toFixed(2));
      if (noteInput) localStorage.setItem("pay_note", noteInput.value || "");
      window.location.href = "send-confirm.html";
    });
  }

  const load = () => {
    const storedRecipient = localStorage.getItem("pay_recipient");
    const storedAmount = localStorage.getItem("pay_amount");
    const storedNote = localStorage.getItem("pay_note");
    if (storedRecipient) setRecipient(storedRecipient);
    else setRecipient(recipients[0].dataset.recipient);
    if (storedAmount) amountInput.value = storedAmount;
    if (storedNote && noteInput) noteInput.value = storedNote;
  };

  load();
}

function initSendConfirm() {
  const summary = document.querySelector("[data-pay-summary]");
  if (!summary) return;
  const recipientEl = summary.querySelector("[data-pay-recipient]");
  const amountEl = summary.querySelector("[data-pay-amount]");
  const noteEl = summary.querySelector("[data-pay-note]");
  const sendBtn = document.querySelector("[data-pay-send-now]");
  const modal = document.querySelector("[data-pay-success-modal]");
  const tick = modal ? modal.querySelector("[data-success-tick]") : null;

  const recipient = localStorage.getItem("pay_recipient") || "Recipient";
  const amount = parseFloat(localStorage.getItem("pay_amount") || "0").toFixed(2);
  const note = localStorage.getItem("pay_note") || "—";
  if (recipientEl) recipientEl.textContent = recipient;
  if (amountEl) amountEl.textContent = `£${amount}`;
  if (noteEl) noteEl.textContent = note || "—";

  const closeModal = () => {
    if (modal) modal.setAttribute("hidden", "true");
  };

  const openModal = () => {
    if (!modal) return;
    modal.removeAttribute("hidden");
    if (tick) {
      tick.classList.remove("animate");
      setTimeout(() => tick.classList.add("animate"), 20);
    }
  };

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target && event.target.hasAttribute && event.target.hasAttribute("data-close-modal")) {
        closeModal();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      openModal();
      setTimeout(() => {
        window.location.href = "send-success.html";
      }, 900);
    });
  }
}

function initSendSuccess() {
  const summary = document.querySelector("[data-pay-success]");
  if (!summary) return;
  const recipientEl = summary.querySelector("[data-pay-recipient]");
  const amountEl = summary.querySelector("[data-pay-amount]");
  const noteEl = summary.querySelector("[data-pay-note]");

  const recipient = localStorage.getItem("pay_recipient") || "Recipient";
  const amount = parseFloat(localStorage.getItem("pay_amount") || "0").toFixed(2);
  const note = localStorage.getItem("pay_note") || "—";

  if (recipientEl) recipientEl.textContent = recipient;
  if (amountEl) amountEl.textContent = `£${amount}`;
  if (noteEl) noteEl.textContent = note || "—";

  ["pay_recipient", "pay_amount", "pay_note"].forEach((key) => localStorage.removeItem(key));
}

function initInvestQuiz() {
  const quiz = document.querySelector("[data-invest-quiz]");
  if (!quiz) return;
  const goalGroup = quiz.querySelector("[data-invest-goal]");
  const horizonGroup = quiz.querySelector("[data-invest-horizon]");
  const riskGroup = quiz.querySelector("[data-invest-risk]");
  const monthlyInput = quiz.querySelector("[data-invest-monthly]");
  const generateBtn = quiz.querySelector("[data-invest-generate]");

  const toggleGroup = (group, value, attr) => {
    if (!group) return;
    group.querySelectorAll(`[${attr}]`).forEach((btn) => {
      const isSelected = btn.getAttribute(attr) === value;
      btn.classList.toggle("selected", isSelected);
      btn.setAttribute("aria-pressed", String(isSelected));
    });
  };

  const setGoal = (goal) => {
    toggleGroup(goalGroup, goal, "data-goal");
    localStorage.setItem("invest_goal", goal);
  };
  const setHorizon = (horizon) => {
    toggleGroup(horizonGroup, horizon, "data-horizon");
    localStorage.setItem("invest_horizon", horizon);
  };
  const setRisk = (risk) => {
    toggleGroup(riskGroup, risk, "data-risk");
    localStorage.setItem("invest_risk", risk);
  };

  if (goalGroup) {
    goalGroup.querySelectorAll("[data-goal]").forEach((btn) => {
      btn.addEventListener("click", () => setGoal(btn.dataset.goal));
    });
  }

  if (horizonGroup) {
    horizonGroup.querySelectorAll("[data-horizon]").forEach((btn) => {
      btn.addEventListener("click", () => setHorizon(btn.dataset.horizon));
    });
  }

  if (riskGroup) {
    riskGroup.querySelectorAll("[data-risk]").forEach((btn) => {
      btn.addEventListener("click", () => setRisk(btn.dataset.risk));
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const monthly = monthlyInput ? monthlyInput.value || "100" : "100";
      localStorage.setItem("invest_monthly", monthly);
      window.location.href = "invest-plan.html";
    });
  }

  const load = () => {
    const goal = localStorage.getItem("invest_goal") || "balanced";
    const horizon = localStorage.getItem("invest_horizon") || "3-7";
    const risk = localStorage.getItem("invest_risk") || "balanced";
    const monthly = localStorage.getItem("invest_monthly") || "100";
    setGoal(goal);
    setHorizon(horizon);
    setRisk(risk);
    if (monthlyInput) monthlyInput.value = monthly;
  };

  load();
}

function initInvestPlan() {
  const plan = document.querySelector("[data-invest-plan]");
  if (!plan) return;
  const equityBar = plan.querySelector("[data-alloc-equity]");
  const bondsBar = plan.querySelector("[data-alloc-bonds]");
  const cashBar = plan.querySelector("[data-alloc-cash]");
  const riskLabel = plan.querySelector("[data-invest-risk-label]");
  const goalLabel = plan.querySelector("[data-invest-goal-label]");

  const projectionCard = document.querySelector("[data-invest-projection]");
  const returnLabel = projectionCard ? projectionCard.querySelector("[data-invest-return]") : null;
  const projectedValue = projectionCard ? projectionCard.querySelector("[data-invest-projected]") : null;

  const risk = localStorage.getItem("invest_risk") || "balanced";
  const goal = localStorage.getItem("invest_goal") || "balanced";
  const monthly = parseFloat(localStorage.getItem("invest_monthly") || "100");

  const riskConfig = {
    cautious: { equity: 30, bonds: 50, cash: 20, return: 0.04, label: "Cautious" },
    balanced: { equity: 60, bonds: 30, cash: 10, return: 0.06, label: "Balanced" },
    growth: { equity: 85, bonds: 10, cash: 5, return: 0.08, label: "Growth" },
  };
  const config = riskConfig[risk] || riskConfig.balanced;

  const setBar = (bar, percent, name) => {
    if (!bar) return;
    bar.style.width = `${percent}%`;
    bar.innerHTML = `<span>${name} ${percent}%</span>`;
  };

  setBar(equityBar, config.equity, "Equity");
  setBar(bondsBar, config.bonds, "Bonds");
  setBar(cashBar, config.cash, "Cash");

  const goalLabelMap = {
    growth: "Long-term growth",
    balanced: "Balanced",
    preserve: "Preserve capital",
  };

  if (riskLabel) riskLabel.textContent = config.label;
  if (goalLabel) goalLabel.textContent = `Goal: ${goalLabelMap[goal] || "Balanced"}`;
  if (returnLabel) returnLabel.textContent = `${Math.round(config.return * 100)}% expected`;

  const monthlyRate = Math.pow(1 + config.return, 1 / 12) - 1;
  const months = 10 * 12;
  const futureValue =
    monthlyRate > 0 ? monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : monthly * months;
  if (projectedValue) projectedValue.textContent = `£${futureValue.toFixed(0)}`;
}

function initInvestConfirm() {
  const summary = document.querySelector("[data-invest-summary]");
  if (!summary) return;
  const monthlyEl = summary.querySelector("[data-invest-monthly]");
  const riskEl = summary.querySelector("[data-invest-risk]");
  const allocationEl = summary.querySelector("[data-invest-allocation]");
  const startBtn = document.querySelector("[data-invest-start]");
  const modal = document.querySelector("[data-invest-success-modal]");
  const tick = modal ? modal.querySelector("[data-success-tick]") : null;

  const risk = localStorage.getItem("invest_risk") || "balanced";
  const monthly = parseFloat(localStorage.getItem("invest_monthly") || "100");
  const config = {
    cautious: { equity: 30, bonds: 50, cash: 20, label: "Cautious" },
    balanced: { equity: 60, bonds: 30, cash: 10, label: "Balanced" },
    growth: { equity: 85, bonds: 10, cash: 5, label: "Growth" },
  }[risk] || { equity: 60, bonds: 30, cash: 10, label: "Balanced" };

  if (monthlyEl) monthlyEl.textContent = `£${monthly.toFixed(0)}/mo`;
  if (riskEl) riskEl.textContent = config.label;
  if (allocationEl)
    allocationEl.textContent = `${config.equity}% equity / ${config.bonds}% bonds / ${config.cash}% cash`;

  const closeModal = () => {
    if (modal) modal.setAttribute("hidden", "true");
  };

  const openModal = () => {
    if (!modal) return;
    modal.removeAttribute("hidden");
    if (tick) {
      tick.classList.remove("animate");
      setTimeout(() => tick.classList.add("animate"), 20);
    }
  };

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target && event.target.hasAttribute && event.target.hasAttribute("data-close-modal")) {
        closeModal();
      }
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      openModal();
      setTimeout(() => {
        window.location.href = "invest-success.html";
      }, 900);
    });
  }
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
  initSignInFlow();
  initBottomNav();
  initSpendAnalyserModal();
  initWealthRefresh();
  initChatbot();
  initIntlStart();
  initIntlSummary();
  initAccordion();
  initFxAlertModal();
  initSendDomestic();
  initSendConfirm();
  initSendSuccess();
  initInvestQuiz();
  initInvestPlan();
  initInvestConfirm();
});
