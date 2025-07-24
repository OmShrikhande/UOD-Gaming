import Game from '../Models/game.model.js';
import User from '../Models/auth.model.js';
import { Payment } from '../Models/payment.model.js';
import { LeaderboardEntry, GlobalLeaderboard } from '../Models/leaderboard.model.js';
import { validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'games');
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

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.zip', '.rar', '.7z', '.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.mp3', '.wav', '.ogg'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only game files, images, and audio files are allowed.'));
    }
  }
});

// Create/Upload new game
export const createGame = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const {
      title,
      description,
      shortDescription,
      category,
      tags,
      minPlayers,
      maxPlayers,
      averagePlayTime,
      difficulty,
      ageRating,
      paymentTransactionId
    } = req.body;

    // Check if user is a supporter
    const user = await User.findById(userId);
    if (user.role !== 'supporter') {
      return res.status(403).json({
        success: false,
        message: "Only supporters can upload games. Please upgrade to supporter first."
      });
    }

    // Verify payment for game upload
    const payment = await Payment.findOne({
      user: userId,
      transactionId: paymentTransactionId,
      purpose: 'game_upload',
      status: 'verified'
    });

    if (!payment) {
      return res.status(402).json({
        success: false,
        message: "Payment required. Please complete the ₹50 payment to upload your game."
      });
    }

    // Check if game title already exists
    const existingGame = await Game.findOne({ title });
    if (existingGame) {
      return res.status(409).json({
        success: false,
        message: "A game with this title already exists"
      });
    }

    // Process uploaded files
    const screenshots = [];
    const gameFiles = {
      webVersion: { jsFiles: [], cssFiles: [], assetFiles: [] },
      downloadVersion: {}
    };

    if (req.files) {
      // Process screenshots
      if (req.files.screenshots) {
        req.files.screenshots.forEach((file, index) => {
          screenshots.push({
            url: `/uploads/games/${file.filename}`,
            caption: `Screenshot ${index + 1}`,
            isPrimary: index === 0
          });
        });
      }

      // Process game files
      if (req.files.gameFiles) {
        req.files.gameFiles.forEach(file => {
          const ext = path.extname(file.originalname).toLowerCase();
          const filePath = `/uploads/games/${file.filename}`;
          
          if (ext === '.html') {
            gameFiles.webVersion.htmlFile = filePath;
          } else if (ext === '.js') {
            gameFiles.webVersion.jsFiles.push(filePath);
          } else if (ext === '.css') {
            gameFiles.webVersion.cssFiles.push(filePath);
          } else if (ext === '.zip' || ext === '.rar' || ext === '.7z') {
            gameFiles.downloadVersion.windowsFile = filePath;
            gameFiles.downloadVersion.fileSize = file.size;
          } else {
            gameFiles.webVersion.assetFiles.push(filePath);
          }
        });
      }
    }

    // Create new game
    const game = new Game({
      title,
      description,
      shortDescription,
      developer: userId,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      screenshots,
      gameFiles,
      gameplay: {
        minPlayers: minPlayers || 1,
        maxPlayers: maxPlayers || 1,
        averagePlayTime,
        difficulty: difficulty || 'medium',
        ageRating: ageRating || 'everyone'
      },
      paymentInfo: {
        transactionId: paymentTransactionId,
        paymentStatus: 'verified',
        paidAmount: 50,
        verifiedBy: payment.verification.verifiedBy,
        verifiedAt: payment.verification.verificationDate
      },
      status: 'pending_review'
    });

    await game.save();

    // Update payment to link with game
    payment.relatedEntity = {
      entityType: 'Game',
      entityId: game._id
    };
    await payment.save();

    // Update user stats
    user.supporterInfo.gamesUploaded += 1;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Game uploaded successfully! It's now pending review.",
      game: {
        id: game._id,
        title: game.title,
        category: game.category,
        status: game.status,
        createdAt: game.createdAt
      }
    });

  } catch (error) {
    console.error('Game creation error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to upload game"
    });
  }
};

