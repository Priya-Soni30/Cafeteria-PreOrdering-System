document.addEventListener("DOMContentLoaded", async () => {
  const goHome = document.getElementById("goHome");
  const startOrder = document.getElementById("startOrder");
  const viewMenu = document.getElementById("viewMenu");
  const topActions = document.getElementById("topActions");
  const specialsGrid = document.getElementById("specialsGrid");
  const specialsState = document.getElementById("specialsState");
  const seeAllSpecials = document.getElementById("seeAllSpecials");

  let currentUser = null;
  const CART_KEY = "cart";

  function redirect(path) {
    window.location.href = path;
  }

  async function parseResponse(response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }

  function getCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
  }

  function normalizeItemForCart(item) {
    return {
      id: item.id || item._id || item.name || `item-${Date.now()}`,
      _id: item._id || item.id || item.name || `item-${Date.now()}`,
      name: item.name || "Food Item",
      price: Number(item.specialPrice || item.price || 0),
      quantity: Number(item.quantity || 1),
      image: item.image || "food-momo.png",
      cafeteriaName:
        item.cafeteriaName ||
        item.cafeName ||
        "Islington College Cafeteria",
      cafeName:
        item.cafeteriaName ||
        item.cafeName ||
        "Islington College Cafeteria"
    };
  }

  function addItemToCart(item) {
    const cart = getCart();
    const normalizedItem = normalizeItemForCart(item);

    const existingIndex = cart.findIndex((cartItem) => {
      const sameId =
        String(cartItem.id || cartItem._id || "") ===
        String(normalizedItem.id || normalizedItem._id || "");

      const sameCafe =
        String(cartItem.cafeteriaName || cartItem.cafeName || "").trim().toLowerCase() ===
        String(normalizedItem.cafeteriaName || normalizedItem.cafeName || "").trim().toLowerCase();

      return sameId && sameCafe;
    });

    if (existingIndex > -1) {
      cart[existingIndex].quantity =
        Number(cart[existingIndex].quantity || 1) + Number(normalizedItem.quantity || 1);
    } else {
      cart.push(normalizedItem);
    }

    saveCart(cart);
  }

  async function getCurrentUser() {
    try {
      const response = await fetch(`${window.API_BASE}/api/users/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) return null;

      const data = await parseResponse(response);
      return data.user || null;
    } catch (error) {
      console.error("User session error:", error);
      return null;
    }
  }

  async function logoutUser() {
    try {
      const response = await fetch(`${window.API_BASE}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("currentUser");

      if (response.ok) {
        redirect("./home.html");
      } else {
        alert("Logout failed.");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to logout.");
    }
  }

  function renderGuestActions() {
    if (!topActions) return;

    topActions.innerHTML = `
      <button id="goLogin" class="top-btn">Login</button>
      <button id="goRegister" class="top-btn">Register</button>
    `;

    document.getElementById("goLogin")?.addEventListener("click", () => {
      redirect("../login/login.html");
    });

    document.getElementById("goRegister")?.addEventListener("click", () => {
      redirect("../register/register.html");
    });
  }

  function renderLoggedInActions(user) {
    if (!topActions) return;

    topActions.innerHTML = "";

    const userName = document.createElement("span");
    userName.className = "user-name";
    userName.textContent = `Hi, ${user.fullName || "User"}`;
    topActions.appendChild(userName);

    if (user.role !== "admin") {
      const profileBtn = document.createElement("button");
      profileBtn.className = "top-btn";
      profileBtn.textContent = "Profile";
      profileBtn.addEventListener("click", () => {
        redirect("../profile/profile.html");
      });
      topActions.appendChild(profileBtn);
    }

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "top-btn";
    logoutBtn.textContent = "Logout";
    logoutBtn.addEventListener("click", logoutUser);
    topActions.appendChild(logoutBtn);
  }

  function formatPrice(price) {
    return `Rs ${Number(price || 0).toFixed(2)}`;
  }

  function normalizeCafeteriaName(value = "") {
    const name = String(value).trim().toLowerCase();

    if (name.includes("kumari")) return "Kumari Hall";
    if (name.includes("brit")) return "Brit Cafe";
    if (name.includes("coffee")) return "Coffee Station";
    if (name.includes("canteen")) return "Canteen";

    return value || "Campus Cafeteria";
  }

  function getCafeteriaClass(value = "") {
    const name = String(value).trim().toLowerCase();

    if (name.includes("kumari")) return "caf-theme-kumari";
    if (name.includes("brit")) return "caf-theme-brit";
    if (name.includes("coffee")) return "caf-theme-coffee";
    if (name.includes("canteen")) return "caf-theme-canteen";

    return "caf-theme-default";
  }

  function cleanImageName(imageName = "") {
    return String(imageName)
      .split("/")
      .pop()
      .split("\\")
      .pop()
      .trim()
      .replace(/\s+/g, "-");
  }

  function getImageUrl(item) {
    const possibleImage = item?.image || "";

    if (!possibleImage) {
      return `${window.API_BASE}/assets/food-momo.png`;
    }

    if (
      possibleImage.startsWith("http://") ||
      possibleImage.startsWith("https://") ||
      possibleImage.startsWith("data:")
    ) {
      return possibleImage;
    }

    return `${window.API_BASE}/assets/${cleanImageName(possibleImage)}`;
  }

  function getOfferBadge(item, index) {
    const label = String(item?.type || item?.badge || "").trim();
    if (label) return label;

    const fallbackBadges = [
      "Today’s Pick",
      "Popular Choice",
      "Fresh Special",
      "Limited Offer"
    ];

    return fallbackBadges[index % fallbackBadges.length];
  }

  function getStyledDescription(item, cafeteriaName) {
    if (item?.description && String(item.description).trim()) {
      return item.description;
    }

    const name = item?.name || "Special item";

    if (cafeteriaName === "Kumari Hall") {
      return `${name} prepared fresh today for a filling and satisfying meal.`;
    }

    if (cafeteriaName === "Brit Cafe") {
      return `${name} featured today as a quick and tasty cafe favorite.`;
    }

    if (cafeteriaName === "Coffee Station") {
      return `${name} is available today as a light pick-me-up with cafe freshness.`;
    }

    if (cafeteriaName === "Canteen") {
      return `${name} is one of today’s featured canteen specials, ready for pre-order.`;
    }

    return `${name} is freshly available today as one of our featured specials.`;
  }

  function pickSpecialsFromDifferentCafes(items) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const grouped = {
      "Kumari Hall": [],
      "Brit Cafe": [],
      "Coffee Station": [],
      "Canteen": [],
      Other: [],
    };

    items.forEach((item) => {
      const normalized = normalizeCafeteriaName(item?.cafeteriaName || "");
      if (grouped[normalized]) {
        grouped[normalized].push(item);
      } else {
        grouped.Other.push(item);
      }
    });

    const selected = [];

    Object.keys(grouped).forEach((key) => {
      if (grouped[key].length > 0 && selected.length < 4) {
        selected.push(grouped[key][0]);
      }
    });

    if (selected.length < 4) {
      items.forEach((item) => {
        if (selected.length >= 4) return;
        if (!selected.includes(item)) {
          selected.push(item);
        }
      });
    }

    return selected.slice(0, 4);
  }

  function renderSpecials(items) {
    if (!specialsGrid || !specialsState) return;

    if (!Array.isArray(items) || items.length === 0) {
      specialsState.style.display = "flex";
      specialsState.textContent = "No daily specials available right now.";
      specialsGrid.style.display = "none";
      specialsGrid.innerHTML = "";
      return;
    }

    const limitedItems = pickSpecialsFromDifferentCafes(items);

    specialsGrid.innerHTML = limitedItems
      .map((item, index) => {
        const name = item.name || "Special Item";
        const cafeteriaName = normalizeCafeteriaName(item.cafeteriaName || "");
        const cafeteriaClass = getCafeteriaClass(item.cafeteriaName || "");
        const description = getStyledDescription(item, cafeteriaName);
        const imageUrl = getImageUrl(item);
        const price = Number(item.price || 0);
        const specialPrice = Number(item.specialPrice || item.price || 0);
        const badge = getOfferBadge(item, index);

        return `
          <article class="special-card ${cafeteriaClass}">
            <div class="special-image-wrap">
              <img
                src="${imageUrl}"
                alt="${name}"
                class="special-image"
                onerror="this.onerror=null;this.src='${window.API_BASE}/assets/food-momo.png';"
              />
              <span class="special-badge">${badge}</span>
            </div>

            <div class="special-body">
              <div class="special-top-row">
                <span class="special-cafeteria">${cafeteriaName}</span>
              </div>

              <h3 class="special-name">${name}</h3>
              <p class="special-desc">${description}</p>

              <div class="special-bottom">
                <div class="special-price-block">
                  ${
                    price > specialPrice
                      ? `<span class="special-old-price">${formatPrice(price)}</span>`
                      : ""
                  }
                  <span class="special-price">${formatPrice(specialPrice)}</span>
                </div>

                <button
                  class="card-btn special-order-btn"
                  data-id="${item._id || item.id || item.name || `special-${index}`}"
                  data-name="${name}"
                  data-price="${specialPrice}"
                  data-image="${item.image || "food-momo.png"}"
                  data-cafeteria="${cafeteriaName}"
                >
                  Order Now
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    specialsState.style.display = "none";
    specialsGrid.style.display = "grid";

    document.querySelectorAll(".special-order-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const item = {
          id: button.dataset.id,
          name: button.dataset.name,
          price: Number(button.dataset.price || 0),
          image: button.dataset.image,
          cafeteriaName: button.dataset.cafeteria,
          quantity: 1
        };

        addItemToCart(item);
        redirect("../cart/cart.html");
      });
    });
  }

  async function loadDailySpecials() {
    if (!specialsState || !specialsGrid) return;

    specialsState.style.display = "flex";
    specialsState.textContent = "Loading today’s specials...";
    specialsGrid.style.display = "none";
    specialsGrid.innerHTML = "";

    try {
      const response = await fetch(`${window.API_BASE}/api/special-offers`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch daily specials");
      }

      const data = await parseResponse(response);
      const items = Array.isArray(data.offers) ? data.offers : [];

      renderSpecials(items);
    } catch (error) {
      console.error("Daily specials load failed:", error);
      renderSpecials([]);
    }
  }

  currentUser = await getCurrentUser();

  if (currentUser) {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    localStorage.setItem("user", JSON.stringify(currentUser));
    localStorage.setItem("role", currentUser.role || "student");
    renderLoggedInActions(currentUser);
  } else {
    renderGuestActions();
  }

  goHome?.addEventListener("click", () => {
    redirect("./home.html");
  });

  startOrder?.addEventListener("click", () => {
    const item = {
      id: startOrder.dataset.id || "home-featured-special",
      name: startOrder.dataset.name || "Chef Special Meal",
      price: Number(startOrder.dataset.price || 220),
      image: startOrder.dataset.image || "food-momo.png",
      cafeteriaName: startOrder.dataset.cafeteria || "Islington College Cafeteria",
      quantity: 1
    };

    addItemToCart(item);
    redirect("../cart/cart.html");
  });

  viewMenu?.addEventListener("click", () => {
    redirect("../menu/menu.html");
  });

  seeAllSpecials?.addEventListener("click", () => {
    redirect("../menu/menu.html");
  });

  document.querySelectorAll(".cafeteria-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const cafeteria = button.dataset.cafeteria;
      redirect(`../menu/menu.html?cafeteria=${cafeteria}`);
    });
  });

  await loadDailySpecials();
});