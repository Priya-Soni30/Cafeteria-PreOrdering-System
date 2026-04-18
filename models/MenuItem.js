import mongoose from "mongoose";

const nutritionSchema = new mongoose.Schema(
  {
    serving: { type: String, default: "1 plate" },

    // energy
    calories: { type: Number, default: 0 },

    // macros (grams)
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },

    // detailed nutrition (grams unless noted)
    satFat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },

    // mg values
    sodium: { type: Number, default: 0 },
    cholesterol: { type: Number, default: 0 },

    // Optional Daily Values (for later use)
    proteinDV: { type: Number, default: 0 },
    carbsDV: { type: Number, default: 0 },
    fatDV: { type: Number, default: 0 },
    sodiumDV: { type: Number, default: 0 },
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    // basic
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },

    // filters
    tags: { type: [String], default: [] },        // veg, vegan, nonveg
    allergens: { type: [String], default: [] },   // dairy, egg, gluten, nuts, soy
    prepMinutes: { type: Number, default: 10 },
    isSpecial: { type: Boolean, default: false },

    // details page
    description: { type: String, required: true, trim: true },
    ingredients: { type: [String], default: [] },

    // ✅ upgraded nutrition
    nutrition: { type: nutritionSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);