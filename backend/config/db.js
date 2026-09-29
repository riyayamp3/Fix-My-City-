import mongoose from "mongoose";

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    if (uri && !uri.includes("retryWrites=true") && !uri.includes("w=majority")) {
      uri += (uri.includes("?") ? "&" : "?") + "retryWrites=true&w=majority";
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4, // Force IPv4
    });
    console.log("MongoDB Connected");
  } catch (error) {
    const msg = error.message || "";
    const code = error.code || "";
    console.error("MongoDB Connection Error (full):", msg);
    if (msg.includes("ECONNREFUSED") || code === "ECONNREFUSED" || msg.includes("MongoServerSelectionError")) {
      console.error("Could not reach Atlas. Retrying in 5s...");
    }
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
