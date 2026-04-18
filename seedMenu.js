import dotenv from "dotenv";
import mongoose from "mongoose";
import MenuItem from "./models/MenuItem.js";

dotenv.config();

function normalizeImage(name) {
  const s = String(name || "").trim();
  if (!s) return s;
  return s
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

function lowerList(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean);
}

function withNutritionDefaults(item) {
  const n = item.nutrition || {};
  const calories = Number(n.calories ?? 0);
  const protein = Number(n.protein ?? 0);
  const carbs = Number(n.carbs ?? 0);
  const fat = Number(n.fat ?? 0);

  const satFat =
    n.satFat != null
      ? Number(n.satFat)
      : Math.max(0, Math.round(fat * 0.3 * 10) / 10);

  const fiber =
    n.fiber != null
      ? Number(n.fiber)
      : Math.max(0, Math.round(carbs * 0.12 * 10) / 10);

  const sugar =
    n.sugar != null
      ? Number(n.sugar)
      : Math.max(0, Math.round(carbs * 0.08 * 10) / 10);

  const sodium =
    n.sodium != null
      ? Number(n.sodium)
      : Math.max(0, Math.round(200 + calories * 0.6));

  const cholesterol =
    n.cholesterol != null
      ? Number(n.cholesterol)
      : lowerList(item.tags).includes("nonveg")
      ? 35
      : 0;

  return {
    ...item,
    tags: lowerList(item.tags),
    allergens: lowerList(item.allergens),
    ingredients: Array.isArray(item.ingredients)
      ? item.ingredients.map((x) => String(x).trim()).filter(Boolean)
      : [],
    image: normalizeImage(item.image),
    nutrition: {
      serving: n.serving ?? "1 serving",
      calories,
      protein,
      carbs,
      fat,
      satFat,
      fiber,
      sugar,
      sodium,
      cholesterol,
      proteinDV: Number(n.proteinDV ?? 0),
      carbsDV: Number(n.carbsDV ?? 0),
      fatDV: Number(n.fatDV ?? 0),
      sodiumDV: Number(n.sodiumDV ?? 0),
    },
  };
}

