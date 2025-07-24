import express from "express";
import {
  createGame,
  getAllGames,
  getGameById,
  playGame,
  downloadGame,
  submitScore,
  getGameLeaderboard,
  addGameReview,
  getUserGames,
  displayHighscore,
  upload
} from "../Controllers/game.controller.js";
import { isAuthenticated, isSupporter, optionalAuth } from "../Middlewares/auth.middleware.js";
import {
  validateGameCreation,
  validateScoreSubmission,
  validateGameReview,
  validateObjectId,
  validateGameFilters,
  validateLeaderboardFilters
} from "../Middlewares/validation.js";

const router = express.Router();

// Public routes
router.get('/', validateGameFilters, getAllGames);
router.get('/:gameId', validateObjectId('gameId'), optionalAuth, getGameById);
router.get('/:gameId/leaderboard', validateObjectId('gameId'), validateLeaderboardFilters, getGameLeaderboard);
router.get('/:gameId/highscore', validateObjectId('gameId'), displayHighscore);

// Protected routes
router.post('/upload', 
  isAuthenticated, 
  isSupporter, 
  upload.fields([
    { name: 'screenshots', maxCount: 5 },
    { name: 'gameFiles', maxCount: 10 }
  ]), 
  validateGameCreation, 
  createGame
);

router.post('/:gameId/play', validateObjectId('gameId'), optionalAuth, playGame);
router.get('/:gameId/download', validateObjectId('gameId'), optionalAuth, downloadGame);
router.post('/:gameId/score', validateObjectId('gameId'), isAuthenticated, validateScoreSubmission, submitScore);
router.post('/:gameId/review', validateObjectId('gameId'), isAuthenticated, validateGameReview, addGameReview);
router.get('/user/my-games', isAuthenticated, getUserGames);

export default router;
