document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.API_BASE || "http://127.0.0.1:5000";
  const CART_URL = "../cart/cart.html";
  const LOGIN_URL = "../login/login.html";

  const year = document.getElementById("year");
  const cafeteriaFilter = document.getElementById("cafeteriaFilter");
  const typeFilter = document.getElementById("typeFilter");
  const offersGrid = document.getElementById("offersGrid");
  const resultBadge = document.getElementById("resultBadge");
  const btnLogout = document.getElementById("btnLogout");

  if (year) year.textContent = new Date().getFullYear();

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
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="360">
        <rect width="100%" height="100%" fill="#eef2f8"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="Arial" font-size="24" fill="#788663">
          Image not found
        </text>
      </svg>
    `);

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function getCurrentUser() {
    const currentUser = safeJsonParse(localStorage.getItem("currentUser"), null);
    const user = safeJsonParse(localStorage.getItem("user"), null);
    return currentUser || user || null;
  }

  function normalizeRole() {
    const currentUser = getCurrentUser();
    return String(
      currentUser?.role ||
      localStorage.getItem("userRole") ||
      localStorage.getItem("role") ||
      "student"
    ).toLowerCase();
  }

  const currentUser = getCurrentUser();
  const role = normalizeRole();
  const userId = String(currentUser?._id || currentUser?.id || "").trim();

  function getCartStorageKey() {
    if (userId) return `cart_${userId}`;
    return "cart";
  }

  function buildImageCandidates(fileName) {
    if (!fileName) return [];
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
    if (!imgElement) return;

    if (!fileName) {
      imgElement.src = FALLBACK_IMAGE;
      imgElement.classList.add("is-fallback");
      return;
    }

    const foundPath = await tryLoadImage(buildImageCandidates(fileName));

    if (foundPath) {
      imgElement.src = foundPath;
      imgElement.classList.remove("is-fallback");
    } else {
      imgElement.src = FALLBACK_IMAGE;
      imgElement.classList.add("is-fallback");
    }
  }

  function getCart() {
    return safeJsonParse(localStorage.getItem(getCartStorageKey()), []);
  }

  function writeCart(cart) {
    localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
  }

  function clearLegacyCartIfNeeded() {
    if (userId) {
      localStorage.removeItem("cart");
    }
  }

  function addToCartAndRedirect(offer) {
    if (!currentUser) {
      alert("Please login first.");
      window.location.href = LOGIN_URL;
      return;
    }

    if (role === "admin") {
      alert("Admin can view specials only. Ordering is disabled for admin.");
      return;
    }

    clearLegacyCartIfNeeded();

    let cart = getCart();

    const existingIndex = cart.findIndex((item) => {
      const itemId = String(item?.id || item?._id || item?.menuItemId || "").trim();
      const offerId = String(offer?._id || "").trim();

      const sameId = itemId && offerId && itemId === offerId;
      const sameName =
        String(item?.name || "").trim().toLowerCase() ===
        String(offer?.itemName || "").trim().toLowerCase();

      return sameId || sameName;
    });

    if (cart.length > 0 && existingIndex === -1) {
      const existingCafe = String(
        cart[0]?.cafeName || cart[0]?.cafeteriaName || ""
      ).toLowerCase().trim();

      const newCafe = String(offer?.cafeteriaName || "").toLowerCase().trim();

      if (existingCafe && newCafe && existingCafe !== newCafe) {
        const shouldClear = window.confirm(
          "Cart contains items from another cafeteria. Clear cart and continue?"
        );

        if (!shouldClear) return;

        cart = [];
      }
    }

    const normalizedOffer = {
      id: offer?._id || offer?.itemName || `special-${Date.now()}`,
      menuItemId: offer?._id || offer?.itemName || `special-${Date.now()}`,
      name: offer?.itemName || "Special Item",
      image: offer?.image || "",
      price: Number(offer?.specialPrice || 0),
      quantity: 1,
      qty: 1,
      cafeName: offer?.cafeteriaName || "",
      cafeteriaName: offer?.cafeteriaName || "",
      isSpecial: true,
      specialType: offer?.type || "",
      description: offer?.description || ""
    };

    const entryIndex = cart.findIndex((item) => {
      const itemId = String(item?.id || item?._id || item?.menuItemId || "").trim();
      const offerId = String(normalizedOffer?.id || "").trim();

      const sameId = itemId && offerId && itemId === offerId;
      const sameName =
        String(item?.name || "").trim().toLowerCase() ===
        String(normalizedOffer?.name || "").trim().toLowerCase();

      return sameId || sameName;
    });

    if (entryIndex > -1) {
      const currentQty = Number(cart[entryIndex].quantity ?? cart[entryIndex].qty ?? 1);
      cart[entryIndex].quantity = currentQty + 1;
      cart[entryIndex].qty = currentQty + 1;
    } else {
      cart.push(normalizedOffer);
    }

    writeCart(cart);

    window.dispatchEvent(new Event("storage"));
    window.location.href = CART_URL;
  }

  async function openNutrition(offer) {
    try {
      const searchUrl = `${API_BASE}/api/menu?search=${encodeURIComponent(offer.itemName)}`;
      const res = await fetch(searchUrl, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      let matchedItem = null;

      if (res.ok && Array.isArray(data.items)) {
        matchedItem = data.items.find(
          (item) =>
            String(item.name || "").trim().toLowerCase() ===
            String(offer.itemName || "").trim().toLowerCase()
        ) || data.items[0] || null;
      }

      if (matchedItem && matchedItem._id) {
        localStorage.setItem("selectedFood", JSON.stringify(matchedItem));
        window.location.href = `../nutrition/nutrition.html?id=${matchedItem._id}`;
        return;
      }

      localStorage.setItem(
        "selectedFood",
        JSON.stringify({
          id: offer._id,
          name: offer.itemName,
          image: offer.image || "",
          cafeteriaName: offer.cafeteriaName || "",
          description: offer.description || "",
          price: offer.specialPrice || offer.originalPrice || 0
        })
      );

      window.location.href = "../nutrition/nutrition.html";
    } catch (error) {
      console.error("Nutrition redirect failed:", error);

      localStorage.setItem(
        "selectedFood",
        JSON.stringify({
          id: offer._id,
          name: offer.itemName,
          image: offer.image || "",
          cafeteriaName: offer.cafeteriaName || "",
          description: offer.description || "",
          price: offer.specialPrice || offer.originalPrice || 0
        })
      );

      window.location.href = "../nutrition/nutrition.html";
    }
  }

  function renderOffers(offers) {
    if (!offersGrid) return;

    if (resultBadge) {
      resultBadge.textContent = `${offers.length} special item(s)`;
    }

    if (!offers.length) {
      offersGrid.innerHTML = `<div class="emptyBox">No specials available right now.</div>`;
      return;
    }

    offersGrid.innerHTML = offers
      .map(
        (offer) => `
      <article class="offerCard">
        <div class="offerImage">
          <img data-offer-image="${offer.image || ""}" alt="${offer.itemName || "Special Item"}" />
          <span class="offerBadge">${offer.discountText || "Special"}</span>
        </div>

        <div class="offerBody">
          <div class="offerTop">
            <h3>${offer.itemName || "Special Item"}</h3>
            <span class="offerCafe">${offer.cafeteriaName || "Campus Cafeteria"}</span>
          </div>

          <p class="offerDesc">${offer.description || ""}</p>

          <div class="offerMeta">
            <span class="oldPrice">Rs. ${Number(offer.originalPrice || 0)}</span>
            <span class="newPrice">Rs. ${Number(offer.specialPrice || 0)}</span>
          </div>

          <div class="offerActions">
            <button class="btn btnLight" type="button" data-nutrition="${offer._id}">Nutrition</button>
            <button class="btn btnGreen" type="button" data-cart="${offer._id}">Add to Cart</button>
          </div>
        </div>
      </article>
    `
      )
      .join("");

    offersGrid.querySelectorAll("img[data-offer-image]").forEach((img) => {
      applySmartImage(img, img.dataset.offerImage);
    });

    offersGrid.querySelectorAll("[data-cart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const offer = offers.find((x) => String(x._id) === String(btn.dataset.cart));
        if (offer) addToCartAndRedirect(offer);
      });
    });

    offersGrid.querySelectorAll("[data-nutrition]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const offer = offers.find((x) => String(x._id) === String(btn.dataset.nutrition));
        if (offer) openNutrition(offer);
      });
    });
  }

  async function fetchOffers() {
    try {
      if (offersGrid) {
        offersGrid.innerHTML = `<div class="emptyBox">Loading specials...</div>`;
      }

      const params = new URLSearchParams();

      if (cafeteriaFilter?.value) {
        params.set("cafeteriaName", cafeteriaFilter.value);
      }

      if (typeFilter?.value) {
        params.set("type", typeFilter.value);
      }

      const url = `${API_BASE}/api/special-offers${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load specials");
      }

      renderOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch (error) {
      console.error("Specials fetch error:", error);

      if (resultBadge) {
        resultBadge.textContent = "0 special item(s)";
      }

      if (offersGrid) {
        offersGrid.innerHTML = `<div class="emptyBox">Failed to load specials.</div>`;
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
      localStorage.removeItem("currentUser");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      window.location.href = LOGIN_URL;
    }
  }

  cafeteriaFilter?.addEventListener("change", fetchOffers);
  typeFilter?.addEventListener("change", fetchOffers);
  btnLogout?.addEventListener("click", logoutUser);

  fetchOffers();
});