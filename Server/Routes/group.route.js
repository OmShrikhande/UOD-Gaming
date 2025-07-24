import express from "express";
import {
  createGroup,
  getAllGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getUserGroups,
  updateGroup,
  deleteGroup
} from "../Controllers/group.controller.js";
import { isAuthenticated, isSupporter, optionalAuth } from "../Middlewares/auth.middleware.js";
import {
  validateGroupCreation,
  validateObjectId,
  validatePagination
} from "../Middlewares/validation.js";

const router = express.Router();

// Public routes
router.get('/', validatePagination, getAllGroups);
router.get('/:groupId', validateObjectId('groupId'), optionalAuth, getGroupById);

// Protected routes
router.post('/create', isAuthenticated, isSupporter, validateGroupCreation, createGroup);
router.post('/:groupId/join', isAuthenticated, validateObjectId('groupId'), joinGroup);
router.post('/:groupId/leave', isAuthenticated, validateObjectId('groupId'), leaveGroup);
router.get('/user/my-groups', isAuthenticated, validatePagination, getUserGroups);

// Group management routes (Admin/Moderator only)
router.put('/:groupId', isAuthenticated, validateObjectId('groupId'), updateGroup);
router.delete('/:groupId', isAuthenticated, validateObjectId('groupId'), deleteGroup);

export default router;