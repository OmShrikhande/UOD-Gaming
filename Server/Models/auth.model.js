import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please enter your username"],
        unique: true,
        maxLength: [20, "Username cannot exceed 20 characters"],
        minLength: [3, "Username should have more than 3 characters"],
        match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"]
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
        minLength: [8, "Password should be at least 8 characters long"]
    },
    role: {
        type: String,
        enum: ['user', 'supporter', 'admin'],
        default: 'user'
    },
    profile: {
        displayName: {
            type: String,
            maxLength: [50, "Display name cannot exceed 50 characters"]
        },
        avatar: {
            type: String,
            default: null
        },
        bio: {
            type: String,
            maxLength: [500, "Bio cannot exceed 500 characters"]
        },
        dateOfBirth: Date,
        country: String,
        socialLinks: {
            discord: String,
            steam: String,
            twitch: String,
            youtube: String
        }
    },
    gameStats: {
        totalGamesPlayed: { type: Number, default: 0 },
        totalScore: { type: Number, default: 0 },
        totalWins: { type: Number, default: 0 },
        totalLosses: { type: Number, default: 0 },
        achievements: [{
            name: String,
            description: String,
            unlockedAt: { type: Date, default: Date.now },
            icon: String
        }],
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 }
    },
    supporterInfo: {
        isPaidSupporter: { type: Boolean, default: false },
        supporterSince: Date,
        gamesUploaded: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        paymentHistory: [{
            amount: Number,
            purpose: String,
            transactionId: String,
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            paymentDate: { type: Date, default: Date.now },
            verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            verifiedAt: Date
        }]
    },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    friends: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' }
    }],
    notifications: [{
        title: String,
        message: String,
        type: { type: String, enum: ['info', 'success', 'warning', 'error'] },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        link: String
    }],
    settings: {
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
        showOnlineStatus: { type: Boolean, default: true }
    },
    security: {
        loginAttempts: { type: Number, default: 0 },
        lockUntil: Date,
        lastLogin: Date,
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: String,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        emailVerified: { type: Boolean, default: false },
        emailVerificationToken: String
    },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: String,
    banExpiresAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Virtual for account locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { 'security.lockUntil': 1 },
            $set: { 'security.loginAttempts': 1 }
        });
    }
    
    const updates = { $inc: { 'security.loginAttempts': 1 } };
    
    if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

const User = mongoose.model("User", userSchema);
export default User;
