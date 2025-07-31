import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import compression from "compression";
import morgan from "morgan";

// Import enhanced configurations
import dbConnection from "./config/database.js";
import { 
  helmetConfig, 
  rateLimiters, 
  securityHeaders, 
  sanitizeRequest 
} from "./config/security.js";
import { 
  logger, 
  httpLogger, 
  errorLogger, 
  logStartup, 
  logShutdown 
} from "./config/logger.js";

// Import routes
import authRouter from "./Routes/auth.route.js"; 
import gameRouter from "./Routes/game.route.js"; 
import paymentRouter from "./Routes/payment.route.js";
import groupRouter from "./Routes/group.route.js";
import chatRouter from "./Routes/chat.route.js";
import leaderboardRouter from "./Routes/leaderboard.route.js";

// Load environment variables
dotenv.config({
    path: "./.env",
});

// Validate required environment variables
const requiredEnvVars = ['MONGO_URL', 'SECRET', 'EMAIL_USER', 'EMAIL_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    logger.error('Missing required environment variables:', { missing: missingEnvVars });
    process.exit(1);
}

// Log server startup
logStartup();

const app = express();
const server = createServer(app);

// Enhanced Socket.IO setup with better configuration
const io = new Server(server, {
    cors: {
        origin: function(origin, callback) {
            const allowedOrigins = [
                process.env.FRONTEND_URL || "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
            ];
            
            if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS policy'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    },
    // Enhanced Socket.IO configuration
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: true,
    transports: ['websocket', 'polling']
});

// Enhanced CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:5173", 
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        ];
        
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            logger.warn('CORS blocked request from origin:', { origin });
            callback(new Error('🚫 Not allowed by CORS policy'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'X-CSRF-Token',
        'X-API-Version'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Response-Time'],
    maxAge: 86400 // 24 hours
};

// Apply security middleware first
app.use(helmetConfig);
app.use(securityHeaders);
app.use(sanitizeRequest);

// Compression middleware for better performance
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// CORS middleware
app.use(cors(corsOptions));

// Request timing middleware
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// HTTP logging middleware
app.use(httpLogger);

// Body parsing middleware with enhanced security
app.use(express.json({ 
    limit: '50mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb',
    parameterLimit: 1000
}));

// Trust proxy for rate limiting and real IP detection
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// Static file serving with caching
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true
}));

// Enhanced rate limiting
app.use('/api/v1/auth/login', rateLimiters.auth);
app.use('/api/v1/auth/register', rateLimiters.auth);
app.use('/api/v1/auth/forgot-password', rateLimiters.passwordReset);
app.use('/api/v1/payments', rateLimiters.payment);
app.use('/api/v1/games/upload', rateLimiters.upload);
app.use('/api/v1/chat', rateLimiters.chat);
app.use('/api', rateLimiters.general);

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

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await dbConnection.healthCheck();
        const memoryUsage = process.memoryUsage();
        
        res.status(200).json({
            success: true,
            message: 'UOD Gaming Server is running!',
            timestamp: new Date().toISOString(),
            version: process.env.API_VERSION || '2.0.0',
            environment: process.env.NODE_ENV,
            uptime: process.uptime(),
            database: dbStatus,
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                cpuUsage: process.cpuUsage()
            }
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable',
            timestamp: new Date().toISOString()
        });
    }
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

// Enhanced error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
    // Handle specific error types
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'File too large. Maximum size allowed is 50MB.',
            code: 'FILE_TOO_LARGE'
        });
    }
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            errors: Object.values(err.errors).map(e => ({
                field: e.path,
                message: e.message,
                value: e.value
            }))
        });
    }
    
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message,
            code: 'UPLOAD_ERROR'
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            code: 'INVALID_ID'
        });
    }
    
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            success: false,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
            code: 'DUPLICATE_ENTRY',
            field
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
        });
    }
    
    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong!' 
            : err.message,
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
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

// Enhanced graceful shutdown
const gracefulShutdown = (signal) => {
    logShutdown(signal);
    
    server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
            // Close database connection
            await dbConnection.mongoose.connection.close();
            logger.info('Database connection closed');
            
            // Close any other connections (Redis, etc.)
            if (global.redisClient) {
                await global.redisClient.quit();
                logger.info('Redis connection closed');
            }
            
            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// Enhanced database connection and server startup
const startServer = async () => {
    try {
        // Connect to database
        await dbConnection.connect();
        logger.info('🎮 Connected to MongoDB successfully!');
        
        // Start HTTP server
        server.listen(port, () => {
            logger.info(`🚀 UOD Gaming Server is running on port ${port}`);
            logger.info(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            logger.info(`🎯 API Base URL: http://localhost:${port}/api/v1`);
            logger.info(`💳 UPI Payment ID: ${process.env.UPI_ID}`);
            logger.info(`📧 Admin Email: ${process.env.ADMIN_EMAIL}`);
            logger.info(`🔒 Environment: ${process.env.NODE_ENV}`);
            logger.info(`📊 Health Check: http://localhost:${port}/api/health`);
        });
        
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

export default app;
