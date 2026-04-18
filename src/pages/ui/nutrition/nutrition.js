const API_BASE = window.API_BASE || "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupNavbar();
  initNutritionPage();
});

function setupNavbar() {
  const navActions = document.getElementById("navActions");

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
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

  const role = normalizeRole();

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

  document.getElementById("btnLogout")?.addEventListener("click", async () => {
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
  });
}

function setupTabs() {
  const tabFacts = document.getElementById("tabFacts");
  const tabIng = document.getElementById("tabIng");
  const factsPanel = document.getElementById("factsPanel");
  const ingPanel = document.getElementById("ingPanel");

  tabFacts?.addEventListener("click", () => {
    tabFacts.classList.add("active");
    tabIng?.classList.remove("active");
    factsPanel?.classList.remove("hide");
    ingPanel?.classList.add("hide");
  });

  tabIng?.addEventListener("click", () => {
    tabIng.classList.add("active");
    tabFacts?.classList.remove("active");
    ingPanel?.classList.remove("hide");
    factsPanel?.classList.add("hide");
  });

  document.getElementById("btnViewIngredients")?.addEventListener("click", () => {
    tabIng?.click();
  });
}

/* ---------------- Full nutrition library ---------------- */

const NUTRITION_LIBRARY = {
  "brit-chicken-burger": {
    id: "brit-chicken-burger",
    name: "Chicken Burger",
    image: "brit-chicken-burger.png",
    price: 240,
    category: "main",
    tags: ["nonveg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Burger bun", "Chicken patty", "Lettuce", "Tomato", "Mayonnaise", "Cheese", "Seasoning"],
    nutrition: { serving: "1 burger", calories: 520, fat: 24, satFat: 8, cholesterol: 65, sodium: 880, carbs: 46, fiber: 3, sugar: 6, protein: 28 }
  },
  "brit-club-sandwich": {
    id: "brit-club-sandwich",
    name: "Club Sandwich",
    image: "brit-club-sandwich.png",
    price: 210,
    category: "snacks",
    tags: ["nonveg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Bread", "Chicken", "Egg", "Lettuce", "Tomato", "Mayonnaise", "Cheese"],
    nutrition: { serving: "1 sandwich", calories: 410, fat: 17, satFat: 5, cholesterol: 48, sodium: 720, carbs: 38, fiber: 3, sugar: 5, protein: 24 }
  },
  "brit-french-fries": {
    id: "brit-french-fries",
    name: "French Fries",
    image: "brit-french-fries.png",
    price: 150,
    category: "snacks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Potato", "Vegetable oil", "Salt", "Herb seasoning"],
    nutrition: { serving: "1 medium portion", calories: 300, fat: 15, satFat: 2, cholesterol: 0, sodium: 360, carbs: 39, fiber: 4, sugar: 1, protein: 4 }
  },
  "brit-iced-tea": {
    id: "brit-iced-tea",
    name: "Iced Tea",
    image: "brit-iced-tea.png",
    price: 95,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Black tea", "Water", "Sugar syrup", "Ice", "Lemon"],
    nutrition: { serving: "1 glass", calories: 48, fat: 0, satFat: 0, cholesterol: 0, sodium: 8, carbs: 12, fiber: 0, sugar: 11, protein: 0 }
  },
  "brit-oreo-shake": {
    id: "brit-oreo-shake",
    name: "Oreo Shake",
    image: "brit-oreo-shake.png",
    price: 165,
    category: "dessert",
    tags: ["veg"],
    allergens: ["dairy", "gluten"],
    ingredients: ["Milk", "Ice cream", "Oreo cookies", "Sugar syrup", "Ice"],
    nutrition: { serving: "1 glass", calories: 360, fat: 14, satFat: 8, cholesterol: 40, sodium: 210, carbs: 49, fiber: 1, sugar: 37, protein: 7 }
  },
  "brit-red-sauce-pasta": {
    id: "brit-red-sauce-pasta",
    name: "Red Sauce Pasta",
    image: "brit-red-sauce-pasta.png",
    price: 215,
    category: "main",
    tags: ["veg"],
    allergens: ["gluten"],
    ingredients: ["Pasta", "Tomato sauce", "Garlic", "Olive oil", "Onion", "Bell pepper", "Italian herbs"],
    nutrition: { serving: "1 plate", calories: 430, fat: 12, satFat: 2, cholesterol: 0, sodium: 640, carbs: 67, fiber: 5, sugar: 8, protein: 12 }
  },
  "brit-veg-burger": {
    id: "brit-veg-burger",
    name: "Veg Burger",
    image: "brit-veg-burger.png",
    price: 195,
    category: "main",
    tags: ["veg"],
    allergens: ["gluten"],
    ingredients: ["Burger bun", "Veg patty", "Lettuce", "Tomato", "Onion", "Sauce"],
    nutrition: { serving: "1 burger", calories: 370, fat: 13, satFat: 2, cholesterol: 0, sodium: 620, carbs: 51, fiber: 5, sugar: 6, protein: 10 }
  },
  "brit-white-sauce-pasta": {
    id: "brit-white-sauce-pasta",
    name: "White Sauce Pasta",
    image: "brit-white-sauce-pasta.png",
    price: 230,
    category: "main",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Pasta", "Milk", "Butter", "Cheese", "Garlic", "Black pepper", "Herbs"],
    nutrition: { serving: "1 plate", calories: 490, fat: 21, satFat: 11, cholesterol: 48, sodium: 710, carbs: 61, fiber: 3, sugar: 6, protein: 15 }
  },

  "canteen-chicken-chowmein": {
    id: "canteen-chicken-chowmein",
    name: "Chicken Chowmein",
    image: "canteen-chicken-chowmein.png",
    price: 210,
    category: "main",
    tags: ["nonveg"],
    allergens: ["gluten", "soy"],
    ingredients: ["Noodles", "Chicken", "Cabbage", "Carrot", "Onion", "Soy sauce", "Oil", "Garlic"],
    nutrition: { serving: "1 plate", calories: 470, fat: 16, satFat: 3, cholesterol: 52, sodium: 930, carbs: 56, fiber: 4, sugar: 5, protein: 22 }
  },
  "canteen-chicken-curry-set": {
    id: "canteen-chicken-curry-set",
    name: "Chicken Curry Set",
    image: "canteen-chicken-curry-set.png",
    price: 260,
    category: "main",
    tags: ["nonveg"],
    allergens: ["dairy"],
    ingredients: ["Rice", "Chicken curry", "Spices", "Oil", "Dal", "Pickle", "Vegetable side"],
    nutrition: { serving: "1 set", calories: 560, fat: 22, satFat: 6, cholesterol: 70, sodium: 920, carbs: 59, fiber: 5, sugar: 4, protein: 29 }
  },
  "canteen-chicken-momo": {
    id: "canteen-chicken-momo",
    name: "Chicken Momo",
    image: "canteen-chicken-momo.png",
    price: 180,
    category: "snacks",
    tags: ["nonveg"],
    allergens: ["gluten"],
    ingredients: ["Flour wrapper", "Chicken mince", "Onion", "Ginger", "Garlic", "Spices", "Momo achar"],
    nutrition: { serving: "1 plate", calories: 340, fat: 10, satFat: 2, cholesterol: 35, sodium: 610, carbs: 41, fiber: 2, sugar: 3, protein: 19 }
  },
  "canteen-veg-chowmein": {
    id: "canteen-veg-chowmein",
    name: "Veg Chowmein",
    image: "canteen-veg-chowmein.png",
    price: 170,
    category: "main",
    tags: ["veg"],
    allergens: ["gluten", "soy"],
    ingredients: ["Noodles", "Cabbage", "Carrot", "Capsicum", "Onion", "Soy sauce", "Oil", "Garlic"],
    nutrition: { serving: "1 plate", calories: 390, fat: 12, satFat: 2, cholesterol: 0, sodium: 860, carbs: 58, fiber: 5, sugar: 6, protein: 10 }
  },
  "canteen-veg-friedrice": {
    id: "canteen-veg-friedrice",
    name: "Veg Fried Rice",
    image: "canteen-veg-friedrice.png",
    price: 175,
    category: "main",
    tags: ["veg"],
    allergens: ["soy"],
    ingredients: ["Rice", "Mixed vegetables", "Soy sauce", "Oil", "Spring onion", "Garlic"],
    nutrition: { serving: "1 plate", calories: 380, fat: 11, satFat: 2, cholesterol: 0, sodium: 690, carbs: 61, fiber: 4, sugar: 4, protein: 8 }
  },
  "canteen-veg-momo": {
    id: "canteen-veg-momo",
    name: "Veg Momo",
    image: "canteen-veg-momo.png",
    price: 160,
    category: "snacks",
    tags: ["veg"],
    allergens: ["gluten"],
    ingredients: ["Flour wrapper", "Cabbage", "Carrot", "Onion", "Garlic", "Spices", "Achar"],
    nutrition: { serving: "1 plate", calories: 295, fat: 8, satFat: 1, cholesterol: 0, sodium: 520, carbs: 45, fiber: 3, sugar: 3, protein: 8 }
  },

  "coffee-banana-muffin": {
    id: "coffee-banana-muffin",
    name: "Banana Muffin",
    image: "coffee-banana-muffin.png",
    price: 110,
    category: "dessert",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Flour", "Banana", "Milk", "Egg", "Butter", "Sugar", "Baking powder"],
    nutrition: { serving: "1 muffin", calories: 280, fat: 10, satFat: 4, cholesterol: 30, sodium: 240, carbs: 42, fiber: 2, sugar: 21, protein: 5 }
  },
  "coffee-black-coffee": {
    id: "coffee-black-coffee",
    name: "Black Coffee",
    image: "coffee-black-coffee.png",
    price: 85,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Coffee", "Water"],
    nutrition: { serving: "1 cup", calories: 8, fat: 0, satFat: 0, cholesterol: 0, sodium: 5, carbs: 1, fiber: 0, sugar: 0, protein: 0 }
  },
  "coffee-cappuccino": {
    id: "coffee-cappuccino",
    name: "Cappuccino",
    image: "coffee-cappuccino.png",
    price: 125,
    category: "drinks",
    tags: ["veg"],
    allergens: ["dairy"],
    ingredients: ["Espresso", "Steamed milk", "Milk foam"],
    nutrition: { serving: "1 cup", calories: 110, fat: 4, satFat: 2, cholesterol: 18, sodium: 95, carbs: 10, fiber: 0, sugar: 9, protein: 7 }
  },
  "coffee-cheese-sandwich": {
    id: "coffee-cheese-sandwich",
    name: "Cheese Sandwich",
    image: "coffee-cheese-sandwich.png",
    price: 145,
    category: "snacks",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Bread", "Cheese", "Butter", "Tomato", "Herbs"],
    nutrition: { serving: "1 sandwich", calories: 290, fat: 13, satFat: 7, cholesterol: 26, sodium: 470, carbs: 30, fiber: 2, sugar: 4, protein: 11 }
  },
  "coffee-cookie": {
    id: "coffee-cookie",
    name: "Cookie",
    image: "coffee-cookie.png",
    price: 75,
    category: "dessert",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Flour", "Butter", "Sugar", "Chocolate chips", "Egg"],
    nutrition: { serving: "1 cookie", calories: 150, fat: 7, satFat: 4, cholesterol: 16, sodium: 95, carbs: 20, fiber: 1, sugar: 12, protein: 2 }
  },
  "coffee-croissant": {
    id: "coffee-croissant",
    name: "Croissant",
    image: "coffee-croissant.png",
    price: 95,
    category: "dessert",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Flour", "Butter", "Yeast", "Milk", "Salt", "Sugar"],
    nutrition: { serving: "1 piece", calories: 230, fat: 12, satFat: 7, cholesterol: 28, sodium: 210, carbs: 26, fiber: 1, sugar: 5, protein: 5 }
  },
  "coffee-espresso": {
    id: "coffee-espresso",
    name: "Espresso",
    image: "coffee-espresso.png",
    price: 80,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Coffee", "Water"],
    nutrition: { serving: "1 shot", calories: 6, fat: 0, satFat: 0, cholesterol: 0, sodium: 4, carbs: 1, fiber: 0, sugar: 0, protein: 0 }
  },
  "coffee-green-tea": {
    id: "coffee-green-tea",
    name: "Green Tea",
    image: "coffee-green-tea.png",
    price: 70,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Green tea leaves", "Water"],
    nutrition: { serving: "1 cup", calories: 4, fat: 0, satFat: 0, cholesterol: 0, sodium: 2, carbs: 1, fiber: 0, sugar: 0, protein: 0 }
  },
  "coffee-iced-americano": {
    id: "coffee-iced-americano",
    name: "Iced Americano",
    image: "coffee-iced-americano.png",
    price: 115,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Espresso", "Water", "Ice"],
    nutrition: { serving: "1 glass", calories: 10, fat: 0, satFat: 0, cholesterol: 0, sodium: 5, carbs: 2, fiber: 0, sugar: 0, protein: 0 }
  },
  "coffee-latte": {
    id: "coffee-latte",
    name: "Latte",
    image: "coffee-latte.png",
    price: 130,
    category: "drinks",
    tags: ["veg"],
    allergens: ["dairy"],
    ingredients: ["Espresso", "Milk", "Milk foam"],
    nutrition: { serving: "1 cup", calories: 140, fat: 6, satFat: 3, cholesterol: 22, sodium: 120, carbs: 13, fiber: 0, sugar: 12, protein: 8 }
  },
  "coffee-lemon-tea": {
    id: "coffee-lemon-tea",
    name: "Lemon Tea",
    image: "coffee-lemon-tea.png",
    price: 75,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Tea", "Water", "Lemon", "Sugar"],
    nutrition: { serving: "1 cup", calories: 18, fat: 0, satFat: 0, cholesterol: 0, sodium: 5, carbs: 4, fiber: 0, sugar: 4, protein: 0 }
  },
  "coffee-mocha": {
    id: "coffee-mocha",
    name: "Mocha",
    image: "coffee-mocha.png",
    price: 135,
    category: "drinks",
    tags: ["veg"],
    allergens: ["dairy"],
    ingredients: ["Espresso", "Milk", "Chocolate syrup", "Milk foam"],
    nutrition: { serving: "1 cup", calories: 165, fat: 6, satFat: 3, cholesterol: 20, sodium: 130, carbs: 20, fiber: 1, sugar: 18, protein: 7 }
  },

  "kumari-blueberry-muffin": {
    id: "kumari-blueberry-muffin",
    name: "Blueberry Muffin",
    image: "kumari-blueberry-muffin.png",
    price: 115,
    category: "dessert",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Flour", "Blueberries", "Milk", "Butter", "Egg", "Sugar"],
    nutrition: { serving: "1 muffin", calories: 270, fat: 9, satFat: 4, cholesterol: 28, sodium: 230, carbs: 41, fiber: 2, sugar: 20, protein: 5 }
  },
  "kumari-brownie": {
    id: "kumari-brownie",
    name: "Brownie",
    image: "kumari-brownie.png",
    price: 105,
    category: "dessert",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Chocolate", "Flour", "Butter", "Egg", "Sugar", "Cocoa"],
    nutrition: { serving: "1 brownie", calories: 240, fat: 11, satFat: 6, cholesterol: 32, sodium: 140, carbs: 32, fiber: 2, sugar: 22, protein: 3 }
  },
  "kumari-cheese-toast": {
    id: "kumari-cheese-toast",
    name: "Cheese Toast",
    image: "kumari-cheese-toast.png",
    price: 125,
    category: "snacks",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Bread", "Cheese", "Butter", "Herbs"],
    nutrition: { serving: "1 portion", calories: 260, fat: 12, satFat: 7, cholesterol: 24, sodium: 410, carbs: 26, fiber: 1, sugar: 3, protein: 10 }
  },
  "kumari-chicken-sandwich": {
    id: "kumari-chicken-sandwich",
    name: "Chicken Sandwich",
    image: "kumari-chicken-sandwich.png",
    price: 170,
    category: "snacks",
    tags: ["nonveg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Bread", "Chicken", "Mayonnaise", "Lettuce", "Tomato", "Seasoning"],
    nutrition: { serving: "1 sandwich", calories: 320, fat: 12, satFat: 3, cholesterol: 42, sodium: 520, carbs: 31, fiber: 2, sugar: 4, protein: 19 }
  },
  "kumari-chocolate-donut": {
    id: "kumari-chocolate-donut",
    name: "Chocolate Donut",
    image: "kumari-chocolate-donut.png",
    price: 95,
    category: "dessert",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Flour", "Chocolate glaze", "Milk", "Sugar", "Yeast", "Butter"],
    nutrition: { serving: "1 donut", calories: 250, fat: 12, satFat: 5, cholesterol: 18, sodium: 220, carbs: 32, fiber: 1, sugar: 15, protein: 4 }
  },
  "kumari-chocolate-milkshake": {
    id: "kumari-chocolate-milkshake",
    name: "Chocolate Milkshake",
    image: "kumari-chocolate-milkshake.png",
    price: 165,
    category: "drinks",
    tags: ["veg"],
    allergens: ["dairy"],
    ingredients: ["Milk", "Chocolate syrup", "Ice cream", "Ice"],
    nutrition: { serving: "1 glass", calories: 350, fat: 14, satFat: 8, cholesterol: 42, sodium: 210, carbs: 46, fiber: 1, sugar: 38, protein: 8 }
  },
  "kumari-fruit-pastry": {
    id: "kumari-fruit-pastry",
    name: "Fruit Pastry",
    image: "kumari-fruit-pastry.png",
    price: 120,
    category: "dessert",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Flour", "Cream", "Seasonal fruits", "Sugar", "Butter"],
    nutrition: { serving: "1 pastry", calories: 210, fat: 9, satFat: 5, cholesterol: 22, sodium: 120, carbs: 29, fiber: 1, sugar: 18, protein: 3 }
  },
  "kumari-garlic-bread": {
    id: "kumari-garlic-bread",
    name: "Garlic Bread",
    image: "kumari-garlic-bread.png",
    price: 110,
    category: "snacks",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Bread", "Butter", "Garlic", "Parsley", "Herbs"],
    nutrition: { serving: "1 portion", calories: 220, fat: 9, satFat: 5, cholesterol: 20, sodium: 310, carbs: 29, fiber: 1, sugar: 2, protein: 5 }
  },
  "kumari-popcorn": {
    id: "kumari-popcorn",
    name: "Popcorn",
    image: "kumari-popcorn.png",
    price: 80,
    category: "snacks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Corn kernels", "Oil", "Salt"],
    nutrition: { serving: "1 box", calories: 140, fat: 6, satFat: 1, cholesterol: 0, sodium: 210, carbs: 19, fiber: 3, sugar: 0, protein: 3 }
  },
  "kumari-strawberry-milkshake": {
    id: "kumari-strawberry-milkshake",
    name: "Strawberry Milkshake",
    image: "kumari-strawberry-milkshake.png",
    price: 160,
    category: "drinks",
    tags: ["veg"],
    allergens: ["dairy"],
    ingredients: ["Milk", "Strawberry syrup", "Ice cream", "Ice"],
    nutrition: { serving: "1 glass", calories: 330, fat: 13, satFat: 7, cholesterol: 40, sodium: 190, carbs: 45, fiber: 1, sugar: 36, protein: 8 }
  },
  "kumari-veg-sandwich": {
    id: "kumari-veg-sandwich",
    name: "Veg Sandwich",
    image: "kumari-veg-sandwich.png",
    price: 145,
    category: "snacks",
    tags: ["veg"],
    allergens: ["gluten"],
    ingredients: ["Bread", "Cucumber", "Tomato", "Lettuce", "Sauce", "Herbs"],
    nutrition: { serving: "1 sandwich", calories: 270, fat: 9, satFat: 1, cholesterol: 0, sodium: 430, carbs: 39, fiber: 4, sugar: 5, protein: 7 }
  },

  "shared-buddha-bowl": {
    id: "shared-buddha-bowl",
    name: "Vegan Buddha Bowl",
    image: "vegan-buddha-bowl.png",
    price: 220,
    category: "healthy",
    tags: ["vegan"],
    allergens: ["nuts"],
    ingredients: ["Brown rice", "Chickpeas", "Avocado", "Carrot", "Cucumber", "Lettuce", "Seeds", "Lemon dressing"],
    nutrition: { serving: "1 bowl", calories: 430, fat: 16, satFat: 2, cholesterol: 0, sodium: 320, carbs: 55, fiber: 10, sugar: 6, protein: 14 }
  },
  "shared-detox-salad": {
    id: "shared-detox-salad",
    name: "Green Detox Salad",
    image: "green-detox-salad.png",
    price: 180,
    category: "healthy",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Lettuce", "Cucumber", "Spinach", "Broccoli", "Apple", "Lemon dressing"],
    nutrition: { serving: "1 bowl", calories: 220, fat: 8, satFat: 1, cholesterol: 0, sodium: 170, carbs: 26, fiber: 7, sugar: 9, protein: 5 }
  },
  "shared-orange-juice": {
    id: "shared-orange-juice",
    name: "Fresh Orange Juice",
    image: "fresh-orange-juice.png",
    price: 120,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Fresh oranges"],
    nutrition: { serving: "1 glass", calories: 140, fat: 0, satFat: 0, cholesterol: 0, sodium: 5, carbs: 32, fiber: 1, sugar: 26, protein: 2 }
  },
  "shared-chowmein": {
    id: "shared-chowmein",
    name: "Food Chowmein",
    image: "food-chowmein.png",
    price: 170,
    category: "main",
    tags: ["veg"],
    allergens: ["gluten", "soy"],
    ingredients: ["Noodles", "Cabbage", "Carrot", "Onion", "Soy sauce", "Oil"],
    nutrition: { serving: "1 plate", calories: 390, fat: 12, satFat: 2, cholesterol: 0, sodium: 790, carbs: 58, fiber: 4, sugar: 5, protein: 10 }
  },
  "shared-curry": {
    id: "shared-curry",
    name: "Food Curry",
    image: "food-curry.png",
    price: 190,
    category: "main",
    tags: ["nonveg"],
    allergens: ["dairy"],
    ingredients: ["Chicken", "Tomato", "Onion", "Spices", "Oil", "Cream"],
    nutrition: { serving: "1 bowl", calories: 460, fat: 24, satFat: 7, cholesterol: 68, sodium: 740, carbs: 18, fiber: 3, sugar: 5, protein: 31 }
  },
  "shared-friedrice": {
    id: "shared-friedrice",
    name: "Food Fried Rice",
    image: "food-friedrice.png",
    price: 175,
    category: "main",
    tags: ["veg"],
    allergens: ["soy"],
    ingredients: ["Rice", "Vegetables", "Soy sauce", "Oil", "Spring onion"],
    nutrition: { serving: "1 plate", calories: 380, fat: 11, satFat: 2, cholesterol: 0, sodium: 680, carbs: 61, fiber: 4, sugar: 4, protein: 8 }
  },
  "shared-pasta": {
    id: "shared-pasta",
    name: "Food Pasta",
    image: "food-pasta.png",
    price: 210,
    category: "main",
    tags: ["veg"],
    allergens: ["gluten", "dairy"],
    ingredients: ["Pasta", "Sauce", "Cheese", "Garlic", "Herbs"],
    nutrition: { serving: "1 plate", calories: 450, fat: 17, satFat: 6, cholesterol: 26, sodium: 700, carbs: 60, fiber: 4, sugar: 7, protein: 14 }
  },
  "shared-thakali": {
    id: "shared-thakali",
    name: "Food Thakali",
    image: "food-thakali.png",
    price: 245,
    category: "main",
    tags: ["nonveg"],
    allergens: [],
    ingredients: ["Rice", "Dal", "Chicken curry", "Vegetable curry", "Pickle", "Salad"],
    nutrition: { serving: "1 set", calories: 520, fat: 18, satFat: 4, cholesterol: 58, sodium: 860, carbs: 63, fiber: 7, sugar: 5, protein: 26 }
  },
  "shared-cold-coffee": {
    id: "shared-cold-coffee",
    name: "Cold Coffee",
    image: "cold-coffee.png",
    price: 130,
    category: "drinks",
    tags: ["veg"],
    allergens: ["dairy"],
    ingredients: ["Coffee", "Milk", "Sugar", "Ice"],
    nutrition: { serving: "1 glass", calories: 160, fat: 5, satFat: 3, cholesterol: 16, sodium: 90, carbs: 24, fiber: 0, sugar: 21, protein: 5 }
  },
  "shared-lemon-mint": {
    id: "shared-lemon-mint",
    name: "Lemon Mint Drink",
    image: "lemon-mint-drink.png",
    price: 110,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Lemon", "Mint", "Water", "Sugar", "Ice"],
    nutrition: { serving: "1 glass", calories: 70, fat: 0, satFat: 0, cholesterol: 0, sodium: 4, carbs: 18, fiber: 0, sugar: 16, protein: 0 }
  },
  "shared-iced-lemon-tea": {
    id: "shared-iced-lemon-tea",
    name: "Iced Lemon Tea",
    image: "IcedLemonTea.png",
    price: 105,
    category: "drinks",
    tags: ["vegan"],
    allergens: [],
    ingredients: ["Tea", "Lemon", "Water", "Sugar", "Ice"],
    nutrition: { serving: "1 glass", calories: 55, fat: 0, satFat: 0, cholesterol: 0, sodium: 4, carbs: 14, fiber: 0, sugar: 12, protein: 0 }
  }
};

