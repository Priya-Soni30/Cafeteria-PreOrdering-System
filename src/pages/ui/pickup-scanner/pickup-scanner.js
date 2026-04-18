const API_BASE = window.API_BASE || "http://127.0.0.1:5000";
const LOGIN_URL = "../login/login.html";
const DASHBOARD_URL = "../dashboard/dashboard.html";
const PICKUP_SCANNER_URL = "../pickup-scanner/pickup-scanner.html";

let CURRENT_USER = null;
let USER_ID = "";
let STORAGE = {
  orders: "orders",
  lastOrder: "lastOrder"
};

let html5QrScanner = null;
let lastScannedText = "";
let SCANNED_ORDER = null;

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const allowed = await requireStudentAccess();
  if (!allowed) return;

  setupUserStorage();
  renderNavbar();
  bindActions();

  document.getElementById("goHome")?.addEventListener("click", () => {
    window.location.href = "../home/home.html";
  });

  loadInitialOrderDirectly();
});

/* ---------------- ACCESS ---------------- */

function getCurrentUser() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return currentUser || user || null;
}

async function requireStudentAccess() {
  CURRENT_USER = getCurrentUser();

  if (!CURRENT_USER) {
    try {
      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "GET",
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        const backendUser = data?.user || data || null;

        if (backendUser) {
          CURRENT_USER = backendUser;
          localStorage.setItem("currentUser", JSON.stringify(backendUser));
          localStorage.setItem("user", JSON.stringify(backendUser));

          if (backendUser.role) {
            localStorage.setItem("role", String(backendUser.role).toLowerCase());
          }
        }
      }
    } catch {
      // ignore backend session issue
    }
  }

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
    orders: `orders_${USER_ID}`,
    lastOrder: `lastOrder_${USER_ID}`
  };
}

/* ---------------- NAVBAR ---------------- */

function renderNavbar() {
  const nav = document.getElementById("navActions");
  if (!nav) return;

  nav.innerHTML = "";

  const links = [
    { text: "Home", href: "../home/home.html" },
    { text: "Menu", href: "../menu/menu.html" },
    { text: "Orders", href: "../orders/orders.html" },
    { text: "Profile", href: "../profile/profile.html" },
    { text: "Pickup", href: "../pickup-scanner/pickup-scanner.html", active: true }
  ];

  links.forEach((link) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `nav-btn${link.active ? " active" : ""}`;
    btn.textContent = link.text;
    btn.addEventListener("click", () => {
      window.location.href = link.href;
    });
    nav.appendChild(btn);
  });

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "nav-btn";
  logoutBtn.textContent = "Logout";
  logoutBtn.addEventListener("click", logoutUser);
  nav.appendChild(logoutBtn);
}

function logoutUser() {
  const ok = window.confirm("Are you sure you want to logout?");
  if (!ok) return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("role");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  window.location.href = LOGIN_URL;
}

/* ---------------- BINDINGS ---------------- */

function bindActions() {
  document.getElementById("btnStartScanner")?.addEventListener("click", startScanner);
  document.getElementById("btnParseManual")?.addEventListener("click", parseManualQrText);
  document.getElementById("btnClearManual")?.addEventListener("click", clearManualText);
  document.getElementById("btnResetScan")?.addEventListener("click", resetScannedResult);
  document.getElementById("btnMarkCollected")?.addEventListener("click", markOrderCollected);
}

/* ---------------- STORAGE ---------------- */

function getOrders() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE.orders) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getLastOrder() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE.lastOrder) || "null");
    return data || null;
  } catch {
    return null;
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE.orders, JSON.stringify(orders || []));
}

function saveLastOrder(order) {
  localStorage.setItem(STORAGE.lastOrder, JSON.stringify(order || null));
}

/* ---------------- HELPERS ---------------- */

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

function normalizeQty(item) {
  return Number(item?.quantity ?? item?.qty ?? 1);
}

function normalizeItemId(item) {
  return String(item?.id || item?._id || item?.menuItemId || item?.name || "").trim();
}

function setScanMessage(text, type = "normal") {
  const box = document.getElementById("scanMessage");
  if (!box) return;

  box.textContent = text || "";

  if (type === "error") {
    box.style.background = "rgba(220, 38, 38, 0.10)";
    box.style.color = "#b42318";
    return;
  }

  if (type === "success") {
    box.style.background = "rgba(92, 106, 82, 0.12)";
    box.style.color = "#4c5b43";
    return;
  }

  box.style.background = "rgba(92, 106, 82, 0.09)";
  box.style.color = "#4c5b43";
}

