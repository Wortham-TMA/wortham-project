import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const auth = (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ normalize so routes can use req.user.id OR req.user._id
    req.user = {
      ...decoded,
      _id: decoded.id, // ✅ important
    };

    return next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ ok: false, error: "Admin access only" });
  }
  return next();
};
