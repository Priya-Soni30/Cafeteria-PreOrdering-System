import dotenv from "dotenv";
import mongoose from "mongoose";
import SpecialOffer from "./models/SpecialOffer.js";

dotenv.config();

const offers = [
  // Kumari Hall
  {
    title: "Today’s Drink Special",
    itemName: "Chocolate Milkshake",
    cafeteriaName: "Kumari Hall",
    description: "Creamy chocolate milkshake available today at a lower special price.",
    image: "kumari-chocolate-milkshake.png",
    originalPrice: 165,
    specialPrice: 140,
    discountText: "Special Price",
    type: "daily-special",
    isActive: true,
    validDate: "Today",
    tags: ["drink", "special", "veg"]
  },
  {
    title: "Refreshing Offer",
    itemName: "Strawberry Milkshake",
    cafeteriaName: "Kumari Hall",
    description: "Refreshing strawberry milkshake featured today as a limited promotion.",
    image: "kumari-strawberry-milkshake.png",
    originalPrice: 160,
    specialPrice: 135,
    discountText: "Promo Deal",
    type: "promotion",
    isActive: true,
    validDate: "Today",
    tags: ["drink", "promo", "veg"]
  },

  // Brit Cafe
  {
    title: "Burger Promotion",
    itemName: "Chicken Burger",
    cafeteriaName: "Brit Cafe",
    description: "Popular chicken burger available today at a promotional special price.",
    image: "brit-chicken-burger.png",
    originalPrice: 240,
    specialPrice: 210,
    discountText: "Promo Deal",
    type: "promotion",
    isActive: true,
    validDate: "Today",
    tags: ["main", "promo", "nonveg"]
  },
  {
    title: "Pasta Special",
    itemName: "White Sauce Pasta",
    cafeteriaName: "Brit Cafe",
    description: "Creamy white sauce pasta selected as today’s featured cafe special.",
    image: "brit-white-sauce-pasta.png",
    originalPrice: 230,
    specialPrice: 200,
    discountText: "Daily Special",
    type: "daily-special",
    isActive: true,
    validDate: "Today",
    tags: ["main", "special", "veg"]
  },

  // Coffee Station
  {
    title: "Coffee Break Offer",
    itemName: "Cappuccino",
    cafeteriaName: "Coffee Station",
    description: "Fresh cappuccino available today as a coffee break special offer.",
    image: "coffee-cappuccino.png",
    originalPrice: 125,
    specialPrice: 105,
    discountText: "Save Rs. 20",
    type: "promotion",
    isActive: true,
    validDate: "Today",
    tags: ["drink", "promo", "veg"]
  },
  {
    title: "Mocha Special",
    itemName: "Mocha",
    cafeteriaName: "Coffee Station",
    description: "Rich mocha featured today for students looking for a quick coffee treat.",
    image: "coffee-mocha.png",
    originalPrice: 135,
    specialPrice: 115,
    discountText: "Daily Special",
    type: "daily-special",
    isActive: true,
    validDate: "Today",
    tags: ["drink", "special", "veg"]
  },

  // Canteen
  {
    title: "Lunch Meal Special",
    itemName: "Chicken Curry Set",
    cafeteriaName: "Canteen",
    description: "Complete meal set available today as the cafeteria lunch special.",
    image: "canteen-chicken-curry-set.png",
    originalPrice: 260,
    specialPrice: 225,
    discountText: "Special Price",
    type: "daily-special",
    isActive: true,
    validDate: "Today",
    tags: ["meal", "special", "nonveg"]
  },
  {
    title: "Snack Promotion",
    itemName: "Chicken Momo",
    cafeteriaName: "Canteen",
    description: "Steamed chicken momo featured today as a quick and popular snack promotion.",
    image: "canteen-chicken-momo.png",
    originalPrice: 180,
    specialPrice: 155,
    discountText: "Promo Deal",
    type: "promotion",
    isActive: true,
    validDate: "Today",
    tags: ["snack", "promo", "nonveg"]
  }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    await SpecialOffer.deleteMany({});
    await SpecialOffer.insertMany(offers);

    console.log("Special offers seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

run();