function getOrderTotalFromItems(items = []) {
  return items.reduce((sum, item) => sum + Number(item?.price || 0) * normalizeQty(item), 0);
}

function getPickupQrUrl(order) {
  const url = new URL(PICKUP_SCANNER_URL, window.location.href);
  const orderNo = String(order?.orderNo || "").trim();

  if (orderNo) {
    url.searchParams.set("orderNo", orderNo);
  }

  if (order?.cafeteriaName) {
    url.searchParams.set("cafeteria", order.cafeteriaName);
  }

  return url.toString();
}

/* ---------------- ORDER LOAD ---------------- */

function getOrderNoFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("orderNo") || "").trim();
}

function findStoredOrderByOrderNo(orderNo) {
  const orders = getOrders();

  return (
    orders.find((order) => String(order?.orderNo || "").trim() === String(orderNo || "").trim()) || null
  );
}

function buildScannerOrderFromStoredOrder(order) {
  return {
    orderNo: String(order?.orderNo || ""),
    collectionCode: `ORD-${String(order?.orderNo || "000000")}`,
    cafeteriaName: String(order?.cafeteriaName || "Islington College Cafeteria"),
    pickupTime: String(order?.pickupTime || "—"),
    paymentMethod: String(order?.paymentMethod || "—"),
    paymentStatus: String(order?.paymentStatus || "—"),
    total: Number(order?.totalAmount || getOrderTotalFromItems(order?.items || []) || 0),
    items: Array.isArray(order?.items)
      ? order.items.map((item) => ({
          id: normalizeItemId(item),
          name: item?.name || "Item",
          quantity: normalizeQty(item),
          price: Number(item?.price || 0),
          image: item?.image || ""
        }))
      : []
  };
}

function loadInitialOrderDirectly() {
  const urlOrderNo = getOrderNoFromUrl();
  let matchedOrder = null;

  if (urlOrderNo) {
    matchedOrder = findStoredOrderByOrderNo(urlOrderNo);
  }

  if (!matchedOrder) {
    matchedOrder = getLastOrder();
  }

  if (!matchedOrder) {
    const orders = getOrders();
    matchedOrder = orders.length ? orders[orders.length - 1] : null;
  }

  if (!matchedOrder) {
    showEmptyState();
    setScanMessage("No order found yet. Place an order first or scan a QR.", "normal");
    return;
  }

  SCANNED_ORDER = buildScannerOrderFromStoredOrder(matchedOrder);
  showScannedOrder(SCANNED_ORDER);
  renderQrPreview(SCANNED_ORDER);
  setScanMessage(`Order #${SCANNED_ORDER.orderNo} loaded successfully.`, "success");
}

/* ---------------- QR PREVIEW ---------------- */
function buildPickupPreviewText(order) {
  const itemsText = (order?.items || [])
    .map((item) => {
      const qty = normalizeQty(item);
      const price = Number(item?.price || 0);
      return `${item?.name || "Item"} x${qty} = Rs ${(qty * price).toLocaleString()}`;
    })
    .join(", ");

  return [
    "ISLINGTON COLLEGE CAFETERIA ORDER",
    `Order No: ${String(order?.orderNo || "").trim() || "—"}`,
    `Collection Code: ORD-${String(order?.orderNo || "000000").trim()}`,
    `Cafeteria: ${order?.cafeteriaName || "—"}`,
    `Pickup Time: ${order?.pickupTime || "—"}`,
    `Payment Method: ${order?.paymentMethod || "—"}`,
    `Payment Status: ${order?.paymentStatus || "—"}`,
    `Items: ${itemsText || "No items"}`,
    `Total: Rs ${Number(order?.total || 0).toLocaleString()}`
  ].join("\n");
}

