import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  sendGroupMessage,
  sendDirectMessage,
  getGroupMessages,
  getDirectMessages,
  getUserConversations,
  deleteMessage,
  editMessage,
  addReaction,
  searchMessages
} from "../Controllers/chat.controller.js";
import { isAuthenticated } from "../Middlewares/auth.middleware.js";
import {
  validateMessage,
  validateReaction,
  validateObjectId,
  validatePagination,
  validateSearchQuery
} from "../Middlewares/validation.js";

// Configure multer for chat file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'chat');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx', '.mp3', '.wav', '.mp4', '.avi'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and media files are allowed.'));
    }
  }
});

const router = express.Router();

// Group messaging
router.post('/group/:groupId', 
  isAuthenticated, 
  validateObjectId('groupId'), 
  upload.array('attachments', 5),
  validateMessage, 
  sendGroupMessage
);

router.get('/group/:groupId', 
  isAuthenticated, 
  validateObjectId('groupId'), 
  validatePagination, 
  getGroupMessages
);

// Direct messaging
router.post('/direct/:recipientId', 
  isAuthenticated, 
  validateObjectId('recipientId'), 
  upload.array('attachments', 5),
  validateMessage, 
  sendDirectMessage
);

router.get('/direct/:recipientId', 
  isAuthenticated, 
  validateObjectId('recipientId'), 
  validatePagination, 
  getDirectMessages
);

// User conversations
router.get('/conversations', isAuthenticated, validatePagination, getUserConversations);

// Message management
router.delete('/message/:messageId', 
  isAuthenticated, 
  validateObjectId('messageId'), 
  deleteMessage
);

router.put('/message/:messageId', 
  isAuthenticated, 
  validateObjectId('messageId'), 
  validateMessage, 
  editMessage
);

router.post('/message/:messageId/react', 
  isAuthenticated, 
  validateObjectId('messageId'), 
  validateReaction, 
  addReaction
);

// Search messages
router.get('/search', isAuthenticated, validateSearchQuery, searchMessages);

export default router;