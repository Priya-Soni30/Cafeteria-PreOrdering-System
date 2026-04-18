const API_BASE = "http://127.0.0.1:5000";
const ORDERS_URL = "../orders/orders.html";
const LOGIN_URL = "../login/login.html";
const DASHBOARD_URL = "../dashboard/dashboard.html";

let CURRENT_USER = null;
let USER_ID = "";

let STORAGE = {
  cart: "cart",
  orders: "orders",
  lastOrder: "lastOrder",
  favorites: "favorites"
};

const LEGACY_KEYS = {
  cart: "cart",
  orders: "orders",
  lastOrder: "lastOrder",
  favorites: "favorites"
};

const ESEWA_CONFIG = {
  TAX_AMOUNT: 0,
  SERVICE_CHARGE: 0,
  DELIVERY_CHARGE: 0
};

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  if (!requireStudentAccess()) return;

  setupUserStorage();
  migrateLegacyCartData();
  cleanupInvalidCart();

  renderNavbar();
  normalizeStoredCart();
  bindLogout();
  setDefaultPickupTime();
  bindPaymentHint();

  const hasSession = await checkBackendSession();
  if (!hasSession) {
    setStatus("Your login session may have expired. Please login again before placing order.", "err");
  }

  await handleEsewaReturnIfAny();

  renderCart();
  renderWalletBalance();

  document.getElementById("btnClear")?.addEventListener("click", () => {
    saveCart([]);
    localStorage.removeItem(LEGACY_KEYS.cart);
    renderCart();
  });

  document.getElementById("btnPlaceOrder")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await placeOrder();
  });
});

/* ---------------- ACCESS ---------------- */

function getCurrentUser() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return currentUser || user || null;
}

function requireStudentAccess() {
  CURRENT_USER = getCurrentUser();

  if (!CURRENT_USER) {
    window.location.href = LOGIN_URL;
    return false;
  }

  const role = String(CURRENT_USER.role || localStorage.getItem("role") || "").toLowerCase();

  if (role === "admin") {
    alert("Admin cannot access this page.");
    window.location.href = DASHBOARD_URL;
    return false;
  }

  USER_ID = String(CURRENT_USER._id || CURRENT_USER.id || "").trim();

  if (!USER_ID) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");
    window.location.href = LOGIN_URL;
    return false;
  }

  return true;
}

function setupUserStorage() {
  STORAGE = {
    cart: `cart_${USER_ID}`,
    orders: `orders_${USER_ID}`,
    lastOrder: `lastOrder_${USER_ID}`,
    favorites: `favorites_${USER_ID}`
  };
}

function getWalletStorageKeys() {
  return {
    balance: `wallet_balance_${USER_ID}`,
    transactions: `wallet_transactions_${USER_ID}`,
    monthlyTotal: `wallet_monthly_total_${USER_ID}`,
    loyalty: `wallet_loyalty_${USER_ID}`,
    monthlyPlan: `wallet_plan_${USER_ID}`
  };
}

function getPendingEsewaKey() {
  return `pending_esewa_order_${USER_ID}`;
}

function getProcessedEsewaKey(transactionUuid) {
  return `processed_esewa_${USER_ID}_${transactionUuid}`;
}

function migrateLegacyCartData() {
  try {
    const legacyCart = JSON.parse(localStorage.getItem(LEGACY_KEYS.cart) || "[]");
    const userCart = JSON.parse(localStorage.getItem(STORAGE.cart) || "[]");

    if (!Array.isArray(legacyCart) || !legacyCart.length) return;

    const merged = Array.isArray(userCart) ? [...userCart] : [];

    legacyCart.forEach((legacyItem) => {
      const legacyKey = String(legacyItem?.id || legacyItem?._id || legacyItem?.name || "");
      const existingIndex = merged.findIndex(
        (item) => String(item?.id || item?._id || item?.name || "") === legacyKey
      );

      if (existingIndex === -1) {
        merged.push({
          ...legacyItem,
          id: legacyItem.id || legacyItem._id || legacyItem.name,
          quantity: Number(legacyItem.quantity ?? legacyItem.qty ?? 1)
        });
      } else {
        merged[existingIndex].quantity =
          Number(merged[existingIndex].quantity ?? merged[existingIndex].qty ?? 0) +
          Number(legacyItem.quantity ?? legacyItem.qty ?? 1);
      }
    });

    localStorage.setItem(STORAGE.cart, JSON.stringify(merged));
    localStorage.removeItem(LEGACY_KEYS.cart);
  } catch {
    // ignore migration failure
  }
}

