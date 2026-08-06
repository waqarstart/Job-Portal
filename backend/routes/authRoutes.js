import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

    const token = makeToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = makeToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
