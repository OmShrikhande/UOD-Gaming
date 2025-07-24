import mongoose from "mongoose";

const { Schema } = mongoose;

const gameSchema = new Schema({
    title: {
        type: String,
        required: [true, "Game title is required"],
        trim: true,
        maxLength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Game description is required"],
        maxLength: [2000, "Description cannot exceed 2000 characters"]
    },
    shortDescription: {
        type: String,
        maxLength: [200, "Short description cannot exceed 200 characters"]
    },
    developer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['action', 'adventure', 'puzzle', 'strategy', 'racing', 'sports', 'arcade', 'rpg', 'simulation', 'platform', 'shooter', 'casual']
    },
    tags: [{
        type: String,
        maxLength: 30
    }],
    screenshots: [{
        url: String,
        caption: String,
        isPrimary: { type: Boolean, default: false }
    }],
    gameFiles: {
        webVersion: {
            htmlFile: String,
            jsFiles: [String],
            cssFiles: [String],
            assetFiles: [String],
            isActive: { type: Boolean, default: false }
        },
        downloadVersion: {
            windowsFile: String,
            macFile: String,
            linuxFile: String,
            androidFile: String,
            iosFile: String,
            fileSize: Number,
            version: String,
            releaseNotes: String
        }
    },
    gameplay: {
        minPlayers: { type: Number, default: 1 },
        maxPlayers: { type: Number, default: 1 },
        averagePlayTime: Number, // in minutes
        difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
        ageRating: { type: String, enum: ['everyone', 'teen', 'mature', 'adult'], default: 'everyone' }
    },
    statistics: {
        totalPlays: { type: Number, default: 0 },
        totalDownloads: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        totalReviews: { type: Number, default: 0 },
        uniquePlayers: { type: Number, default: 0 },
        averageSessionTime: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        views: { type: Number, default: 0 }
    },
    leaderboard: [{
        player: { type: Schema.Types.ObjectId, ref: 'User' },
        score: Number,
        level: Number,
        completionTime: Number,
        achievedAt: { type: Date, default: Date.now },
        metadata: Schema.Types.Mixed
    }],
    reviews: [{
        reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxLength: 1000 },
        helpful: { type: Number, default: 0 },
        reportedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        createdAt: { type: Date, default: Date.now }
    }],
    monetization: {
        isPaid: { type: Boolean, default: false },
        price: { type: Number, default: 0 },
        hasInAppPurchases: { type: Boolean, default: false },
        revenue: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'approved', 'rejected', 'suspended'],
        default: 'draft'
    },
    approvalInfo: {
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: Date,
        rejectionReason: String,
        approvalNotes: String
    },
    paymentInfo: {
        transactionId: String,
        paymentStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        paidAmount: { type: Number, default: 50 },
        paymentDate: { type: Date, default: Date.now },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
        upiReference: String
    },
    technical: {
        gameEngine: String,
        supportedPlatforms: [String],
        systemRequirements: {
            minimum: {
                os: String,
                processor: String,
                memory: String,
                graphics: String,
                storage: String
            },
            recommended: {
                os: String,
                processor: String,
                memory: String,
                graphics: String,
                storage: String
            }
        }
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    publishedAt: Date
});

// Index for better performance
gameSchema.index({ category: 1, status: 1 });
gameSchema.index({ 'statistics.averageRating': -1 });
gameSchema.index({ 'statistics.totalPlays': -1 });
gameSchema.index({ createdAt: -1 });
gameSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Game = mongoose.model("Game", gameSchema);

export default Game;