function renderNavbar() {
  const nav = document.getElementById("navActions");
  if (!nav) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const role = String(currentUser.role || localStorage.getItem("role") || "").toLowerCase();

  nav.innerHTML = "";

  const home = document.createElement("a");
  home.className = "nav__link";
  home.href = "../home/home.html";
  home.textContent = "Home";
  nav.appendChild(home);

  if (role === "admin") {
    const dash = document.createElement("a");
    dash.className = "nav__link";
    dash.href = DASHBOARD_URL;
    dash.textContent = "Dashboard";
    nav.appendChild(dash);
  } else {
    const menu = document.createElement("a");
    menu.className = "nav__link";
    menu.href = "../menu/menu.html";
    menu.textContent = "Menu";

    const orders = document.createElement("a");
    orders.className = "nav__link";
    orders.href = "../orders/orders.html";
    orders.textContent = "Orders";

    const profile = document.createElement("a");
    profile.className = "nav__link";
    profile.href = "../profile/profile.html";
    profile.textContent = "Profile";

    nav.appendChild(menu);
    nav.appendChild(orders);
    nav.appendChild(profile);
  }

  const logout = document.createElement("button");
  logout.className = "nav__link nav__logout";
  logout.textContent = "Logout";
  logout.addEventListener("click", handleLogout);
  nav.appendChild(logout);
}

/* ---------------- SESSION CHECK ---------------- */

async function checkBackendSession() {
  try {
    const res = await fetch(`${API_BASE}/api/orders/__test`, {
      method: "GET",
      credentials: "include"
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ---------------- LOGOUT ---------------- */

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("role");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  window.location.href = LOGIN_URL;
}

function bindLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;
    handleLogout();
  });
}

/* ---------------- BASIC HELPERS ---------------- */

function setStatus(text, type = "") {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = text || "";
  el.className = `status ${type}`.trim();
}

function setDefaultPickupTime() {
  const input = document.getElementById("pickupTime");
  if (!input) return;

  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  input.value = `${hh}:${mm}`;
}

function bindPaymentHint() {
  const paymentMethod = document.getElementById("paymentMethod");
  const paymentHint = document.getElementById("paymentHint");
  const summaryType = document.getElementById("selectedPaymentType");

  if (!paymentMethod || !paymentHint) return;

  function refreshUI() {
    const value = paymentMethod.value;

    if (value === "esewa") {
      paymentHint.textContent = "eSewa Payment will redirect you to the eSewa sandbox payment page before your order is confirmed.";
      if (summaryType) summaryType.textContent = "eSewa Payment";
    } else if (value === "wallet") {
      paymentHint.textContent = "Wallet balance will be used instantly if enough balance is available.";
      if (summaryType) summaryType.textContent = "Wallet Balance";
    } else {
      paymentHint.textContent = "Cash payment will be completed at pickup.";
      if (summaryType) summaryType.textContent = "Cash on Pickup";
    }
  }

  paymentMethod.addEventListener("change", refreshUI);
  refreshUI();
}

function money(n) {
  return `Rs ${Number(n || 0).toLocaleString()}`;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }
  return String(value).replace(/"/g, '\\"');
}

function getItemKey(item) {
  return String(item.id || item._id || item.name || "");
}

function getItemQty(item) {
  return Number(item.quantity ?? item.qty ?? 0);
}

function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE.cart) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE.cart, JSON.stringify(cart || []));
}

function getOrders() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE.orders) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE.orders, JSON.stringify(orders || []));
}

function getFavorites() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE.favorites) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites || []));
}

function cleanupInvalidCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(STORAGE.cart) || "[]");

    if (!Array.isArray(cart)) {
      localStorage.setItem(STORAGE.cart, "[]");
      return;
    }

    const cleaned = cart.filter((item) => item && (item.id || item._id || item.name));
    localStorage.setItem(STORAGE.cart, JSON.stringify(cleaned));
  } catch {
    localStorage.setItem(STORAGE.cart, "[]");
  }
}

