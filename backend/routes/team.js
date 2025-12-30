import { Router } from "express";
import Project from "../models/Project.js";
import { auth } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/team/my-projects
 * Team member will see ONLY projects where they are assigned.
 */
router.get("/my-projects", auth, async (req, res) => {
  try {
    if (req.user.role !== "TEAM_MEMBER") {
      return res.status(403).json({ ok: false, error: "Team member access only" });
    }

    const projects = await Project.find({ teamMembers: req.user.id })
      .sort({ createdAt: -1 })
      .populate("client", "name email companyName")
      .populate("teamMembers", "name email designation")
      .populate("stages.lastUpdatedBy", "name email");

    return res.json({
      ok: true,
      projects: projects.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        dueDate: p.dueDate,
        client: p.client,
        teamMembers: p.teamMembers,
        stages: p.stages || [],
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("MY PROJECTS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});

/**
 * PATCH /api/team/projects/:projectId/stages/:key
 * Team member can update ONLY:
 * - status
 * - latestUpdate
 * and server will set:
 * - lastUpdatedBy
 */
router.patch("/projects/:projectId/stages/:key", auth, async (req, res) => {
  try {
    if (req.user.role !== "TEAM_MEMBER") {
      return res.status(403).json({ ok: false, error: "Team member access only" });
    }

    const { projectId, key } = req.params;
    const { status, latestUpdate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ ok: false, error: "Project not found" });

    // ✅ Team member must be assigned
    const isAssigned = (project.teamMembers || []).some(
      (id) => String(id) === String(req.user.id)
    );
    if (!isAssigned) {
      return res.status(403).json({ ok: false, error: "Not assigned to this project" });
    }

    if (!Array.isArray(project.stages)) {
      return res.status(400).json({ ok: false, error: "Stages not initialized" });
    }

    const stage = project.stages.find((s) => String(s.key) === String(key));
    if (!stage) return res.status(404).json({ ok: false, error: "Stage not found" });

    // ✅ allow ONLY status
    if (status !== undefined) {
      const allowed = ["PENDING", "ACTIVE", "COMPLETED"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }
      stage.status = status;
    }

    // ✅ allow ONLY latestUpdate
    if (typeof latestUpdate === "string") {
      stage.latestUpdate = latestUpdate;
    }

    // ✅ always set updated fields
    stage.updatedAt = new Date();
    stage.lastUpdatedBy = req.user.id;

    await project.save();

    // Return refreshed project with populated updater for "Me" / name display
    const updated = await Project.findById(project._id)
      .populate("client", "name email companyName")
      .populate("teamMembers", "name email designation")
      .populate("stages.lastUpdatedBy", "name email");

    return res.json({
      ok: true,
      project: {
        id: updated._id,
        stages: updated.stages,
        client: updated.client,
        name: updated.name,
      },
    });
  } catch (err) {
    console.error("TEAM UPDATE STAGE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});

export default router;
