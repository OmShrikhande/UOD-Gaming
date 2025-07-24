import bcrypt from "bcrypt";
import User from "../Models/auth.model.js";
import { createToken } from "../Middlewares/auth.middleware.js";

export const registerUser = async (req, res) => {
  try {
    console.log('Received signup request:', req.body);
    const { name, username, email, password } = req.body;
    const userName = name || username;

    if (!userName || !email || !password) {
      console.log('Missing fields:', { userName, email, password: password ? 'provided' : 'missing' });
      return res.status(400).json({ 
        success: false,
        message: "All Fields are required",
        missingFields: {
          username: !userName,
          email: !email,
          password: !password
        }
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide a valid email address" 
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long" 
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { name: userName }] });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists with this email or username" 
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: userName,
      email,
      password: hashPassword,
    });

    const token = createToken(user._id, user.email);

    res.status(201).json({
      success: true,
      message: "User Registered successfully",
      user,
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error: " + err.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (![email, password].every(Boolean)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the credentials",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exists",
      });
    }

    const checkMatchPass = await bcrypt.compare(password, user.password);

    if (!checkMatchPass) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const token = createToken(user._id, user.email);

    res.status(200).json({
      success: true,
      message: "User Logged In successfully",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const isLogin = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(200).json({
        success: true,
        isLogin: false,
      });
    }

    return res.status(200).json({
      success: true,
      isLogin: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};