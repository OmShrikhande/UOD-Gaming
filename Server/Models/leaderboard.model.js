import mongoose from "mongoose";

const { Schema } = mongoose;

const leaderboardEntrySchema = new Schema({
    player: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    game: {
        type: Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    level: {
        type: Number,
        default: 1
    },
    completionTime: {
        type: Number, // in seconds
        default: null
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert'],
        default: 'medium'
    },
    gameMode: {
        type: String,
        default: 'standard'
    },
    metadata: {
        achievements: [String],
        powerUpsUsed: [String],
        streaks: Number,
        accuracy: Number,
        totalMoves: Number,
        bonusPoints: Number,
        penaltyPoints: Number,
        customData: Schema.Types.Mixed
    },
    proof: {
        screenshot: String,
        videoUrl: String,
        gameReplay: String,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date
    },
    position: {
        global: Number,
        weekly: Number,
        monthly: Number,
        yearly: Number
    },
    isActive: { type: Boolean, default: true },
    submittedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Global leaderboard schema for overall rankings
const globalLeaderboardSchema = new Schema({
    player: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    overallStats: {
        totalScore: { type: Number, default: 0 },
        totalGames: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        bestScore: { type: Number, default: 0 },
        totalPlayTime: { type: Number, default: 0 }, // in minutes
        gamesCompleted: { type: Number, default: 0 },
        achievements: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 }, // percentage
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 }
    },
    categoryStats: [{
        category: String,
        totalScore: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        bestScore: { type: Number, default: 0 },
        rank: Number
    }],
    monthlyStats: [{
        month: { type: Date, required: true },
        score: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
        rank: Number
    }],
    weeklyStats: [{
        week: { type: Date, required: true },
        score: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
        rank: Number
    }],
    badges: [{
        name: String,
        description: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
        category: String,
        rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' }
    }],
    level: {
        current: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        experienceToNext: { type: Number, default: 100 }
    },
    globalRank: { type: Number, default: null },
    countryRank: { type: Number, default: null },
    lastActive: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

// Tournament leaderboard schema
const tournamentSchema = new Schema({
    name: {
        type: String,
        required: true,
        maxLength: [100, "Tournament name cannot exceed 100 characters"]
    },
    description: {
        type: String,
        maxLength: [1000, "Description cannot exceed 1000 characters"]
    },
    game: {
        type: Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    organizer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'ladder'],
        default: 'single_elimination'
    },
    format: {
        type: String,
        enum: ['1v1', 'team', 'battle_royale', 'time_trial'],
        default: '1v1'
    },
    participants: [{
        player: { type: Schema.Types.ObjectId, ref: 'User' },
        team: String,
        seed: Number,
        registeredAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['registered', 'active', 'eliminated', 'withdrawn'], default: 'registered' }
    }],
    brackets: [{
        round: Number,
        matches: [{
            player1: { type: Schema.Types.ObjectId, ref: 'User' },
            player2: { type: Schema.Types.ObjectId, ref: 'User' },
            winner: { type: Schema.Types.ObjectId, ref: 'User' },
            score1: Number,
            score2: Number,
            scheduledAt: Date,
            completedAt: Date,
            status: { type: String, enum: ['pending', 'in_progress', 'completed', 'disputed'], default: 'pending' }
        }]
    }],
    prizes: [{
        position: Number,
        reward: String,
        amount: Number,
        currency: String
    }],
    rules: {
        maxParticipants: Number,
        registrationDeadline: Date,
        gameRules: String,
        eligibility: String
    },
    schedule: {
        registrationStart: Date,
        registrationEnd: Date,
        tournamentStart: Date,
        tournamentEnd: Date
    },
    status: {
        type: String,
        enum: ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'],
        default: 'draft'
    },
    isPublic: { type: Boolean, default: true },
    entryFee: { type: Number, default: 0 },
    prizePool: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for better performance
leaderboardEntrySchema.index({ game: 1, score: -1 });
leaderboardEntrySchema.index({ player: 1, game: 1 });
leaderboardEntrySchema.index({ submittedAt: -1 });

globalLeaderboardSchema.index({ 'overallStats.totalScore': -1 });
globalLeaderboardSchema.index({ globalRank: 1 });
globalLeaderboardSchema.index({ lastActive: -1 });

tournamentSchema.index({ game: 1, status: 1 });
tournamentSchema.index({ 'schedule.registrationEnd': 1 });

const LeaderboardEntry = mongoose.model("LeaderboardEntry", leaderboardEntrySchema);
const GlobalLeaderboard = mongoose.model("GlobalLeaderboard", globalLeaderboardSchema);
const Tournament = mongoose.model("Tournament", tournamentSchema);

export { LeaderboardEntry, GlobalLeaderboard, Tournament };