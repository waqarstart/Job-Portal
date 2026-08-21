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

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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

app.get("/", (req, res) => res.send("Job Portal API is running."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
