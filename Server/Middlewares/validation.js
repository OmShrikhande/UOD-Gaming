import { body, param, query } from 'express-validator';

// User validation
export const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('displayName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name cannot exceed 50 characters')
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateSupporterUpgrade = [
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isLength({ min: 5 })
    .withMessage('Transaction ID must be at least 5 characters'),
  
  body('upiReference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('UPI reference cannot exceed 100 characters'),
  
  body('screenshot')
    .optional()
    .isURL()
    .withMessage('Screenshot must be a valid URL')
];

// Game validation
export const validateGameCreation = [
  body('title')
    .notEmpty()
    .withMessage('Game title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Game title must be between 3 and 100 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Game description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Game description must be between 10 and 2000 characters'),
  
  body('category')
    .isIn(['action', 'adventure', 'puzzle', 'strategy', 'racing', 'sports', 'arcade', 'rpg', 'simulation', 'platform', 'shooter', 'casual'])
    .withMessage('Invalid game category'),
  
  body('shortDescription')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  
  body('averagePlayTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Average play time must be a positive integer'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'expert'])
    .withMessage('Invalid difficulty level'),
  
  body('ageRating')
    .optional()
    .isIn(['everyone', 'teen', 'mature', 'adult'])
    .withMessage('Invalid age rating'),
  
  body('paymentTransactionId')
    .notEmpty()
    .withMessage('Payment transaction ID is required')
];

export const validateScoreSubmission = [
  body('score')
    .isInt({ min: 0 })
    .withMessage('Score must be a non-negative integer'),
  
  body('level')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Level must be a positive integer'),
  
  body('completionTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Completion time must be a non-negative integer'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

export const validateGameReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters')
];

// Group validation
export const validateGroupCreation = [
  body('name')
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Group name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Group name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('type')
    .optional()
    .isIn(['public', 'private', 'invite_only'])
    .withMessage('Invalid group type'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string')
];

// Chat validation
export const validateMessage = [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'game_invite', 'system'])
    .withMessage('Invalid message type'),
  
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Reply to must be a valid message ID')
];

export const validateReaction = [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be between 1 and 10 characters')
];

// Payment validation
export const validateGameUploadPayment = [
  body('gameTitle')
    .notEmpty()
    .withMessage('Game title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Game title must be between 3 and 100 characters'),
  
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isLength({ min: 5 })
    .withMessage('Transaction ID must be at least 5 characters'),
  
  body('upiReference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('UPI reference cannot exceed 100 characters'),
  
  body('screenshot')
    .optional()
    .isURL()
    .withMessage('Screenshot must be a valid URL')
];

export const validatePaymentVerification = [
  body('verificationNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Verification notes cannot exceed 500 characters')
];

export const validatePaymentRejection = [
  body('rejectionReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
];

// Tournament validation
export const validateTournamentCreation = [
  body('name')
    .notEmpty()
    .withMessage('Tournament name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('gameId')
    .isMongoId()
    .withMessage('Game ID must be a valid MongoDB ID'),
  
  body('type')
    .isIn(['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'ladder'])
    .withMessage('Invalid tournament type'),
  
  body('format')
    .isIn(['1v1', 'team', 'battle_royale', 'time_trial'])
    .withMessage('Invalid tournament format'),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 4, max: 256 })
    .withMessage('Max participants must be between 4 and 256'),
  
  body('entryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Entry fee must be a non-negative number'),
  
  body('prizePool')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prize pool must be a non-negative number')
];

// Parameter validation
export const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ID`)
];

// Query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const validateGameFilters = [
  ...validatePagination,
  query('category')
    .optional()
    .isIn(['all', 'action', 'adventure', 'puzzle', 'strategy', 'racing', 'sports', 'arcade', 'rpg', 'simulation', 'platform', 'shooter', 'casual'])
    .withMessage('Invalid category filter'),
  
  query('sortBy')
    .optional()
    .isIn(['popular', 'rating', 'players', 'downloads', 'newest'])
    .withMessage('Invalid sort criteria'),
  
  query('status')
    .optional()
    .isIn(['draft', 'pending_review', 'approved', 'rejected', 'suspended'])
    .withMessage('Invalid status filter')
];

export const validateLeaderboardFilters = [
  ...validatePagination,
  query('period')
    .optional()
    .isIn(['all', 'today', 'week', 'month', 'year'])
    .withMessage('Invalid period filter'),
  
  query('difficulty')
    .optional()
    .isIn(['all', 'easy', 'medium', 'hard', 'expert'])
    .withMessage('Invalid difficulty filter')
];

export const validateSearchQuery = [
  query('query')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
];