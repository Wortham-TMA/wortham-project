import { Router } from "express";
import multer from "multer";
import { google } from "googleapis";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Readable } from "stream";

import { auth } from "../middleware/auth.js";
import Client from "../models/Client.js";
import OAuthToken from "../models/OAuthToken.js";

dotenv.config();
const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

const SCOPES = ["https://www.googleapis.com/auth/drive.file"]; 
// NOTE: drive.file = app-created files only (upload works)

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

// ✅ 1) CONNECT (Generate URL)
router.get("/google/connect", auth, async (req, res) => {
  try {
    const missing = [];
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID) missing.push("GOOGLE_OAUTH_CLIENT_ID");
    if (!process.env.GOOGLE_OAUTH_CLIENT_SECRET) missing.push("GOOGLE_OAUTH_CLIENT_SECRET");
    if (!process.env.GOOGLE_OAUTH_REDIRECT_URI) missing.push("GOOGLE_OAUTH_REDIRECT_URI");
    if (!process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT) missing.push("GOOGLE_OAUTH_SUCCESS_REDIRECT");

    if (missing.length) {
      return res.status(500).json({
        ok: false,
        error: `Missing Google OAuth env: ${missing.join(", ")}`
      });
    }

    const oauth2Client = getOAuthClient();

    // ✅ state = same JWT token (so callback can identify user)
    const token = req.headers.authorization?.split(" ")[1];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
      state: token, // ✅ important
    });

    return res.json({ ok: true, url });
  } catch (err) {
    console.error("GOOGLE CONNECT ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});

// ✅ 2) CALLBACK (Save tokens in DB)
router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const stateToken = req.query.state; // JWT from connect

    if (!code) return res.status(400).send("Missing code");
    if (!stateToken) return res.status(400).send("Missing state");

    // ✅ decode user from state JWT
    const decoded = jwt.verify(stateToken, process.env.JWT_SECRET); // { id, role }
    const ownerId = decoded.id;

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // ✅ save tokens
    await OAuthToken.findOneAndUpdate(
      { ownerId },
      { ownerId, tokens },
      { upsert: true, new: true }
    );

    // ✅ redirect to frontend
    return res.redirect(`${process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT}?google=connected`);
  } catch (err) {
    console.error("GOOGLE CALLBACK ERROR:", err);
    return res.status(500).send("OAuth error");
  }
});

// ✅ 3) UPLOAD FILE (to client's folderId)
router.post("/upload/:clientId", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "file required" });

    const client = await Client.findById(req.params.clientId);
    if (!client?.googleDriveFolderId) {
      return res.status(400).json({ ok: false, error: "Client Drive folderId missing" });
    }

    // ✅ tokens load
    const saved = await OAuthToken.findOne({ ownerId: req.user.id });
    if (!saved?.tokens) {
      return res.status(401).json({ ok: false, error: "Google not connected. Connect first." });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(saved.tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: req.file.originalname,
      parents: [client.googleDriveFolderId],
    };

    // ✅ IMPORTANT FIX: body must be a stream (NOT Buffer)
    const media = {
      mimeType: req.file.mimetype,
      body: Readable.from(req.file.buffer),
    };

    const resp = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink, webContentLink, parents",
      supportsAllDrives: true, // shared drive support
    });

    return res.json({ ok: true, file: resp.data });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server Error" });
  }
});

// ✅ LIST FILES IN CLIENT FOLDER
router.get("/list/:clientId", auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client?.googleDriveFolderId) {
      return res.status(400).json({ ok: false, error: "Client Drive folderId missing" });
    }

    const saved = await OAuthToken.findOne({ ownerId: req.user.id });
    if (!saved?.tokens) {
      return res.status(401).json({ ok: false, error: "Google not connected. Connect first." });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(saved.tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const folderId = client.googleDriveFolderId;

    const resp = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields:
        "files(id,name,mimeType,modifiedTime,size,webViewLink,webContentLink,iconLink)",
      orderBy: "modifiedTime desc",
      pageSize: 50,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return res.json({ ok: true, files: resp.data.files || [] });
  } catch (err) {
    console.error("LIST FILES ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server Error" });
  }
});


export default router;