function renderQrPreview(order) {
  const box = document.getElementById("qrPreview");
  const previewWrap = document.getElementById("qrPreviewBox");

  if (!box || !previewWrap || !order) return;

  previewWrap.style.display = "flex";
  box.innerHTML = "";

  new QRCode(box, {
    text: buildPickupPreviewText(order),
    width: 190,
    height: 190,
    colorDark: "#4c5b43",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}
/* ---------------- QR SCAN PARSE ---------------- */

function parseScannedText(rawText) {
  if (!rawText) return null;

  const text = String(rawText).trim();

  const orderNoMatch = text.match(/Order No:\s*([^\n\r]+)/i);
  if (orderNoMatch && orderNoMatch[1]) {
    return { orderNo: String(orderNoMatch[1]).trim() };
  }

  if (text.startsWith("ICPICKUP|")) {
    const parts = text.split("|");
    const orderNo = String(parts[1] || "").trim();
    if (orderNo) return { orderNo };
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed?.orderNo) {
      return { orderNo: String(parsed.orderNo).trim() };
    }
  } catch {
    // ignore invalid JSON
  }

  return null;
}

function buildScannedOrderFromStoredOrder(matchedOrder) {
  return buildScannerOrderFromStoredOrder(matchedOrder);
}

/* ---------------- SCANNER ---------------- */

function startScanner() {
  if (typeof Html5QrcodeScanner === "undefined") {
    setScanMessage("Scanner library not loaded.", "error");
    return;
  }

  const previewWrap = document.getElementById("qrPreviewBox");
  if (previewWrap) previewWrap.style.display = "none";

  if (html5QrScanner) {
    setScanMessage("Scanner is already running.", "normal");
    return;
  }

  const reader = document.getElementById("reader");
  if (reader) reader.innerHTML = "";

  html5QrScanner = new Html5QrcodeScanner(
    "reader",
    {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      rememberLastUsedCamera: true
    },
    false
  );

  html5QrScanner.render(onScanSuccess, onScanFailure);
  setScanMessage("Scanner started. Point camera toward the QR code.", "normal");
}

function stopScanner() {
  if (!html5QrScanner) return;

  try {
    html5QrScanner.clear();
  } catch (err) {
    console.error("Scanner clear error:", err);
  }

  html5QrScanner = null;

  const reader = document.getElementById("reader");
  if (reader) {
    reader.innerHTML = `
      <div id="qrPreviewBox" class="qr-preview">
        <div id="qrPreview" class="qr-preview-canvas"></div>
        <div class="qr-preview-text">Current Pickup QR</div>
      </div>
    `;
  }

  if (SCANNED_ORDER) {
    renderQrPreview(SCANNED_ORDER);
  }
}

function onScanSuccess(decodedText) {
  if (!decodedText || decodedText === lastScannedText) return;

  lastScannedText = decodedText;

  const parsed = parseScannedText(decodedText);

  if (!parsed?.orderNo) {
    setScanMessage("This QR does not contain valid pickup order data.", "error");
    return;
  }

  const matchedOrder = findStoredOrderByOrderNo(parsed.orderNo);

  if (!matchedOrder) {
    setScanMessage("Matching order not found for this student.", "error");
    return;
  }

  SCANNED_ORDER = buildScannedOrderFromStoredOrder(matchedOrder);
  showScannedOrder(SCANNED_ORDER);
  renderQrPreview(SCANNED_ORDER);
  stopScanner();

  setScanMessage(`Order #${SCANNED_ORDER.orderNo} scanned successfully.`, "success");
}

function onScanFailure() {
  // keep silent
}

/* ---------------- MANUAL ---------------- */

function parseManualQrText() {
  const text = document.getElementById("manualQrText")?.value?.trim() || "";

  if (!text) {
    setScanMessage("Paste the QR text first.", "error");
    return;
  }

  const parsed = parseScannedText(text);

  if (!parsed?.orderNo) {
    setScanMessage("Paste valid pickup QR content.", "error");
    return;
  }

  const matchedOrder = findStoredOrderByOrderNo(parsed.orderNo);

  if (!matchedOrder) {
    setScanMessage("Matching order not found for this student.", "error");
    return;
  }

  SCANNED_ORDER = buildScannedOrderFromStoredOrder(matchedOrder);
  showScannedOrder(SCANNED_ORDER);
  renderQrPreview(SCANNED_ORDER);
  setScanMessage(`Order #${SCANNED_ORDER.orderNo} loaded successfully.`, "success");
}

/* ---------------- RENDER ---------------- */

function showEmptyState() {
  const resultEmpty = document.getElementById("resultEmpty");
  const resultContent = document.getElementById("resultContent");
  const resultBadge = document.getElementById("resultBadge");
  const heroCafePill = document.getElementById("heroCafePill");
  const heroStatusPill = document.getElementById("heroStatusPill");
  const itemsList = document.getElementById("itemsList");
  const itemCountText = document.getElementById("itemCountText");

  if (resultEmpty) resultEmpty.style.display = "grid";
  if (resultContent) resultContent.style.display = "none";
  if (resultBadge) resultBadge.textContent = "No Order";
  if (heroCafePill) heroCafePill.textContent = "Cafeteria Pickup";
  if (heroStatusPill) heroStatusPill.textContent = "Ready to Scan";
  if (itemsList) itemsList.innerHTML = "";
  if (itemCountText) itemCountText.textContent = "0 item(s)";
}

function showScannedOrder(data) {
  const resultEmpty = document.getElementById("resultEmpty");
  const resultContent = document.getElementById("resultContent");
  const resultBadge = document.getElementById("resultBadge");
  const heroCafePill = document.getElementById("heroCafePill");
  const heroStatusPill = document.getElementById("heroStatusPill");

  if (resultEmpty) resultEmpty.style.display = "none";
  if (resultContent) resultContent.style.display = "block";
  if (resultBadge) resultBadge.textContent = "Order Found";

  document.getElementById("orderNoText").textContent = data.orderNo || "—";
  document.getElementById("collectionCodeText").textContent = data.collectionCode || "—";
  document.getElementById("cafeteriaText").textContent = data.cafeteriaName || "—";
  document.getElementById("pickupTimeText").textContent = data.pickupTime || "—";
  document.getElementById("paymentMethodText").textContent = data.paymentMethod || "—";
  document.getElementById("paymentStatusText").textContent = data.paymentStatus || "—";
  document.getElementById("totalText").textContent = money(data.total || 0);

  if (heroCafePill) heroCafePill.textContent = data.cafeteriaName || "Cafeteria Pickup";
  if (heroStatusPill) heroStatusPill.textContent = "Order Loaded";

  const itemsList = document.getElementById("itemsList");
  const itemCountText = document.getElementById("itemCountText");

  if (!itemsList) return;

  itemsList.innerHTML = "";

  let totalItems = 0;

  (data.items || []).forEach((item) => {
    const qty = normalizeQty(item);
    const price = Number(item?.price || 0);
    const lineTotal = qty * price;

    totalItems += qty;

    const row = document.createElement("div");
    row.className = "scan-item";

    row.innerHTML = `
      <div class="scan-item-top">
        <div>
          <div class="scan-item-name">${escapeHtml(item?.name || "Item")}</div>
          <div class="scan-item-meta">Qty: ${qty} • Unit Price: ${money(price)}</div>
        </div>
        <div class="scan-item-total">${money(lineTotal)}</div>
      </div>
    `;

    itemsList.appendChild(row);
  });

  if (itemCountText) {
    itemCountText.textContent = `${totalItems} item(s)`;
  }
}

/* ---------------- CLEAR / RESET ---------------- */

function clearManualText() {
  const field = document.getElementById("manualQrText");
  if (field) field.value = "";
  setScanMessage("Manual QR text cleared.", "normal");
}

function resetScannedResult() {
  SCANNED_ORDER = null;
  lastScannedText = "";

  const itemsList = document.getElementById("itemsList");
  const itemCountText = document.getElementById("itemCountText");
  const manualField = document.getElementById("manualQrText");

  if (itemsList) itemsList.innerHTML = "";
  if (itemCountText) itemCountText.textContent = "0 item(s)";
  if (manualField) manualField.value = "";

  stopScanner();
  loadInitialOrderDirectly();
}

/* ---------------- MARK COLLECTED ---------------- */

function markOrderCollected() {
  if (!SCANNED_ORDER) {
    setScanMessage("No order available to mark collected.", "error");
    return;
  }

  const orders = getOrders();
  if (!orders.length) {
    setScanMessage("No stored orders found for this student.", "error");
    return;
  }

  const index = orders.findIndex((order) => {
    return String(order?.orderNo || "").trim() === String(SCANNED_ORDER.orderNo || "").trim();
  });

  if (index === -1) {
    setScanMessage("Matching order not found in local storage.", "error");
    return;
  }

  orders[index] = {
    ...orders[index],
    orderStatus: "collected"
  };

  saveOrders(orders);

  const lastOrder = orders[orders.length - 1] || null;
  saveLastOrder(lastOrder);

  const resultBadge = document.getElementById("resultBadge");
  const heroStatusPill = document.getElementById("heroStatusPill");

  if (resultBadge) resultBadge.textContent = "Collected";
  if (heroStatusPill) heroStatusPill.textContent = "Marked Collected";

  setScanMessage(`Order #${SCANNED_ORDER.orderNo} marked as collected.`, "success");
}

