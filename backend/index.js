import express from  'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import teamRoutes from './routes/team.js';
import filesRoutes from "./routes/files.js";
import clientRoutes from "./routes/client.js";






dotenv.config();

console.log("CLIENT_ID VALUE:", process.env.GOOGLE_OAUTH_CLIENT_ID);


console.log("ENV CHECK CLIENT ID:", process.env.GOOGLE_OAUTH_CLIENT_ID);
console.log("ENV CHECK REDIRECT:", process.env.GOOGLE_OAUTH_REDIRECT_URI);


const app = express();
app.use("/api/client", clientRoutes);

// Middlewares 

// app.use(cors());


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://wortham-project.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server or Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);




// app.use(cors(...));
// app.options("*", cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/files", filesRoutes);


console.log("CREDS PATH:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log("CREDS JSON exists?:", !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON);


// DB Connection 


const MONGODB_URI = process.env.MONGODB_URI


mongoose
  .connect(MONGODB_URI, { dbName: "studio-app" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err.message));

  app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});


// test route
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend running",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
