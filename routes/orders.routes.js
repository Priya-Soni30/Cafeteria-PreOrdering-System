import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { requireLogin, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/* --------------------------------
   HELPERS
--------------------------------- */
function normalizeStatus(value = "") {
  return String(value || "").trim().toLowerCase();
}

function buildOrderNo() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${yy}${mm}${dd}${rand}`;
}

async function ensureUniqueOrderNo() {
  let orderNo = buildOrderNo();
  let exists = await Order.exists({ orderNo });

  while (exists) {
    orderNo = buildOrderNo();
    exists = await Order.exists({ orderNo });
  }

  return orderNo;
}

function safeUserId(req) {
  return req.session?.user?.id || req.session?.user?._id || null;
}

/* --------------------------------
   PLACE ORDER
--------------------------------- */
async function handlePlaceOrder(req, res) {
  try {
    const {
      items,
      totalAmount,
      pickupTime,
      cafeteriaName,
      paymentMethod,
      paymentStatus,
      esewaTransactionUuid,
      esewaRefId,
      note
    } = req.body;

    const userId = safeUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required."
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items in order."
      });
    }

    const normalizedItems = items.map((item) => ({
      menuItemId: item.menuItemId || item.id || item._id || "",
      name: item.name || "Item",
      price: Number(item.price || 0),
      quantity: Number(item.quantity ?? item.qty ?? 1),
      image: item.image || ""
    }));

    const finalTotal =
      typeof totalAmount === "number" && !Number.isNaN(totalAmount)
        ? Number(totalAmount)
        : normalizedItems.reduce((sum, item) => {
            return sum + Number(item.price || 0) * Number(item.quantity || 0);
          }, 0);

    const normalizedPaymentMethod = String(paymentMethod || "esewa").trim().toLowerCase();

    let normalizedPaymentStatus = String(paymentStatus || "").trim().toLowerCase();

    if (!normalizedPaymentStatus) {
      if (normalizedPaymentMethod === "cash") {
        normalizedPaymentStatus = "pending";
      } else if (
        normalizedPaymentMethod === "wallet" ||
        normalizedPaymentMethod === "esewa"
      ) {
        normalizedPaymentStatus = "paid";
      } else {
        normalizedPaymentStatus = "pending";
      }
    }

    const pointsEarned = Math.floor(finalTotal / 10);
    const orderNo = await ensureUniqueOrderNo();

    const order = await Order.create({
      user: userId,
      orderNo,
      items: normalizedItems,
      totalAmount: finalTotal,
      pickupTime: pickupTime || "Not selected",
      cafeteriaName: cafeteriaName || "Islington Cafeteria",
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: normalizedPaymentStatus,
      esewaTransactionUuid: esewaTransactionUuid || "",
      esewaRefId: esewaRefId || "",
      note: note || "",
      orderStatus: "placed",
      earnedPoints: pointsEarned
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { loyaltyPoints: pointsEarned }
    });

    const populatedOrder = await Order.findById(order._id).populate(
      "user",
      "fullName email role"
    );

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: populatedOrder,
      pointsEarned
    });
  } catch (error) {
    console.error("❌ place order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message
    });
  }
}

/* --------------------------------
   STUDENT: MY ORDERS
--------------------------------- */
router.get("/my-orders", requireLogin, async (req, res) => {
  try {
    const userId = safeUserId(req);

    const orders = await Order.find({ user: userId })
      .populate("user", "fullName email role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("❌ my-orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load your orders",
      error: error.message
    });
  }
});

/* --------------------------------
   ADMIN: ALL ORDERS
--------------------------------- */
router.get("/", requireLogin, async (req, res) => {
  try {
    const role = String(req.session?.user?.role || "").toLowerCase();

    if (role === "admin") {
      const orders = await Order.find({})
        .populate("user", "fullName email role")
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        orders
      });
    }

    const userId = safeUserId(req);

    const orders = await Order.find({ user: userId })
      .populate("user", "fullName email role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("❌ get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load orders",
      error: error.message
    });
  }
});

/* --------------------------------
   ADMIN DASHBOARD
--------------------------------- */
router.get("/admin-dashboard", requireLogin, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "fullName email role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("❌ admin dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: error.message
    });
  }
});

/* --------------------------------
   SESSION TEST
--------------------------------- */
router.get("/__test", requireLogin, (req, res) => {
  return res.json({
    success: true,
    message: "Order route session active",
    user: req.session?.user || null
  });
});

/* --------------------------------
   UPDATE ORDER STATUS
--------------------------------- */
router.patch("/:id/status", requireLogin, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowed = ["placed", "preparing", "ready", "collected"];
    const normalized = normalizeStatus(orderStatus);

    if (!allowed.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const updated = await Order.findByIdAndUpdate(
      id,
      { orderStatus: normalized },
      { new: true }
    ).populate("user", "fullName email role");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order: updated
    });
  } catch (error) {
    console.error("❌ update status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    });
  }
});

/* --------------------------------
   QUICK STATUS ROUTES
--------------------------------- */
router.patch("/:id/preparing", requireLogin, requireAdmin, async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: "preparing" },
      { new: true }
    ).populate("user", "fullName email role");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      message: "Order marked as preparing",
      order: updated
    });
  } catch (error) {
    console.error("❌ mark preparing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark preparing",
      error: error.message
    });
  }
});

router.patch("/:id/ready", requireLogin, requireAdmin, async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: "ready" },
      { new: true }
    ).populate("user", "fullName email role");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      message: "Order marked as ready",
      order: updated
    });
  } catch (error) {
    console.error("❌ mark ready error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark ready",
      error: error.message
    });
  }
});

router.patch("/:id/collected", requireLogin, requireAdmin, async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: "collected" },
      { new: true }
    ).populate("user", "fullName email role");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      message: "Order marked as collected",
      order: updated
    });
  } catch (error) {
    console.error("❌ mark collected error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark collected",
      error: error.message
    });
  }
});

/* --------------------------------
   SINGLE ORDER
--------------------------------- */
router.get("/:id", requireLogin, async (req, res) => {
  try {
    const userId = safeUserId(req);
    const role = String(req.session?.user?.role || "").toLowerCase();

    const query =
      role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, user: userId };

    const order = await Order.findOne(query).populate("user", "fullName email role");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("❌ get single order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load order",
      error: error.message
    });
  }
});

/* --------------------------------
   ROUTES: PLACE ORDER
--------------------------------- */
router.post("/place", requireLogin, handlePlaceOrder);
router.post("/", requireLogin, handlePlaceOrder);

export default router;