import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

import dns from "dns";
dns.setServers(["8.8.8.8"]);

dotenv.config();

const [email, password, name = "Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.log("Usage: npm run create-admin -- <email> <password> [name]");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);

  const hashed = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.role = "admin";
    existing.password = hashed;
    existing.authProvider = "local";
    await existing.save();
    console.log(`Existing user promoted to admin: ${email}`);
  } else {
    await User.create({
      name,
      email,
      password: hashed,
      role: "admin",
      authProvider: "local",
    });
    console.log(`Admin created: ${email}`);
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}