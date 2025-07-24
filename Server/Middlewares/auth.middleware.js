import jwt from "jsonwebtoken";
import User from "../Models/auth.model.js";

export const createToken = (id, email) => {
    const token = jwt.sign(
        {
            id,
            email,
        },
        process.env.SECRET,
        {
            expiresIn: "5d",
        }
    );

    return token;
};

export const isAuthenticated = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                isLogin: false,
                message: "Authentication required. Please login.",
            });
        }

        jwt.verify(token, process.env.SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    isLogin: false,
                    message: "Invalid or expired token. Please login again.",
                });
            }

            const user = await User.findById(decoded.id);
            
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    isLogin: false,
                    message: "User account not found or inactive.",
                });
            }

            if (user.isBanned) {
                return res.status(403).json({
                    success: false,
                    isLogin: false,
                    message: "Account is banned.",
                    banReason: user.banReason,
                    banExpiresAt: user.banExpiresAt
                });
            }

            req.user = user;
            next();
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Authentication error: " + err.message,
        });
    }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            req.user = null;
            return next();
        }

        jwt.verify(token, process.env.SECRET, async (err, decoded) => {
            if (err) {
                req.user = null;
                return next();
            }

            const user = await User.findById(decoded.id);
            req.user = user && user.isActive && !user.isBanned ? user : null;
            next();
        });
    } catch (err) {
        req.user = null;
        next();
    }
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (req.user.role !== 'admin' || req.user.username !== 'omshrikhande') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};

// Check if user is supporter
export const isSupporter = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (req.user.role !== 'supporter' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Supporter access required. Please upgrade to supporter."
        });
    }

    next();
};

// Rate limiting middleware
export const createRateLimit = (windowMs, max, message) => {
    const attempts = new Map();

    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        
        // Clean old entries
        for (const [ip, data] of attempts.entries()) {
            if (now - data.resetTime > windowMs) {
                attempts.delete(ip);
            }
        }

        if (!attempts.has(key)) {
            attempts.set(key, {
                count: 1,
                resetTime: now
            });
            return next();
        }

        const userData = attempts.get(key);
        
        if (now - userData.resetTime > windowMs) {
            userData.count = 1;
            userData.resetTime = now;
            return next();
        }

        if (userData.count >= max) {
            return res.status(429).json({
                success: false,
                message: message || "Too many requests. Please try again later."
            });
        }

        userData.count++;
        next();
    };
};
