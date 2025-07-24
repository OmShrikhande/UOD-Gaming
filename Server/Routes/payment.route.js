import express from "express";
import {
  submitGameUploadPayment,
  verifyPayment,
  rejectPayment,
  getUserPayments,
  getAllPayments,
  getPaymentStats
} from "../Controllers/payment.controller.js";
import { isAuthenticated, isAdmin, isSupporter } from "../Middlewares/auth.middleware.js";
import {
  validateGameUploadPayment,
  validatePaymentVerification,
  validatePaymentRejection,
  validateObjectId,
  validatePagination
} from "../Middlewares/validation.js";

const router = express.Router();

// Supporter routes
router.post('/game-upload', 
  isAuthenticated, 
  isSupporter, 
  validateGameUploadPayment, 
  submitGameUploadPayment
);

// User routes
router.get('/my-payments', isAuthenticated, validatePagination, getUserPayments);

// Admin routes
router.get('/all', isAuthenticated, isAdmin, validatePagination, getAllPayments);
router.get('/stats', isAuthenticated, isAdmin, getPaymentStats);
router.post('/:paymentId/verify', 
  isAuthenticated, 
  isAdmin, 
  validateObjectId('paymentId'), 
  validatePaymentVerification, 
  verifyPayment
);
router.post('/:paymentId/reject', 
  isAuthenticated, 
  isAdmin, 
  validateObjectId('paymentId'), 
  validatePaymentRejection, 
  rejectPayment
);

export default router;