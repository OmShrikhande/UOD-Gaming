import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes
import authRouter from "./Routes/auth.route.js"; 
import gameRouter from "./Routes/game.route.js"; 
import paymentRouter from "./Routes/payment.route.js";
import groupRouter from "./Routes/group.route.js";
import chatRouter from "./Routes/chat.route.js";
import leaderboardRouter from "./Routes/leaderboard.route.js";

// Import middleware
import { createRateLimit } from "./Middlewares/auth.middleware.js";

dotenv.config({
    path: "./.env",
});

const app = express();
const server = createServer(app);

// Socket.IO setup for real-time chat
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Configure CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy for rate limiting
app.set('trust proxy', true);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting middleware
const authLimiter = createRateLimit(15 * 60 * 1000, 5, "Too many authentication attempts");
const generalLimiter = createRateLimit(60 * 1000, 100, "Too many requests");

// Apply rate limiting
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/signup', authLimiter);
app.use('/api', generalLimiter);

// Make io available to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// API Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/games", gameRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/leaderboard", leaderboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'UOD Gaming Server is running!',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user to their personal room
    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined personal room`);
    });

    // Join group chat room
    socket.on('join_group', (groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`User joined group ${groupId}`);
    });

    // Leave group chat room
    socket.on('leave_group', (groupId) => {
        socket.leave(`group_${groupId}`);
        console.log(`User left group ${groupId}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
        if (data.groupId) {
            socket.to(`group_${data.groupId}`).emit('user_typing', {
                userId: data.userId,
                username: data.username
            });
        } else if (data.recipientId) {
            socket.to(`user_${data.recipientId}`).emit('user_typing', {
                userId: data.userId,
                username: data.username
            });
        }
    });

    socket.on('typing_stop', (data) => {
        if (data.groupId) {
            socket.to(`group_${data.groupId}`).emit('user_stopped_typing', {
                userId: data.userId
            });
        } else if (data.recipientId) {
            socket.to(`user_${data.recipientId}`).emit('user_stopped_typing', {
                userId: data.userId
            });
        }
    });

    // Handle user online status
    socket.on('user_online', (userId) => {
        socket.broadcast.emit('user_status_change', {
            userId,
            status: 'online'
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Handle offline status here if needed
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'File too large. Maximum size allowed is 50MB.'
        });
    }
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
        });
    }
    
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong!' 
            : err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        availableEndpoints: {
            auth: '/api/v1/auth',
            games: '/api/v1/games',
            payments: '/api/v1/payments',
            groups: '/api/v1/groups',
            chat: '/api/v1/chat',
            leaderboard: '/api/v1/leaderboard'
        }
    });
});

const port = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
});

// Database connection with better error handling
mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('🎮 Connected to MongoDB successfully!');
        server.listen(port, () => {
            console.log(`🚀 UOD Gaming Server is running on port ${port}`);
            console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log(`🎯 API Base URL: http://localhost:${port}/api/v1`);
            console.log(`💳 UPI Payment ID: omshrikhande73@oksbi`);
            console.log(`📧 Admin Email: omshrikhande73@gmail.com`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB');
});

export default app;
