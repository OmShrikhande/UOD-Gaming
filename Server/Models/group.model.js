import mongoose from "mongoose";

const { Schema } = mongoose;

const groupSchema = new Schema({
    name: {
        type: String,
        required: [true, "Group name is required"],
        trim: true,
        maxLength: [50, "Group name cannot exceed 50 characters"],
        minLength: [3, "Group name should be at least 3 characters"]
    },
    description: {
        type: String,
        maxLength: [500, "Description cannot exceed 500 characters"]
    },
    avatar: {
        type: String,
        default: null
    },
    type: {
        type: String,
        enum: ['public', 'private', 'invite_only'],
        default: 'public'
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        permissions: {
            canInvite: { type: Boolean, default: false },
            canKick: { type: Boolean, default: false },
            canManageMessages: { type: Boolean, default: false },
            canManageEvents: { type: Boolean, default: false }
        }
    }],
    bannedMembers: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        bannedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        bannedAt: { type: Date, default: Date.now },
        banExpiresAt: Date
    }],
    settings: {
        maxMembers: { type: Number, default: 100 },
        allowInvites: { type: Boolean, default: true },
        moderateMessages: { type: Boolean, default: false },
        allowFileUploads: { type: Boolean, default: true },
        welcomeMessage: String
    },
    categories: [{
        name: String,
        description: String,
        channels: [{
            name: String,
            type: { type: String, enum: ['text', 'voice', 'announcement'], default: 'text' },
            description: String,
            isPrivate: { type: Boolean, default: false },
            allowedRoles: [String],
            createdAt: { type: Date, default: Date.now }
        }]
    }],
    tags: [String],
    statistics: {
        totalMembers: { type: Number, default: 0 },
        totalMessages: { type: Number, default: 0 },
        activeMembers: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for better performance
groupSchema.index({ name: 'text', description: 'text', tags: 'text' });
groupSchema.index({ type: 1, isActive: 1 });
groupSchema.index({ 'statistics.totalMembers': -1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;