import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import savedJobRoutes from "./routes/savedJobRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import cvRoutes from "./routes/cvRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";

dotenv.config();
// Also try repo-root .env when running from /backend
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

connectDB();

const app = express();

// =========================
// CORS CONFIGURATION
// =========================

const allowedOrigins = [
  "http://localhost:5173",
  "https://job-portal-frontend-blue-zeta.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked request from origin: ${origin}`)
      );
    },

    credentials: true,
  })
);

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// STATIC UPLOADS
// =========================

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// =========================
// API ROUTES
// =========================

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cvs", cvRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/newsletter", newsletterRoutes);

// =========================
// ROOT
// =========================

app.get("/", (req, res) => {
  res.send("Job Portal API is running.");
});

// =========================
// START SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});