import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: ""
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["CITIZEN", "ADMIN", "CONTRACTOR"],
    required: true
  }
});

export default mongoose.model("User", userSchema);
