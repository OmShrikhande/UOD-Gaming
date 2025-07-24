import express from "express";
import {
  loginUser,
  isLogin,
  getAllUsers,
  registerUser,
  getUserProfile,
  updateProfile,
  upgradeToBecomeSupporter,
  getUserStats
} from "../Controllers/auth.controller.js";
import { isAuthenticated, isAdmin } from "../Middlewares/auth.middleware.js";
import {
  validateUserRegistration,
  validateUserLogin,
  validateSupporterUpgrade,
  validateObjectId,
  validatePagination
} from "../Middlewares/validation.js";

const router = express.Router();

// Public routes
router.post('/signup', validateUserRegistration, registerUser);
router.post('/login', validateUserLogin, loginUser);

// Protected routes
router.get('/profile', isAuthenticated, isLogin);
router.get('/profile/:userId', validateObjectId('userId'), getUserProfile);
router.put('/profile', isAuthenticated, updateProfile);
router.get('/stats', isAuthenticated, getUserStats);

// Supporter routes
router.post('/upgrade-supporter', isAuthenticated, validateSupporterUpgrade, upgradeToBecomeSupporter);

// Admin routes
router.get('/users', isAuthenticated, isAdmin, validatePagination, getAllUsers);

export default router;

