import express from "express";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

const router = express.Router();

router.post("/subscribe", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      return res.json({ message: "You're already subscribed!", alreadySubscribed: true });
    }

    await NewsletterSubscriber.create({ email });
    res.status(201).json({ message: "Subscribed! You'll hear from us soon." });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ message: "You're already subscribed!", alreadySubscribed: true });
    }
    res.status(500).json({ message: err.message });
  }
});

export default router;
