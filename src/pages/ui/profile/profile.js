document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.API_BASE || "http://127.0.0.1:5000";
  const DEFAULT_AVATAR = "../../../../assets/default-avatar.png";
  const LOGIN_URL = "../login/login.html";
  const DASHBOARD_URL = "../dashboard/dashboard.html";
  const REWARDS_URL = "../rewards/rewards.html";
  const FAVORITES_URL = "../favorites/favorites.html";
  const SPECIALS_URL = "../specials/specials.html";
  const WALLET_URL = "../wallet/wallet.html";

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const els = {
    userNav: document.getElementById("userNav"),
    adminNav: document.getElementById("adminNav"),

    profileAvatar: document.getElementById("profileAvatar"),
    avatarInput: document.getElementById("avatarInput"),

    profileName: document.getElementById("profileName"),
    profileEmail: document.getElementById("profileEmail"),
    profileRole: document.getElementById("profileRole"),
    profileJoined: document.getElementById("profileJoined"),

    detailName: document.getElementById("detailName"),
    detailEmail: document.getElementById("detailEmail"),
    detailRole: document.getElementById("detailRole"),
    detailJoined: document.getElementById("detailJoined"),

    totalOrders: document.getElementById("totalOrders"),
    favoriteCount: document.getElementById("favoriteCount"),
    loyaltyPoints: document.getElementById("loyaltyPoints"),
    cartCount: document.getElementById("cartCount"),
    walletBalance: document.getElementById("walletBalance"),

    favoritesCard: document.getElementById("favoritesCard"),
    loyaltyCard: document.getElementById("loyaltyCard"),
    walletCard: document.getElementById("walletCard"),

    userActions: document.getElementById("userActions"),
    adminActions: document.getElementById("adminActions"),
    actionNote: document.getElementById("actionNote"),

    btnLogoutUser: document.getElementById("btnLogoutUser"),
    btnLogoutAdmin: document.getElementById("btnLogoutAdmin"),
    btnLogoutProfileAdmin: document.getElementById("btnLogoutProfileAdmin"),

    btnEditProfile: document.getElementById("btnEditProfile"),
    btnRewards: document.getElementById("btnRewards"),
    btnFavorites: document.getElementById("btnFavorites"),
    btnSpecials: document.getElementById("btnSpecials"),
    btnDashboard: document.getElementById("btnDashboard")
  };

  let currentUser = null;
  let userId = "";
  let currentRole = "student";

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function formatRole(role) {
    return String(role || "").toLowerCase() === "admin" ? "Admin" : "Student";
  }

  function formatJoinedDate(dateValue) {
    if (!dateValue) return "Joined recently";

    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "Joined recently";

    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatMoney(value) {
    return `Rs ${Number(value || 0).toLocaleString()}`;
  }

  function getLocalUserFallback() {
    const user =
      safeJsonParse(localStorage.getItem("currentUser"), null) ||
      safeJsonParse(localStorage.getItem("user"), null) ||
      {};

    return {
      id: user._id || user.id || "",
      _id: user._id || user.id || "",
      fullName: user.fullName || user.name || "Student User",
      email: user.email || "student@example.com",
      role: user.role || localStorage.getItem("role") || "student",
      avatar: localStorage.getItem("profileAvatar") || user.avatar || "",
      createdAt: user.createdAt || ""
    };
  }

  function getStorageKeys() {
    return {
      cart: `cart_${userId}`,
      orders: `orders_${userId}`,
      favorites: `favorites_${userId}`,
      walletBalance: `wallet_balance_${userId}`,
      walletLoyalty: `wallet_loyalty_${userId}`
    };
  }

  function getCartItemsCount() {
    const keys = getStorageKeys();
    const cart = safeJsonParse(localStorage.getItem(keys.cart), []);
    if (!Array.isArray(cart)) return 0;

    return cart.reduce((sum, item) => {
      const qty = Number(item?.quantity ?? item?.qty ?? 1);
      return sum + (Number.isFinite(qty) ? qty : 1);
    }, 0);
  }

  function getUniqueFavoritesCountFromStorage() {
    const keys = getStorageKeys();
    const favorites = safeJsonParse(localStorage.getItem(keys.favorites), []);
    if (!Array.isArray(favorites)) return 0;

    const unique = new Set();

    favorites.forEach((item) => {
      const key = String(
        item?.id ||
        item?._id ||
        item?.menuItemId ||
        item?.name ||
        ""
      ).trim().toLowerCase();

      if (key) unique.add(key);
    });

    return unique.size;
  }

  function getOrdersFromStorage() {
    const keys = getStorageKeys();
    const orders = safeJsonParse(localStorage.getItem(keys.orders), []);
    return Array.isArray(orders) ? orders : [];
  }

  function getWalletBalance() {
    const keys = getStorageKeys();
    return Number(localStorage.getItem(keys.walletBalance) || 0);
  }

  function getWalletLoyaltyPoints() {
    const keys = getStorageKeys();
    return Number(localStorage.getItem(keys.walletLoyalty) || 0);
  }

  async function fetchProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/users/full-profile`, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.user) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      return data.user;
    } catch (error) {
      console.error("Profile fetch failed, using fallback:", error);
      return getLocalUserFallback();
    }
  }

  async function fetchMyOrders() {
    try {
      const res = await fetch(`${API_BASE}/api/orders/my-orders`, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      return Array.isArray(data.orders) ? data.orders : [];
    } catch (error) {
      console.error("Orders fetch failed, using local storage:", error);
      return getOrdersFromStorage();
    }
  }

  async function fetchFavoriteCount() {
    const localUniqueCount = getUniqueFavoritesCountFromStorage();

    try {
      const res = await fetch(`${API_BASE}/api/users/favorites`, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.favorites)) {
        const backendUnique = new Set(
          data.favorites.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
        ).size;

        if (localUniqueCount > 0) {
          return localUniqueCount;
        }

        return backendUnique;
      }
    } catch (error) {
      console.error("Favorites fetch failed, using local storage:", error);
    }

    return localUniqueCount;
  }

  function renderProfile(user, totalOrders, favoriteCount) {
    const roleLabel = formatRole(user.role);
    const joinedText = formatJoinedDate(user.createdAt);

    const cartCount = getCartItemsCount();
    const walletBalance = getWalletBalance();
    const loyaltyPoints = getWalletLoyaltyPoints();

    if (els.profileName) els.profileName.textContent = user.fullName || "Student User";
    if (els.profileEmail) els.profileEmail.textContent = user.email || "student@example.com";
    if (els.profileRole) els.profileRole.textContent = roleLabel;
    if (els.profileJoined) els.profileJoined.textContent = joinedText;

    if (els.detailName) els.detailName.textContent = user.fullName || "Student User";
    if (els.detailEmail) els.detailEmail.textContent = user.email || "student@example.com";
    if (els.detailRole) els.detailRole.textContent = roleLabel;
    if (els.detailJoined) els.detailJoined.textContent = joinedText;

    if (els.totalOrders) els.totalOrders.textContent = totalOrders;
    if (els.favoriteCount) els.favoriteCount.textContent = favoriteCount;
    if (els.loyaltyPoints) els.loyaltyPoints.textContent = loyaltyPoints;
    if (els.cartCount) els.cartCount.textContent = cartCount;
    if (els.walletBalance) els.walletBalance.textContent = formatMoney(walletBalance);

    const avatarSrc =
      user.avatar ||
      localStorage.getItem("profileAvatar") ||
      DEFAULT_AVATAR;

    if (els.profileAvatar) {
      els.profileAvatar.src = avatarSrc;
      els.profileAvatar.onerror = () => {
        els.profileAvatar.src = DEFAULT_AVATAR;
      };
    }

    if (String(user.role).toLowerCase() === "admin") {
      els.userNav?.classList.add("hidden");
      els.adminNav?.classList.remove("hidden");

      els.favoritesCard?.classList.add("hidden");
      els.loyaltyCard?.classList.add("hidden");
      els.walletCard?.classList.add("hidden");

      els.userActions?.classList.add("hidden");
      els.adminActions?.classList.remove("hidden");

      if (els.actionNote) {
        els.actionNote.textContent = "Use these shortcuts to move quickly through admin pages.";
      }
    } else {
      els.userNav?.classList.remove("hidden");
      els.adminNav?.classList.add("hidden");

      els.favoritesCard?.classList.remove("hidden");
      els.loyaltyCard?.classList.remove("hidden");
      els.walletCard?.classList.remove("hidden");

      els.userActions?.classList.remove("hidden");
      els.adminActions?.classList.add("hidden");

      if (els.actionNote) {
        els.actionNote.textContent = "Move quickly to your most used pages from here.";
      }
    }
  }

  async function logoutUser() {
    try {
      await fetch(`${API_BASE}/api/users/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("role");
      window.location.href = LOGIN_URL;
    }
  }

  async function updateProfileAvatar(base64Avatar) {
    try {
      const res = await fetch(`${API_BASE}/api/users/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ avatar: base64Avatar })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update avatar");
      }

      localStorage.setItem("profileAvatar", base64Avatar);
      return data.user;
    } catch (error) {
      console.error("Avatar update failed:", error);
      localStorage.setItem("profileAvatar", base64Avatar);
      return null;
    }
  }

  function setupEvents() {
    els.btnLogoutUser?.addEventListener("click", logoutUser);
    els.btnLogoutAdmin?.addEventListener("click", logoutUser);
    els.btnLogoutProfileAdmin?.addEventListener("click", logoutUser);

    els.btnRewards?.addEventListener("click", () => {
      window.location.href = REWARDS_URL;
    });

    els.btnFavorites?.addEventListener("click", () => {
      window.location.href = FAVORITES_URL;
    });

    els.btnSpecials?.addEventListener("click", () => {
      window.location.href = SPECIALS_URL;
    });

    els.favoritesCard?.addEventListener("click", () => {
      if (currentRole !== "admin") {
        window.location.href = FAVORITES_URL;
      }
    });

    els.loyaltyCard?.addEventListener("click", () => {
      if (currentRole !== "admin") {
        window.location.href = REWARDS_URL;
      }
    });

    els.walletCard?.addEventListener("click", () => {
      if (currentRole !== "admin") {
        window.location.href = WALLET_URL;
      }
    });

    els.btnDashboard?.addEventListener("click", () => {
      window.location.href = DASHBOARD_URL;
    });

    els.btnEditProfile?.addEventListener("click", () => {
      window.location.href = "../edit-profile/edit-profile.html";
    });

    els.avatarInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result;

        if (typeof result === "string") {
          if (els.profileAvatar) {
            els.profileAvatar.src = result;
          }

          const updatedUser = await updateProfileAvatar(result);
          if (updatedUser) {
            currentUser = updatedUser;
            renderProfile(
              currentUser,
              getOrdersFromStorage().length,
              getUniqueFavoritesCountFromStorage()
            );
          }
        }
      };

      reader.readAsDataURL(file);
    });

    window.addEventListener("storage", (e) => {
      const keys = getStorageKeys();
      const watchedKeys = [
        keys.cart,
        keys.orders,
        keys.favorites,
        keys.walletBalance,
        keys.walletLoyalty,
        "profileAvatar"
      ];

      if (watchedKeys.includes(e.key)) {
        const orders = getOrdersFromStorage();
        const favoriteCount = getUniqueFavoritesCountFromStorage();
        renderProfile(currentUser, orders.length, favoriteCount);
      }
    });
  }

  currentUser = await fetchProfile();
  userId = String(currentUser?._id || currentUser?.id || "").trim();
  currentRole = String(currentUser?.role || "student").toLowerCase();

  if (!userId) {
    window.location.href = LOGIN_URL;
    return;
  }

  if (currentRole === "admin") {
    renderProfile(currentUser, 0, 0);
    setupEvents();
    return;
  }

  const myOrders = await fetchMyOrders();
  const favoriteCount = await fetchFavoriteCount();

  renderProfile(currentUser, myOrders.length, favoriteCount);
  setupEvents();
});