// Get all games with filters
export const getAllGames = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sortBy = 'popular',
      status = 'approved',
      featured
    } = req.query;

    // Build query
    let query = { status, isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case 'rating':
        sortCriteria = { 'statistics.averageRating': -1 };
        break;
      case 'players':
        sortCriteria = { 'statistics.uniquePlayers': -1 };
        break;
      case 'downloads':
        sortCriteria = { 'statistics.totalDownloads': -1 };
        break;
      case 'newest':
        sortCriteria = { publishedAt: -1 };
        break;
      case 'popular':
      default:
        sortCriteria = { 'statistics.totalPlays': -1, 'statistics.averageRating': -1 };
        break;
    }

    const games = await Game.find(query)
      .populate('developer', 'username profile.displayName profile.avatar')
      .populate('reviews.reviewer', 'username profile.displayName')
      .sort(sortCriteria)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Game.countDocuments(query);

    // Get categories with counts
    const categories = await Game.aggregate([
      { $match: { status: 'approved', isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      games,
      categories,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch games"
    });
  }
};

// Get single game details
export const getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user?._id;

    const game = await Game.findById(gameId)
      .populate('developer', 'username profile.displayName profile.avatar gameStats')
      .populate('reviews.reviewer', 'username profile.displayName profile.avatar')
      .populate('leaderboard.player', 'username profile.displayName profile.avatar');

    if (!game || !game.isActive) {
      return res.status(404).json({
        success: false,
        message: "Game not found"
      });
    }

    // Increment view count
    game.statistics.views += 1;
    await game.save();

    // Get user's personal best if logged in
    let userBestScore = null;
    if (userId) {
      const userScore = await LeaderboardEntry.findOne({
        player: userId,
        game: gameId
      }).sort({ score: -1 });
      
      if (userScore) {
        userBestScore = userScore.score;
      }
    }

    res.status(200).json({
      success: true,
      game,
      userBestScore
    });

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game details"
    });
  }
};

// Play game (increment play count)
export const playGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user?._id;

    const game = await Game.findById(gameId);
    if (!game || !game.isActive || game.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: "Game not available"
      });
    }

    // Check if web version is available
    if (!game.gameFiles.webVersion.htmlFile) {
      return res.status(400).json({
        success: false,
        message: "Web version not available for this game"
      });
    }

    // Increment play statistics
    game.statistics.totalPlays += 1;
    
    // Track unique players
    if (userId) {
      const existingPlay = await LeaderboardEntry.findOne({
        player: userId,
        game: gameId
      });
      
      if (!existingPlay) {
        game.statistics.uniquePlayers += 1;
      }

      // Update user game stats
      const user = await User.findById(userId);
      user.gameStats.totalGamesPlayed += 1;
      await user.save();
    }

    await game.save();

    res.status(200).json({
      success: true,
      message: "Game started successfully",
      gameFiles: game.gameFiles.webVersion
    });

  } catch (error) {
    console.error('Play game error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to start game"
    });
  }
};

// Download game
export const downloadGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { platform = 'windows' } = req.query;
    const userId = req.user?._id;

    const game = await Game.findById(gameId);
    if (!game || !game.isActive || game.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: "Game not available"
      });
    }

    // Check if download version is available
    const downloadFiles = game.gameFiles.downloadVersion;
    let downloadUrl = null;

    switch (platform) {
      case 'windows':
        downloadUrl = downloadFiles.windowsFile;
        break;
      case 'mac':
        downloadUrl = downloadFiles.macFile;
        break;
      case 'linux':
        downloadUrl = downloadFiles.linuxFile;
        break;
      case 'android':
        downloadUrl = downloadFiles.androidFile;
        break;
      case 'ios':
        downloadUrl = downloadFiles.iosFile;
        break;
    }

    if (!downloadUrl) {
      return res.status(400).json({
        success: false,
        message: `${platform} version not available`
      });
    }

    // Increment download count
    game.statistics.totalDownloads += 1;
    await game.save();

    // Update user stats if logged in
    if (userId) {
      const user = await User.findById(userId);
      // You can track download history here if needed
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Download started",
      downloadUrl,
      fileSize: downloadFiles.fileSize,
      version: downloadFiles.version
    });

  } catch (error) {
    console.error('Download game error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to download game"
    });
  }
};

