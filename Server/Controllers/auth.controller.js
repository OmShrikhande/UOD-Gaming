import User from "../Models/auth.model.js";
import { Payment } from "../Models/payment.model.js";
import { GlobalLeaderboard } from "../Models/leaderboard.model.js";
import { createToken } from "../Middlewares/auth.middleware.js";
import { sendWelcomeSupporter } from "../utils/emailService.js";
import { validationResult } from "express-validator";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// Register new user
export const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { username, email, password, displayName, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? "Email already in use" 
          : "Username already taken",
        field: existingUser.email === email ? 'email' : 'username'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role === 'supporter' ? 'supporter' : 'user',
      profile: {
        displayName: displayName || username
      },
      security: {
        emailVerificationToken: crypto.randomBytes(32).toString('hex')
      }
    });

    await user.save();

    // Create global leaderboard entry
    await GlobalLeaderboard.create({
      player: user._id
    });

    // Generate JWT token
    const token = createToken(user._id, user.email);

    // Remove sensitive information
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.security;

    res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome to UOD Gaming!",
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        field
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: "Account temporarily locked due to too many failed login attempts. Please try again later."
      });
    }

    // Check if account is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Account banned${user.banReason ? ': ' + user.banReason : ''}`,
        banExpiresAt: user.banExpiresAt
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Reset login attempts on successful login
    if (user.security.loginAttempts > 0) {
      await User.updateOne(
        { _id: user._id },
        {
          $unset: { 'security.lockUntil': 1 },
          $set: { 'security.loginAttempts': 0, 'security.lastLogin': new Date() }
        }
      );
    } else {
      user.security.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = createToken(user._id, user.email);

    // Prepare user response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.security.twoFactorSecret;
    delete userResponse.security.resetPasswordToken;

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.profile.displayName || user.username}!`,
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
};

// Check if user is logged in
export const isLogin = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('groups', 'name type avatar')
      .select('-password -security.twoFactorSecret -security.resetPasswordToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        isLogin: false,
        message: "User not found"
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        isLogin: false,
        message: "Account is banned",
        banReason: user.banReason,
        banExpiresAt: user.banExpiresAt
      });
    }

    res.status(200).json({
      success: true,
      isLogin: true,
      user
    });

  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      isLogin: false,
      message: "Authentication check failed"
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user._id;

    const user = await User.findById(userId)
      .populate('gameStats.achievements')
      .populate('supporterInfo.gamesUploaded')
      .select('-password -security -notifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check privacy settings
    if (user.settings.profileVisibility === 'private' && 
        userId !== requestingUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "This profile is private"
      });
    }

    if (user.settings.profileVisibility === 'friends' && 
        userId !== requestingUserId.toString()) {
      const isFriend = user.friends.some(friend => 
        friend.user.toString() === requestingUserId.toString() && 
        friend.status === 'accepted'
      );
      
      if (!isFriend) {
        return res.status(403).json({
          success: false,
          message: "This profile is only visible to friends"
        });
      }
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile"
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;
    
    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.role;
    delete updates.security;
    delete updates.supporterInfo;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        ...updates,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -security.twoFactorSecret -security.resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

// Upgrade to supporter
export const upgradeToBecomeSupporter = async (req, res) => {
  try {
    const userId = req.user._id;
    const { transactionId, upiReference, screenshot } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required"
      });
    }

    // Check if user is already a supporter
    const user = await User.findById(userId);
    if (user.role === 'supporter') {
      return res.status(400).json({
        success: false,
        message: "You are already a supporter!"
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ transactionId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "This transaction ID has already been used"
      });
    }

    // Create payment record
    const payment = new Payment({
      user: userId,
      transactionId,
      upiTransactionId: upiReference || transactionId,
      amount: 50,
      purpose: 'supporter_upgrade',
      paymentDetails: {
        upiReference,
        screenshot
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await payment.save();

    // Send notification emails
    const userData = {
      username: user.username,
      email: user.email
    };
    
    const paymentData = {
      transactionId,
      amount: 50,
      purpose: 'Supporter Upgrade',
      paymentDate: new Date(),
      username: user.username,
      email: user.email,
      paymentId: payment._id,
      screenshot
    };

    // Import email service dynamically to avoid circular imports
    const emailService = await import('../utils/emailService.js');
    await emailService.sendPaymentVerificationRequest(paymentData);
    await emailService.sendPaymentConfirmation(userData, paymentData);

    res.status(201).json({
      success: true,
      message: "Payment submitted successfully! We'll verify it within 24 hours and notify you via email.",
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });

  } catch (error) {
    console.error('Supporter upgrade error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to process supporter upgrade"
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    
    // Build query
    let query = {};
    
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'banned') query.isBanned = true;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.displayName': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -security')
      .populate('gameStats.achievements')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('gameStats supporterInfo')
      .populate('gameStats.achievements');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get global leaderboard position
    const globalStats = await GlobalLeaderboard.findOne({ player: userId });

    res.status(200).json({
      success: true,
      stats: {
        gameStats: user.gameStats,
        supporterInfo: user.supporterInfo,
        globalRank: globalStats?.globalRank || null,
        level: globalStats?.level || { current: 1, experience: 0 }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics"
    });
  }
};