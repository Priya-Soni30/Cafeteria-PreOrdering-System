import express from "express";
import SpecialOffer from "../models/SpecialOffer.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const cafeteriaName = String(req.query.cafeteriaName || "").trim();
    const type = String(req.query.type || "").trim();

    const filter = { isActive: true };

    if (cafeteriaName) {
      filter.cafeteriaName = cafeteriaName;
    }

    if (type) {
      filter.type = type;
    }

    const offers = await SpecialOffer.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      offers
    });
  } catch (error) {
    console.error("Special offers fetch failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch special offers"
    });
  }
});

export default router;