// Submit game score
export const submitScore = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { score, level, completionTime, metadata } = req.body;
    const userId = req.user._id;

    if (!score || score < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid score"
      });
    }

    const game = await Game.findById(gameId);
    if (!game || !game.isActive || game.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: "Game not found"
      });
    }

    // Check if this is a new personal best
    const existingBest = await LeaderboardEntry.findOne({
      player: userId,
      game: gameId
    }).sort({ score: -1 });

    let isNewBest = !existingBest || score > existingBest.score;

    if (isNewBest) {
      // Create new leaderboard entry
      const leaderboardEntry = new LeaderboardEntry({
        player: userId,
        game: gameId,
        score,
        level: level || 1,
        completionTime,
        metadata
      });

      await leaderboardEntry.save();

      // Update game leaderboard
      game.leaderboard.push({
        player: userId,
        score,
        level: level || 1,
        completionTime,
        achievedAt: new Date(),
        metadata
      });

      // Keep only top 100 scores
      game.leaderboard.sort((a, b) => b.score - a.score);
      if (game.leaderboard.length > 100) {
        game.leaderboard = game.leaderboard.slice(0, 100);
      }

      await game.save();

      // Update user stats
      const user = await User.findById(userId);
      user.gameStats.totalScore += score;
      if (score > user.gameStats.bestScore) {
        user.gameStats.bestScore = score;
      }
      
      // Calculate wins/losses based on game performance
      const averageScore = game.statistics.totalPlays > 0 
        ? game.statistics.totalPlays / game.statistics.uniquePlayers 
        : 0;
      
      if (score > averageScore) {
        user.gameStats.totalWins += 1;
      } else {
        user.gameStats.totalLosses += 1;
      }

      await user.save();

      // Update global leaderboard
      let globalStats = await GlobalLeaderboard.findOne({ player: userId });
      if (!globalStats) {
        globalStats = new GlobalLeaderboard({ player: userId });
      }
      
      globalStats.overallStats.totalScore += score;
      globalStats.overallStats.totalGames += 1;
      globalStats.overallStats.averageScore = globalStats.overallStats.totalScore / globalStats.overallStats.totalGames;
      
      if (score > globalStats.overallStats.bestScore) {
        globalStats.overallStats.bestScore = score;
      }
      
      await globalStats.save();
    }

    res.status(200).json({
      success: true,
      message: isNewBest ? "New personal best!" : "Score submitted",
      isNewBest,
      score,
      previousBest: existingBest?.score || null
    });

  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to submit score"
    });
  }
};

// Get game leaderboard
export const getGameLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { limit = 50, period = 'all' } = req.query;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found"
      });
    }

    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter.submittedAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter.submittedAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
        break;
      case 'year':
        dateFilter.submittedAt = { $gte: new Date(now.getFullYear(), 0, 1) };
        break;
    }

    const leaderboard = await LeaderboardEntry.find({
      game: gameId,
      ...dateFilter
    })
    .populate('player', 'username profile.displayName profile.avatar')
    .sort({ score: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      leaderboard,
      gameTitle: game.title
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard"
    });
  }
};

// Add game review
export const addGameReview = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const game = await Game.findById(gameId);
    if (!game || !game.isActive || game.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: "Game not found"
      });
    }

    // Check if user already reviewed this game
    const existingReview = game.reviews.find(
      review => review.reviewer.toString() === userId.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this game"
      });
    }

    // Add review
    game.reviews.push({
      reviewer: userId,
      rating,
      comment,
      createdAt: new Date()
    });

    // Update average rating
    const totalRatings = game.reviews.length;
    const sumRatings = game.reviews.reduce((sum, review) => sum + review.rating, 0);
    game.statistics.averageRating = sumRatings / totalRatings;
    game.statistics.totalReviews = totalRatings;

    await game.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      averageRating: game.statistics.averageRating,
      totalReviews: game.statistics.totalReviews
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to add review"
    });
  }
};

// Get user's uploaded games
export const getUserGames = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { developer: userId };
    if (status) query.status = status;

    const games = await Game.find(query)
      .populate('paymentInfo.verifiedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Game.countDocuments(query);

    // Get status counts
    const statusCounts = await Game.aggregate([
      { $match: { developer: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      games,
      statusCounts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get user games error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your games"
    });
  }
};

// Legacy function for compatibility
export const displayHighscore = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const leaderboard = await LeaderboardEntry.find({ game: gameId })
      .populate('player', 'username profile.displayName')
      .sort({ score: -1 })
      .limit(1);

    if (!leaderboard.length) {
      return res.status(404).json({
        success: false,
        message: "No scores found for this game"
      });
    }

    const topScore = leaderboard[0];
    
    res.status(200).json({
      success: true,
      highscore: {
        username: topScore.player.username,
        displayName: topScore.player.profile?.displayName,
        score: topScore.score,
        level: topScore.level,
        achievedAt: topScore.submittedAt
      }
    });

  } catch (error) {
    console.error('Get highscore error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch highscore"
    });
  }
};
