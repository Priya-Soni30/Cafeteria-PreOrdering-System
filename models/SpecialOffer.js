import mongoose from "mongoose";

const specialOfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    cafeteriaName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },
    originalPrice: {
      type: Number,
      required: true
    },
    specialPrice: {
      type: Number,
      required: true
    },
    discountText: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      enum: ["daily-special", "promotion"],
      default: "daily-special"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    validDate: {
      type: String,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("SpecialOffer", specialOfferSchema);