import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group'
    },
    content: {
        type: String,
        required: [true, "Message content is required"],
        maxLength: [2000, "Message cannot exceed 2000 characters"]
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'game_invite', 'system'],
        default: 'text'
    },
    attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String
    }],
    metadata: {
        gameInvite: {
            gameId: { type: Schema.Types.ObjectId, ref: 'Game' },
            lobbyId: String,
            expiresAt: Date
        },
        systemMessage: {
            action: String,
            targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
            details: Schema.Types.Mixed
        }
    },
    reactions: [{
        emoji: String,
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        count: { type: Number, default: 0 }
    }],
    readBy: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    editedAt: Date,
    deletedAt: Date,
    isDeleted: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    pinnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    pinnedAt: Date,
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    createdAt: { type: Date, default: Date.now }
});

// Conversation schema for direct messages
const conversationSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastActivity: { type: Date, default: Date.now },
    unreadCounts: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 }
    }],
    isArchived: { type: Boolean, default: false },
    archivedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    settings: {
        muteNotifications: [{
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            mutedUntil: Date
        }]
    },
    createdAt: { type: Date, default: Date.now }
});

// Index for better performance
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

const Message = mongoose.model("Message", messageSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);

export { Message, Conversation };