async function initNutritionPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const name = params.get("name");
  const selectedFood = getSelectedFood();

  const resolvedId =
    id ||
    selectedFood?.id ||
    selectedFood?._id ||
    selectedFood?.menuItemId ||
    "";

  const resolvedName =
    name ||
    selectedFood?.name ||
    "";

  if (!resolvedId && !resolvedName) {
    showError("Missing item id. Go back to Menu and click Nutrition again.");
    return;
  }

  try {
    setStatus("Loading nutrition...");

    let item = null;

    item = findItemInLibrary(resolvedId, resolvedName);

    if (!item) {
      item = findItemInLocalMenu(resolvedId, resolvedName);
    }

    if (!item && resolvedId) {
      item = await fetchItemFromApi(resolvedId);
    }

    if (!item && resolvedName) {
      item = findItemInLibrary("", resolvedName);
    }

    if (!item && selectedFood) {
      item = normalizeMenuItem(selectedFood);
    }

    if (!item) {
      showError("Nutrition item not found.");
      return;
    }

    renderNutrition(item);
  } catch (e) {
    console.error("nutrition load error:", e);
    showError("Failed to load nutrition. Please try again.");
  }
}

function getSelectedFood() {
  try {
    return JSON.parse(localStorage.getItem("selectedFood") || "null");
  } catch {
    return null;
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

function getKeyVariants(id, name) {
  const list = [];
  if (id) list.push(String(id));
  if (name) list.push(String(name));

  return list
    .map(x => x.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeMenuItem(item) {
  if (!item || typeof item !== "object") return null;

  const lib = findItemInLibrary(
    item.id || item._id || item.menuItemId,
    item.name
  ) || {};

  return {
    ...lib,
    ...item,
    id: item.id || item._id || item.menuItemId || lib.id || item.name,
    name: item.name || lib.name || "Menu Item",
    image: item.image || lib.image || "food-momo.png",
    price: num(item.price ?? lib.price),
    category: item.category || lib.category || "Food",
    tags: Array.isArray(item.tags) && item.tags.length
      ? item.tags
      : (lib.tags || dietToTags(item.diet)),
    allergens: Array.isArray(item.allergens) && item.allergens.length
      ? item.allergens
      : (lib.allergens || []),
    ingredients: Array.isArray(item.ingredients) && item.ingredients.length
      ? item.ingredients
      : (lib.ingredients || []),
    nutrition: {
      ...(lib.nutrition || {}),
      ...(item.nutrition || {})
    },
    isSpecial: Boolean(item.isSpecial ?? lib.isSpecial)
  };
}

function dietToTags(diet) {
  const d = String(diet || "").toLowerCase();
  if (d === "vegan") return ["vegan"];
  if (d === "veg") return ["veg"];
  if (d === "non-veg" || d === "nonveg") return ["nonveg"];
  return [];
}

function findItemInLocalMenu(id, name) {
  const keys = getKeyVariants(id, name);
  const items = getMenuItems();

  const found = items.find((x) => {
    const itemKeys = [
      String(x.id || "").trim().toLowerCase(),
      String(x._id || "").trim().toLowerCase(),
      String(x.menuItemId || "").trim().toLowerCase(),
      String(x.name || "").trim().toLowerCase()
    ].filter(Boolean);

    return keys.some(k => itemKeys.includes(k));
  });

  return found ? normalizeMenuItem(found) : null;
}

function findItemInLibrary(id, name) {
  const keys = getKeyVariants(id, name);

  for (const [libKey, value] of Object.entries(NUTRITION_LIBRARY)) {
    const compareKeys = [
      String(libKey).trim().toLowerCase(),
      String(value.id || "").trim().toLowerCase(),
      String(value.name || "").trim().toLowerCase()
    ].filter(Boolean);

    if (keys.some(k => compareKeys.includes(k))) {
      return { ...value };
    }
  }

  return null;
}

async function fetchItemFromApi(id) {
  const urls = [
    `${API_BASE}/api/menu/${encodeURIComponent(id)}`,
    `${API_BASE}/api/menu?id=${encodeURIComponent(id)}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();

      if (Array.isArray(data)) {
        const found = data.find((x) => {
          return String(x._id || x.id || x.menuItemId || "").trim() === String(id).trim();
        });
        if (found) return normalizeMenuItem(found);
      }

      if (data && typeof data === "object") {
        if (String(data._id || data.id || data.menuItemId || "").trim() === String(id).trim()) {
          return normalizeMenuItem(data);
        }
        if (data.item && String(data.item._id || data.item.id || data.item.menuItemId || "").trim() === String(id).trim()) {
          return normalizeMenuItem(data.item);
        }
      }
    } catch (_) {}
  }

  return null;
}

function setStatus(text) {
  const el = document.getElementById("statusText");
  if (el) el.textContent = text || "";
}

function showError(msg) {
  const page = document.getElementById("nutritionPage");
  const status = document.getElementById("statusCard");
  if (page) page.style.display = "none";
  if (status) status.style.display = "block";
  setStatus(msg);
}

function cleanImageName(image) {
  const img = String(image || "").trim().replace(/\\/g, "/");

  if (!img) return "food-momo.png";

  if (/^https?:\/\//i.test(img)) {
    const last = img.split("/").pop() || "food-momo.png";
    return decodeURIComponent(last.split("?")[0]);
  }

  if (img.startsWith("/assets/")) return decodeURIComponent(img.replace("/assets/", ""));
  if (img.startsWith("assets/")) return decodeURIComponent(img.replace("assets/", ""));

  return decodeURIComponent(img.split("/").pop() || "food-momo.png");
}

function normalizeImageSrc(image) {
  return `${API_BASE}/assets/${encodeURIComponent(cleanImageName(image))}`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bestDiet(item) {
  const tags = Array.isArray(item.tags)
    ? item.tags.map(x => String(x).toLowerCase())
    : [];

  if (tags.includes("vegan")) return "Vegan";
  if (tags.includes("veg") || tags.includes("vegetarian")) return "Veg";
  if (tags.includes("nonveg") || tags.includes("non-veg")) return "Non-Veg";
  return "Standard";
}

const DV = {
  fat: 78,
  satFat: 20,
  carbs: 275,
  fiber: 28,
  protein: 50,
  sodium: 2300,
  cholesterol: 300,
  sugar: 50
};

function dvPct(value, dv) {
  const v = Number(value || 0);
  if (!dv || dv <= 0) return "";
  return `${Math.round((v / dv) * 100)}%`;
}

function row(label, value, dvText, dvPctText) {
  return { label, value, dvText: dvText || "", dvPct: dvPctText || "" };
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderNutrition(item) {
  const nutritionPage = document.getElementById("nutritionPage");
  const statusCard = document.getElementById("statusCard");

  if (statusCard) statusCard.style.display = "none";
  if (nutritionPage) nutritionPage.style.display = "grid";

  const itemName = item.name || "Menu Item";
  const diet = bestDiet(item);
  const imgSrc = normalizeImageSrc(item.image);

  const n = item.nutrition || {};

  const kcal = num(n.calories);
  const serving = String(n.serving || "1 serving").trim();

  const fat = num(n.fat);
  const carbs = num(n.carbs);
  const protein = num(n.protein);

  const satFat = n.satFat != null ? num(n.satFat) : null;
  const cholesterol = n.cholesterol != null ? num(n.cholesterol) : null;
  const sodium = n.sodium != null ? num(n.sodium) : null;
  const fiber = n.fiber != null ? num(n.fiber) : null;
  const sugar = n.sugar != null ? num(n.sugar) : null;

  setText("foodName", itemName);
  setText("foodMeta", `${kcal} kcal per serving`);
  setText("foodCategory", item.category || "Food");
  setText("dietBadge", diet);
  setText("priceBadge", `Rs ${num(item.price)}`);

  const foodImg = document.getElementById("foodImg");
  if (foodImg) {
    foodImg.src = imgSrc;
    foodImg.onerror = () => {
      foodImg.src = `${API_BASE}/assets/food-momo.png`;
    };
  }

  setText("servingText", `Serving Size: ${serving}`);
  setText("servingText2", `Serving Size: ${serving}`);
  setText("kcalBig", String(kcal));

  const rows = [
    row("Calories", `${kcal} kcal`, "", ""),
    row("Total Fat", fat ? `${fat}g` : "—", `${DV.fat}g`, dvPct(fat, DV.fat)),
    row("Saturated Fat", satFat == null ? "—" : `${satFat}g`, `${DV.satFat}g`, satFat == null ? "" : dvPct(satFat, DV.satFat)),
    row("Cholesterol", cholesterol == null ? "—" : `${cholesterol}mg`, `${DV.cholesterol}mg`, cholesterol == null ? "" : dvPct(cholesterol, DV.cholesterol)),
    row("Sodium", sodium == null ? "—" : `${sodium}mg`, `${DV.sodium}mg`, sodium == null ? "" : dvPct(sodium, DV.sodium)),
    row("Total Carbohydrates", carbs ? `${carbs}g` : "—", `${DV.carbs}g`, dvPct(carbs, DV.carbs)),
    row("Dietary Fiber", fiber == null ? "—" : `${fiber}g`, `${DV.fiber}g`, fiber == null ? "" : dvPct(fiber, DV.fiber)),
    row("Total Sugars", sugar == null ? "—" : `${sugar}g`, `${DV.sugar}g`, sugar == null ? "" : dvPct(sugar, DV.sugar)),
    row("Protein", protein ? `${protein}g` : "—", `${DV.protein}g`, dvPct(protein, DV.protein))
  ];

  const factsRows = document.getElementById("factsRows");
  if (factsRows) {
    factsRows.innerHTML = rows.map((r) => `
      <div class="r">
        <div>${escapeHtml(r.label)} <span class="muted">${escapeHtml(r.value)}</span></div>
        <div class="right muted">${escapeHtml(r.dvText)}</div>
        <div class="right">${escapeHtml(r.dvPct)}</div>
      </div>
    `).join("");
  }

  const ing = Array.isArray(item.ingredients) ? item.ingredients : [];
  const ingList = document.getElementById("ingList");
  if (ingList) {
    ingList.innerHTML = (ing.length ? ing : ["Ingredients not provided"])
      .map((x) => `<li>${escapeHtml(x)}</li>`)
      .join("");
  }

  const allergens = Array.isArray(item.allergens) && item.allergens.length
    ? item.allergens.join(", ")
    : "No major allergens listed";
  setText("allergensText", allergens);

  const notes = [];
  notes.push(`Approx. ${kcal} kcal per serving.`);
  notes.push(`Diet type: ${diet}.`);
  if (item.isSpecial) notes.push("This item is marked as special.");
  notes.push("Nutrition values are shown for one serving.");
  notes.push("Ask cafeteria staff if you need detailed allergen guidance.");
  setText("notesText", notes.join(" "));

  const total = fat + carbs + protein;
  const pf = total ? Math.round((fat / total) * 100) : 0;
  const pc = total ? Math.round((carbs / total) * 100) : 0;
  const pp = Math.max(0, 100 - pf - pc);

  setDonut(pf, pc, pp);
  renderLegend(pf, pc, pp);
}

function setDonut(fatPct, carbPct, protPct) {
  const r = 38;
  const c = 2 * Math.PI * r;

  const segFat = document.getElementById("segFat");
  const segCarb = document.getElementById("segCarb");
  const segProt = document.getElementById("segProt");
  if (!segFat || !segCarb || !segProt) return;

  const fatLen = (fatPct / 100) * c;
  const carbLen = (carbPct / 100) * c;
  const protLen = (protPct / 100) * c;

  segFat.style.strokeDasharray = `${fatLen} ${c - fatLen}`;
  segFat.style.strokeDashoffset = "0";

  segCarb.style.strokeDasharray = `${carbLen} ${c - carbLen}`;
  segCarb.style.strokeDashoffset = `${-fatLen}`;

  segProt.style.strokeDasharray = `${protLen} ${c - protLen}`;
  segProt.style.strokeDashoffset = `${-(fatLen + carbLen)}`;
}

function renderLegend(fatPct, carbPct, protPct) {
  const legend = document.getElementById("macroLegend");
  if (!legend) return;

  legend.innerHTML = `
    <div class="legendRow">
      <div class="legendLeft"><span class="dot" style="background: var(--fat)"></span> ${fatPct}% Fats</div>
      <div class="legendRight">${fatPct}%</div>
    </div>
    <div class="legendRow">
      <div class="legendLeft"><span class="dot" style="background: var(--carb)"></span> ${carbPct}% Carbs</div>
      <div class="legendRight">${carbPct}%</div>
    </div>
    <div class="legendRow">
      <div class="legendLeft"><span class="dot" style="background: var(--prot)"></span> ${protPct}% Protein</div>
      <div class="legendRight">${protPct}%</div>
    </div>
  `;
}