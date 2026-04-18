document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.API_BASE || "http://127.0.0.1:5000";

  const els = {
    availablePoints: document.getElementById("availablePoints"),
    ordersCount: document.getElementById("ordersCount"),
    itemsCount: document.getElementById("itemsCount"),
    eligibleDiscount: document.getElementById("eligibleDiscount"),
    basePoints: document.getElementById("basePoints"),
    bonusPoints: document.getElementById("bonusPoints"),
    totalRewardPoints: document.getElementById("totalRewardPoints"),
    rewardActivityList: document.getElementById("rewardActivityList"),
    btnLogout: document.getElementById("btnLogout"),
    btnGoCart: document.getElementById("btnGoCart"),
    btnGoOrders: document.getElementById("btnGoOrders"),
    btnGoMenu: document.getElementById("btnGoMenu")
  };

  // =========================
  // 🔐 AUTH CHECK (IMPORTANT)
  // =========================
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    window.location.href = "../login/login.html";
    return;
  }

  if (currentUser.role === "admin") {
    window.location.href = "../dashboard/dashboard.html";
    return;
  }

  const userId = currentUser._id || currentUser.id;

  // =========================
  // 🎯 BONUS RULES
  // =========================
  const CAFE_BONUS = {
    "kumari hall": 2,
    "brit cafe": 3,
    "coffee station": 1,
    "canteen": 4
  };

  function normalizeCafe(name) {
    return String(name || "").toLowerCase().trim();
  }

  function getBonus(cafe) {
    return CAFE_BONUS[normalizeCafe(cafe)] || 0;
  }

  function getDiscount(points) {
    if (points >= 200) return "20%";
    if (points >= 150) return "15%";
    if (points >= 100) return "10%";
    if (points >= 50) return "5%";
    return "0%";
  }

  // =========================
  // 📦 FETCH ORDERS
  // =========================
  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/api/orders/my-orders`, {
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok || !data.orders) throw new Error();

      return data.orders;
    } catch {
      // fallback (user-specific)
      const local = JSON.parse(localStorage.getItem(`orders_${userId}`)) || [];
      return local;
    }
  }

  function getItemCount(order) {
    if (!Array.isArray(order?.items)) return 0;
    return order.items.reduce((sum, item) => {
      return sum + Number(item.quantity || 1);
    }, 0);
  }

  // =========================
  // 🧮 CALCULATE REWARDS
  // =========================
  function calculate(orders) {
    let ordersCount = 0;
    let itemsCount = 0;
    let basePoints = 0;
    let bonusPoints = 0;

    const activity = [];

    for (const order of orders) {
      const itemCount = getItemCount(order);
      if (!itemCount) continue;

      const cafe = order.cafeteriaName || "canteen";

      const base = itemCount * 10;
      const bonus = itemCount * getBonus(cafe);

      ordersCount++;
      itemsCount += itemCount;
      basePoints += base;
      bonusPoints += bonus;

      activity.push({
        cafe,
        total: base + bonus,
        items: itemCount,
        date: order.createdAt || ""
      });
    }

    return {
      ordersCount,
      itemsCount,
      basePoints,
      bonusPoints,
      total: basePoints + bonusPoints,
      activity
    };
  }

  // =========================
  // 🎨 RENDER
  // =========================
  function render(summary) {
    els.availablePoints.textContent = summary.total;
    els.ordersCount.textContent = summary.ordersCount;
    els.itemsCount.textContent = summary.itemsCount;
    els.eligibleDiscount.textContent = getDiscount(summary.total);
    els.basePoints.textContent = summary.basePoints;
    els.bonusPoints.textContent = summary.bonusPoints;
    els.totalRewardPoints.textContent = summary.total;

    // 🔥 USER-SPECIFIC STORAGE
    localStorage.setItem(`rewardPoints_${userId}`, summary.total);
    localStorage.setItem(`wallet_loyalty_${userId}`, summary.total);
  }

  function renderActivity(list) {
    if (!list.length) {
      els.rewardActivityList.innerHTML =
        `<div class="emptyState">No reward activity yet.</div>`;
      return;
    }

    els.rewardActivityList.innerHTML = list.map(a => `
      <div class="activityItem">
        <div>${a.cafe}</div>
        <div>+${a.total} pts</div>
      </div>
    `).join("");
  }

  // =========================
  // 🔘 BUTTONS
  // =========================
  function setupEvents() {
    els.btnGoCart?.addEventListener("click", () => {
      window.location.href = "../cart/cart.html";
    });

    els.btnGoOrders?.addEventListener("click", () => {
      window.location.href = "../orders/orders.html";
    });

    els.btnGoMenu?.addEventListener("click", () => {
      window.location.href = "../menu/menu.html";
    });

    els.btnLogout?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("role");

      window.location.href = "../login/login.html";
    });
  }

  // =========================
  // 🚀 INIT
  // =========================
  const orders = await fetchOrders();
  const summary = calculate(orders);

  render(summary);
  renderActivity(summary.activity);
  setupEvents();
});