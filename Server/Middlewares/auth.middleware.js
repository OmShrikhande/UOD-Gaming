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
                message: "Missing Token",
            });
        }

        jwt.verify(token, process.env.SECRET, async (err, user) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    isLogin: false,
                    message: err.message,
                });
            }

            req.user = await User.findById(user.id);
            next();
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
