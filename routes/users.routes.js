import express from "express";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import { requireLogin, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/* -------------------------------
   HELPERS
-------------------------------- */
function generateFourDigitOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function getMailer() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

function sanitizeUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    favorites: Array.isArray(user.favorites) ? user.favorites : [],
    loyaltyPoints: Number(user.loyaltyPoints || 0),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/* -------------------------------
   TEST ROUTE
-------------------------------- */
router.get("/__test", (req, res) => {
  return res.json({ success: true, where: "users" });
});

/* -------------------------------
   REGISTER
-------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const cleanName = String(fullName || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const exists = await User.findOne({ email: cleanEmail });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const user = await User.create({
      fullName: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: "student",
      avatar: "",
      favorites: [],
      loyaltyPoints: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Registered successfully.",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("❌ register error:", err);
    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: err.message,
    });
  }
});

/* -------------------------------
   LOGIN
-------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isMatch = await bcrypt.compare(cleanPassword, String(user.password));

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    req.session.user = {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    req.session.save((err) => {
      if (err) {
        console.error("❌ session save error:", err);
        return res.status(500).json({
          success: false,
          message: "Login failed while saving session.",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Login successful.",
        user: sanitizeUser(user),
      });
    });
  } catch (err) {
    console.error("❌ login error:", err);
    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: err.message,
    });
  }
});

/* -------------------------------
   SEND OTP
-------------------------------- */
router.post("/send-otp", async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email.",
      });
    }

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: "MAIL_USER or MAIL_PASS is missing in .env",
      });
    }

    const otp = generateFourDigitOtp();

    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    const transporter = getMailer();
    await transporter.verify();

    await transporter.sendMail({
      from: `"Cafeteria Pre-Order" <${process.env.MAIL_USER}>`,
      to: cleanEmail,
      subject: "Your 4-Digit OTP for Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <h2>Password Reset Request</h2>
          <p>Your 4-digit OTP is:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #55624b; margin: 16px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email successfully.",
    });
  } catch (err) {
    console.error("❌ send-otp error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP email.",
      error: err.message,
    });
  }
});

/* -------------------------------
   RESET PASSWORD
-------------------------------- */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();
    const newPassword = String(password || "");

    if (!cleanEmail || !cleanOtp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    if (!/^\d{4}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be exactly 4 digits.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email.",
      });
    }

    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new OTP.",
      });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      user.resetOtp = null;
      user.resetOtpExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (String(user.resetOtp) !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = null;
    user.resetOtpExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (err) {
    console.error("❌ reset-password error:", err);
    return res.status(500).json({
      success: false,
      message: "Password reset failed.",
      error: err.message,
    });
  }
});

/* -------------------------------
   ME
-------------------------------- */
router.get("/me", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("❌ me route error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get current user.",
      error: err.message,
    });
  }
});

/* -------------------------------
   FULL PROFILE
-------------------------------- */
router.get("/full-profile", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("❌ full-profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      error: err.message,
    });
  }
});

/* -------------------------------
   PROFILE
-------------------------------- */
router.get("/profile", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "You are logged in.",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("❌ profile route error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      error: err.message,
    });
  }
});

/* -------------------------------
   UPDATE PROFILE
-------------------------------- */
router.put("/update-profile", requireLogin, async (req, res) => {
  try {
    const { fullName, avatar } = req.body;

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const cleanName = String(fullName || "").trim();
    const cleanAvatar = String(avatar || "").trim();

    if (cleanName) {
      user.fullName = cleanName;
      req.session.user.fullName = cleanName;
    }

    if (typeof avatar !== "undefined") {
      user.avatar = cleanAvatar;
    }

    await user.save();

    req.session.save((err) => {
      if (err) {
        console.error("❌ session update error:", err);
        return res.status(500).json({
          success: false,
          message: "Profile updated in DB but session update failed.",
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        user: sanitizeUser(user),
      });
    });
  } catch (err) {
    console.error("❌ update-profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: err.message,
    });
  }
});

/* -------------------------------
   GET FAVORITES
-------------------------------- */
router.get("/favorites", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      favorites: user.favorites || [],
    });
  } catch (err) {
    console.error("❌ get favorites error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch favorites.",
      error: err.message,
    });
  }
});

/* -------------------------------
   ADD FAVORITE
-------------------------------- */
router.post("/favorites/:itemId", requireLogin, async (req, res) => {
  try {
    const itemId = String(req.params.itemId || "").trim();

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item id required.",
      });
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.favorites.includes(itemId)) {
      user.favorites.push(itemId);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Added to favorites.",
      favorites: user.favorites || [],
    });
  } catch (err) {
    console.error("❌ add favorite error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to add favorite.",
      error: err.message,
    });
  }
});

/* -------------------------------
   REMOVE FAVORITE
-------------------------------- */
router.delete("/favorites/:itemId", requireLogin, async (req, res) => {
  try {
    const itemId = String(req.params.itemId || "").trim();

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.favorites = user.favorites.filter((id) => String(id) !== itemId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Removed from favorites.",
      favorites: user.favorites || [],
    });
  } catch (err) {
    console.error("❌ remove favorite error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to remove favorite.",
      error: err.message,
    });
  }
});

/* -------------------------------
   ADD POINTS
-------------------------------- */
router.post("/add-points", requireLogin, async (req, res) => {
  try {
    const points = Number(req.body.points || 0);

    if (!Number.isFinite(points) || points <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid positive points value is required.",
      });
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.loyaltyPoints += points;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Loyalty points updated.",
      loyaltyPoints: user.loyaltyPoints,
    });
  } catch (err) {
    console.error("❌ add-points error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update loyalty points.",
      error: err.message,
    });
  }
});

/* -------------------------------
   ADMIN TEST
-------------------------------- */
router.get("/admin-test", requireAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome admin.",
    user: req.session.user,
  });
});

/* -------------------------------
   LOGOUT
-------------------------------- */
router.post("/logout", (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Logout failed.",
        });
      }

      res.clearCookie("cafeteria.sid");

      return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    });
  } catch (err) {
    console.error("❌ logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Logout failed.",
      error: err.message,
    });
  }
});

export default router;