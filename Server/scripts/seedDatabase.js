import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../Models/auth.model.js';
import Game from '../Models/game.model.js';
import { GlobalLeaderboard } from '../Models/leaderboard.model.js';

// Load env variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/uod-gaming';

const seedData = async () => {
    try {
        console.log('⏳ Connecting to MongoDB at:', MONGO_URL);
        await mongoose.connect(MONGO_URL);
        console.log('✅ Connected to MongoDB.');

        // 1. Clear database
        console.log('🧹 Clearing existing collections...');
        await User.deleteMany({});
        await Game.deleteMany({});
        await GlobalLeaderboard.deleteMany({});
        console.log('✅ Collections cleared.');

        // 2. Create Admin Developer User
        console.log('👤 Creating default admin developer...');
        const adminUser = new User({
            username: 'omshrikhande',
            email: 'omshrikhande73@gmail.com',
            password: 'Password@123', // Will be hashed by pre-save hooks
            role: 'admin',
            profile: {
                displayName: 'Om Shrikhande',
                bio: 'Creator & Administrator of UOD Gaming.',
                country: 'India'
            },
            supporterInfo: {
                isPaidSupporter: true,
                supporterSince: new Date(),
                gamesUploaded: 9
            }
        });
        await adminUser.save();
        console.log('✅ Admin developer created.');

        // 3. Create Global Leaderboard for Admin
        await GlobalLeaderboard.create({
            player: adminUser._id,
            globalRank: 1,
            overallStats: {
                totalScore: 1000,
                totalGames: 10,
                averageScore: 100,
                bestScore: 250
            }
        });

        // 4. Create default games list
        console.log('🎮 Seeding default games list...');
        const games = [
            {
                title: "Snake Arcade",
                description: "Classic neon arcade Snake with dynamic difficulty speed scaling, audio synths, and particles!",
                shortDescription: "Neon classic arcade Snake game.",
                category: "action",
                tags: ["Retro", "Arcade", "Singleplayer"],
                screenshots: [{ url: "/snake_icon.png", caption: "Snake Arcade Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },
            {
                title: "Tic Tac Toe Duo",
                description: "Play Tic Tac Toe locally with custom names, round tracking, turn indicators, and neon animations!",
                shortDescription: "Duo locally playable Tic Tac Toe.",
                category: "strategy",
                tags: ["Board", "Multiplayer", "Local"],
                screenshots: [{ url: "/ttt_icon.png", caption: "Tic Tac Toe Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 2, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },
            {
                title: "Color Guesser RGB",
                description: "Test your quickness and luck by matching hex/RGB color codes to correct preview swatches!",
                shortDescription: "Color guessing game using RGB codes.",
                category: "puzzle",
                tags: ["Logic", "Casual", "Trivia"],
                screenshots: [{ url: "/color_icon.png", caption: "Color Guesser Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },
            {
                title: "Memory Card Match",
                description: "Flip and match custom neon icons under active move counters, scoring multipliers, and visual feedback!",
                shortDescription: "Sleek memory matching logic game.",
                category: "puzzle",
                tags: ["Logic", "Memory", "Singleplayer"],
                screenshots: [{ url: "/memory_icon.png", caption: "Memory Card Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },
            {
                title: "Cyber Block Stacker",
                description: "Classic tetromino falling-block puzzle. Move, rotate, slide, and hard drop blocks to clear rows!",
                shortDescription: "Classic block falling stacker.",
                category: "puzzle",
                tags: ["Retro", "Puzzle", "Singleplayer"],
                screenshots: [{ url: "/tetris_icon.png", caption: "Block Stacker Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },
            {
                title: "Neon Brick Breaker",
                description: "Completely redesigned physics breakout bouncer! Control the neon paddle to destroy glass bricks with particles and screen shake!",
                shortDescription: "Redesigned breakout arcade bouncer.",
                category: "action",
                tags: ["Arcade", "Physics", "Singleplayer"],
                screenshots: [{ url: "/brick_icon.png", caption: "Brick Breaker Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },

            {
                title: "Cyber Falcon",
                description: "Thrust-based gravity avoider. Guide the ship through gaps between scrolling laser pillar obstacles!",
                shortDescription: "Thrust physics endless avoider.",
                category: "action",
                tags: ["Endless", "Survival", "Singleplayer"],
                screenshots: [{ url: "/falcon_icon.png", caption: "Cyber Falcon Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },
            {
                title: "Neon Stack Tower",
                description: "A precision timing block-stacker. Drop sliding blocks to build a tower—any offset portions are cut away!",
                shortDescription: "Sleek stack tower block puzzle.",
                category: "puzzle",
                tags: ["Precision", "Reflex", "Singleplayer"],
                screenshots: [{ url: "/stack_icon.png", caption: "Tower Stack Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },
            {
                title: "Cyber Grid 1-25",
                description: "A cognitive speed-finder grid game. Find and click numbers 1 through 25 in sequential order as fast as you can!",
                shortDescription: "Cognitive speed find sequential grid.",
                category: "casual",
                tags: ["Logic", "Reflex", "Casual"],
                screenshots: [{ url: "/schulte_icon.png", caption: "Grid Speed Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            },
            {
                title: "Space Obstacle",
                description: "Top-down endless space runner! Pilot a neon ship, dodge procedurally generated asteroids, and survive the scrolling starfield!",
                shortDescription: "Top-down endless space runner.",
                category: "action",
                tags: ["Endless", "Survival", "Action"],
                screenshots: [{ url: "/falcon_icon.png", caption: "Space Obstacle Icon", isPrimary: true }],
                gameplay: { minPlayers: 1, maxPlayers: 1, difficulty: "medium" },
                developer: adminUser._id,
                status: "approved",
                isActive: true,
                publishedAt: new Date()
            }
        ];

        for (const gameData of games) {
            const game = new Game(gameData);
            await game.save();
        }
        console.log('✅ Games seeded successfully.');

        await mongoose.disconnect();
        console.log('🔌 Database disconnected.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding process failed:', error);
        process.exit(1);
    }
};

seedData();
