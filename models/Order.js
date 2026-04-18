import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      alias: "qty",
      required: true,
      min: 1,
      default: 1,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderNo: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one order item is required.",
      },
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    pickupTime: {
      type: String,
      required: true,
      trim: true,
    },

    cafeteriaName: {
      type: String,
      default: "Islington College Cafeteria",
      trim: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "wallet", "esewa"],
      default: "esewa",
      trim: true,
      lowercase: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      trim: true,
      lowercase: true,
    },

    esewaTransactionUuid: {
      type: String,
      default: "",
      trim: true,
    },

    esewaRefId: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    orderStatus: {
      type: String,
      enum: ["placed", "preparing", "ready", "collected"],
      default: "placed",
      trim: true,
      lowercase: true,
    },

    earnedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;