import mongoose from "mongoose";

export default async function connectDB() {
  try {
    // maxPoolSize: how many concurrent MongoDB connections mongoose keeps
    // open. Default is 100, which is fine for most traffic, but we set it
    // explicitly here so it's easy to tune if concurrent load grows.
    // This doesn't change any query behavior — same results, same API.
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 100,
    });
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
