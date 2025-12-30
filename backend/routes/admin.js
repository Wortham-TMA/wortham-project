import {Router} from "express";
import bcrypt from "bcrypt";
import User from '../models/User.js';
import {auth, adminOnly} from '../middleware/auth.js';
import Client from "../models/Client.js";
import TeamMember from "../models/TeamMember.js";
import Project from '../models/Project.js';

const router = Router();


// POst api/admin/create-team 

// Route to create team member 

router.post("/create-team", auth, adminOnly, async (req, res)=>{


    try{
        const {name, email, password, designation} = req.body;


          console.log("CREATE TEAM BODY:", req.body); // 👈 add this



        if(!name || !email || !password || !designation){
            return res.status(400).json({error: "All fields area required"});
        }

        const exists = await User.findOne({email});

        if(exists){
            return res.status(400).json({error: "User already exists with this email"});
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const member = await TeamMember.create({
            name,
            email,
            passwordHash,
            designation,
        });

        res.json({
            ok: true,
            teamMember: {
                id: member._id,
                name: member.name,
                email: member.email,
                designation: member.designation,
            },
        });
    } catch (err) {

        console.error("create-team error:", err);
        res.status(500).json({error: "Server error"});
        
    }


})


// Route to fetch team 


router.get("/teams", auth, adminOnly, async (req, res)=>{
    try{

        const teams = await TeamMember.find().sort({createdAt: -1});  // Latest  First

        console.log(teams);
        


        res.json({
            ok: true,
            teams: teams.map((m)=>({
                id: m._id,
        name: m.name,
        email: m.email,
        designation: m.designation,
        isActive: m.isActive,
            }))
        })


    }catch (err){
        console.log("get-teaam error:", err);
        res.status(500).json({error: "Server Error"});
        
    }
})



// Route to create Client

router.post("/create-client", auth, adminOnly, async (req, res)=>{

try{

    const {name, email, companyName, googleDriveFolderId, creditBalance, clientType} = req.body;


    if(!name || !email){
        return res.status(400).json({error: "Name and email are required"})
    };

    const exists = await Client.findOne({email});

    if(exists){
        return res.status(400).json({error: "Client with this email already exists"});
    }

    const client = await Client.create({
        name,
        email,
        companyName,
        clientType,
        googleDriveFolderId,
        creditBalance: creditBalance || 0
        });

    res.json({
        ok: true,
        Client:{
            id: client._id,
            name: client.name,
            email: client.email,
            clientType: client.clientType,
            companyName: client.companyName,
            googleDriveFolderId: client.googleDriveFolderId,
            creditBalance: client.creditBalance,
        },
    });
} catch (err){
    console.error("create-client error:", err);
     console.error(err.errors);
    res.status(500).json({error: "Server Error"});
}



});


// Route to fetch data of clients 

router.get("/clients", auth, adminOnly, async (req, res)=>{
    try{

        const clients = await Client.find().sort({ createdAt: -1}); // latest first


        res.json({
            ok: true,
            clients: clients.map((c)=>({
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
    } catch (err){
        console.error("get-clients error:", err);
        res.status(500).json({error: "Server Error"});
    }
});




// Route to create project 

// CREATE PROJECT
// CREATE PROJECT (admin only)
router.post("/projects", auth, adminOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      dueDate,
      clientId,        // kis client ka project
      teamMemberIds,   // array of TeamMember IDs
    } = req.body;

    console.log("CREATE PROJECT BODY:", req.body);

    // basic validation
    if (!name || !clientId) {
      return res
        .status(400)
        .json({ error: "Project name and client are required" });
    }

    // 1) client exist karta hai ya nahi
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(400).json({ error: "Client not found" });
    }

    // 2) team members validate (optional)
    let validTeamIds = [];
    if (Array.isArray(teamMemberIds) && teamMemberIds.length > 0) {
      const found = await TeamMember.find({
        _id: { $in: teamMemberIds },
      }).select("_id");

      validTeamIds = found.map((m) => m._id);
    }

    // 3) project create
    const project = await Project.create({
      name,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user.id,   // admin id from JWT
      client: client._id,
      teamMembers: validTeamIds,
    });

    // 4) full populated project wapas bhejo (client + team members ke saath)
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
        client: populated.client,             // full client doc (limited fields)
        teamMembers: populated.teamMembers,   // full team docs (name/email/designation)
      },
    });
  } catch (err) {
    console.error("CREATE PROJECT ERROR:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});



const defaultStages = [
  { key: "STAGE_1", stageName: "Concept", status: "PENDING", latestUpdate: "" },
  { key: "STAGE_2", stageName: "Production", status: "PENDING", latestUpdate: "" },
  { key: "STAGE_3", stageName: "Delivery", status: "PENDING", latestUpdate: "" },
];

// RUN ONCE: initialize stages for old projects
router.post("/projects/init-stages", auth, adminOnly, async (req, res) => {
  try {
    const result = await Project.updateMany(
      { $or: [{ stages: { $exists: false } }, { stages: { $size: 0 } }] },
      { $set: { stages: defaultStages } }
    );

    return res.json({ ok: true, result });
  } catch (err) {
    console.error("INIT STAGES ERROR:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});




// Get Project List 


// GET ALL PROJECTS (admin only)
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
        client: p.client,            // client object
        teamMembers: p.teamMembers, 
        stages: p.stages || [], // array of team members
      })),
    });
  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});



// UPDATE PROJECT STAGE (admin only)
router.patch(
  "/projects/:projectId/stages/:key",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { projectId, key } = req.params;
      const { stageName, timeline, status, latestUpdate } = req.body;

      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });

      if (!Array.isArray(project.stages)) {
        return res
          .status(400)
          .json({ error: "Stages not initialized on this project" });
      }

      const stage = project.stages.find((s) => s.key === key);
      if (!stage) return res.status(404).json({ error: "Stage not found" });

      // update only provided fields
      if (typeof stageName === "string") stage.stageName = stageName;

      if (timeline !== undefined) {
        // allow clearing timeline by sending "" or null
        stage.timeline = timeline ? new Date(timeline) : null;
      }

      if (status !== undefined) {
        const allowed = ["PENDING", "ACTIVE", "COMPLETED"];
        if (!allowed.includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        stage.status = status;
      }

      if (typeof latestUpdate === "string") stage.latestUpdate = latestUpdate;

      stage.updatedAt = new Date();

      await project.save();

      // ✅ return FULL updated project + populate
      const populated = await Project.findById(project._id)
        .populate("client", "name email companyName")
        .populate("teamMembers", "name email designation");

      return res.json({
        ok: true,
        project: {
          id: populated._id,
          name: populated.name,
          description: populated.description,
          status: populated.status,
          startDate: populated.startDate,
          dueDate: populated.dueDate,
          client: populated.client,
          teamMembers: populated.teamMembers,
          stages: populated.stages,
        },
      });
    } catch (err) {
      console.error("UPDATE STAGE ERROR:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  }
);







export default router;