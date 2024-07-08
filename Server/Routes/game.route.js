import express from 'express';
import { displayHighscore } from '../Controllers/game.controller.js';
import { isAuthenticated } from '../Middlewares/auth.middleware.js';

const router = express.Router();

// Route to display highscore for a specific game title
// Example: GET /api/games/highscore/:title
router.get('/highscore/:title',
    isAuthenticated, // Middleware to authenticate user
    displayHighscore // Controller function to display highscore
);

export default router;
