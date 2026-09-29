import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { username, password, role, name } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: "username, password, and role are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      name: name || username,
      password: hashedPassword,
      role
    });

    res.json({ message: "User created", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      role: user.role,
      userId: user._id,
      name: user.name || user.username
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
