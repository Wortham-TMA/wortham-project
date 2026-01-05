// routes/admin.js
import { Router } from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

import User from "../models/User.js";
import Client from "../models/Client.js";
import TeamMember from "../models/TeamMember.js";
import Project from "../models/Project.js";

import { auth, adminOnly } from "../middleware/auth.js";

const router = Router();

// -------------------- Stage templates --------------------
const PRODUCTION_STAGES = [
  { key: "STAGE_1", stageName: "Concept", status: "PENDING", latestUpdate: "" },
  { key: "STAGE_2", stageName: "Production", status: "PENDING", latestUpdate: "" },
  { key: "STAGE_3", stageName: "Delivery", status: "PENDING", latestUpdate: "" },
];

const NORMAL_STAGES = [
  { key: "STAGE_1", stageName: "Project Update", status: "ACTIVE", latestUpdate: "" },
];

const ALLOWED_PROJECT_TYPES = ["PRODUCTION", "NORMAL"];

// helper
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const getUserId = (req) => req?.user?._id || req?.user?.id;

// =========================================================
// ===================== TEAM ROUTES =======================
// =========================================================

// POST /api/admin/create-team
router.post("/create-team", auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, designation } = req.body;

    if (!name || !email || !password || !designation) {
      return res.status(400).json({ ok: false, error: "All fields are required" });
    }

    const existsUser = await User.findOne({ email });
    const existsTeam = await TeamMember.findOne({ email });

    if (existsUser || existsTeam) {
      return res.status(400).json({ ok: false, error: "User already exists with this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const member = await TeamMember.create({
      name,
      email,
      passwordHash,
      designation,
    });

    return res.json({
      ok: true,
      teamMember: {
        id: member._id,
        name: member.name,
        email: member.email,
        designation: member.designation,
        isActive: member.isActive,
      },
    });
  } catch (err) {
    console.error("create-team error:", err);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});

// GET /api/admin/teams
router.get("/teams", auth, adminOnly, async (req, res) => {
  try {
    const teams = await TeamMember.find().sort({ createdAt: -1 });

    return res.json({
      ok: true,
      teams: teams.map((m) => ({
        id: m._id,
        name: m.name,
        email: m.email,
        designation: m.designation,
        isActive: m.isActive,
      })),
    });
  } catch (err) {
    console.error("get-teams error:", err);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});

// =========================================================
// ===================== CLIENT ROUTES =====================
// =========================================================

// POST /api/admin/create-client
router.post("/create-client", auth, adminOnly, async (req, res) => {
  try {
    const { name, email, companyName, googleDriveFolderId, creditBalance, clientType } = req.body;

    if (!name || !email) {
      return res.status(400).json({ ok: false, error: "Name and email are required" });
    }

    const exists = await Client.findOne({ email });
    if (exists) {
      return res.status(400).json({ ok: false, error: "Client with this email already exists" });
    }

    const client = await Client.create({
      name,
      email,
      companyName,
      clientType,
      googleDriveFolderId,
      creditBalance: creditBalance || 0,
    });

    return res.json({
      ok: true,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        clientType: client.clientType,
        companyName: client.companyName,
        googleDriveFolderId: client.googleDriveFolderId,
        creditBalance: client.creditBalance,
        isActive: client.isActive,
        createdAt: client.createdAt,
      },
    });
  } catch (err) {
    console.error("create-client error:", err);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});

// GET /api/admin/clients
router.get("/clients", auth, adminOnly, async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });

    return res.json({
      ok: true,
      clients: clients.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        companyName: c.companyName,
        clientType: c.clientType,
        googleDriveFolderId: c.googleDriveFolderId,
        creditBalance: c.creditBalance,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error("get-clients error:", err);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});

// =========================================================
// ===================== PROJECT ROUTES ====================
// =========================================================

