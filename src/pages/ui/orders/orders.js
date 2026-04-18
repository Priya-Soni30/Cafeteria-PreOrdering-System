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

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const allowed = await requireStudentAccess();
  if (!allowed) return;

  setupUserStorage();
  normalizeStoredOrders();
  ensureLastOrderConsistency();
  renderNavbar();
  bindActions();
  bindPaymentSummaryModal();
  renderSpecialFromHome();
  renderOrders();
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
      // ignore backend session check failure
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
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", logoutUser);
}

function logoutUser() {
  const confirmLogout = window.confirm("Are you sure you want to logout?");
  if (!confirmLogout) return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("role");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  window.location.href = LOGIN_URL;
}

/* ---------------- ACTIONS ---------------- */

function bindActions() {
  document.getElementById("btnClearHistory")?.addEventListener("click", clearOrderHistory);
  document.getElementById("btnTrack")?.addEventListener("click", trackLatestOrderStep);
  document.getElementById("btnPaymentSummary")?.addEventListener("click", openPaymentSummaryModal);

  updatePickupScannerLink(getResolvedLastOrder());
}

function updatePickupScannerLink(order) {
  const qrLink = document.querySelector(".qrScanBtn");
  if (!qrLink) return;

  if (order?.orderNo) {
    qrLink.href = getPickupQrUrl(order);
  } else {
    qrLink.href = PICKUP_SCANNER_URL;
  }
}

function bindPaymentSummaryModal() {
  document.getElementById("paymentSummaryBackdrop")?.addEventListener("click", closePaymentSummaryModal);
  document.getElementById("paymentSummaryClose")?.addEventListener("click", closePaymentSummaryModal);
  document.getElementById("paymentSummaryDone")?.addEventListener("click", closePaymentSummaryModal);
}

function openPaymentSummaryModal() {
  const order = getResolvedLastOrder();
  if (!order) return;

  const modal = document.getElementById("paymentSummaryModal");
  const method = document.getElementById("modalPaymentMethod");
  const status = document.getElementById("modalPaymentStatus");
  const ref = document.getElementById("modalPaymentReference");
  const account = document.getElementById("modalPaymentAccount");
  const total = document.getElementById("modalPaymentTotal");
  const note = document.getElementById("modalPaymentNote");

  if (method) method.textContent = order?.paymentMethod || "—";
  if (status) status.textContent = order?.paymentStatus || "—";
  if (ref) ref.textContent = getPaymentReference(order);
  if (account) account.textContent = order?.dummyAccount || "—";
  if (total) total.textContent = money(getOrderTotal(order));
  if (note) {
    note.textContent =
      getPaymentDetailsText(order) || "Your payment details are stored with this order for quick review.";
  }

  if (modal) {
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }
}