function getMenuItems() {
  try {
    const data = JSON.parse(localStorage.getItem("menuItems") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getSubtotal(cart) {
  return cart.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = getItemQty(item);
    return sum + price * qty;
  }, 0);
}

function getTotalItems(cart) {
  return cart.reduce((sum, item) => sum + getItemQty(item), 0);
}

function normalizeStoredCart() {
  const cart = getCart().map((item) => ({
    ...item,
    id: item.id || item._id || item.name,
    quantity: Number(item.quantity ?? item.qty ?? 1)
  }));
  saveCart(cart);
}

function getEstimatedPrepTime(cart) {
  const menuItems = getMenuItems();
  let totalPrep = 0;

  cart.forEach((cartItem) => {
    const matched = menuItems.find((m) => {
      const menuId = String(m?._id || m?.id || "");
      const cartId = String(cartItem?.id || cartItem?._id || "");
      const sameId = menuId && cartId && menuId === cartId;
      const sameName =
        String(m?.name || "").trim().toLowerCase() ===
        String(cartItem?.name || "").trim().toLowerCase();
      return sameId || sameName;
    });

    const prep = Number(matched?.prepMinutes) || Number(matched?.prepTime) || 10;
    totalPrep += prep;
  });

  return totalPrep > 0 ? totalPrep : 10;
}

/* ---------------- IMAGE HELPERS ---------------- */

function cleanImageName(image) {
  const img = String(image || "").trim().replace(/\\/g, "/");
  if (!img) return "";

  if (/^https?:\/\//i.test(img)) {
    const last = img.split("/").pop() || "";
    return decodeURIComponent(last.split("?")[0]);
  }

  if (img.startsWith("/assets/")) return decodeURIComponent(img.replace("/assets/", ""));
  if (img.startsWith("assets/")) return decodeURIComponent(img.replace("assets/", ""));

  return decodeURIComponent(img.split("/").pop() || "");
}

function findMenuItem(cartItem) {
  const menuItems = getMenuItems();

  return menuItems.find((m) => {
    const menuId = String(m?._id || m?.id || "");
    const cartId = String(cartItem?.id || cartItem?._id || "");
    const sameId = menuId && cartId && menuId === cartId;

    const sameName =
      String(m?.name || "").trim().toLowerCase() ===
      String(cartItem?.name || "").trim().toLowerCase();

    return sameId || sameName;
  });
}

function getImageFileName(cartItem) {
  const fromCart = cleanImageName(cartItem?.image);
  if (fromCart) return fromCart;

  const menuItem = findMenuItem(cartItem);
  const fromMenu = cleanImageName(menuItem?.image);
  if (fromMenu) return fromMenu;

  return "food-momo.png";
}

function getImageUrl(cartItem) {
  return `${API_BASE}/assets/${encodeURIComponent(getImageFileName(cartItem))}`;
}

function attachImageFallback(imgEl) {
  imgEl.addEventListener("error", function onImgError() {
    imgEl.removeEventListener("error", onImgError);
    imgEl.src = `${API_BASE}/assets/food-momo.png`;
  });
}

/* ---------------- HERO UI HELPERS ---------------- */

function updateHeroInfo(cart) {
  const subtotal = getSubtotal(cart);
  const totalItems = getTotalItems(cart);
  const prepTime = getEstimatedPrepTime(cart);

  const status = document.getElementById("status");
  if (status && cart.length) {
    status.textContent = `${totalItems} item(s) in cart • Estimated prep ${prepTime} min • Total ${money(subtotal)}`;
  } else if (status) {
    status.textContent = "Your cart is currently empty.";
  }
}

function renderWalletBalance() {
  const walletKeys = getWalletStorageKeys();
  const balance = Number(localStorage.getItem(walletKeys.balance) || 0);
  const el = document.getElementById("walletBalanceDisplay");
  if (el) el.textContent = money(balance);
}

/* ---------------- RENDER CART ---------------- */

function renderCart() {
  const cart = getCart();
  const list = document.getElementById("list");
  const empty = document.getElementById("empty");
  const sub = document.getElementById("subtotal");
  const tot = document.getElementById("total");

  if (!list || !empty) return;

  list.innerHTML = "";
  updateHeroInfo(cart);
  renderWalletBalance();

  if (!cart.length) {
    empty.style.display = "block";
    if (sub) sub.textContent = money(0);
    if (tot) tot.textContent = money(0);
    return;
  }

  empty.style.display = "none";

  const subtotal = getSubtotal(cart);

  cart.forEach((item) => {
    const price = Number(item.price || 0);
    const qty = getItemQty(item);
    const itemKey = getItemKey(item);

    const row = document.createElement("div");
    row.className = "itemRow";

    row.innerHTML = `
      <img class="thumb" alt="${escapeHtml(item.name || "Item")}">
      <div class="info">
        <div class="itemName">${escapeHtml(item.name || "Item")}</div>
        <div class="itemMeta">Qty is saved locally</div>
        <div class="price">${money(price)}</div>
      </div>

      <div class="qtyBox">
        <button class="qtyBtn" type="button" data-minus="${escapeHtml(itemKey)}">−</button>
        <div class="qtyNum">${qty}</div>
        <button class="qtyBtn" type="button" data-plus="${escapeHtml(itemKey)}">+</button>
      </div>
    `;

    const img = row.querySelector(".thumb");
    if (img) {
      img.src = getImageUrl(item);
      attachImageFallback(img);
    }

    row.querySelector(`[data-plus="${cssEscape(itemKey)}"]`)?.addEventListener("click", () => {
      changeQty(itemKey, 1);
    });

    row.querySelector(`[data-minus="${cssEscape(itemKey)}"]`)?.addEventListener("click", () => {
      changeQty(itemKey, -1);
    });

    list.appendChild(row);
  });

  if (sub) sub.textContent = money(subtotal);
  if (tot) tot.textContent = money(subtotal);
}

/* ---------------- CHANGE QTY ---------------- */

function changeQty(id, delta) {
  const cart = getCart();
  const index = cart.findIndex((item) => getItemKey(item) === String(id));

  if (index === -1) return;

  cart[index].quantity = getItemQty(cart[index]) + Number(delta || 0);

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
}

/* ---------------- ORDER PREP ---------------- */

function buildOrderDraft() {
  const cart = getCart();

  if (!cart.length) {
    alert("Cart is empty.");
    return null;
  }

  const pickupTime = document.getElementById("pickupTime")?.value || "";
  const paymentMethod = document.getElementById("paymentMethod")?.value || "";
  const note = document.getElementById("note")?.value.trim() || "";

  if (!pickupTime) {
    alert("Please select a pickup time.");
    return null;
  }

  if (!paymentMethod) {
    alert("Please select payment method.");
    return null;
  }

  const totalAmount = getSubtotal(cart);
  const cafeteriaName =
    cart[0]?.cafeName ||
    cart[0]?.cafeteriaName ||
    "Islington College Cafeteria";

  const payload = {
    pickupTime,
    paymentMethod,
    note,
    cafeteriaName,
    totalAmount,
    items: cart.map((item) => ({
      menuItemId: item.id || item._id || item.name,
      name: item.name,
      price: Number(item.price || 0),
      quantity: getItemQty(item),
      qty: getItemQty(item),
      image: getImageFileName(item)
    }))
  };

  return { cart, pickupTime, paymentMethod, note, cafeteriaName, totalAmount, payload };
}

/* ---------------- PLACE ORDER MAIN ---------------- */

async function placeOrder() {
  const draft = buildOrderDraft();
  if (!draft) return;

  const btn = document.getElementById("btnPlaceOrder");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Processing...";
  }

  try {
    if (draft.paymentMethod === "cash") {
      setStatus("Placing cash order...", "loading");
      await finalizeOrderOnBackend(draft.payload, {
        paymentMethod: "cash",
        paymentStatus: "pending"
      });
      return;
    }

    if (draft.paymentMethod === "wallet") {
      await handleWalletPayment(draft);
      return;
    }

    if (draft.paymentMethod === "esewa") {
      await startEsewaPayment(draft);
      return;
    }

    throw new Error("Unsupported payment method.");
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Failed to process order.", "err");
    alert(err.message || "Failed to process order.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Place Pre-Order";
    }
  }
}