async function run() {
  console.log("✅ seedMenu started...");
  console.log("MONGO_URI =", process.env.MONGO_URI);

  if (!process.env.MONGO_URI) {
    console.log("❌ Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected for seed");

  await MenuItem.deleteMany({});

  const seed = [
    // =========================
    // BRITANNIA / BURGER STYLE
    // =========================
    {
      name: "Chicken Burger",
      price: 240,
      category: "Main",
      image: "brit-chicken-burger.png",
      tags: ["nonveg"],
      prepMinutes: 12,
      isSpecial: true,
      allergens: ["gluten", "dairy", "egg"],
      description: "Crispy chicken burger with lettuce, sauce, and soft toasted bun.",
      ingredients: ["Burger bun", "Chicken patty", "Lettuce", "Tomato", "Cheese", "Mayonnaise", "Sauce"],
      nutrition: { serving: "1 burger", calories: 520, protein: 28, carbs: 46, fat: 24 },
    },
    {
      name: "Veg Burger",
      price: 200,
      category: "Main",
      image: "brit-veg-burger.png",
      tags: ["veg"],
      prepMinutes: 10,
      isSpecial: false,
      allergens: ["gluten", "dairy"],
      description: "Fresh veg burger with crunchy vegetables and house sauce.",
      ingredients: ["Burger bun", "Veg patty", "Lettuce", "Tomato", "Cheese", "Sauce"],
      nutrition: { serving: "1 burger", calories: 420, protein: 14, carbs: 44, fat: 16 },
    },
    {
      name: "French Fries",
      price: 150,
      category: "Snacks",
      image: "brit-french-fries.png",
      tags: ["vegan"],
      prepMinutes: 8,
      isSpecial: false,
      allergens: [],
      description: "Golden crispy fries served hot with seasoning.",
      ingredients: ["Potato", "Vegetable oil", "Salt", "Seasoning"],
      nutrition: { serving: "1 medium portion", calories: 300, protein: 4, carbs: 39, fat: 15 },
    },
    {
      name: "Club Sandwich",
      price: 260,
      category: "Main",
      image: "brit-club-sandwich.png",
      tags: ["nonveg"],
      prepMinutes: 10,
      isSpecial: false,
      allergens: ["gluten", "egg", "dairy"],
      description: "Layered club sandwich with chicken, vegetables, and creamy spread.",
      ingredients: ["Bread", "Chicken", "Egg", "Lettuce", "Tomato", "Mayonnaise", "Cheese"],
      nutrition: { serving: "1 sandwich", calories: 470, protein: 24, carbs: 32, fat: 22 },
    },
    {
      name: "White Sauce Pasta",
      price: 250,
      category: "Main",
      image: "brit-white-sauce-pasta.png",
      tags: ["veg"],
      prepMinutes: 14,
      isSpecial: false,
      allergens: ["gluten", "dairy"],
      description: "Creamy white sauce pasta with vegetables and herbs.",
      ingredients: ["Pasta", "Milk", "Cream", "Butter", "Vegetables", "Cheese", "Herbs"],
      nutrition: { serving: "1 plate", calories: 520, protein: 13, carbs: 41, fat: 28 },
    },
    {
      name: "Red Sauce Pasta",
      price: 240,
      category: "Main",
      image: "brit-red-sauce-pasta.png",
      tags: ["veg"],
      prepMinutes: 14,
      isSpecial: false,
      allergens: ["gluten"],
      description: "Tangy tomato pasta cooked with herbs and vegetables.",
      ingredients: ["Pasta", "Tomato sauce", "Garlic", "Vegetables", "Herbs", "Salt"],
      nutrition: { serving: "1 plate", calories: 430, protein: 9, carbs: 40, fat: 14 },
    },
    {
      name: "Iced Tea",
      price: 140,
      category: "Drinks",
      image: "brit-iced-tea.png",
      tags: ["vegan"],
      prepMinutes: 3,
      isSpecial: false,
      allergens: [],
      description: "Refreshing iced tea served chilled.",
      ingredients: ["Tea", "Water", "Ice", "Sugar", "Lemon essence"],
      nutrition: { serving: "1 glass", calories: 90, protein: 0, carbs: 22, fat: 0 },
    },
    {
      name: "Oreo Shake",
      price: 190,
      category: "Drinks",
      image: "brit-oreo-shake.png",
      tags: ["veg"],
      prepMinutes: 4,
      isSpecial: true,
      allergens: ["dairy", "gluten"],
      description: "Creamy Oreo milkshake with rich chocolate cookie flavor.",
      ingredients: ["Milk", "Oreo biscuits", "Ice cream", "Sugar", "Ice"],
      nutrition: { serving: "1 glass", calories: 380, protein: 8, carbs: 46, fat: 18 },
    },

    // =========================
    // CANTEEN
    // =========================
    {
      name: "Chicken Chowmein",
      price: 230,
      category: "Main",
      image: "canteen-chicken-chowmein.png",
      tags: ["nonveg"],
      prepMinutes: 12,
      isSpecial: false,
      allergens: ["gluten", "soy"],
      description: "Stir-fried noodles with chicken and vegetables.",
      ingredients: ["Noodles", "Chicken", "Cabbage", "Carrot", "Onion", "Soy sauce", "Oil"],
      nutrition: { serving: "1 plate", calories: 510, protein: 21, carbs: 44, fat: 20 },
    },
    {
      name: "Veg Chowmein",
      price: 210,
      category: "Main",
      image: "canteen-veg-chowmein.png",
      tags: ["veg"],
      prepMinutes: 11,
      isSpecial: false,
      allergens: ["gluten", "soy"],
      description: "Vegetable chowmein with savory seasoning.",
      ingredients: ["Noodles", "Cabbage", "Carrot", "Onion", "Soy sauce", "Oil", "Garlic"],
      nutrition: { serving: "1 plate", calories: 430, protein: 8, carbs: 40, fat: 16 },
    },
    {
      name: "Chicken Momo",
      price: 220,
      category: "Snacks",
      image: "canteen-chicken-momo.png",
      tags: ["nonveg"],
      prepMinutes: 14,
      isSpecial: true,
      allergens: ["gluten"],
      description: "Steamed chicken momo served with spicy achar.",
      ingredients: ["Flour", "Chicken mince", "Onion", "Garlic", "Ginger", "Spices"],
      nutrition: { serving: "1 plate", calories: 330, protein: 14, carbs: 32, fat: 12 },
    },
    {
      name: "Veg Momo",
      price: 190,
      category: "Snacks",
      image: "canteen-veg-momo.png",
      tags: ["veg"],
      prepMinutes: 12,
      isSpecial: false,
      allergens: ["gluten"],
      description: "Soft steamed veg momo with flavorful filling.",
      ingredients: ["Flour", "Cabbage", "Carrot", "Onion", "Garlic", "Spices"],
      nutrition: { serving: "1 plate", calories: 260, protein: 7, carbs: 34, fat: 8 },
    },
    {
      name: "Veg Fried Rice",
      price: 220,
      category: "Main",
      image: "canteen-veg-friedrice.png",
      tags: ["veg"],
      prepMinutes: 12,
      isSpecial: false,
      allergens: ["soy"],
      description: "Wok-fried rice with vegetables and light seasoning.",
      ingredients: ["Rice", "Carrot", "Peas", "Spring onion", "Soy sauce", "Oil"],
      nutrition: { serving: "1 plate", calories: 410, protein: 7, carbs: 42, fat: 14 },
    },
    {
      name: "Chicken Curry Set",
      price: 280,
      category: "Main",
      image: "canteen-chicken-curry-set.png",
      tags: ["nonveg"],
      prepMinutes: 16,
      isSpecial: true,
      allergens: ["dairy"],
      description: "Chicken curry set served as a hearty full meal.",
      ingredients: ["Chicken", "Curry gravy", "Rice", "Spices", "Onion", "Garlic"],
      nutrition: { serving: "1 set", calories: 580, protein: 26, carbs: 52, fat: 28 },
    },

    // =========================
    // COFFEE STATION
    // =========================
    {
      name: "Black Coffee",
      price: 110,
      category: "Drinks",
      image: "coffee-black-coffee.png",
      tags: ["vegan"],
      prepMinutes: 3,
      isSpecial: false,
      allergens: [],
      description: "Strong black coffee with bold aroma.",
      ingredients: ["Coffee", "Hot water"],
      nutrition: { serving: "1 cup", calories: 5, protein: 0, carbs: 1, fat: 0 },
    },
    {
      name: "Cappuccino",
      price: 150,
      category: "Drinks",
      image: "coffee-cappuccino.png",
      tags: ["veg"],
      prepMinutes: 4,
      isSpecial: false,
      allergens: ["dairy"],
      description: "Creamy cappuccino with rich foam and coffee flavor.",
      ingredients: ["Espresso", "Milk", "Milk foam"],
      nutrition: { serving: "1 cup", calories: 120, protein: 6, carbs: 10, fat: 5 },
    },
    {
      name: "Espresso",
      price: 120,
      category: "Drinks",
      image: "coffee-espresso.png",
      tags: ["vegan"],
      prepMinutes: 3,
      isSpecial: false,
      allergens: [],
      description: "Rich concentrated espresso shot.",
      ingredients: ["Coffee", "Water"],
      nutrition: { serving: "1 cup", calories: 8, protein: 0, carbs: 1, fat: 0 },
    },
    {
      name: "Green Tea",
      price: 100,
      category: "Drinks",
      image: "coffee-green-tea.png",
      tags: ["vegan"],
      prepMinutes: 3,
      isSpecial: false,
      allergens: [],
      description: "Warm green tea with light and fresh taste.",
      ingredients: ["Green tea leaves", "Hot water"],
      nutrition: { serving: "1 cup", calories: 2, protein: 0, carbs: 0, fat: 0 },
    },
    {
      name: "Iced Americano",
      price: 140,
      category: "Drinks",
      image: "coffee-iced-americano.png",
      tags: ["vegan"],
      prepMinutes: 3,
      isSpecial: false,
      allergens: [],
      description: "Chilled americano with strong coffee taste.",
      ingredients: ["Espresso", "Water", "Ice"],
      nutrition: { serving: "1 glass", calories: 10, protein: 0, carbs: 2, fat: 0 },
    },
    {
      name: "Latte",
      price: 155,
      category: "Drinks",
      image: "coffee-latte.png",
      tags: ["veg"],
      prepMinutes: 4,
      isSpecial: false,
      allergens: ["dairy"],
      description: "Smooth latte with milk and espresso.",
      ingredients: ["Espresso", "Milk"],
      nutrition: { serving: "1 cup", calories: 150, protein: 7, carbs: 13, fat: 6 },
    },
    {
      name: "Lemon Tea",
      price: 120,
      category: "Drinks",
      image: "coffee-lemon-tea.png",
      tags: ["vegan"],
      prepMinutes: 3,
      isSpecial: false,
      allergens: [],
      description: "Light lemon tea with a clean citrus finish.",
      ingredients: ["Tea", "Lemon", "Water", "Sugar"],
      nutrition: { serving: "1 cup", calories: 45, protein: 0, carbs: 11, fat: 0 },
    },
    {
      name: "Mocha",
      price: 170,
      category: "Drinks",
      image: "coffee-mocha.png",
      tags: ["veg"],
      prepMinutes: 4,
      isSpecial: true,
      allergens: ["dairy"],
      description: "Chocolate coffee drink with rich creamy taste.",
      ingredients: ["Coffee", "Milk", "Chocolate syrup", "Foam"],
      nutrition: { serving: "1 cup", calories: 210, protein: 7, carbs: 24, fat: 8 },
    },
    {
      name: "Banana Muffin",
      price: 130,
      category: "Bakery",
      image: "coffee-banana-muffin.png",
      tags: ["veg"],
      prepMinutes: 2,
      isSpecial: false,
      allergens: ["gluten", "dairy", "egg"],
      description: "Soft banana muffin perfect with tea or coffee.",
      ingredients: ["Flour", "Banana", "Sugar", "Milk", "Egg", "Butter"],
      nutrition: { serving: "1 piece", calories: 260, protein: 4, carbs: 36, fat: 10 },
    },
    {
      name: "Cheese Sandwich",
      price: 170,
      category: "Snacks",
      image: "coffee-cheese-sandwich.png",
      tags: ["veg"],
      prepMinutes: 6,
      isSpecial: false,
      allergens: ["gluten", "dairy"],
      description: "Simple grilled cheese sandwich with creamy filling.",
      ingredients: ["Bread", "Cheese", "Butter", "Seasoning"],
      nutrition: { serving: "1 sandwich", calories: 320, protein: 10, carbs: 28, fat: 16 },
    },
    {
      name: "Cookie",
      price: 90,
      category: "Bakery",
      image: "coffee-cookie.png",
      tags: ["veg"],
      prepMinutes: 2,
      isSpecial: false,
      allergens: ["gluten", "dairy", "egg"],
      description: "Crunchy baked cookie with sweet buttery taste.",
      ingredients: ["Flour", "Sugar", "Butter", "Egg", "Chocolate chips"],
      nutrition: { serving: "1 piece", calories: 180, protein: 2, carbs: 24, fat: 8 },
    },
    {
      name: "Croissant",
      price: 140,
      category: "Bakery",
      image: "coffee-croissant.png",
      tags: ["veg"],
      prepMinutes: 2,
      isSpecial: false,
      allergens: ["gluten", "dairy"],
      description: "Flaky buttery croissant fresh from the bakery.",
      ingredients: ["Flour", "Butter", "Milk", "Yeast", "Salt"],
      nutrition: { serving: "1 piece", calories: 250, protein: 5, carbs: 26, fat: 13 },
    },

    // =========================
    // MAIN FOOD ITEMS
    // =========================
    {
      name: "Chicken Curry",
      price: 280,
      category: "Main",
      image: "food-curry.png",
      tags: ["nonveg"],
      prepMinutes: 15,
      isSpecial: false,
      allergens: ["dairy"],
      description: "Slow-cooked chicken curry with rich spices and gravy.",
      ingredients: ["Chicken", "Onion", "Tomato", "Garlic", "Ginger", "Curry spices", "Oil", "Salt"],
      nutrition: { serving: "1 plate", calories: 480, protein: 26, carbs: 18, fat: 30 },
    },
    {
      name: "Fried Rice",
      price: 240,
      category: "Main",
      image: "food-friedrice.png",
      tags: ["nonveg"],
      prepMinutes: 12,
      isSpecial: false,
      allergens: ["egg", "soy"],
      description: "Wok-fried rice with vegetables, egg, and seasoning.",
      ingredients: ["Rice", "Egg", "Carrot", "Peas", "Spring onion", "Soy sauce", "Oil", "Salt"],
      nutrition: { serving: "1 plate", calories: 560, protein: 20, carbs: 78, fat: 18 },
    },
    {
      name: "Chow Mein",
      price: 220,
      category: "Main",
      image: "food-chowmein.png",
      tags: ["nonveg"],
      prepMinutes: 10,
      isSpecial: false,
      allergens: ["gluten", "soy"],
      description: "Savory noodles stir-fried with vegetables and sauce.",
      ingredients: ["Noodles", "Cabbage", "Carrot", "Onion", "Soy sauce", "Garlic", "Oil"],
      nutrition: { serving: "1 plate", calories: 520, protein: 16, carbs: 76, fat: 16 },
    },
    {
      name: "Momo",
      price: 200,
      category: "Snacks",
      image: "food-momo.png",
      tags: ["nonveg"],
      prepMinutes: 14,
      isSpecial: true,
      allergens: ["gluten"],
      description: "Steamed Nepali dumplings served with spicy dip.",
      ingredients: ["Flour", "Minced chicken", "Onion", "Garlic", "Ginger", "Spices"],
      nutrition: { serving: "1 plate", calories: 420, protein: 18, carbs: 55, fat: 14 },
    },
    {
      name: "Pasta",
      price: 260,
      category: "Main",
      image: "food-pasta.png",
      tags: ["veg"],
      prepMinutes: 12,
      isSpecial: false,
      allergens: ["gluten", "dairy"],
      description: "Creamy pasta with vegetables and herbs.",
      ingredients: ["Pasta", "Cream", "Vegetables", "Garlic", "Herbs", "Cheese", "Salt"],
      nutrition: { serving: "1 plate", calories: 590, protein: 16, carbs: 72, fat: 26 },
    },
    {
      name: "Nepali Thakali Set",
      price: 320,
      category: "Main",
      image: "food-thakali.png",
      tags: ["nonveg"],
      prepMinutes: 18,
      isSpecial: true,
      allergens: ["dairy"],
      description: "Traditional Thakali meal with rice, dal, curry, achar, and sides.",
      ingredients: ["Rice", "Dal", "Chicken curry", "Saag", "Achar", "Papad", "Ghee"],
      nutrition: { serving: "1 set", calories: 650, protein: 28, carbs: 80, fat: 18 },
    },

    // =========================
    // HEALTHY / DRINKS
    // =========================
    {
      name: "Vegan Buddha Bowl",
      price: 300,
      category: "Healthy",
      image: "vegan-buddha-bowl.png",
      tags: ["vegan"],
      prepMinutes: 10,
      isSpecial: false,
      allergens: ["nuts"],
      description: "Balanced vegan bowl with grains, greens, and seeds.",
      ingredients: ["Mixed greens", "Chickpeas", "Rice", "Cucumber", "Carrot", "Seeds", "Dressing"],
      nutrition: { serving: "1 bowl", calories: 430, protein: 16, carbs: 52, fat: 14 },
    },
    {
      name: "Green Detox Salad",
      price: 250,
      category: "Healthy",
      image: "green-detox-salad.png",
      tags: ["vegan"],
      prepMinutes: 8,
      isSpecial: false,
      allergens: [],
      description: "Fresh green salad with lemon-herb dressing.",
      ingredients: ["Lettuce", "Cucumber", "Green vegetables", "Lemon", "Herbs", "Olive oil"],
      nutrition: { serving: "1 bowl", calories: 220, protein: 6, carbs: 18, fat: 12 },
    },
    {
      name: "Fresh Orange Juice",
      price: 160,
      category: "Drinks",
      image: "fresh-orange-juice.png",
      tags: ["vegan"],
      prepMinutes: 2,
      isSpecial: true,
      allergens: [],
      description: "Freshly squeezed orange juice.",
      ingredients: ["Orange"],
      nutrition: { serving: "1 glass", calories: 140, protein: 2, carbs: 32, fat: 0 },
    },
    {
      name: "Iced Lemon Tea",
      price: 140,
      category: "Drinks",
      image: "icedlemontea.png",
      tags: ["vegan"],
      prepMinutes: 2,
      isSpecial: false,
      allergens: [],
      description: "Chilled lemon tea with crisp refreshment.",
      ingredients: ["Black tea", "Lemon", "Ice", "Sugar"],
      nutrition: { serving: "1 glass", calories: 90, protein: 0, carbs: 22, fat: 0 },
    },
    {
      name: "Lemon Mint Drink",
      price: 150,
      category: "Drinks",
      image: "lemon-mint-drink.png",
      tags: ["vegan"],
      prepMinutes: 2,
      isSpecial: false,
      allergens: [],
      description: "Refreshing lemon mint cooler served chilled.",
      ingredients: ["Lemon", "Mint", "Ice", "Sugar", "Water"],
      nutrition: { serving: "1 glass", calories: 100, protein: 0, carbs: 24, fat: 0 },
    },
    {
      name: "Cold Coffee",
      price: 170,
      category: "Drinks",
      image: "cold-coffee.png",
      tags: ["veg"],
      prepMinutes: 3,
      isSpecial: false,
      allergens: ["dairy"],
      description: "Smooth chilled coffee blended with milk.",
      ingredients: ["Coffee", "Milk", "Ice", "Sugar"],
      nutrition: { serving: "1 glass", calories: 190, protein: 6, carbs: 26, fat: 7 },
    },

    // =========================
    // KUMARI HALL
    // =========================
    {
      name: "Blueberry Muffin",
      price: 140,
      category: "Bakery",
      image: "kumari-blueberry-muffin.png",
      tags: ["veg"],
      prepMinutes: 2,
      isSpecial: false,
      allergens: ["gluten", "dairy", "egg"],
      description: "Soft muffin with sweet blueberry flavor.",
      ingredients: ["Flour", "Blueberries", "Milk", "Sugar", "Egg", "Butter"],
      nutrition: { serving: "1 piece", calories: 270, protein: 4, carbs: 35, fat: 11 },
    },
    {
      name: "Brownie",
      price: 130,
      category: "Bakery",
      image: "kumari-brownie.png",
      tags: ["veg"],
      prepMinutes: 2,
      isSpecial: true,
      allergens: ["gluten", "dairy", "egg"],
      description: "Rich chocolate brownie with dense texture.",
      ingredients: ["Flour", "Cocoa", "Butter", "Sugar", "Egg", "Chocolate"],
      nutrition: { serving: "1 piece", calories: 290, protein: 4, carbs: 34, fat: 14 },
    },
    {
      name: "Cheese Toast",
      price: 160,
      category: "Snacks",
      image: "kumari-cheese-toast.png",
      tags: ["veg"],
      prepMinutes: 6,
      isSpecial: false,
      allergens: ["gluten", "dairy"],
      description: "Crispy toast topped with melted cheese.",
      ingredients: ["Bread", "Cheese", "Butter", "Seasoning"],
      nutrition: { serving: "1 plate", calories: 310, protein: 10, carbs: 24, fat: 16 },
    },
    {
      name: "Chicken Sandwich",
      price: 190,
      category: "Snacks",
      image: "kumari-chicken-sandwich.png",
      tags: ["nonveg"],
      prepMinutes: 7,
      isSpecial: false,
      allergens: ["gluten", "egg", "dairy"],
      description: "Fresh chicken sandwich with creamy filling and vegetables.",
      ingredients: ["Bread", "Chicken", "Lettuce", "Mayonnaise", "Tomato", "Cheese"],
      nutrition: { serving: "1 sandwich", calories: 360, protein: 18, carbs: 29, fat: 17 },
    },
    {
      name: "Chocolate Donut",
      price: 120,
      category: "Bakery",
      image: "kumari-chocolate-donut.png",
      tags: ["veg"],
      prepMinutes: 2,
      isSpecial: false,
      allergens: ["gluten", "dairy", "egg"],
      description: "Soft donut coated with chocolate glaze.",
      ingredients: ["Flour", "Sugar", "Milk", "Egg", "Chocolate glaze", "Butter"],
      nutrition: { serving: "1 piece", calories: 280, protein: 3, carbs: 36, fat: 13 },
    },
    {
      name: "Chocolate Milkshake",
      price: 180,
      category: "Drinks",
      image: "kumari-chocolate-milkshake.png",
      tags: ["veg"],
      prepMinutes: 4,
      isSpecial: true,
      allergens: ["dairy"],
      description: "Creamy chocolate milkshake served cold.",
      ingredients: ["Milk", "Chocolate syrup", "Ice cream", "Sugar", "Ice"],
      nutrition: { serving: "1 glass", calories: 340, protein: 8, carbs: 40, fat: 15 },
    },
    {
      name: "Fruit Pastry",
      price: 150,
      category: "Bakery",
      image: "kumari-fruit-pastry.png",
      tags: ["veg"],
      prepMinutes: 2,
      isSpecial: false,
      allergens: ["gluten", "dairy", "egg"],
      description: "Soft pastry topped with fruit and cream.",
      ingredients: ["Flour", "Cream", "Fruit topping", "Sugar", "Egg", "Butter"],
      nutrition: { serving: "1 piece", calories: 260, protein: 4, carbs: 32, fat: 12 },
    },
    {
      name: "Garlic Bread",
      price: 140,
      category: "Snacks",
      image: "kumari-garlic-bread.png",
      tags: ["veg"],
      prepMinutes: 5,
      isSpecial: false,
      allergens: ["gluten", "dairy"],
      description: "Toasted garlic bread with buttery herb flavor.",
      ingredients: ["Bread", "Garlic butter", "Herbs", "Salt"],
      nutrition: { serving: "1 plate", calories: 250, protein: 5, carbs: 28, fat: 11 },
    },
    {
      name: "Popcorn",
      price: 110,
      category: "Snacks",
      image: "kumari-popcorn.png",
      tags: ["vegan"],
      prepMinutes: 3,
      isSpecial: false,
      allergens: [],
      description: "Light and crunchy popcorn snack.",
      ingredients: ["Corn kernels", "Oil", "Salt"],
      nutrition: { serving: "1 tub", calories: 180, protein: 3, carbs: 22, fat: 8 },
    },
    {
      name: "Strawberry Milkshake",
      price: 180,
      category: "Drinks",
      image: "kumari-strawberry-milkshake.png",
      tags: ["veg"],
      prepMinutes: 4,
      isSpecial: true,
      allergens: ["dairy"],
      description: "Sweet strawberry milkshake served chilled.",
      ingredients: ["Milk", "Strawberry syrup", "Ice cream", "Sugar", "Ice"],
      nutrition: { serving: "1 glass", calories: 320, protein: 7, carbs: 38, fat: 14 },
    },
    {
      name: "Veg Sandwich",
      price: 170,
      category: "Snacks",
      image: "kumari-veg-sandwich.png",
      tags: ["veg"],
      prepMinutes: 6,
      isSpecial: false,
      allergens: ["gluten", "dairy"],
      description: "Fresh vegetable sandwich with soft bread and filling.",
      ingredients: ["Bread", "Cucumber", "Tomato", "Lettuce", "Cheese", "Sauce"],
      nutrition: { serving: "1 sandwich", calories: 290, protein: 8, carbs: 30, fat: 12 },
    },
  ];

  const finalSeed = seed.map(withNutritionDefaults);

  await MenuItem.insertMany(finalSeed);
  console.log("✅ Seeded items:", finalSeed.length);
  console.log("✅ Saved image filenames:");
  console.log(finalSeed.map((x) => x.image));

  await mongoose.disconnect();
  console.log("✅ Done. Disconnected.");
  process.exit(0);
}

run().catch((e) => {
  console.log("❌ Seed error:", e.message);
  process.exit(1);
});