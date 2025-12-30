// import { Router } from "express";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import User from "../models/User.js";
// import Team from '../models/TeamMember.js'
// import dotenv from "dotenv";

import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Team from "../models/TeamMember.js";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

// One time admin create
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({
        error: "Admin already exists",
      });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "ADMIN",
    });

    res.json({ ok: true, user });
  } catch (err) {
    console.error("CREATE ADMIN ERROR:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ Login Route (Admin + Team)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "Email and password required" });
    }

    // ✅ IMPORTANT: let user so we can reassign
    let user = await User.findOne({ email });

    // ✅ If not found in User, try TeamMember collection
    if (!user) {
      const team = await Team.findOne({ email });

      if (!team) {
        return res.status(400).json({ ok: false, error: "Invalid credentials" });
      }

      // ✅ password compare for team (adjust field name if different)
      const teamHash = team.passwordHash; // <-- ensure TeamMember schema has passwordHash
      if (!teamHash) {
        return res.status(500).json({
          ok: false,
          error: "TeamMember passwordHash missing. Check TeamMember schema field name.",
        });
      }

      const matchTeam = await bcrypt.compare(password, teamHash);
      if (!matchTeam) {
        return res.status(400).json({ ok: false, error: "Invalid credentials" });
      }

      // ✅ Build user-like object for token + response
      user = {
        _id: team._id,
        name: team.name,
        email: team.email,
        role: "TEAM_MEMBER",
      };
    } else {
      // ✅ User found (ADMIN/CLIENT/TEAM_MEMBER stored in User collection)
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(400).json({ ok: false, error: "Invalid credentials" });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});

export default router;

