import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Client from "../models/Client.js";
import Project from "../models/Project.js";
import ProjectFile from "../models/ProjectFile.js";

const router = Router();

const clientOnly = (req, res, next) => {
  if (req.user.role !== "CLIENT") {
    return res.status(403).json({ error: "Client access only" });
  }
  next();
};

// ✅ Client projects
router.get("/projects", auth, clientOnly, async (req, res) => {
  const client = await Client.findOne({ email: req.user.email });

  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }

  const projects = await Project.find({ client: client._id })
    .populate("teamMembers", "name")
    .lean();

  res.json({ ok: true, projects });
});


// ✅ Files for a project
router.get("/projects/:projectId/files", auth, clientOnly, async (req, res) => {
  try {
    const files = await ProjectFile.find({
      project: req.params.projectId,
    }).sort({ createdAt: -1 });

    res.json({ ok: true, files });
  } catch (err) {
    console.error("CLIENT FILE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
