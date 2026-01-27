import { Router } from "express";
import multer from "multer";
import { google } from "googleapis";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Readable } from "stream";

import { auth } from "../middleware/auth.js";
import Client from "../models/Client.js";
import OAuthToken from "../models/OAuthToken.js";
import ProjectFile from "../models/ProjectFile.js";

dotenv.config();
const router = Router();

// =======================
// CONFIG
// =======================
const upload = multer({ storage: multer.memoryStorage() });

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

// =======================
// 1️⃣ ADMIN / TEAM → GOOGLE CONNECT
// =======================
router.get("/google/connect", auth, async (req, res) => {
  try {
    const oauth2Client = getOAuthClient();

    const token = req.headers.authorization?.split(" ")[1];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
      state: token, // JWT
    });

    res.json({ ok: true, url });
  } catch (err) {
    console.error("GOOGLE CONNECT ERROR:", err);
    res.status(500).json({ ok: false, error: "Google connect failed" });
  }
});

// =======================
// 2️⃣ GOOGLE CALLBACK (SAVE TOKENS)
// =======================
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send("Invalid callback");

    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const ownerId = decoded.id;

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    await OAuthToken.findOneAndUpdate(
      { ownerId },
      { ownerId, tokens },
      { upsert: true, new: true }
    );

    res.redirect(
      `${process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT}?google=connected`
    );
  } catch (err) {
    console.error("GOOGLE CALLBACK ERROR:", err);
    res.status(500).send("OAuth failed");
  }
});

// =======================
// HELPER → GET DRIVE USING ADMIN TOKEN
// =======================
async function getDrive() {
  const saved = await OAuthToken.findOne();
  if (!saved?.tokens) {
    throw new Error("Google not connected by admin");
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(saved.tokens);

  return google.drive({ version: "v3", auth: oauth2Client });
}

// =======================
// 3️⃣ CLIENT → UPLOAD FILE (NO LOGIN)
// =======================
router.post("/upload/:clientId", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "File required" });
    }

    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ ok: false, error: "Project ID missing" });
    }

    const client = await Client.findById(req.params.clientId);
    if (!client?.googleDriveFolderId) {
      return res
        .status(400)
        .json({ ok: false, error: "Client Drive folder not set" });
    }

    const drive = await getDrive();

    const resp = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [client.googleDriveFolderId],
      },
      media: {
        mimeType: req.file.mimetype,
        body: Readable.from(req.file.buffer),
      },
      fields: "id,name,webViewLink,webContentLink",
      supportsAllDrives: true,
    });

    await ProjectFile.create({
      project: projectId,
      uploadedByRole: "CLIENT",
      fileName: resp.data.name,
      driveFileId: resp.data.id,
      driveLink: resp.data.webViewLink,
      remark: "",
    });

    res.json({ ok: true, file: resp.data });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// =======================
// 4️⃣ CLIENT → LIST FILES (NO LOGIN)
// =======================
router.get("/list/:clientId", async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client?.googleDriveFolderId) {
      return res
        .status(400)
        .json({ ok: false, error: "Client Drive folder not set" });
    }

    const drive = await getDrive();

    const resp = await drive.files.list({
      q: `'${client.googleDriveFolderId}' in parents and trashed=false`,
      fields:
        "files(id,name,mimeType,modifiedTime,webViewLink,webContentLink)",
      orderBy: "modifiedTime desc",
      pageSize: 50,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    res.json({ ok: true, files: resp.data.files || [] });
  } catch (err) {
    console.error("LIST ERROR:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
