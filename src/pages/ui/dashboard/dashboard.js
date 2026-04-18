let allDashboardOrders = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  bindStaticActions();
  await initializeDashboard();
});

/* ---------------- INIT ---------------- */

function bindStaticActions() {
  document.getElementById("btnLogout")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await logoutUser();
  });

  document.getElementById("btnRefresh")?.addEventListener("click", async () => {
    currentFilter = "all";
    syncFilterSelect();
    await loadDashboard();
  });

  document.getElementById("filterSelect")?.addEventListener("change", (e) => {
    currentFilter = String(e.target.value || "all").toLowerCase();
    renderOrders(filterOrders(allDashboardOrders));
    updateTableSubtitle();
  });
}

function syncFilterSelect() {
  const select = document.getElementById("filterSelect");
  if (select) select.value = currentFilter;
}

async function initializeDashboard() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    showBlockedState("Please login first.");
    window.location.href = "../login/login.html";
    return;
  }

  if (String(currentUser.role || "").toLowerCase() !== "admin") {
    showBlockedState("Only admin can access dashboard.");
    window.location.href = "../home/home.html";
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  localStorage.setItem("user", JSON.stringify(currentUser));
  localStorage.setItem("role", String(currentUser.role || "").toLowerCase());

  setAdminState(`Authorized as ${currentUser.fullName || "Admin"}`);
  await loadDashboard();
}

/* ---------------- SESSION / AUTH ---------------- */

async function safeJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Unexpected server response." };
  }
}

async function getCurrentUser() {
  try {
    const res = await fetch(`${window.API_BASE}/api/users/me`, {
      method: "GET",
      credentials: "include"
    });

    const data = await safeJson(res);
    if (!res.ok) return null;
    return data.user || data || null;
  } catch (err) {
    console.error("Session check error:", err);
    return null;
  }
}

async function logoutUser() {
  try {
    await fetch(`${window.API_BASE}/api/users/logout`, {
      method: "POST",
      credentials: "include"
    });
  } catch (err) {
    console.error("Logout error:", err);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("role");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("role");

  window.location.href = "../login/login.html";
}

function setAdminState(message) {
  const badge = document.getElementById("adminBadge");
  const hint = document.getElementById("adminHint");

  if (badge) {
    badge.textContent = "Admin ✅";
    badge.classList.remove("chipBlocked");
    badge.classList.add("chipOk");
  }

  if (hint) hint.textContent = message || "Authorized admin session";
}

function showBlockedState(message) {
  const badge = document.getElementById("adminBadge");
  const hint = document.getElementById("adminHint");
  const emptyBox = document.getElementById("emptyBox");
  const dashboardMsg = document.getElementById("dashboardMsg");

  if (badge) {
    badge.textContent = "Blocked";
    badge.classList.remove("chipOk");
    badge.classList.add("chipBlocked");
  }

  if (hint) hint.textContent = message || "Access denied";

  if (dashboardMsg) {
    dashboardMsg.style.display = "block";
    dashboardMsg.textContent = message || "Access denied.";
  }

  if (emptyBox) {
    emptyBox.style.display = "block";
    emptyBox.textContent = message || "Access denied.";
  }
}

/* ---------------- LOAD DASHBOARD ---------------- */

async function loadDashboard() {
  const body = document.getElementById("ordersTableBody");
  const emptyBox = document.getElementById("emptyBox");
  const dashboardMsg = document.getElementById("dashboardMsg");

  if (body) body.innerHTML = "";
  if (emptyBox) emptyBox.style.display = "none";
  if (dashboardMsg) {
    dashboardMsg.style.display = "none";
    dashboardMsg.textContent = "";
  }

  try {
    const data = await fetchOrdersFromAvailableEndpoint();
    const orders = Array.isArray(data.orders) ? data.orders : [];

    allDashboardOrders = orders;

    renderStats(orders);
    renderOperations(orders);
    renderOrders(filterOrders(orders));
    updateTableSubtitle();
    syncFilterSelect();
  } catch (err) {
    console.error("Dashboard load error:", err);

    if (dashboardMsg) {
      dashboardMsg.style.display = "block";
      dashboardMsg.textContent = err.message || "Dashboard failed to load.";
    }

    if (emptyBox) {
      emptyBox.style.display = "block";
      emptyBox.textContent = "No dashboard data available.";
    }

    allDashboardOrders = [];
    renderStats([]);
    renderOperations([]);
    renderOrders([]);
    updateTableSubtitle();
    syncFilterSelect();
  }
}

async function fetchOrdersFromAvailableEndpoint() {
  const candidates = [
    `${window.API_BASE}/api/orders/admin-dashboard`,
    `${window.API_BASE}/api/orders/admin`,
    `${window.API_BASE}/api/orders`
  ];

  let lastError = "Failed to load dashboard.";

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include"
      });

      const data = await safeJson(res);

      if (res.ok) {
        if (Array.isArray(data)) return { orders: data };
        if (Array.isArray(data.orders)) return { orders: data.orders };
        if (Array.isArray(data.data)) return { orders: data.data };
        return { orders: [] };
      }

      if (res.status === 401) {
        window.location.href = "../login/login.html";
        throw new Error("Please login first.");
      }

      if (res.status === 403) {
        window.location.href = "../home/home.html";
        throw new Error(data.message || "Admin access only.");
      }

      lastError = data.message || `Failed on ${url}`;
    } catch (err) {
      lastError = err.message || lastError;
    }
  }

  throw new Error(lastError);
}