// POST /api/admin/projects
router.post("/projects", auth, adminOnly, async (req, res) => {
  try {
    const { name, description, startDate, dueDate, clientId, teamMemberIds, projectType } = req.body;

    if (!name || !clientId) {
      return res.status(400).json({ ok: false, error: "Project name and client are required" });
    }

    if (!isValidObjectId(clientId)) {
      return res.status(400).json({ ok: false, error: "Invalid clientId" });
    }

    // projectType normalize
    let normalizedProjectType = projectType;
    if (normalizedProjectType !== undefined && normalizedProjectType !== null && normalizedProjectType !== "") {
      if (!ALLOWED_PROJECT_TYPES.includes(normalizedProjectType)) {
        return res.status(400).json({ ok: false, error: "Invalid projectType" });
      }
    } else {
      normalizedProjectType = undefined; // schema default
    }

    const client = await Client.findById(clientId);
    if (!client) return res.status(400).json({ ok: false, error: "Client not found" });

    // validate team members (optional)
    let validTeamIds = [];
    if (Array.isArray(teamMemberIds) && teamMemberIds.length > 0) {
      const cleanIds = teamMemberIds.filter((id) => isValidObjectId(id));
      const found = await TeamMember.find({ _id: { $in: cleanIds } }).select("_id");
      validTeamIds = found.map((m) => m._id);
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized (no user id)" });
    }

    // IMPORTANT: do NOT send stages; schema hook sets based on projectType
    const project = await Project.create({
      name,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: userId, // ✅ FIXED
      client: client._id,
      teamMembers: validTeamIds,
      projectType: normalizedProjectType,
    });

    const populated = await Project.findById(project._id)
      .populate("client", "name email companyName")
      .populate("teamMembers", "name email designation");

    return res.status(201).json({
      ok: true,
      project: {
        id: populated._id,
        name: populated.name,
        description: populated.description,
        status: populated.status,
        startDate: populated.startDate,
        dueDate: populated.dueDate,
        projectType: populated.projectType,
        client: populated.client,
        teamMembers: populated.teamMembers,
        stages: populated.stages || [],
      },
    });
  } catch (err) {
    console.error("CREATE PROJECT ERROR:", err);
    // ✅ return real message so you can see exact reason in frontend
    return res.status(500).json({ ok: false, error: err?.message || "Server Error" });
  }
});

// POST /api/admin/projects/init-stages
router.post("/projects/init-stages", auth, adminOnly, async (req, res) => {
  try {
    // 1) Backfill projectType if missing
    const backfillProjectType = await Project.updateMany(
      { projectType: { $exists: false } },
      { $set: { projectType: "PRODUCTION" } }
    );

    // 2) Find projects missing stages
    const projectsNeedingStages = await Project.find({
      $or: [{ stages: { $exists: false } }, { stages: { $size: 0 } }],
    }).select("_id projectType");

    let updatedStagesProjects = 0;

    for (const p of projectsNeedingStages) {
      const stages = p.projectType === "NORMAL" ? NORMAL_STAGES : PRODUCTION_STAGES;
      await Project.updateOne({ _id: p._id }, { $set: { stages } });
      updatedStagesProjects++;
    }

    return res.json({
      ok: true,
      backfillProjectType,
      updatedStagesProjects,
      totalNeedingStages: projectsNeedingStages.length,
    });
  } catch (err) {
    console.error("INIT STAGES ERROR:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server Error" });
  }
});

// GET /api/admin/projects
router.get("/projects", auth, adminOnly, async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .populate("client", "name email companyName")
      .populate("teamMembers", "name email designation");

    return res.json({
      ok: true,
      projects: projects.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        dueDate: p.dueDate,
        projectType: p.projectType,
        client: p.client,
        teamMembers: p.teamMembers,
        stages: p.stages || [],
      })),
    });
  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server Error" });
  }
});

// PATCH /api/admin/projects/:projectId/stages/:key
router.patch("/projects/:projectId/stages/:key", auth, adminOnly, async (req, res) => {
  try {
    const { projectId, key } = req.params;
    const { stageName, timeline, status, latestUpdate } = req.body;

    if (!isValidObjectId(projectId)) {
      return res.status(400).json({ ok: false, error: "Invalid projectId" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ ok: false, error: "Project not found" });

    if (!Array.isArray(project.stages)) {
      return res.status(400).json({ ok: false, error: "Stages not initialized on this project" });
    }

    const stage = project.stages.find((s) => s.key === key);
    if (!stage) return res.status(404).json({ ok: false, error: "Stage not found" });

    if (typeof stageName === "string") stage.stageName = stageName;

    if (timeline !== undefined) {
      stage.timeline = timeline ? new Date(timeline) : null; // allow "" / null to clear
    }

    if (status !== undefined) {
      const allowed = ["PENDING", "ACTIVE", "COMPLETED"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }
      stage.status = status;
    }

    if (typeof latestUpdate === "string") stage.latestUpdate = latestUpdate;

    const userId = getUserId(req);
    stage.updatedAt = new Date();
    stage.lastUpdatedBy = userId || stage.lastUpdatedBy; // ✅ FIXED

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("client", "name email companyName")
      .populate("teamMembers", "name email designation")
      .populate("stages.lastUpdatedBy", "name email");

    return res.json({
      ok: true,
      project: {
        id: populated._id,
        name: populated.name,
        description: populated.description,
        status: populated.status,
        startDate: populated.startDate,
        dueDate: populated.dueDate,
        projectType: populated.projectType,
        client: populated.client,
        teamMembers: populated.teamMembers,
        stages: populated.stages || [],
      },
    });
  } catch (err) {
    console.error("UPDATE STAGE ERROR:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server Error" });
  }
});

export default router;
