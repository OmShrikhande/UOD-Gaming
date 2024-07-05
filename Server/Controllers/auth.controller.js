import bcrypt from "bcrypt";
import User from "../Models/auth.model.js";
import { createToken } from "../middlewares/auth.middleware.js";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { name }] });

        if ([name, email, password].some((field) => field?.trim() === "")) {
            return res.status(400).json({ message: "All Fields are required" });
        }

        if (existingUser) {
            return res.status(400).json({ message: "User is already Exist" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
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
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email && !password) {
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
        res.status(500).json({
            success: false,
            message: error.message,
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

        if (user) {
            return res.status(200).json({
                success: true,
                isLogin: true,
                user,
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
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
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

