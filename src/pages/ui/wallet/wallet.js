document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://127.0.0.1:5000";
  const balanceEl = document.getElementById("walletBalance");
  const monthlyTopupEl = document.getElementById("monthlyTopup");
  const loyaltyPointsEl = document.getElementById("loyaltyPoints");
  const customAmountEl = document.getElementById("customAmount");
  const paymentMethodEl = document.getElementById("paymentMethod");
  const monthlyPlanToggleEl = document.getElementById("monthlyPlanToggle");
  const monthlyAmountEl = document.getElementById("monthlyAmount");
  const monthlyDateEl = document.getElementById("monthlyDate");
  const btnTopUp = document.getElementById("btnTopUp");
  const btnSavePlan = document.getElementById("btnSavePlan");
  const walletMsg = document.getElementById("walletMsg");
  const transactionList = document.getElementById("transactionList");
  const emptyTransactions = document.getElementById("emptyTransactions");
  const quickAmountButtons = Array.from(document.querySelectorAll(".amount-btn"));
  const btnLogout = document.getElementById("btnLogout");
  const paymentPreviewEl = document.getElementById("paymentPreview");

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  if (!currentUser) {
    window.location.href = "../login/login.html";
    return;
  }

  if (String(currentUser.role || "").toLowerCase() === "admin") {
    window.location.href = "../dashboard/dashboard.html";
    return;
  }

  const userId = currentUser._id || currentUser.id;

  if (!userId) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");
    window.location.href = "../login/login.html";
    return;
  }

  const STORAGE_KEYS = {
    balance: `wallet_balance_${userId}`,
    transactions: `wallet_transactions_${userId}`,
    monthlyTotal: `wallet_monthly_total_${userId}`,
    loyalty: `wallet_loyalty_${userId}`,
    monthlyPlan: `wallet_plan_${userId}`,
    pendingEsewa: `wallet_pending_esewa_${userId}`,
    processedEsewa: `wallet_processed_esewa_${userId}`
  };

  let selectedQuickAmount = 0;

  function getNumber(key, fallback = 0) {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  }

  function getTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.transactions);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveTransactions(items) {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(items));
  }

  function formatCurrency(value) {
    return `Rs. ${Number(value || 0).toLocaleString()}`;
  }

  function showMessage(text, type = "success") {
    walletMsg.hidden = false;
    walletMsg.textContent = text;
    walletMsg.className = `msg msg--${type}`;
  }

  function clearMessage() {
    walletMsg.hidden = true;
    walletMsg.textContent = "";
    walletMsg.className = "msg";
  }

  function renderSummary() {
    const balance = getNumber(STORAGE_KEYS.balance, 0);
    const monthlyTotal = getNumber(STORAGE_KEYS.monthlyTotal, 0);
    const loyalty = getNumber(STORAGE_KEYS.loyalty, 0);

    balanceEl.textContent = formatCurrency(balance);
    monthlyTopupEl.textContent = formatCurrency(monthlyTotal);
    loyaltyPointsEl.textContent = `${loyalty} pts`;
  }

  function renderTransactions() {
    const transactions = getTransactions();

    if (!transactions.length) {
      transactionList.innerHTML = "";
      emptyTransactions.style.display = "block";
      return;
    }

    emptyTransactions.style.display = "none";

    transactionList.innerHTML = transactions
      .slice()
      .reverse()
      .map((item) => {
        return `
          <article class="transaction-item">
            <div class="transaction-main">
              <div class="transaction-title">${item.type || "Wallet Transaction"}</div>
              <div class="transaction-date">${item.date || "-"}</div>
            </div>
            <div class="transaction-amount">${formatCurrency(item.amount || 0)}</div>
            <div class="transaction-method">${item.method || "-"}</div>
            <div class="transaction-status">${item.status || "Success"}</div>
          </article>
        `;
      })
      .join("");
  }

  function setActiveQuickAmount(amount) {
    selectedQuickAmount = Number(amount) || 0;

    quickAmountButtons.forEach((btn) => {
      const btnAmount = Number(btn.dataset.amount || 0);
      btn.classList.toggle("is-active", btnAmount === selectedQuickAmount);
    });

    if (selectedQuickAmount > 0) {
      customAmountEl.value = selectedQuickAmount;
    }
  }

  function getTodayString() {
    return new Date().toLocaleDateString();
  }

  function updatePaymentPreview() {
    const method = String(paymentMethodEl.value || "").toLowerCase();

    if (method === "cash") {
      paymentPreviewEl.textContent = "Cash top-up will be added directly in this project flow.";
      return;
    }

    paymentPreviewEl.textContent = "eSewa payment will redirect you to eSewa sandbox before wallet top-up confirmation.";
  }

  function applyWalletTopup(amount, method, reference = "") {
    const currentBalance = getNumber(STORAGE_KEYS.balance, 0);
    const currentMonthlyTotal = getNumber(STORAGE_KEYS.monthlyTotal, 0);
    const currentLoyalty = getNumber(STORAGE_KEYS.loyalty, 0);
    const transactions = getTransactions();

    const newBalance = currentBalance + amount;
    const newMonthlyTotal = currentMonthlyTotal + amount;
    const earnedPoints = Math.floor(amount / 100);
    const newLoyalty = currentLoyalty + earnedPoints;

    localStorage.setItem(STORAGE_KEYS.balance, String(newBalance));
    localStorage.setItem(STORAGE_KEYS.monthlyTotal, String(newMonthlyTotal));
    localStorage.setItem(STORAGE_KEYS.loyalty, String(newLoyalty));

    transactions.push({
      type: "Wallet Top-Up",
      amount,
      method,
      reference,
      status: "Success",
      date: getTodayString()
    });

    saveTransactions(transactions);
    renderSummary();
    renderTransactions();
  }

  function handleCashTopup(amount) {
    applyWalletTopup(amount, "Cash", `CASH-${Date.now()}`);
    showMessage(`Wallet topped up successfully with ${formatCurrency(amount)} using Cash.`, "success");
  }

  function getReturnUrl(mode) {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("esewa", mode);
    return url.toString();
  }

  function removeEsewaQueryParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete("esewa");
    url.searchParams.delete("data");
    window.history.replaceState({}, document.title, url.toString());
  }

  function generateTransactionUuid() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `WALLET-${y}${m}${d}-${hh}${mm}${ss}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function parseEsewaResponseData(dataParam) {
    try {
      let normalized = String(dataParam || "").replace(/ /g, "+");
      while (normalized.length % 4 !== 0) normalized += "=";
      const decoded = atob(normalized);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  async function verifyEsewaTransaction(transactionUuid, totalAmount) {
    const query = new URLSearchParams({
      transaction_uuid: String(transactionUuid),
      total_amount: String(Number(totalAmount))
    });

    const response = await fetch(`${API_BASE}/api/esewa/verify?${query.toString()}`, {
      method: "GET",
      credentials: "include"
    });

    const data = await response.json().catch(() => ({}));
    return data;
  }

  async function startEsewaTopup(amount) {
    const transactionUuid = generateTransactionUuid();
    const successUrl = getReturnUrl("success");
    const failureUrl = getReturnUrl("failure");

    const pendingData = {
      transaction_uuid: transactionUuid,
      totalAmount: Number(amount),
      createdAt: Date.now()
    };

    localStorage.setItem(STORAGE_KEYS.pendingEsewa, JSON.stringify(pendingData));

    const signRes = await fetch(`${API_BASE}/api/esewa/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        totalAmount: Number(amount),
        transactionUuid
      })
    });

    const signData = await signRes.json().catch(() => ({}));

    if (!signRes.ok || !signData.success) {
      throw new Error(signData.message || "Failed to initialize eSewa payment.");
    }

    showMessage("Redirecting to eSewa sandbox...", "success");

    const form = document.createElement("form");
    form.method = "POST";
    form.action = signData.formUrl;
    form.style.display = "none";

    const fields = {
      amount: Number(amount),
      tax_amount: 0,
      total_amount: Number(amount),
      transaction_uuid: transactionUuid,
      product_code: signData.productCode,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: signData.signedFieldNames,
      signature: signData.signature
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value ?? "");
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  async function handleEsewaReturnIfAny() {
    const url = new URL(window.location.href);
    const mode = url.searchParams.get("esewa");
    const dataParam = url.searchParams.get("data");
    const pendingRaw = localStorage.getItem(STORAGE_KEYS.pendingEsewa);

    if (!pendingRaw) return;

    let pending;
    try {
      pending = JSON.parse(pendingRaw);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.pendingEsewa);
      return;
    }

    const processedKey = `${STORAGE_KEYS.processedEsewa}_${pending.transaction_uuid}`;

    if (sessionStorage.getItem(processedKey) === "1") {
      removeEsewaQueryParams();
      return;
    }

    if (mode === "failure") {
      showMessage("eSewa payment was canceled or failed. Please try again.", "error");
      localStorage.removeItem(STORAGE_KEYS.pendingEsewa);
      removeEsewaQueryParams();
      return;
    }

    if (!mode && !dataParam) {
      return;
    }

    let returnedPayload = null;
    if (dataParam) {
      returnedPayload = parseEsewaResponseData(dataParam);
    }

    let verifyResponse = null;
    try {
      verifyResponse = await verifyEsewaTransaction(
        pending.transaction_uuid,
        pending.totalAmount
      );
    } catch {
      verifyResponse = null;
    }

    const verifiedStatus = verifyResponse?.data || {};
    const verifiedComplete =
      String(verifiedStatus.status || "").toUpperCase() === "COMPLETE";

    const fallbackComplete =
      returnedPayload &&
      String(returnedPayload.status || "").toUpperCase() === "COMPLETE";

    if (!verifiedComplete && !fallbackComplete) {
      showMessage("Payment could not be verified yet. Please try again.", "error");
      return;
    }

    sessionStorage.setItem(processedKey, "1");

    const ref =
      verifiedStatus.ref_id ||
      verifiedStatus.transaction_code ||
      returnedPayload?.transaction_code ||
      returnedPayload?.transaction_uuid ||
      "";

    applyWalletTopup(Number(pending.totalAmount), "eSewa Payment", ref);

    showMessage(
      `Wallet topped up successfully with ${formatCurrency(pending.totalAmount)} using eSewa Payment.`,
      "success"
    );

    localStorage.removeItem(STORAGE_KEYS.pendingEsewa);
    removeEsewaQueryParams();
  }

  function handleTopUp() {
    clearMessage();

    const amount = Number(customAmountEl.value || selectedQuickAmount || 0);
    const method = String(paymentMethodEl.value || "").toLowerCase();

    if (!amount || amount < 100) {
      showMessage("Please enter a valid top-up amount of at least Rs. 100.", "error");
      return;
    }

    if (method === "cash") {
      handleCashTopup(amount);
      return;
    }

    if (method === "esewa") {
      startEsewaTopup(amount).catch((err) => {
        console.error(err);
        showMessage(err.message || "Failed to start eSewa top-up.", "error");
      });
      return;
    }

    showMessage("Unsupported payment method selected.", "error");
  }

  function handleSavePlan() {
    clearMessage();

    const enabled = !!monthlyPlanToggleEl.checked;
    const plan = {
      enabled,
      amount: Number(monthlyAmountEl.value || 0),
      day: Number(monthlyDateEl.value || 1)
    };

    localStorage.setItem(STORAGE_KEYS.monthlyPlan, JSON.stringify(plan));

    if (enabled) {
      showMessage(
        `Monthly top-up plan saved: ${formatCurrency(plan.amount)} on day ${plan.day} of every month.`,
        "success"
      );
    } else {
      showMessage("Monthly top-up plan saved as disabled.", "success");
    }
  }

  function loadPlan() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.monthlyPlan);
      if (!raw) return;

      const plan = JSON.parse(raw);
      monthlyPlanToggleEl.checked = !!plan.enabled;

      if (plan.amount) monthlyAmountEl.value = String(plan.amount);
      if (plan.day) monthlyDateEl.value = String(plan.day);
    } catch {
      // ignore broken plan data
    }
  }

  quickAmountButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveQuickAmount(btn.dataset.amount);
      clearMessage();
    });
  });

  customAmountEl.addEventListener("input", () => {
    quickAmountButtons.forEach((btn) => btn.classList.remove("is-active"));
    selectedQuickAmount = 0;
    clearMessage();
  });

  paymentMethodEl.addEventListener("change", updatePaymentPreview);

  btnTopUp.addEventListener("click", async () => {
    btnTopUp.disabled = true;
    btnTopUp.textContent = "Processing...";
    try {
      await handleTopUp();
    } finally {
      btnTopUp.disabled = false;
      btnTopUp.textContent = "Top Up Now";
    }
  });

  btnSavePlan.addEventListener("click", handleSavePlan);

  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");
    window.location.href = "../login/login.html";
  });

  loadPlan();
  updatePaymentPreview();
  renderSummary();
  renderTransactions();
  await handleEsewaReturnIfAny();
});