function closePaymentSummaryModal() {
  const modal = document.getElementById("paymentSummaryModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function clearOrderHistory() {
  const ok = window.confirm("Are you sure you want to clear your order history?");
  if (!ok) return;

  localStorage.removeItem(STORAGE.orders);
  localStorage.removeItem(STORAGE.lastOrder);
  renderOrders();
}

function trackLatestOrderStep() {
  const lastOrder = getResolvedLastOrder();
  if (!lastOrder) return;

  const currentStatus = normalizeOrderStatus(lastOrder.orderStatus || "placed");
  let nextStatus = currentStatus;

  if (currentStatus === "placed") nextStatus = "preparing";
  else if (currentStatus === "preparing") nextStatus = "ready";
  else if (currentStatus === "ready") nextStatus = "ready";
  else if (currentStatus === "collected") nextStatus = "collected";

  updateStoredOrderStatus(nextStatus);
  renderOrders();
}

function updateStoredOrderStatus(newStatus) {
  const orders = getOrders();
  if (!orders.length) return;

  const updatedOrders = [...orders];
  const lastIndex = updatedOrders.length - 1;

  updatedOrders[lastIndex] = normalizeOrderObject({
    ...updatedOrders[lastIndex],
    orderStatus: normalizeOrderStatus(newStatus)
  });

  saveOrders(updatedOrders);
  saveLastOrder(updatedOrders[lastIndex]);
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

function getResolvedLastOrder() {
  const lastOrder = getLastOrder();
  const orders = getOrders();

  if (lastOrder && String(lastOrder.orderNo || "").trim()) {
    return normalizeOrderObject(lastOrder);
  }

  if (orders.length) {
    return normalizeOrderObject(orders[orders.length - 1]);
  }

  return null;
}

function ensureLastOrderConsistency() {
  const orders = getOrders().map(normalizeOrderObject);
  saveOrders(orders);

  const lastOrder = getLastOrder();

  if (lastOrder && String(lastOrder.orderNo || "").trim()) {
    saveLastOrder(normalizeOrderObject(lastOrder));
    return;
  }

  if (orders.length) {
    saveLastOrder(orders[orders.length - 1]);
  } else {
    localStorage.removeItem(STORAGE.lastOrder);
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

function normalizeOrderItem(item) {
  const qty = Number(item?.quantity ?? item?.qty ?? 1);
  const price = Number(item?.price || 0);

  return {
    ...item,
    id: item?.id || item?._id || item?.menuItemId || item?.name || "",
    menuItemId: item?.menuItemId || item?.id || item?._id || item?.name || "",
    quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
    image: item?.image || "",
    total: Number(item?.total || price * qty || 0)
  };
}

function normalizeOrderObject(order) {
  const items = Array.isArray(order?.items) ? order.items.map(normalizeOrderItem) : [];
  const totalAmount = Number(order?.totalAmount);

  return {
    ...order,
    orderId: order?.orderId || order?._id || "",
    orderNo: String(order?.orderNo || "").trim(),
    createdAt: order?.createdAt || Date.now(),
    pickupTime: order?.pickupTime || "—",
    cafeteriaName: order?.cafeteriaName || "Islington College Cafeteria",
    paymentMethod: normalizePaymentMethod(order?.paymentMethod),
    paymentStatus: normalizePaymentStatus(order?.paymentStatus, order?.paymentMethod),
    orderStatus: normalizeOrderStatus(order?.orderStatus || "placed"),
    esewaTransactionUuid: order?.esewaTransactionUuid || "",
    esewaRefId: order?.esewaRefId || "",
    dummyAccount: order?.dummyAccount || "",
    dummyTxn: order?.dummyTxn || "",
    note: order?.note || "",
    totalAmount: Number.isFinite(totalAmount) ? totalAmount : calculateItemsTotal(items),
    earnedPoints: Number(order?.earnedPoints || 0),
    items
  };
}

function normalizeStoredOrders() {
  const orders = getOrders().map(normalizeOrderObject);
  saveOrders(orders);

  const lastOrder = getLastOrder();
  if (lastOrder) {
    saveLastOrder(normalizeOrderObject(lastOrder));
  }
}

/* ---------------- HELPERS ---------------- */

function money(n) {
  return `Rs ${Number(n || 0).toLocaleString()}`;
}

function formatDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getItemKey(item) {
  return String(item?.id || item?._id || item?.menuItemId || item?.name || "").trim();
}

function getItemQty(item) {
  return Number(item?.quantity ?? item?.qty ?? 0);
}

function normalizePaymentMethod(value) {
  const raw = String(value || "").trim().toLowerCase();

  if (raw === "wallet") return "Wallet Balance";
  if (raw === "cash") return "Cash on Pickup";
  if (raw === "esewa") return "eSewa Payment";

  return value || "—";
}

function normalizePaymentStatus(status, method) {
  const rawStatus = String(status || "").trim().toLowerCase();
  const rawMethod = String(method || "").trim().toLowerCase();

  if (rawStatus === "paid") return "Paid";
  if (rawStatus === "pending") return "Pending";
  if (rawStatus === "failed") return "Failed";

  if (rawMethod === "wallet" || rawMethod === "esewa") return "Paid";
  if (rawMethod === "cash") return "Pending";

  return "—";
}

function normalizeOrderStatus(status) {
  const raw = String(status || "").trim().toLowerCase();

  if (raw === "preparing") return "preparing";
  if (raw === "ready") return "ready";
  if (raw === "collected") return "collected";
  return "placed";
}

function getPaymentReference(order) {
  if (order?.esewaRefId) return order.esewaRefId;
  if (order?.esewaTransactionUuid) return order.esewaTransactionUuid;
  if (order?.dummyTxn) return order.dummyTxn;
  return "—";
}

function getPaymentDetailsText(order) {
  const parts = [];

  parts.push(`Method: ${order?.paymentMethod || "—"}`);
  parts.push(`Status: ${order?.paymentStatus || "—"}`);

  if (order?.dummyAccount) parts.push(`Account: ${order.dummyAccount}`);
  if (order?.dummyTxn) parts.push(`Transaction: ${order.dummyTxn}`);
  if (order?.esewaTransactionUuid) parts.push(`Transaction UUID: ${order.esewaTransactionUuid}`);
  if (order?.esewaRefId) parts.push(`Reference ID: ${order.esewaRefId}`);

  return parts.join(" • ");
}

function calculateItemsTotal(items) {
  return (items || []).reduce((sum, item) => {
    return sum + Number(item?.price || 0) * getItemQty(item);
  }, 0);
}

/* ---------------- SPECIAL ---------------- */

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    cafeteria: params.get("cafeteria") || "",
    specialOfferId: params.get("specialOfferId") || "",
    name: params.get("name") || "",
    price: params.get("price") || "",
    image: params.get("image") || ""
  };
}

function normalizeCafeNameFromSlug(value = "") {
  const raw = String(value || "").trim().toLowerCase();

  if (raw.includes("kumari")) return "Kumari Hall";
  if (raw.includes("brit")) return "Brit Cafe";
  if (raw.includes("coffee")) return "Coffee Station";
  if (raw.includes("canteen")) return "Canteen";

  return value || "Campus Cafeteria";
}

function renderSpecialFromHome() {
  const section = document.getElementById("specialFromHomeSection");
  const title = document.getElementById("specialFromHomeTitle");
  const cafe = document.getElementById("specialFromHomeCafe");
  const price = document.getElementById("specialFromHomePrice");
  const wrap = document.getElementById("specialFromHomeItemWrap");

  if (!section || !title || !cafe || !price || !wrap) return;

  const special = getUrlParams();

  if (!special.name) {
    section.style.display = "none";
    return;
  }

  const item = {
    name: special.name,
    price: Number(special.price || 0),
    quantity: 1,
    image: special.image || ""
  };

  section.style.display = "block";
  title.textContent = special.name;
  cafe.textContent = normalizeCafeNameFromSlug(special.cafeteria);
  price.textContent = money(Number(special.price || 0));

  wrap.innerHTML = "";
  wrap.appendChild(createOrderItemRow(item));
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

function findMenuItem(orderItem) {
  const menuItems = getMenuItems();

  return menuItems.find((m) => {
    const menuId = String(m?._id || m?.id || "").trim();
    const itemId = getItemKey(orderItem);

    const sameId = menuId && itemId && menuId === itemId;

    const sameName =
      String(m?.name || "").trim().toLowerCase() ===
      String(orderItem?.name || "").trim().toLowerCase();

    return sameId || sameName;
  });
}

function getImageFileName(orderItem) {
  const fromOrder = cleanImageName(orderItem?.image);
  if (fromOrder) return fromOrder;

  const menuItem = findMenuItem(orderItem);
  const fromMenu = cleanImageName(menuItem?.image);
  if (fromMenu) return fromMenu;

  return "food-momo.png";
}

function getImageUrl(orderItem) {
  const raw = String(orderItem?.image || "").trim();

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/assets/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("assets/")) return `${API_BASE}/${raw}`;

  return `${API_BASE}/assets/${encodeURIComponent(getImageFileName(orderItem))}`;
}

function attachImageFallback(imgEl) {
  imgEl.addEventListener("error", function onImgError() {
    imgEl.removeEventListener("error", onImgError);
    imgEl.src = `${API_BASE}/assets/food-momo.png`;
  });
}

/* ---------------- CALCULATIONS ---------------- */

function getOrderTotal(order) {
  if (Number.isFinite(Number(order?.totalAmount))) {
    return Number(order.totalAmount);
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  return calculateItemsTotal(items);
}

function getOrderItemCount(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.reduce((sum, item) => sum + getItemQty(item), 0);
}

function getEstimatedWaitTime(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const menuItems = getMenuItems();

  let totalPrep = 0;

  items.forEach((item) => {
    const itemId = getItemKey(item);
    const matched = menuItems.find((m) => {
      const menuId = String(m?._id || m?.id || "").trim();
      const sameId = menuId && itemId && menuId === itemId;
      const sameName =
        String(m?.name || "").trim().toLowerCase() ===
        String(item?.name || "").trim().toLowerCase();

      return sameId || sameName;
    });

    totalPrep += Number(matched?.prepMinutes || matched?.prepTime || 10);
  });

  if (totalPrep <= 10) return "10-15 min";
  if (totalPrep <= 20) return "15-20 min";
  if (totalPrep <= 35) return "20-30 min";
  return "30+ min";
}

function getLoyaltyPoints(order) {
  if (Number.isFinite(Number(order?.earnedPoints))) {
    return Number(order.earnedPoints);
  }

  return Math.floor(getOrderTotal(order) / 10);
}

function getCollectionCode(order) {
  const orderNo = String(order?.orderNo || "000000").trim();
  return `ORD-${orderNo || "000000"}`;
}

/* ---------------- QR ---------------- */

function buildPickupPayload(order) {
  const items = Array.isArray(order?.items)
    ? order.items.map((item) => {
        const qty = getItemQty(item);
        const price = Number(item?.price || 0);
        return {
          name: item?.name || "Item",
          qty,
          price,
          lineTotal: qty * price
        };
      })
    : [];

  return {
    type: "cafeteria-pickup",
    orderNo: String(order?.orderNo || "").trim(),
    collectionCode: getCollectionCode(order),
    cafeteriaName: order?.cafeteriaName || "",
    pickupTime: order?.pickupTime || "",
    paymentMethod: order?.paymentMethod || "",
    paymentStatus: order?.paymentStatus || "",
    totalAmount: getOrderTotal(order),
    items
  };
}

function buildPickupQrText(order) {
  const payload = buildPickupPayload(order);

  const itemsText = (payload.items || [])
    .map((item) => `${item.name} x${item.qty} = Rs ${Number(item.lineTotal || 0).toLocaleString()}`)
    .join(", ");

  return [
    "ISLINGTON COLLEGE CAFETERIA ORDER",
    `Order No: ${payload.orderNo || "—"}`,
    `Collection Code: ${payload.collectionCode || "—"}`,
    `Cafeteria: ${payload.cafeteriaName || "—"}`,
    `Pickup Time: ${payload.pickupTime || "—"}`,
    `Payment Method: ${payload.paymentMethod || "—"}`,
    `Payment Status: ${payload.paymentStatus || "—"}`,
    `Items: ${itemsText || "No items"}`,
    `Total: Rs ${Number(payload.totalAmount || 0).toLocaleString()}`
  ].join("\n");
}

function getPickupQrUrl(order) {
  const orderNo = String(order?.orderNo || "").trim();
  return `${PICKUP_SCANNER_URL}?orderNo=${encodeURIComponent(orderNo)}`;
}

function generateQRCode(order) {
  const qrContainer = document.getElementById("qrCode");
  if (!qrContainer || typeof QRCode === "undefined") return;

  qrContainer.innerHTML = "";

  if (!order?.orderNo) {
    qrContainer.innerHTML = `<div class="muted">No QR available</div>`;
    return;
  }

  const qrText = buildPickupQrText(order);

  new QRCode(qrContainer, {
    text: qrText,
    width: 160,
    height: 160,
    colorDark: "#4c5b43",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  qrContainer.setAttribute("data-qr-text", qrText);
}

/* ---------------- TRACKER ---------------- */

function updateOrderTracker(state = "placed") {
  const orderStateText = document.getElementById("orderStateText");
  const statusMessageText = document.getElementById("statusMessageText");

  const stepPlaced = document.getElementById("stepPlaced");
  const stepPreparing = document.getElementById("stepPreparing");
  const stepReady = document.getElementById("stepReady");

  stepPlaced?.classList.add("active");
  stepPreparing?.classList.remove("active");
  stepReady?.classList.remove("active");

  if (state === "placed") {
    if (orderStateText) orderStateText.textContent = "Placed";
    if (statusMessageText) statusMessageText.textContent = "Your order has been recorded successfully.";
    return;
  }

  if (state === "preparing") {
    stepPreparing?.classList.add("active");
    if (orderStateText) orderStateText.textContent = "Preparing";
    if (statusMessageText) statusMessageText.textContent = "Your cafeteria order is currently being prepared.";
    return;
  }

  if (state === "ready") {
    stepPreparing?.classList.add("active");
    stepReady?.classList.add("active");
    if (orderStateText) orderStateText.textContent = "Ready";
    if (statusMessageText) statusMessageText.textContent = "Your order is ready for pickup.";
    return;
  }

  if (state === "collected") {
    stepPreparing?.classList.add("active");
    stepReady?.classList.add("active");
    if (orderStateText) orderStateText.textContent = "Collected";
    if (statusMessageText) statusMessageText.textContent = "Your order has been collected successfully.";
  }
}

/* ---------------- HERO ---------------- */

function updateHeroData(order) {
  const pickupTimeText = document.getElementById("pickupTimeText");
  const paymentText = document.getElementById("paymentText");
  const paymentStatusText = document.getElementById("paymentStatusText");
  const paymentRefText = document.getElementById("paymentRefText");
  const heroTotalText = document.getElementById("heroTotalText");
  const heroItemsText = document.getElementById("heroItemsText");
  const loyaltyPointsText = document.getElementById("loyaltyPointsText");
  const waitTimeText = document.getElementById("waitTimeText");
  const collectionCodeText = document.getElementById("collectionCodeText");
  const cafeteriaText = document.getElementById("cafeteriaText");
  const paymentSummaryText = document.getElementById("paymentSummaryText");

  const latestPickupPill = document.getElementById("latestPickupPill");
  const latestPaymentPill = document.getElementById("latestPaymentPill");
  const latestPaymentStatusPill = document.getElementById("latestPaymentStatusPill");

  const code = getCollectionCode(order);

  if (pickupTimeText) pickupTimeText.textContent = order?.pickupTime || "—";
  if (paymentText) paymentText.textContent = order?.paymentMethod || "—";
  if (paymentStatusText) paymentStatusText.textContent = order?.paymentStatus || "—";
  if (paymentRefText) paymentRefText.textContent = getPaymentReference(order);
  if (heroTotalText) heroTotalText.textContent = money(getOrderTotal(order));
  if (heroItemsText) heroItemsText.textContent = `${getOrderItemCount(order)} item(s)`;
  if (loyaltyPointsText) loyaltyPointsText.textContent = `${getLoyaltyPoints(order)} pts earned`;
  if (waitTimeText) waitTimeText.textContent = getEstimatedWaitTime(order);
  if (collectionCodeText) collectionCodeText.textContent = code;
  if (cafeteriaText) cafeteriaText.textContent = order?.cafeteriaName || "Islington College Cafeteria";
  if (paymentSummaryText) {
    paymentSummaryText.textContent = `${order?.paymentMethod || "—"} • ${order?.paymentStatus || "—"}`;
  }

  if (latestPickupPill) latestPickupPill.textContent = `Pickup: ${order?.pickupTime || "—"}`;
  if (latestPaymentPill) latestPaymentPill.textContent = `Payment: ${order?.paymentMethod || "—"}`;
  if (latestPaymentStatusPill) latestPaymentStatusPill.textContent = `Status: ${order?.paymentStatus || "—"}`;

  generateQRCode(order);
  updatePickupScannerLink(order);
}

/* ---------------- ITEM UI ---------------- */

function createOrderItemRow(item) {
  const qty = getItemQty(item);
  const price = Number(item?.price || 0);
  const lineTotal = qty * price;

  const row = document.createElement("div");
  row.className = "itemRow";

  row.innerHTML = `
    <img class="thumb" alt="${escapeHtml(item?.name || "Item")}">
    <div class="info">
      <div class="itemName">${escapeHtml(item?.name || "Item")}</div>
      <div class="itemMeta">Qty: ${qty} • Unit Price: ${money(price)}</div>
      <div class="price">${money(lineTotal)}</div>
    </div>
    <div class="lineTotal">${money(lineTotal)}</div>
  `;

  const img = row.querySelector(".thumb");
  if (img) {
    img.src = getImageUrl(item);
    attachImageFallback(img);
  }

  return row;
}

/* ---------------- RENDER ---------------- */

function renderOrders() {
  const orders = getOrders().map(normalizeOrderObject);
  saveOrders(orders);

  let lastOrder = getResolvedLastOrder();

  const latestEmpty = document.getElementById("latestEmpty");
  const latestCard = document.getElementById("latestCard");
  const latestOrderNo = document.getElementById("latestOrderNo");
  const latestDate = document.getElementById("latestDate");
  const latestTotal = document.getElementById("latestTotal");
  const latestNote = document.getElementById("latestNote");
  const latestItems = document.getElementById("latestItems");

  const historyEmpty = document.getElementById("historyEmpty");
  const historyList = document.getElementById("historyList");

  if (!lastOrder) {
    updateHeroData({
      pickupTime: "—",
      paymentMethod: "—",
      paymentStatus: "—",
      items: [],
      orderNo: "",
      cafeteriaName: "—",
      totalAmount: 0,
      earnedPoints: 0
    });
    updateOrderTracker("placed");

    if (latestEmpty) latestEmpty.style.display = "block";
    if (latestCard) latestCard.style.display = "none";
    if (historyEmpty) historyEmpty.style.display = "block";
    if (historyList) historyList.innerHTML = "";
    return;
  }

  lastOrder = normalizeOrderObject(lastOrder);
  saveLastOrder(lastOrder);

  updateHeroData(lastOrder);
  updateOrderTracker(lastOrder?.orderStatus || "placed");

  if (latestEmpty) latestEmpty.style.display = "none";
  if (latestCard) latestCard.style.display = "block";

  if (latestOrderNo) latestOrderNo.textContent = `Order #${lastOrder?.orderNo || "—"}`;
  if (latestDate) latestDate.textContent = formatDateTime(lastOrder?.createdAt);
  if (latestTotal) latestTotal.textContent = money(getOrderTotal(lastOrder));
  if (latestNote) latestNote.textContent = lastOrder?.note ? lastOrder.note : "—";

  if (latestItems) {
    latestItems.innerHTML = "";
    const items = Array.isArray(lastOrder?.items) ? lastOrder.items : [];

    if (!items.length) {
      latestItems.innerHTML = `<div class="muted">No items found.</div>`;
    } else {
      items.forEach((item) => latestItems.appendChild(createOrderItemRow(item)));
    }
  }

  if (!historyList || !historyEmpty) return;

  historyList.innerHTML = "";

  if (!orders.length) {
    historyEmpty.style.display = "block";
    return;
  }

  historyEmpty.style.display = "none";

  const reversed = [...orders].reverse();

  reversed.forEach((order) => {
    const safeOrder = normalizeOrderObject(order);
    const card = document.createElement("div");
    card.className = "historyCard";

    const items = Array.isArray(safeOrder?.items) ? safeOrder.items : [];
    const itemsHtml = items.map((item) => {
      const qty = getItemQty(item);
      const price = Number(item?.price || 0);
      const lineTotal = qty * price;

      return `
        <div class="historyItem">
          <img class="thumb smallThumb" data-img="${escapeHtml(getImageUrl(item))}" alt="${escapeHtml(item?.name || "Item")}">
          <div class="info">
            <div class="itemName">${escapeHtml(item?.name || "Item")}</div>
            <div class="itemMeta">Qty: ${qty} • Unit Price: ${money(price)}</div>
          </div>
          <div class="lineTotal">${money(lineTotal)}</div>
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <div class="historyHead">
        <div>
          <div class="orderNo">Order #${escapeHtml(safeOrder?.orderNo || "—")}</div>
          <div class="muted">${escapeHtml(formatDateTime(safeOrder?.createdAt))}</div>
        </div>
        <div class="totalBadge">${money(getOrderTotal(safeOrder))}</div>
      </div>

      <div class="historyMeta">
        <span>Pickup: ${escapeHtml(safeOrder?.pickupTime || "—")}</span>
        <span>Payment: ${escapeHtml(safeOrder?.paymentMethod || "—")}</span>
        <span>Status: ${escapeHtml(safeOrder?.paymentStatus || "—")}</span>
        <span>Order State: ${escapeHtml(safeOrder?.orderStatus || "placed")}</span>
      </div>

      <div class="historyItems">
        ${itemsHtml || `<div class="muted">No items found.</div>`}
      </div>
    `;

    card.querySelectorAll("[data-img]").forEach((img) => {
      img.src = img.getAttribute("data-img");
      attachImageFallback(img);
    });

    historyList.appendChild(card);
  });
}