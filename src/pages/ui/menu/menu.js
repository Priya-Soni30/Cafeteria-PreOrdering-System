document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.API_BASE || "http://127.0.0.1:5000";
  const DEFAULT_CAFE = "brit-cafe";

  const menuTitle = document.getElementById("menuTitle");
  const menuSubtitle = document.getElementById("menuSubtitle");
  const sectionTitle = document.getElementById("sectionTitle");
  const cafeteriaTabs = document.getElementById("cafeteriaTabs");
  const menuGrid = document.getElementById("menuGrid");
  const emptyState = document.getElementById("emptyState");
  const resultCount = document.getElementById("resultCount");

  const cartCount = document.getElementById("cartCount");

  const navActions = document.getElementById("navActions");
  const menuHero = document.getElementById("menuHero");
  const cartFilterBtn = document.getElementById("cartFilterBtn");
  const peakHoursBtn = document.getElementById("peakHoursBtn");
  const favoritesBtn = document.getElementById("favoritesBtn");
  const rewardsBtn = document.getElementById("rewardsBtn");

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const specialOnly = document.getElementById("specialOnly");
  const vegOnly = document.getElementById("vegOnly");
  const veganOnly = document.getElementById("veganOnly");
  const nonVegOnly = document.getElementById("nonVegOnly");
  const allergenFilter = document.getElementById("allergenFilter");

  const specialsSection = document.getElementById("specialsSection");
  const specialsGrid = document.getElementById("specialsGrid");
  const specialsCount = document.getElementById("specialsCount");
  const specialsEmptyState = document.getElementById("specialsEmptyState");

  let favorites = new Set();

  const cafeterias = {
    "brit-cafe": {
      name: "Brit Cafe",
      subtitle: "Quick bites, burgers, pasta, beverages, and shared items in one clean menu.",
      cover: "brit-cafe-cover.jpg"
    },
    canteen: {
      name: "Canteen",
      subtitle: "Popular daily meals, momo, chowmein, rice sets, and common food selections.",
      cover: "canteen-cover.jpg"
    },
    "coffee-station": {
      name: "Coffee Station",
      subtitle: "Coffee, tea, pastries, quick snacks, and shared drinks for easy pre-ordering.",
      cover: "coffee-station-cover.jpg"
    },
    "kumari-hall": {
      name: "Kumari Hall",
      subtitle: "Snacks, desserts, drinks, sandwiches, and shared food or drink items.",
      cover: "kumari-hall-cover.jpg"
    }
  };

  const sharedItems = [
    { id: "shared-buddha-bowl", name: "Vegan Buddha Bowl", image: "vegan-buddha-bowl.png", price: 220, category: "healthy", diet: "vegan", prepTime: "10 min", calories: 430, allergens: ["nuts"], isSpecial: false },
    { id: "shared-detox-salad", name: "Green Detox Salad", image: "green-detox-salad.png", price: 180, category: "healthy", diet: "vegan", prepTime: "8 min", calories: 220, allergens: [], isSpecial: false },
    { id: "shared-orange-juice", name: "Fresh Orange Juice", image: "fresh-orange-juice.png", price: 120, category: "drinks", diet: "vegan", prepTime: "2 min", calories: 140, allergens: [], isSpecial: false },
    { id: "shared-chowmein", name: "Food Chowmein", image: "food-chowmein.png", price: 170, category: "main", diet: "veg", prepTime: "8 min", calories: 390, allergens: ["gluten", "soy"], isSpecial: false },
    { id: "shared-curry", name: "Food Curry", image: "food-curry.png", price: 190, category: "main", diet: "non-veg", prepTime: "10 min", calories: 460, allergens: ["dairy"], isSpecial: false },
    { id: "shared-friedrice", name: "Food Fried Rice", image: "food-friedrice.png", price: 175, category: "main", diet: "veg", prepTime: "9 min", calories: 380, allergens: ["soy"], isSpecial: false },
    { id: "shared-pasta", name: "Food Pasta", image: "food-pasta.png", price: 210, category: "main", diet: "veg", prepTime: "10 min", calories: 450, allergens: ["gluten", "dairy"], isSpecial: false },
    { id: "shared-thakali", name: "Food Thakali", image: "food-thakali.png", price: 245, category: "main", diet: "non-veg", prepTime: "12 min", calories: 520, allergens: [], isSpecial: false },
    { id: "shared-cold-coffee", name: "Cold Coffee", image: "cold-coffee.png", price: 130, category: "drinks", diet: "veg", prepTime: "3 min", calories: 160, allergens: ["dairy"], isSpecial: false },
    { id: "shared-lemon-mint", name: "Lemon Mint Drink", image: "lemon-mint-drink.png", price: 110, category: "drinks", diet: "vegan", prepTime: "2 min", calories: 70, allergens: [], isSpecial: false },
    { id: "shared-iced-lemon-tea", name: "Iced Lemon Tea", image: "IcedLemonTea.png", price: 105, category: "drinks", diet: "vegan", prepTime: "2 min", calories: 55, allergens: [], isSpecial: false }
  ];

  const cafeItems = {
    "brit-cafe": [
      { id: "brit-chicken-burger", name: "Chicken Burger", image: "brit-chicken-burger.png", price: 240, category: "main", diet: "non-veg", prepTime: "10 min", calories: 520, allergens: ["gluten", "dairy"], isSpecial: true },
      { id: "brit-club-sandwich", name: "Club Sandwich", image: "brit-club-sandwich.png", price: 210, category: "snacks", diet: "non-veg", prepTime: "8 min", calories: 410, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "brit-french-fries", name: "French Fries", image: "brit-french-fries.png", price: 150, category: "snacks", diet: "vegan", prepTime: "6 min", calories: 300, allergens: [], isSpecial: false },
      { id: "brit-iced-tea", name: "Iced Tea", image: "brit-iced-tea.png", price: 95, category: "drinks", diet: "vegan", prepTime: "2 min", calories: 48, allergens: [], isSpecial: false },
      { id: "brit-oreo-shake", name: "Oreo Shake", image: "brit-oreo-shake.png", price: 165, category: "dessert", diet: "veg", prepTime: "5 min", calories: 360, allergens: ["dairy", "gluten"], isSpecial: false },
      { id: "brit-red-sauce-pasta", name: "Red Sauce Pasta", image: "brit-red-sauce-pasta.png", price: 215, category: "main", diet: "veg", prepTime: "10 min", calories: 430, allergens: ["gluten"], isSpecial: false },
      { id: "brit-veg-burger", name: "Veg Burger", image: "brit-veg-burger.png", price: 195, category: "main", diet: "veg", prepTime: "8 min", calories: 370, allergens: ["gluten"], isSpecial: false },
      { id: "brit-white-sauce-pasta", name: "White Sauce Pasta", image: "brit-white-sauce-pasta.png", price: 230, category: "main", diet: "veg", prepTime: "11 min", calories: 490, allergens: ["gluten", "dairy"], isSpecial: true }
    ],
    canteen: [
      { id: "canteen-chicken-chowmein", name: "Chicken Chowmein", image: "canteen-chicken-chowmein.png", price: 210, category: "main", diet: "non-veg", prepTime: "11 min", calories: 470, allergens: ["gluten", "soy"], isSpecial: false },
      { id: "canteen-chicken-curry-set", name: "Chicken Curry Set", image: "canteen-chicken-curry-set.png", price: 260, category: "main", diet: "non-veg", prepTime: "12 min", calories: 560, allergens: ["dairy"], isSpecial: true },
      { id: "canteen-chicken-momo", name: "Chicken Momo", image: "canteen-chicken-momo.png", price: 180, category: "snacks", diet: "non-veg", prepTime: "8 min", calories: 340, allergens: ["gluten"], isSpecial: true },
      { id: "canteen-veg-chowmein", name: "Veg Chowmein", image: "canteen-veg-chowmein.png", price: 170, category: "main", diet: "veg", prepTime: "9 min", calories: 390, allergens: ["gluten", "soy"], isSpecial: false },
      { id: "canteen-veg-friedrice", name: "Veg Fried Rice", image: "canteen-veg-friedrice.png", price: 175, category: "main", diet: "veg", prepTime: "9 min", calories: 380, allergens: ["soy"], isSpecial: false },
      { id: "canteen-veg-momo", name: "Veg Momo", image: "canteen-veg-momo.png", price: 160, category: "snacks", diet: "veg", prepTime: "7 min", calories: 295, allergens: ["gluten"], isSpecial: false }
    ],
    "coffee-station": [
      { id: "coffee-banana-muffin", name: "Banana Muffin", image: "coffee-banana-muffin.png", price: 110, category: "dessert", diet: "veg", prepTime: "2 min", calories: 280, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "coffee-black-coffee", name: "Black Coffee", image: "coffee-black-coffee.png", price: 85, category: "drinks", diet: "vegan", prepTime: "2 min", calories: 8, allergens: [], isSpecial: false },
      { id: "coffee-cappuccino", name: "Cappuccino", image: "coffee-cappuccino.png", price: 125, category: "drinks", diet: "veg", prepTime: "3 min", calories: 110, allergens: ["dairy"], isSpecial: true },
      { id: "coffee-cheese-sandwich", name: "Cheese Sandwich", image: "coffee-cheese-sandwich.png", price: 145, category: "snacks", diet: "veg", prepTime: "4 min", calories: 290, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "coffee-cookie", name: "Cookie", image: "coffee-cookie.png", price: 75, category: "dessert", diet: "veg", prepTime: "1 min", calories: 150, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "coffee-croissant", name: "Croissant", image: "coffee-croissant.png", price: 95, category: "dessert", diet: "veg", prepTime: "2 min", calories: 230, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "coffee-espresso", name: "Espresso", image: "coffee-espresso.png", price: 80, category: "drinks", diet: "vegan", prepTime: "2 min", calories: 6, allergens: [], isSpecial: false },
      { id: "coffee-green-tea", name: "Green Tea", image: "coffee-green-tea.png", price: 70, category: "drinks", diet: "vegan", prepTime: "2 min", calories: 4, allergens: [], isSpecial: false },
      { id: "coffee-iced-americano", name: "Iced Americano", image: "coffee-iced-americano.png", price: 115, category: "drinks", diet: "vegan", prepTime: "3 min", calories: 10, allergens: [], isSpecial: false },
      { id: "coffee-latte", name: "Latte", image: "coffee-latte.png", price: 130, category: "drinks", diet: "veg", prepTime: "3 min", calories: 140, allergens: ["dairy"], isSpecial: false },
      { id: "coffee-lemon-tea", name: "Lemon Tea", image: "coffee-lemon-tea.png", price: 75, category: "drinks", diet: "vegan", prepTime: "2 min", calories: 18, allergens: [], isSpecial: false },
      { id: "coffee-mocha", name: "Mocha", image: "coffee-mocha.png", price: 135, category: "drinks", diet: "veg", prepTime: "3 min", calories: 165, allergens: ["dairy"], isSpecial: true }
    ],
    "kumari-hall": [
      { id: "kumari-blueberry-muffin", name: "Blueberry Muffin", image: "kumari-blueberry-muffin.png", price: 115, category: "dessert", diet: "veg", prepTime: "2 min", calories: 270, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "kumari-brownie", name: "Brownie", image: "kumari-brownie.png", price: 105, category: "dessert", diet: "veg", prepTime: "1 min", calories: 240, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "kumari-cheese-toast", name: "Cheese Toast", image: "kumari-cheese-toast.png", price: 125, category: "snacks", diet: "veg", prepTime: "4 min", calories: 260, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "kumari-chicken-sandwich", name: "Chicken Sandwich", image: "kumari-chicken-sandwich.png", price: 170, category: "snacks", diet: "non-veg", prepTime: "5 min", calories: 320, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "kumari-chocolate-donut", name: "Chocolate Donut", image: "kumari-chocolate-donut.png", price: 95, category: "dessert", diet: "veg", prepTime: "1 min", calories: 250, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "kumari-chocolate-milkshake", name: "Chocolate Milkshake", image: "kumari-chocolate-milkshake.png", price: 165, category: "drinks", diet: "veg", prepTime: "4 min", calories: 350, allergens: ["dairy"], isSpecial: true },
      { id: "kumari-fruit-pastry", name: "Fruit Pastry", image: "kumari-fruit-pastry.png", price: 120, category: "dessert", diet: "veg", prepTime: "1 min", calories: 210, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "kumari-garlic-bread", name: "Garlic Bread", image: "kumari-garlic-bread.png", price: 110, category: "snacks", diet: "veg", prepTime: "3 min", calories: 220, allergens: ["gluten", "dairy"], isSpecial: false },
      { id: "kumari-popcorn", name: "Popcorn", image: "kumari-popcorn.png", price: 80, category: "snacks", diet: "vegan", prepTime: "1 min", calories: 140, allergens: [], isSpecial: false },
      { id: "kumari-strawberry-milkshake", name: "Strawberry Milkshake", image: "kumari-strawberry-milkshake.png", price: 160, category: "drinks", diet: "veg", prepTime: "4 min", calories: 330, allergens: ["dairy"], isSpecial: true },
      { id: "kumari-veg-sandwich", name: "Veg Sandwich", image: "kumari-veg-sandwich.png", price: 145, category: "snacks", diet: "veg", prepTime: "4 min", calories: 270, allergens: ["gluten"], isSpecial: false }
    ]
  };

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

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setQueryParam(name, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(name, value);
    window.location.href = url.toString();
  }

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

  function cacheFavoriteItem(item) {
    const map = getFavoriteItemsMap();
    map[item.id] = {
      id: item.id,
      name: item.name,
      image: item.image,
      price: item.price,
      category: item.category,
      diet: item.diet,
      prepTime: item.prepTime,
      calories: item.calories,
      allergens: Array.isArray(item.allergens) ? item.allergens : [],
      isSpecial: Boolean(item.isSpecial),
      cafeKey: item.cafeKey || "",
      cafeName: item.cafeName || ""
    };
    setFavoriteItemsMap(map);
  }

  function removeCachedFavoriteItem(itemId) {
    const map = getFavoriteItemsMap();
    delete map[itemId];
    setFavoriteItemsMap(map);
  }

  function notifyFavoritesUpdate() {
    localStorage.setItem("favorites_updated", String(Date.now()));
  }

  const role = normalizeRole();

  let selectedCafe = getQueryParam("cafeteria") || DEFAULT_CAFE;
  if (!cafeterias[selectedCafe]) selectedCafe = DEFAULT_CAFE;

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

  async function applyHeroCover(fileName) {
    const foundPath = await tryLoadImage(buildImageCandidates(fileName));
    if (foundPath) {
      menuHero?.style.setProperty("--hero-cover", `url("${foundPath}")`);
    } else {
      menuHero?.style.setProperty("--hero-cover", "linear-gradient(135deg, #d8e0f0, #ece6f8)");
    }
  }

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

  async function loadFavorites() {
    if (role === "admin") {
      favorites = new Set();
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/favorites`, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.favorites)) {
        favorites = new Set(
          data.favorites
            .map((item) => (typeof item === "string" ? item : item?.id || item?._id || ""))
            .filter(Boolean)
        );
      } else {
        favorites = new Set(Object.keys(getFavoriteItemsMap()));
      }
    } catch {
      favorites = new Set(Object.keys(getFavoriteItemsMap()));
    }
  }

  async function saveFavorite(itemId, shouldAdd) {
    const method = shouldAdd ? "POST" : "DELETE";

    const res = await fetch(`${API_BASE}/api/users/favorites/${encodeURIComponent(itemId)}`, {
      method,
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Favorite request failed");
    }

    if (Array.isArray(data.favorites)) {
      favorites = new Set(
        data.favorites
          .map((item) => (typeof item === "string" ? item : item?.id || item?._id || ""))
          .filter(Boolean)
      );
    }
  }

  function renderNavbar() {
    if (!navActions) return;

    navActions.innerHTML = "";

    const homeBtn = document.createElement("a");
    homeBtn.className = "nav__link";
    homeBtn.href = "../home/home.html";
    homeBtn.textContent = "Home";
    navActions.appendChild(homeBtn);

    if (role === "admin") {
      const dashboardBtn = document.createElement("a");
      dashboardBtn.className = "nav__link";
      dashboardBtn.href = "../dashboard/dashboard.html";
      dashboardBtn.textContent = "Dashboard";
      navActions.appendChild(dashboardBtn);
    } else {
      const ordersBtn = document.createElement("a");
      ordersBtn.className = "nav__link";
      ordersBtn.href = "../orders/orders.html";
      ordersBtn.textContent = "Orders";

      const walletBtn = document.createElement("a");
      walletBtn.className = "nav__link";
      walletBtn.href = "../wallet/wallet.html";
      walletBtn.textContent = "Top-up Wallet";

      const profileBtn = document.createElement("a");
      profileBtn.className = "nav__link";
      profileBtn.href = "../profile/profile.html";
      profileBtn.textContent = "Profile";

      navActions.appendChild(ordersBtn);
      navActions.appendChild(walletBtn);
      navActions.appendChild(profileBtn);
    }

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "nav__link nav__btn";
    logoutBtn.type = "button";
    logoutBtn.textContent = "Logout";
    logoutBtn.addEventListener("click", logoutUser);

    navActions.appendChild(logoutBtn);
  }

  function updateCartCount() {
    const total = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    if (cartCount) cartCount.textContent = total;

    if (role === "admin") {
      cartFilterBtn?.classList.add("hidden");
    } else {
      cartFilterBtn?.classList.remove("hidden");
    }
  }

  function getAllItemsForCafe(cafeKey) {
    return [...(cafeItems[cafeKey] || []), ...sharedItems].map((item) => ({
      ...item,
      cafeKey,
      cafeName: cafeterias[cafeKey].name
    }));
  }

  function getAllItemsCatalog() {
    return Object.keys(cafeterias).flatMap((key) => getAllItemsForCafe(key));
  }

  function findItemById(itemId) {
    return getAllItemsCatalog().find((item) => item.id === itemId) || null;
  }

  function setupHeaderContent() {
    const cafe = cafeterias[selectedCafe];
    if (!cafe) return;

    if (menuTitle) menuTitle.textContent = `${cafe.name} Menu`;
    if (menuSubtitle) menuSubtitle.textContent = cafe.subtitle;
    if (sectionTitle) sectionTitle.textContent = `${cafe.name} Food & Drinks`;

    applyHeroCover(cafe.cover);

    if (peakHoursBtn) {
      peakHoursBtn.href = `../peak-hours/peak-hours.html?cafeteria=${encodeURIComponent(selectedCafe)}`;
    }
  }

  function renderCafeTabs() {
    if (!cafeteriaTabs) return;

    cafeteriaTabs.innerHTML = Object.entries(cafeterias)
      .map(([key, cafe]) => `
        <button class="cafe-tab ${key === selectedCafe ? "is-active" : ""}" data-cafe="${key}" type="button">
          ${cafe.name}
        </button>
      `)
      .join("");

    cafeteriaTabs.querySelectorAll(".cafe-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        setQueryParam("cafeteria", btn.dataset.cafe);
      });
    });
  }

  function getFilteredItems() {
    let items = getAllItemsForCafe(selectedCafe);

    const searchValue = String(searchInput?.value || "").trim().toLowerCase();
    const categoryValue = categoryFilter?.value || "all";
    const allergenValue = allergenFilter?.value || "all";

    if (searchValue) items = items.filter((item) => item.name.toLowerCase().includes(searchValue));
    if (categoryValue !== "all") items = items.filter((item) => item.category === categoryValue);
    if (specialOnly?.checked) items = items.filter((item) => item.isSpecial);
    if (vegOnly?.checked) items = items.filter((item) => item.diet === "veg");
    if (veganOnly?.checked) items = items.filter((item) => item.diet === "vegan");
    if (nonVegOnly?.checked) items = items.filter((item) => item.diet === "non-veg");
    if (allergenValue !== "all") items = items.filter((item) => !item.allergens.includes(allergenValue));

    return items;
  }

  function openNutrition(item) {
    const url = `../nutrition/nutrition.html?id=${encodeURIComponent(item.id)}&cafeteria=${encodeURIComponent(item.cafeKey)}`;
    window.location.href = url;
  }

  async function toggleFavorite(itemId) {
    if (role === "admin") {
      alert("Admin cannot use favorites.");
      return;
    }

    const item = findItemById(itemId);
    if (!item) return;

    const shouldAdd = !favorites.has(itemId);

    try {
      if (shouldAdd) {
        favorites.add(itemId);
        cacheFavoriteItem(item);
      } else {
        favorites.delete(itemId);
        removeCachedFavoriteItem(itemId);
      }

      applyFilters();
      notifyFavoritesUpdate();

      await saveFavorite(itemId, shouldAdd);

      if (shouldAdd) {
        cacheFavoriteItem(item);
      } else {
        removeCachedFavoriteItem(itemId);
      }

      notifyFavoritesUpdate();
    } catch (error) {
      console.error("Favorite error:", error);
      alert("Failed to update favorites.");

      await loadFavorites();
      applyFilters();
    }
  }

  function updateItemQuantity(item, change) {
    if (role === "admin") {
      alert("Admin can view menu only. Ordering is disabled for admin.");
      return;
    }

    const cart = getCart();
    const existingIndex = cart.findIndex((entry) => entry.id === item.id);

    if (change > 0) {
      if (cart.length > 0 && existingIndex === -1 && cart[0].cafeKey !== item.cafeKey) {
        const reset = confirm("Cart contains items from another cafeteria. Clear cart and continue?");
        if (!reset) return;
        writeCart([]);
      }
    }

    const updatedCart = getCart();
    const newIndex = updatedCart.findIndex((entry) => entry.id === item.id);

    if (newIndex > -1) {
      updatedCart[newIndex].quantity = Math.max(0, Number(updatedCart[newIndex].quantity || 0) + change);
      if (updatedCart[newIndex].quantity === 0) updatedCart.splice(newIndex, 1);
    } else if (change > 0) {
      updatedCart.push({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        cafeKey: item.cafeKey,
        cafeName: item.cafeName,
        quantity: 1
      });
    }

    writeCart(updatedCart);
    updateCartCount();

    const qtyEl = document.getElementById(`qty-${item.id}`);
    if (qtyEl) qtyEl.textContent = getCartQuantity(item.id);

    const specialQtyEl = document.getElementById(`special-qty-${item.id}`);
    if (specialQtyEl) specialQtyEl.textContent = getCartQuantity(item.id);
  }

  function renderSpecials(specials) {
    if (!specialsGrid) return;

    if (!specials.length) {
      specialsGrid.innerHTML = "";
      if (specialsEmptyState) specialsEmptyState.hidden = false;
      if (specialsCount) specialsCount.textContent = "0 special item(s)";
      return;
    }

    if (specialsEmptyState) specialsEmptyState.hidden = true;
    if (specialsCount) specialsCount.textContent = `${specials.length} special item(s)`;

    specialsGrid.innerHTML = specials.map((item) => `
      <article class="menu-card special-card">
        <div class="menu-card__image">
          <img data-special-image="${item.image}" alt="${item.name}" />
        </div>
        <div class="menu-card__body">
          <div class="menu-card__top">
            <h3 class="menu-card__title">${item.name}</h3>
            <span class="tag tag--special">Special</span>
          </div>
          <div class="menu-card__meta">${capitalize(item.category)} • Prep ~ ${item.prepTime}</div>
          <div class="menu-card__tags">
            <span class="tag tag--diet">${dietText(item.diet)}</span>
            <span class="tag">${item.calories} kcal</span>
          </div>
          <div class="menu-card__bottom">
            <div class="menu-card__price">Rs ${item.price}</div>
            <div class="menu-card__actions">
              <button class="card-btn card-btn--light" type="button" data-special-nutrition="${item.id}">Nutrition</button>
              <div class="qty-box">
                <button class="qty-btn" type="button" data-special-minus="${item.id}">−</button>
                <span class="qty-value" id="special-qty-${item.id}">${getCartQuantity(item.id)}</span>
                <button class="qty-btn" type="button" data-special-plus="${item.id}">+</button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `).join("");

    specialsGrid.querySelectorAll("img[data-special-image]").forEach((img) => {
      applySmartImage(img, img.dataset.specialImage);
    });

    specialsGrid.querySelectorAll("[data-special-plus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = specials.find((x) => x.id === btn.dataset.specialPlus);
        if (item) updateItemQuantity(item, 1);
      });
    });

    specialsGrid.querySelectorAll("[data-special-minus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = specials.find((x) => x.id === btn.dataset.specialMinus);
        if (item) updateItemQuantity(item, -1);
      });
    });

    specialsGrid.querySelectorAll("[data-special-nutrition]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = specials.find((x) => x.id === btn.dataset.specialNutrition);
        if (item) openNutrition(item);
      });
    });
  }

  function renderMenu(items) {
    if (!menuGrid) return;

    if (!items.length) {
      menuGrid.innerHTML = "";
      if (emptyState) emptyState.hidden = false;
      if (resultCount) resultCount.textContent = "0 item(s) found";
      return;
    }

    if (emptyState) emptyState.hidden = true;
    if (resultCount) resultCount.textContent = `${items.length} item(s) found`;

    menuGrid.innerHTML = items.map((item) => {
      const isFavorite = favorites.has(item.id);

      return `
        <article class="menu-card">
          <div class="menu-card__image">
            <img data-image="${item.image}" alt="${item.name}" />
          </div>
          <div class="menu-card__body">
            <div class="menu-card__top">
              <h3 class="menu-card__title">${item.name}</h3>
              <button
                class="fav-btn ${isFavorite ? "is-active" : ""}"
                type="button"
                data-fav="${item.id}"
                title="Favorite"
              >
                ${isFavorite ? "♥" : "♡"}
              </button>
            </div>
            <div class="menu-card__meta">${capitalize(item.category)} • Prep ~ ${item.prepTime}</div>
            <div class="menu-card__tags">
              <span class="tag tag--diet">${dietText(item.diet)}</span>
              <span class="tag">${item.calories} kcal</span>
            </div>
            <div class="menu-card__bottom">
              <div class="menu-card__price">Rs ${item.price}</div>
              <div class="menu-card__actions">
                <button class="card-btn card-btn--light" type="button" data-nutrition="${item.id}">Nutrition</button>
                <div class="qty-box">
                  <button class="qty-btn" type="button" data-minus="${item.id}">−</button>
                  <span class="qty-value" id="qty-${item.id}">${getCartQuantity(item.id)}</span>
                  <button class="qty-btn" type="button" data-plus="${item.id}">+</button>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");

    menuGrid.querySelectorAll("img[data-image]").forEach((img) => {
      applySmartImage(img, img.dataset.image);
    });

    menuGrid.querySelectorAll("[data-plus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = items.find((x) => x.id === btn.dataset.plus);
        if (item) updateItemQuantity(item, 1);
      });
    });

    menuGrid.querySelectorAll("[data-minus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = items.find((x) => x.id === btn.dataset.minus);
        if (item) updateItemQuantity(item, -1);
      });
    });

    menuGrid.querySelectorAll("[data-nutrition]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = items.find((x) => x.id === btn.dataset.nutrition);
        if (item) openNutrition(item);
      });
    });

    menuGrid.querySelectorAll("[data-fav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleFavorite(btn.dataset.fav);
      });
    });
  }

  function applyFilters() {
    const filteredItems = getFilteredItems();
    const specials = filteredItems.filter((item) => item.isSpecial);
    const normalItems = filteredItems.filter((item) => !item.isSpecial);

    if (specialOnly?.checked) {
      if (specialsSection) specialsSection.hidden = false;
      renderSpecials(specials);
      renderMenu([]);
      if (resultCount) resultCount.textContent = "0 item(s) found";
      return;
    }

    if (specialsSection) specialsSection.hidden = specials.length === 0;
    renderSpecials(specials);
    renderMenu(normalItems);
  }

  function setupRoleUI() {
    if (role === "admin") {
      peakHoursBtn?.classList.remove("hidden");
      favoritesBtn?.classList.add("hidden");
      rewardsBtn?.classList.add("hidden");
      cartFilterBtn?.classList.add("hidden");
    } else {
      peakHoursBtn?.classList.remove("hidden");
      favoritesBtn?.classList.remove("hidden");
      rewardsBtn?.classList.remove("hidden");
      cartFilterBtn?.classList.remove("hidden");
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
      localStorage.removeItem("currentUser");
      localStorage.removeItem("role");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      window.location.href = "../login/login.html";
    }
  }

  searchInput?.addEventListener("input", applyFilters);
  categoryFilter?.addEventListener("change", applyFilters);
  specialOnly?.addEventListener("change", applyFilters);
  vegOnly?.addEventListener("change", applyFilters);
  veganOnly?.addEventListener("change", applyFilters);
  nonVegOnly?.addEventListener("change", applyFilters);
  allergenFilter?.addEventListener("change", applyFilters);

  window.addEventListener("storage", (e) => {
    if (e.key === "favorites_updated") {
      loadFavorites().then(applyFilters);
    }
  });

  renderNavbar();
  setupHeaderContent();
  renderCafeTabs();
  setupRoleUI();
  updateCartCount();
  await loadFavorites();
  applyFilters();
});