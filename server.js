import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";

import userRoutes from "./routes/users.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import specialOfferRoutes from "./routes/specialOfferRoutes.js";
import esewaRoutes from "./routes/esewa.routes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5000);
const MONGO_URI = String(process.env.MONGO_URI || "").trim();
const SESSION_SECRET = String(process.env.SESSION_SECRET || "supersecretkey").trim();

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

if (
  !MONGO_URI.startsWith("mongodb://") &&
  !MONGO_URI.startsWith("mongodb+srv://")
) {
  console.error("❌ Invalid MONGO_URI format in .env");
  console.error("Current value:", MONGO_URI);
  process.exit(1);
}

/* DATABASE CONNECT */
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/* CORS */
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true,
  })
);

/* MIDDLEWARES */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* SESSION */
app.use(
  session({
    name: "cafeteria.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  })
);

/* STATIC FILES */
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/ui", express.static(path.join(__dirname, "src/pages/ui")));
app.use(express.static(path.join(__dirname, "src")));

/* API ROUTES */
app.use("/api/users", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/special-offers", specialOfferRoutes);
app.use("/api/esewa", esewaRoutes);

/* HEALTH CHECK */
app.get("/", (req, res) => {
  return res.json({ message: "Cafeteria backend API is running." });
});

/* OPTIONAL TEST ROUTE FOR ESEWA */
app.get("/api/__test", (req, res) => {
  return res.json({
    success: true,
    message: "Server is running",
    routes: ["users", "menu", "orders", "special-offers", "esewa"],
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});