import express from "express";
import {
  getGlobalLeaderboard,
  getGameLeaderboard,
  getUserLeaderboardPosition,
  getUserGameHistory,
  createTournament,
  getTournaments,
  joinTournament,
  getTournamentById,
  updateGlobalRankings
} from "../Controllers/leaderboard.controller.js";
import { isAuthenticated, isSupporter, isAdmin, optionalAuth } from "../Middlewares/auth.middleware.js";
import {
  validateTournamentCreation,
  validateObjectId,
  validateLeaderboardFilters,
  validatePagination
} from "../Middlewares/validation.js";

const router = express.Router();

// Public leaderboard routes
router.get('/global', validateLeaderboardFilters, getGlobalLeaderboard);
router.get('/game/:gameId', validateObjectId('gameId'), validateLeaderboardFilters, getGameLeaderboard);

// User-specific routes
router.get('/user/position', isAuthenticated, getUserLeaderboardPosition);
router.get('/user/position/:gameId', isAuthenticated, validateObjectId('gameId'), getUserLeaderboardPosition);
router.get('/user/history', isAuthenticated, validatePagination, getUserGameHistory);

// Tournament routes
router.get('/tournaments', validatePagination, getTournaments);
router.get('/tournaments/:tournamentId', validateObjectId('tournamentId'), getTournamentById);
router.post('/tournaments/create', 
  isAuthenticated, 
  isSupporter, 
  validateTournamentCreation, 
  createTournament
);
router.post('/tournaments/:tournamentId/join', 
  isAuthenticated, 
  validateObjectId('tournamentId'), 
  joinTournament
);

// Admin routes
router.post('/update-rankings', isAuthenticated, isAdmin, updateGlobalRankings);

export default router;