/* ---------------- WALLET PAYMENT ---------------- */

async function handleWalletPayment(draft) {
  const walletKeys = getWalletStorageKeys();
  const balance = Number(localStorage.getItem(walletKeys.balance) || 0);

  if (balance < draft.totalAmount) {
    setStatus("Insufficient wallet balance. Please top up first.", "err");
    alert("Insufficient wallet balance. Please top up first.");
    return;
  }

  const newBalance = balance - draft.totalAmount;
  localStorage.setItem(walletKeys.balance, String(newBalance));

  const transactions = (() => {
    try {
      return JSON.parse(localStorage.getItem(walletKeys.transactions) || "[]");
    } catch {
      return [];
    }
  })();

  transactions.push({
    type: "Food Order Payment",
    amount: draft.totalAmount,
    method: "Wallet Balance",
    status: "Success",
    date: getTodayString()
  });

  localStorage.setItem(walletKeys.transactions, JSON.stringify(transactions));

  setStatus("Wallet payment successful. Placing your order...", "loading");

  await finalizeOrderOnBackend(draft.payload, {
    paymentMethod: "wallet",
    paymentStatus: "paid"
  });

  renderWalletBalance();
}

/* ---------------- eSewa PAYMENT ---------------- */

async function startEsewaPayment(draft) {
  const transactionUuid = generateTransactionUuid();
  const successUrl = `${window.location.origin}${window.location.pathname}?esewa=success`;
  const failureUrl = `${window.location.origin}${window.location.pathname}?esewa=failure`;

  const pendingData = {
    transaction_uuid: transactionUuid,
    totalAmount: Number(draft.totalAmount),
    createdAt: Date.now(),
    orderPayload: {
      ...draft.payload,
      paymentMethod: "esewa"
    }
  };

  localStorage.setItem(getPendingEsewaKey(), JSON.stringify(pendingData));

  const signRes = await fetch(`${API_BASE}/api/esewa/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      totalAmount: Number(draft.totalAmount),
      transactionUuid
    })
  });

  const signData = await signRes.json().catch(() => ({}));

  if (!signRes.ok || !signData.success) {
    throw new Error(signData.message || "Failed to initialize eSewa Payment.");
  }

  setStatus("Redirecting to eSewa Payment...", "loading");

  submitEsewaForm(signData.formUrl, {
    amount: Number(draft.totalAmount),
    tax_amount: ESEWA_CONFIG.TAX_AMOUNT,
    total_amount: Number(draft.totalAmount),
    transaction_uuid: transactionUuid,
    product_code: signData.productCode,
    product_service_charge: ESEWA_CONFIG.SERVICE_CHARGE,
    product_delivery_charge: ESEWA_CONFIG.DELIVERY_CHARGE,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: signData.signedFieldNames,
    signature: signData.signature
  });
}

function submitEsewaForm(actionUrl, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";

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
  const pendingRaw = localStorage.getItem(getPendingEsewaKey());

  if (!pendingRaw) return;

  let pending;
  try {
    pending = JSON.parse(pendingRaw);
  } catch {
    localStorage.removeItem(getPendingEsewaKey());
    return;
  }

  const processedKey = getProcessedEsewaKey(pending.transaction_uuid);

  if (sessionStorage.getItem(processedKey) === "1") {
    removeEsewaQueryParams();
    return;
  }

  if (mode === "failure") {
    setStatus("eSewa Payment was canceled or failed. Please try again.", "err");
    localStorage.removeItem(getPendingEsewaKey());
    removeEsewaQueryParams();
    return;
  }

  if (!mode && !dataParam) {
    return;
  }

  let returnedPayload = null;
  if (dataParam) {
    returnedPayload = parseEsewaResponseData(dataParam);
    console.log("eSewa returned payload:", returnedPayload);
  }

  let verifyResponse = null;
  try {
    verifyResponse = await verifyEsewaTransaction(
      pending.transaction_uuid,
      pending.totalAmount
    );
    console.log("eSewa verify response:", verifyResponse);
  } catch (err) {
    console.error("eSewa verify failed:", err);
  }

  const verifiedStatus = verifyResponse?.data || {};
  const verifiedComplete =
    String(verifiedStatus.status || "").toUpperCase() === "COMPLETE";

  const fallbackComplete =
    returnedPayload &&
    String(returnedPayload.status || "").toUpperCase() === "COMPLETE";

  if (!verifiedComplete && !fallbackComplete) {
    setStatus("Payment could not be verified yet. Please try again.", "err");
    return;
  }

  const extraMeta = {
    paymentMethod: "esewa",
    paymentStatus: "paid",
    esewaTransactionUuid: pending.transaction_uuid,
    esewaRefId:
      verifiedStatus.ref_id ||
      verifiedStatus.transaction_code ||
      returnedPayload?.transaction_code ||
      returnedPayload?.transaction_uuid ||
      ""
  };

  setStatus("eSewa Payment successful. Finalizing your order...", "loading");

  const success = await finalizeOrderOnBackend(pending.orderPayload, extraMeta);

  if (success) {
    sessionStorage.setItem(processedKey, "1");
    localStorage.removeItem(getPendingEsewaKey());
    removeEsewaQueryParams();
  }
}

/* ---------------- HELPERS ---------------- */

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
  return `${y}${m}${d}-${hh}${mm}${ss}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ---------------- FINALIZE ORDER ---------------- */

async function finalizeOrderOnBackend(payload, paymentMeta = {}) {
  const finalPayload = {
    ...payload,
    paymentMethod: paymentMeta.paymentMethod || payload.paymentMethod,
    paymentStatus: paymentMeta.paymentStatus || "pending",
    esewaTransactionUuid: paymentMeta.esewaTransactionUuid || "",
    esewaRefId: paymentMeta.esewaRefId || ""
  };

  const btn = document.getElementById("btnPlaceOrder");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Placing...";
  }

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(finalPayload)
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      if (res.status === 401) {
        setStatus(data.message || "Please login first to place your order.", "err");
        alert(data.message || "Please login first to place your order.");
        setTimeout(() => {
          window.location.href = LOGIN_URL;
        }, 500);
        return false;
      }

      throw new Error(data.message || data.error || `Failed with status ${res.status}`);
    }

    const savedOrder = data.order || {};
    const cart = getCart();

    const orderObj = {
      orderId: savedOrder._id || "",
      orderNo: savedOrder.orderNo || Math.floor(100000 + Math.random() * 900000),
      createdAt: savedOrder.createdAt || Date.now(),
      pickupTime: savedOrder.pickupTime || finalPayload.pickupTime || "",
      cafeteriaName:
        savedOrder.cafeteriaName ||
        finalPayload.cafeteriaName ||
        "Islington College Cafeteria",
      paymentMethod: savedOrder.paymentMethod || finalPayload.paymentMethod || "",
      paymentStatus: savedOrder.paymentStatus || finalPayload.paymentStatus || "pending",
      esewaTransactionUuid:
        savedOrder.esewaTransactionUuid || finalPayload.esewaTransactionUuid || "",
      esewaRefId:
        savedOrder.esewaRefId || finalPayload.esewaRefId || "",
      note: savedOrder.note || finalPayload.note || "",
      totalAmount: Number(savedOrder.totalAmount || finalPayload.totalAmount || 0),
      orderStatus: savedOrder.orderStatus || "placed",
      earnedPoints: Number(savedOrder.earnedPoints || data.pointsEarned || 0),
      items: cart.map((item) => {
        const qty = getItemQty(item);
        const price = Number(item.price || 0);

        return {
          id: item.id || item._id || item.name,
          name: item.name,
          price,
          quantity: qty,
          image: getImageFileName(item),
          total: price * qty
        };
      }),
      summary: {
        totalItems: getTotalItems(cart),
        subtotal: getSubtotal(cart),
        displayTotal: money(getSubtotal(cart))
      }
    };

    localStorage.setItem(STORAGE.lastOrder, JSON.stringify(orderObj));

    const orders = getOrders();
    orders.push(orderObj);
    saveOrders(orders);

    updateFavoritesFromCart(cart);

    saveCart([]);
    renderWalletBalance();
    setStatus("Order placed successfully. Redirecting to Orders page...", "ok");

    setTimeout(() => {
      window.location.href = ORDERS_URL;
    }, 1200);

    return true;
  } catch (err) {
    console.error("Finalize order error:", err);
    setStatus(err.message || "Failed to place order.", "err");
    alert(err.message || "Failed to place order.");
    return false;
  } finally {
    const btn = document.getElementById("btnPlaceOrder");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Place Pre-Order";
    }
  }
}

function updateFavoritesFromCart(cart) {
  const favorites = getFavorites();

  cart.forEach((cartItem) => {
    const key = String(cartItem.id || cartItem._id || cartItem.name);
    const idx = favorites.findIndex((x) => String(x.id || x._id || x.name) === key);

    if (idx === -1) {
      favorites.push({
        id: cartItem.id || cartItem._id || cartItem.name,
        name: cartItem.name,
        price: Number(cartItem.price || 0),
        image: getImageFileName(cartItem),
        count: getItemQty(cartItem)
      });
    } else {
      favorites[idx].count =
        Number(favorites[idx].count || 0) + getItemQty(cartItem);
    }
  });

  saveFavorites(favorites);
}