/* ---------------- FILTERS ---------------- */

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function normalizePaymentMethod(method) {
  const raw = String(method || "").trim().toLowerCase();

  if (raw === "dummy_online") return "Online Payment";
  if (raw === "wallet") return "Wallet";
  if (raw === "cash") return "Cash on Pickup";
  if (raw === "esewa") return "eSewa Sandbox";
  return method || "—";
}

function filterOrders(orders) {
  if (currentFilter === "all") return orders;
  return orders.filter((o) => normalizeStatus(o.orderStatus) === currentFilter);
}

function updateTableSubtitle() {
  const sub = document.getElementById("tableSubText");
  if (!sub) return;

  if (currentFilter === "all") {
    sub.textContent = "Live order list for cafeteria management.";
    return;
  }

  sub.textContent = `Showing ${currentFilter} orders only.`;
}

/* ---------------- STATS ---------------- */

function getOrderTotal(order) {
  return Number(order?.totalAmount || 0);
}

function renderStats(orders) {
  const totalOrders = document.getElementById("totalOrders");
  const placedCount = document.getElementById("placedCount");
  const preparingCount = document.getElementById("preparingCount");
  const readyCount = document.getElementById("readyCount");
  const collectedCount = document.getElementById("collectedCount");
  const todayRevenue = document.getElementById("todayRevenue");

  const placed = orders.filter((o) => normalizeStatus(o.orderStatus) === "placed").length;
  const preparing = orders.filter((o) => normalizeStatus(o.orderStatus) === "preparing").length;
  const ready = orders.filter((o) => normalizeStatus(o.orderStatus) === "ready").length;
  const collected = orders.filter((o) => normalizeStatus(o.orderStatus) === "collected").length;
  const revenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);

  if (totalOrders) totalOrders.textContent = orders.length;
  if (placedCount) placedCount.textContent = placed;
  if (preparingCount) preparingCount.textContent = preparing;
  if (readyCount) readyCount.textContent = ready;
  if (collectedCount) collectedCount.textContent = collected;
  if (todayRevenue) todayRevenue.textContent = `Rs ${revenue.toLocaleString()}`;
}

function renderOperations(orders) {
  const waitTimeEstimate = document.getElementById("waitTimeEstimate");
  const walletSummary = document.getElementById("walletSummary");
  const qrPendingCount = document.getElementById("qrPendingCount");
  const readyPickupCount = document.getElementById("readyPickupCount");
  const onlinePaymentsCount = document.getElementById("onlinePaymentsCount");
  const walletPaymentsCount = document.getElementById("walletPaymentsCount");
  const cashPaymentsCount = document.getElementById("cashPaymentsCount");
  const specialsCount = document.getElementById("specialsCount");

  const ready = orders.filter((o) => normalizeStatus(o.orderStatus) === "ready").length;
  const walletPayments = orders.filter((o) => String(o.paymentMethod || "").toLowerCase() === "wallet").length;
  const cashPayments = orders.filter((o) => String(o.paymentMethod || "").toLowerCase() === "cash").length;
  const onlinePayments = orders.filter((o) => {
    const raw = String(o.paymentMethod || "").toLowerCase();
    return raw === "dummy_online" || raw === "esewa";
  }).length;

  let waitTime = "10–15 min";
  if (orders.length >= 12) waitTime = "20–30 min";
  else if (orders.length >= 6) waitTime = "15–20 min";

  if (waitTimeEstimate) waitTimeEstimate.textContent = waitTime;
  if (walletSummary) walletSummary.textContent = `${walletPayments} wallet payments`;
  if (qrPendingCount) qrPendingCount.textContent = `${ready} pending`;
  if (readyPickupCount) readyPickupCount.textContent = `${ready} orders waiting`;
  if (onlinePaymentsCount) onlinePaymentsCount.textContent = onlinePayments;
  if (walletPaymentsCount) walletPaymentsCount.textContent = walletPayments;
  if (cashPaymentsCount) cashPaymentsCount.textContent = cashPayments;
  if (specialsCount) specialsCount.textContent = "Specials synced with system";
}

