import express from "express";
import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ---------------- helpers ---------------- */

function cleanStr(v) {
  return String(v ?? "").trim();
}

function cleanLowerList(v) {
  if (!v) return [];

  if (Array.isArray(v)) {
    return v.map((x) => cleanStr(x).toLowerCase()).filter(Boolean);
  }

  return cleanStr(v)
    .split(",")
    .map((x) => cleanStr(x).toLowerCase())
    .filter(Boolean);
}

function ensureNutritionDefaults(n) {
  const src = n && typeof n === "object" ? n : {};

  return {
    serving: src.serving ?? "1 plate",

    calories: Number(src.calories ?? 0),
    protein: Number(src.protein ?? 0),
    carbs: Number(src.carbs ?? 0),
    fat: Number(src.fat ?? 0),

    satFat: Number(src.satFat ?? 0),
    fiber: Number(src.fiber ?? 0),
    sugar: Number(src.sugar ?? 0),

    sodium: Number(src.sodium ?? 0),
    cholesterol: Number(src.cholesterol ?? 0),

    proteinDV: Number(src.proteinDV ?? 0),
    carbsDV: Number(src.carbsDV ?? 0),
    fatDV: Number(src.fatDV ?? 0),
    sodiumDV: Number(src.sodiumDV ?? 0),
  };
}

/* -------------------------------
   GET /api/menu
   Public
   Filters:
   - search
   - category
   - special=1
   - diet=veg,vegan,nonveg
   - excludeAllergen=gluten/nuts/dairy/egg/soy
-------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { search, category, special, diet, excludeAllergen } = req.query;

    const q = {};

    if (cleanStr(search)) {
      q.name = { $regex: cleanStr(search), $options: "i" };
    }

    if (cleanStr(category)) {
      q.category = cleanStr(category);
    }

    if (special === "1") {
      q.isSpecial = true;
    }

    if (cleanStr(diet)) {
      const diets = cleanLowerList(diet);
      if (diets.length) {
        q.tags = { $in: diets };
      }
    }

    if (cleanStr(excludeAllergen)) {
      q.allergens = { $nin: [cleanStr(excludeAllergen).toLowerCase()] };
    }

    const items = await MenuItem.find(q).sort({ createdAt: -1 }).lean();

    const fixed = items.map((it) => ({
      ...it,
      tags: Array.isArray(it.tags) ? it.tags : [],
      allergens: Array.isArray(it.allergens) ? it.allergens : [],
      ingredients: Array.isArray(it.ingredients) ? it.ingredients : [],
      nutrition: ensureNutritionDefaults(it.nutrition),
    }));

    return res.status(200).json(fixed);
  } catch (err) {
    console.error("❌ GET /api/menu error:", err);
    return res.status(500).json({
      success: false,
      message: "Menu fetch failed",
      error: err.message,
    });
  }
});

/* -------------------------------
   GET /api/menu/:id
   Public
-------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item id",
      });
    }

    const item = await MenuItem.findById(id).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    item.nutrition = ensureNutritionDefaults(item.nutrition);
    item.tags = Array.isArray(item.tags) ? item.tags : [];
    item.allergens = Array.isArray(item.allergens) ? item.allergens : [];
    item.ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];

    return res.status(200).json(item);
  } catch (err) {
    console.error("❌ GET /api/menu/:id error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get item",
      error: err.message,
    });
  }
});

/* -------------------------------
   POST /api/menu
   Admin only
-------------------------------- */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};

    if (
      !cleanStr(b.name) ||
      b.price == null ||
      !cleanStr(b.category) ||
      !cleanStr(b.image) ||
      !cleanStr(b.description)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, price, category, image, description",
      });
    }

    const doc = {
      name: cleanStr(b.name),
      price: Number(b.price),
      category: cleanStr(b.category),
      image: cleanStr(b.image),
      description: cleanStr(b.description),

      prepMinutes: Number(b.prepMinutes ?? 10),
      isSpecial: Boolean(b.isSpecial ?? false),

      tags: cleanLowerList(b.tags),
      allergens: cleanLowerList(b.allergens),
      ingredients: Array.isArray(b.ingredients)
        ? b.ingredients.map((x) => cleanStr(x)).filter(Boolean)
        : [],

      nutrition: ensureNutritionDefaults(b.nutrition),
    };

    const created = await MenuItem.create(doc);

    return res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      item: created,
    });
  } catch (err) {
    console.error("❌ POST /api/menu error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create menu item",
      error: err.message,
    });
  }
});

/* -------------------------------
   PATCH /api/menu/:id/nutrition
   Admin only
-------------------------------- */
router.patch("/:id/nutrition", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item id",
      });
    }

    const n = ensureNutritionDefaults(req.body || {});

    const updated = await MenuItem.findByIdAndUpdate(
      id,
      { $set: { nutrition: n } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Nutrition updated successfully",
      item: updated,
    });
  } catch (err) {
    console.error("❌ PATCH /api/menu/:id/nutrition error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update nutrition",
      error: err.message,
    });
  }
});

/* -------------------------------
   PUT /api/menu/:id
   Admin only
-------------------------------- */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item id",
      });
    }

    const update = {};

    if (b.name != null) update.name = cleanStr(b.name);
    if (b.price != null) update.price = Number(b.price);
    if (b.category != null) update.category = cleanStr(b.category);
    if (b.image != null) update.image = cleanStr(b.image);
    if (b.description != null) update.description = cleanStr(b.description);

    if (b.prepMinutes != null) update.prepMinutes = Number(b.prepMinutes);
    if (b.isSpecial != null) update.isSpecial = Boolean(b.isSpecial);

    if (b.tags != null) update.tags = cleanLowerList(b.tags);
    if (b.allergens != null) update.allergens = cleanLowerList(b.allergens);

    if (b.ingredients != null) {
      update.ingredients = Array.isArray(b.ingredients)
        ? b.ingredients.map((x) => cleanStr(x)).filter(Boolean)
        : [];
    }

    if (b.nutrition != null) {
      update.nutrition = ensureNutritionDefaults(b.nutrition);
    }

    const updated = await MenuItem.findByIdAndUpdate(id, update, { new: true });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      item: updated,
    });
  } catch (err) {
    console.error("❌ PUT /api/menu/:id error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update item",
      error: err.message,
    });
  }
});

export default router;