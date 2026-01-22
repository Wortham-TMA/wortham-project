import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import teamRoutes from "./routes/team.js";
import filesRoutes from "./routes/files.js";
import clientRoutes from "./routes/client.js";

dotenv.config();

const app = express();

/* ---------- CORS (simple & correct) ---------- */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://wortham-project.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ---------- Middlewares ---------- */
app.use(express.json());

/* ---------- Routes ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/client", clientRoutes);

/* ---------- Health ---------- */
app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/* ---------- DB ---------- */
mongoose
  .connect(process.env.MONGODB_URI, { dbName: "studio-app" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err.message));

/* ---------- Server ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