/* ---------------- TABLE ---------------- */

function renderOrders(orders) {
  const body = document.getElementById("ordersTableBody");
  const emptyBox = document.getElementById("emptyBox");

  if (!body) return;
  body.innerHTML = "";

  if (!orders.length) {
    if (emptyBox) {
      emptyBox.style.display = "block";
      emptyBox.textContent =
        currentFilter === "all"
          ? "No orders found."
          : `No ${currentFilter} orders found.`;
    }
    return;
  }

  if (emptyBox) emptyBox.style.display = "none";

  orders.forEach((order) => {
    const tr = document.createElement("tr");
    const total = getOrderTotal(order);
    const status = normalizeStatus(order.orderStatus || "placed");
    const payment = normalizePaymentMethod(order.paymentMethod);
    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
    const userName = order.user?.fullName || order.user?.name || "Student";
    const userEmail = order.user?.email || "—";

    tr.innerHTML = `
      <td>#${escapeHtml(String(order.orderNo || order._id || "").slice(-6))}</td>
      <td>
        <div class="userBlock">
          <span class="userName">${escapeHtml(userName)}</span>
          <span class="userSub">${escapeHtml(userEmail)}</span>
        </div>
      </td>
      <td>${escapeHtml(order.pickupTime || "—")}</td>
      <td><span class="paymentPill">${escapeHtml(payment)}</span></td>
      <td>${getStatusBadge(status)}</td>
      <td>Rs ${escapeHtml(String(total.toLocaleString()))}</td>
      <td><span class="itemCount">${itemCount} item(s)</span></td>
      <td class="actionCell">${getActionButtons(order)}</td>
    `;

    bindRowActions(tr, order);
    body.appendChild(tr);
  });
}

function getStatusBadge(status) {
  const safe = escapeHtml(status || "placed");
  return `<span class="statusPill status-${safe}">${safe}</span>`;
}

function getActionButtons(order) {
  const status = normalizeStatus(order.orderStatus);

  if (status === "placed") {
    return `
      <button class="btn small" data-action="preparing" data-id="${order._id}">Mark Preparing</button>
      <button class="btn small" data-action="ready" data-id="${order._id}">Mark Ready</button>
    `;
  }

  if (status === "preparing") {
    return `
      <button class="btn small" data-action="ready" data-id="${order._id}">Mark Ready</button>
    `;
  }

  if (status === "ready") {
    return `
      <button class="btn small" data-action="collected" data-id="${order._id}">Mark Collected</button>
    `;
  }

  return `<span class="statusPill status-collected">done</span>`;
}

function bindRowActions(row, order) {
  row.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.getAttribute("data-action");
      await updateOrderStatus(order._id, action);
    });
  });
}

/* ---------------- STATUS UPDATE ---------------- */

async function updateOrderStatus(orderId, nextStatus) {
  const candidates = [
    {
      url: `${window.API_BASE}/api/orders/${orderId}/status`,
      method: "PATCH",
      body: { orderStatus: nextStatus }
    },
    {
      url: `${window.API_BASE}/api/orders/${orderId}/${nextStatus}`,
      method: "PATCH",
      body: null
    },
    {
      url: `${window.API_BASE}/api/orders/${orderId}`,
      method: "PATCH",
      body: { orderStatus: nextStatus }
    }
  ];

  let lastMessage = "Failed to update order status.";

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate.url, {
        method: candidate.method,
        credentials: "include",
        headers: candidate.body ? { "Content-Type": "application/json" } : {},
        body: candidate.body ? JSON.stringify(candidate.body) : undefined
      });

      const data = await safeJson(res);

      if (res.ok) {
        await loadDashboard();
        return;
      }

      lastMessage = data.message || lastMessage;
    } catch (err) {
      lastMessage = err.message || lastMessage;
    }
  }

  alert(lastMessage);
}

/* ---------------- HELPERS ---------------- */

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}