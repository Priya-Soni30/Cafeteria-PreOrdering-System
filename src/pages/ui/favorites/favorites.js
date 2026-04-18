document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.API_BASE || "http://127.0.0.1:5000";

  const favoritesGrid = document.getElementById("favoritesGrid");
  const emptyState = document.getElementById("emptyState");
  const favoritesCount = document.getElementById("favoritesCount");
  const resultCount = document.getElementById("resultCount");
  const cartCount = document.getElementById("cartCount");
  const navActions = document.getElementById("navActions");

  const IMAGE_BASES = [
    `${API_BASE}/assets/`,
    "/assets/",
    "../../../../assets/",
    "../../../assets/",
    "../../assets/"
  ];

  const FALLBACK_IMAGE =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
        <rect width="100%" height="100%" fill="#f5f7fb"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="26" fill="#788663">
          Image not found
        </text>
      </svg>
    `);

  let favorites = [];

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeRole() {
    const currentUser = readJson("currentUser", null);
    return String(
      currentUser?.role ||
      localStorage.getItem("userRole") ||
      localStorage.getItem("role") ||
      "student"
    ).toLowerCase();
  }

  function getFavoriteItemsMap() {
    return readJson("favoriteItemsMap", {});
  }

  function setFavoriteItemsMap(map) {
    writeJson("favoriteItemsMap", map);
  }

  function notifyFavoritesUpdate() {
    localStorage.setItem("favorites_updated", String(Date.now()));
  }

  const role = normalizeRole();

  function capitalize(value) {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function dietText(diet) {
    if (diet === "veg") return "Vegetarian";
    if (diet === "vegan") return "Vegan";
    if (diet === "non-veg") return "Non-Veg";
    return "General";
  }

  function getCart() {
    return readJson("cart", []);
  }

  function writeCart(cart) {
    writeJson("cart", cart);
  }

  function getCartQuantity(itemId) {
    const entry = getCart().find((item) => item.id === itemId);
    return entry ? Number(entry.quantity || 0) : 0;
  }

  function updateCartCount() {
    const total = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    if (cartCount) cartCount.textContent = total;
  }

  function buildImageCandidates(fileName) {
    return IMAGE_BASES.map((base) => `${base}${fileName}`);
  }

  function tryLoadImage(candidates) {
    return new Promise((resolve) => {
      let index = 0;

      function loadNext() {
        if (index >= candidates.length) {
          resolve(null);
          return;
        }

        const img = new Image();
        img.onload = () => resolve(candidates[index]);
        img.onerror = () => {
          index += 1;
          loadNext();
        };
        img.src = candidates[index];
      }

      loadNext();
    });
  }

  async function applySmartImage(imgElement, fileName) {
    const foundPath = await tryLoadImage(buildImageCandidates(fileName));

    if (foundPath) {
      imgElement.src = foundPath;
      imgElement.classList.remove("is-fallback");
    } else {
      imgElement.src = FALLBACK_IMAGE;
      imgElement.classList.add("is-fallback");
    }
  }

  function renderNavbar() {
    if (!navActions) return;

    if (role === "admin") {
      navActions.innerHTML = `
        <a class="nav__link" href="../home/home.html">Home</a>
        <a class="nav__link" href="../dashboard/dashboard.html">Dashboard</a>
        <button class="nav__link nav__btn" id="btnLogout" type="button">Logout</button>
      `;
    } else {
      navActions.innerHTML = `
        <a class="nav__link" href="../home/home.html">Home</a>
        <a class="nav__link" href="../menu/menu.html">Menu</a>
        <a class="nav__link" href="../orders/orders.html">Orders</a>
        <a class="nav__link" href="../cart/cart.html">Cart</a>
        <a class="nav__link" href="../wallet/wallet.html">Top-up Wallet</a>
        <a class="nav__link" href="../profile/profile.html">Profile</a>
        <button class="nav__link nav__btn" id="btnLogout" type="button">Logout</button>
      `;
    }

    document.getElementById("btnLogout")?.addEventListener("click", logoutUser);
  }

  function normalizeFavoriteItem(item) {
    if (!item) return null;

    if (typeof item === "string") {
      const cached = getFavoriteItemsMap()[item];
      return cached || null;
    }

    const id = item.id || item._id || "";
    if (!id) return null;

    return {
      id,
      name: item.name || "Unnamed Item",
      image: item.image || "",
      price: Number(item.price || 0),
      category: item.category || "general",
      diet: item.diet || "general",
      prepTime: item.prepTime || "5 min",
      calories: Number(item.calories || 0),
      allergens: Array.isArray(item.allergens) ? item.allergens : [],
      isSpecial: Boolean(item.isSpecial),
      cafeKey: item.cafeKey || "",
      cafeName: item.cafeName || ""
    };
  }

  async function loadFavorites() {
    if (role === "admin") {
      favorites = [];
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/favorites`, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.favorites)) {
        favorites = data.favorites
          .map(normalizeFavoriteItem)
          .filter(Boolean);
      } else {
        favorites = Object.values(getFavoriteItemsMap());
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
      favorites = Object.values(getFavoriteItemsMap());
    }

    const map = getFavoriteItemsMap();
    favorites.forEach((item) => {
      map[item.id] = item;
    });
    setFavoriteItemsMap(map);
  }

  async function removeFavorite(itemId) {
    try {
      const map = getFavoriteItemsMap();
      delete map[itemId];
      setFavoriteItemsMap(map);

      favorites = favorites.filter((item) => item.id !== itemId);
      renderFavorites();
      notifyFavoritesUpdate();

      const res = await fetch(`${API_BASE}/api/users/favorites/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to remove favorite");
      }

      notifyFavoritesUpdate();
    } catch (error) {
      console.error("Remove favorite error:", error);
      alert("Failed to remove favorite.");
      await loadFavorites();
      renderFavorites();
    }
  }

  function openNutrition(item) {
    const url = `../nutrition/nutrition.html?id=${encodeURIComponent(item.id)}${item.cafeKey ? `&cafeteria=${encodeURIComponent(item.cafeKey)}` : ""}`;
    window.location.href = url;
  }

  function updateItemQuantity(item, change) {
    if (role === "admin") {
      alert("Admin can view only. Ordering is disabled for admin.");
      return;
    }

    const cart = getCart();
    const existingIndex = cart.findIndex((entry) => entry.id === item.id);

    if (change > 0) {
      if (cart.length > 0 && existingIndex === -1 && cart[0].cafeKey && item.cafeKey && cart[0].cafeKey !== item.cafeKey) {
        const reset = confirm("Cart contains items from another cafeteria. Clear cart and continue?");
        if (!reset) return;
        writeCart([]);
      }
    }

    const updatedCart = getCart();
    const newIndex = updatedCart.findIndex((entry) => entry.id === item.id);

    if (newIndex > -1) {
      updatedCart[newIndex].quantity = Math.max(0, Number(updatedCart[newIndex].quantity || 0) + change);
      if (updatedCart[newIndex].quantity === 0) {
        updatedCart.splice(newIndex, 1);
      }
    } else if (change > 0) {
      updatedCart.push({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        cafeKey: item.cafeKey || "",
        cafeName: item.cafeName || "",
        quantity: 1
      });
    }

    writeCart(updatedCart);
    updateCartCount();

    const qtyEl = document.getElementById(`qty-${item.id}`);
    if (qtyEl) qtyEl.textContent = getCartQuantity(item.id);
  }

  function renderFavorites() {
    if (!favoritesGrid) return;

    const count = favorites.length;

    if (favoritesCount) favoritesCount.textContent = count;
    if (resultCount) resultCount.textContent = `${count} item(s)`;

    if (!count) {
      favoritesGrid.innerHTML = "";
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    favoritesGrid.innerHTML = favorites.map((item) => `
      <article class="menu-card">
        <div class="menu-card__image">
          <img data-image="${item.image}" alt="${item.name}" />
        </div>

        <div class="menu-card__body">
          <div class="menu-card__top">
            <h3 class="menu-card__title">${item.name}</h3>
            <button
              class="remove-fav-btn"
              type="button"
              data-remove-fav="${item.id}"
              title="Remove from favorites"
            >
              ♥
            </button>
          </div>

          <div class="menu-card__meta">
            ${capitalize(item.category)} • Prep ~ ${item.prepTime}${item.cafeName ? ` • ${item.cafeName}` : ""}
          </div>

          <div class="menu-card__tags">
            ${item.isSpecial ? `<span class="tag tag--special">Special</span>` : ""}
            <span class="tag tag--diet">${dietText(item.diet)}</span>
            <span class="tag">${item.calories} kcal</span>
          </div>

          <div class="menu-card__bottom">
            <div class="menu-card__price">Rs ${item.price}</div>

            <div class="menu-card__actions">
              <button class="card-btn card-btn--light" type="button" data-nutrition="${item.id}">
                Nutrition
              </button>

              <div class="qty-box">
                <button class="qty-btn" type="button" data-minus="${item.id}">−</button>
                <span class="qty-value" id="qty-${item.id}">${getCartQuantity(item.id)}</span>
                <button class="qty-btn" type="button" data-plus="${item.id}">+</button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `).join("");

    favoritesGrid.querySelectorAll("img[data-image]").forEach((img) => {
      applySmartImage(img, img.dataset.image);
    });

    favoritesGrid.querySelectorAll("[data-remove-fav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeFavorite(btn.dataset.removeFav);
      });
    });

    favoritesGrid.querySelectorAll("[data-nutrition]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = favorites.find((x) => x.id === btn.dataset.nutrition);
        if (item) openNutrition(item);
      });
    });

    favoritesGrid.querySelectorAll("[data-plus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = favorites.find((x) => x.id === btn.dataset.plus);
        if (item) updateItemQuantity(item, 1);
      });
    });

    favoritesGrid.querySelectorAll("[data-minus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = favorites.find((x) => x.id === btn.dataset.minus);
        if (item) updateItemQuantity(item, -1);
      });
    });
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
      localStorage.removeItem("currentUser");
      localStorage.removeItem("role");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      window.location.href = "../login/login.html";
    }
  }

  window.addEventListener("storage", async (e) => {
    if (e.key === "favorites_updated") {
      await loadFavorites();
      renderFavorites();
    }
  });

  renderNavbar();
  updateCartCount();
  await loadFavorites();
  renderFavorites();
});