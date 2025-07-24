import { LeaderboardEntry, GlobalLeaderboard, Tournament } from '../Models/leaderboard.model.js';
import User from '../Models/auth.model.js';
import Game from '../Models/game.model.js';
import { validationResult } from 'express-validator';

// Get global leaderboard
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      period = 'all',
      category,
      country 
    } = req.query;

    // Build query based on period
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'weekly':
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        dateFilter = { 'weeklyStats.week': { $gte: weekStart } };
        break;
      case 'monthly':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { 'monthlyStats.month': { $gte: monthStart } };
        break;
      case 'yearly':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        dateFilter = { lastActive: { $gte: yearStart } };
        break;
    }

    // Build aggregation pipeline
    let pipeline = [
      { $match: { isActive: true, ...dateFilter } },
      {
        $lookup: {
          from: 'users',
          localField: 'player',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.isActive': true,
          'user.isBanned': false
        }
      }
    ];

    // Add country filter if specified
    if (country) {
      pipeline.push({
        $match: { 'user.profile.country': country }
      });
    }

    // Add category filter if specified
    if (category) {
      pipeline.push({
        $match: { 'categoryStats.category': category }
      });
    }

    // Sort and paginate
    pipeline.push(
      { $sort: { 'overallStats.totalScore': -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    // Add rank calculation
    pipeline.push({
      $addFields: {
        rank: { $add: [{ $multiply: [parseInt(page) - 1, parseInt(limit)] }, { $rank: {} }] }
      }
    });

    const leaderboard = await GlobalLeaderboard.aggregate(pipeline);

    // Get total count for pagination
    const totalPipeline = [
      { $match: { isActive: true, ...dateFilter } },
      {
        $lookup: {
          from: 'users',
          localField: 'player',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.isActive': true,
          'user.isBanned': false
        }
      }
    ];

    if (country) {
      totalPipeline.push({
        $match: { 'user.profile.country': country }
      });
    }

    if (category) {
      totalPipeline.push({
        $match: { 'categoryStats.category': category }
      });
    }

    totalPipeline.push({ $count: 'total' });

    const totalResult = await GlobalLeaderboard.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Get available countries and categories for filters
    const countries = await GlobalLeaderboard.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'player',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $group: { _id: '$user.profile.country' } },
      { $match: { _id: { $ne: null } } },
      { $sort: { _id: 1 } }
    ]);

    const categories = await GlobalLeaderboard.aggregate([
      { $unwind: '$categoryStats' },
      { $group: { _id: '$categoryStats.category' } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      leaderboard,
      filters: {
        countries: countries.map(c => c._id),
        categories: categories.map(c => c._id)
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch global leaderboard"
    });
  }
};

// Get game-specific leaderboard
export const getGameLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      period = 'all',
      difficulty = 'all'
    } = req.query;

    // Verify game exists
    const game = await Game.findById(gameId);
    if (!game || !game.isActive) {
      return res.status(404).json({
        success: false,
        message: "Game not found"
      });
    }

    // Build query
    let query = { game: gameId, isActive: true };

    // Add period filter
    if (period !== 'all') {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      if (startDate) {
        query.submittedAt = { $gte: startDate };
      }
    }

    // Add difficulty filter
    if (difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    const leaderboard = await LeaderboardEntry.find(query)
      .populate('player', 'username profile.displayName profile.avatar profile.country')
      .sort({ score: -1, submittedAt: 1 }) // Higher score first, earlier submission breaks ties
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await LeaderboardEntry.countDocuments(query);

    // Add rank to each entry
    const leaderboardWithRanks = leaderboard.map((entry, index) => ({
      ...entry.toObject(),
      rank: (page - 1) * limit + index + 1
    }));

    // Get game statistics
    const gameStats = await LeaderboardEntry.aggregate([
      { $match: { game: gameId, isActive: true } },
      {
        $group: {
          _id: null,
          totalPlayers: { $addToSet: '$player' },
          averageScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          totalSubmissions: { $sum: 1 }
        }
      },
      {
        $addFields: {
          totalPlayers: { $size: '$totalPlayers' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      leaderboard: leaderboardWithRanks,
      gameInfo: {
        id: game._id,
        title: game.title,
        category: game.category
      },
      stats: gameStats[0] || {
        totalPlayers: 0,
        averageScore: 0,
        highestScore: 0,
        totalSubmissions: 0
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get game leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game leaderboard"
    });
  }
};

// Get user's leaderboard position
export const getUserLeaderboardPosition = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;

    if (gameId) {
      // Get position in specific game
      const userEntry = await LeaderboardEntry.findOne({
        player: userId,
        game: gameId
      }).sort({ score: -1 });

      if (!userEntry) {
        return res.status(404).json({
          success: false,
          message: "No scores found for this game"
        });
      }

      // Calculate rank
      const betterScores = await LeaderboardEntry.countDocuments({
        game: gameId,
        score: { $gt: userEntry.score },
        isActive: true
      });

      const rank = betterScores + 1;

      // Get total players
      const totalPlayers = await LeaderboardEntry.distinct('player', {
        game: gameId,
        isActive: true
      });

      res.status(200).json({
        success: true,
        position: {
          rank,
          score: userEntry.score,
          totalPlayers: totalPlayers.length,
          percentile: Math.round((1 - (rank - 1) / totalPlayers.length) * 100)
        }
      });

    } else {
      // Get global position
      const globalStats = await GlobalLeaderboard.findOne({ player: userId });
      
      if (!globalStats) {
        return res.status(404).json({
          success: false,
          message: "No global stats found"
        });
      }

      res.status(200).json({
        success: true,
        position: {
          globalRank: globalStats.globalRank,
          countryRank: globalStats.countryRank,
          totalScore: globalStats.overallStats.totalScore,
          level: globalStats.level,
          badges: globalStats.badges.length
        }
      });
    }

  } catch (error) {
    console.error('Get user position error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard position"
    });
  }
};

// Get user's game history
export const getUserGameHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, gameId } = req.query;

    let query = { player: userId };
    if (gameId) {
      query.game = gameId;
    }

    const history = await LeaderboardEntry.find(query)
      .populate('game', 'title category screenshots')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await LeaderboardEntry.countDocuments(query);

    // Get user's best scores per game
    const bestScores = await LeaderboardEntry.aggregate([
      { $match: { player: userId } },
      {
        $group: {
          _id: '$game',
          bestScore: { $max: '$score' },
          totalAttempts: { $sum: 1 },
          lastPlayed: { $max: '$submittedAt' }
        }
      },
      {
        $lookup: {
          from: 'games',
          localField: '_id',
          foreignField: '_id',
          as: 'gameInfo'
        }
      },
      { $unwind: '$gameInfo' },
      { $sort: { lastPlayed: -1 } }
    ]);

    res.status(200).json({
      success: true,
      history,
      bestScores,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get user history error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game history"
    });
  }
};

// Create tournament
export const createTournament = async (req, res) => {
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
      name,
      description,
      gameId,
      type,
      format,
      maxParticipants,
      entryFee,
      prizePool,
      prizes,
      rules,
      schedule
    } = req.body;

    // Check if user can create tournaments (supporters only)
    const user = await User.findById(userId);
    if (user.role !== 'supporter' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only supporters can create tournaments"
      });
    }

    // Verify game exists
    const game = await Game.findById(gameId);
    if (!game || !game.isActive) {
      return res.status(404).json({
        success: false,
        message: "Game not found"
      });
    }

    // Create tournament
    const tournament = new Tournament({
      name,
      description,
      game: gameId,
      organizer: userId,
      type,
      format,
      rules: {
        maxParticipants: maxParticipants || 32,
        ...rules
      },
      schedule,
      entryFee: entryFee || 0,
      prizePool: prizePool || 0,
      prizes: prizes || []
    });

    await tournament.save();

    res.status(201).json({
      success: true,
      message: "Tournament created successfully!",
      tournament: {
        id: tournament._id,
        name: tournament.name,
        game: game.title,
        maxParticipants: tournament.rules.maxParticipants,
        entryFee: tournament.entryFee,
        status: tournament.status
      }
    });

  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create tournament"
    });
  }
};

// Get tournaments
export const getTournaments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      status = 'all',
      gameId,
      search,
      upcoming = false
    } = req.query;

    // Build query
    let query = {};
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (gameId) {
      query.game = gameId;
    }
    
    if (upcoming) {
      query.status = { $in: ['registration_open', 'registration_closed'] };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tournaments = await Tournament.find(query)
      .populate('game', 'title category screenshots')
      .populate('organizer', 'username profile.displayName profile.avatar')
      .populate('participants.player', 'username profile.displayName profile.avatar')
      .sort({ 'schedule.tournamentStart': 1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Tournament.countDocuments(query);

    // Add participant count to each tournament
    const tournamentsWithCounts = tournaments.map(tournament => ({
      ...tournament.toObject(),
      participantCount: tournament.participants.length,
      spotsRemaining: tournament.rules.maxParticipants - tournament.participants.length
    }));

    res.status(200).json({
      success: true,
      tournaments: tournamentsWithCounts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tournaments"
    });
  }
};

// Join tournament
export const joinTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user._id;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    // Check tournament status
    if (tournament.status !== 'registration_open') {
      return res.status(400).json({
        success: false,
        message: "Tournament registration is not open"
      });
    }

    // Check if user is already registered
    const isRegistered = tournament.participants.some(p => 
      p.player.toString() === userId.toString()
    );

    if (isRegistered) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this tournament"
      });
    }

    // Check if tournament is full
    if (tournament.participants.length >= tournament.rules.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Tournament is full"
      });
    }

    // Check registration deadline
    if (tournament.rules.registrationDeadline && 
        new Date() > tournament.rules.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has passed"
      });
    }

    // Add participant
    tournament.participants.push({
      player: userId,
      seed: tournament.participants.length + 1,
      registeredAt: new Date()
    });

    await tournament.save();

    res.status(200).json({
      success: true,
      message: `Successfully registered for ${tournament.name}!`,
      tournament: {
        id: tournament._id,
        name: tournament.name,
        participantCount: tournament.participants.length,
        maxParticipants: tournament.rules.maxParticipants
      }
    });

  } catch (error) {
    console.error('Join tournament error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to join tournament"
    });
  }
};

// Get tournament details
export const getTournamentById = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId)
      .populate('game', 'title category screenshots developer')
      .populate('organizer', 'username profile.displayName profile.avatar')
      .populate('participants.player', 'username profile.displayName profile.avatar gameStats')
      .populate('brackets.matches.player1', 'username profile.displayName profile.avatar')
      .populate('brackets.matches.player2', 'username profile.displayName profile.avatar')
      .populate('brackets.matches.winner', 'username profile.displayName profile.avatar');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    res.status(200).json({
      success: true,
      tournament
    });

  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tournament details"
    });
  }
};

// Update global leaderboard rankings (should be run periodically)
export const updateGlobalRankings = async (req, res) => {
  try {
    // This should ideally be run as a cron job
    const rankings = await GlobalLeaderboard.find({ isActive: true })
      .sort({ 'overallStats.totalScore': -1 });

    // Update global ranks
    for (let i = 0; i < rankings.length; i++) {
      rankings[i].globalRank = i + 1;
      await rankings[i].save();
    }

    // Update country ranks
    const countries = await GlobalLeaderboard.distinct('user.profile.country', {
      'user.profile.country': { $ne: null }
    });

    for (const country of countries) {
      const countryRankings = await GlobalLeaderboard.find({
        isActive: true,
        'user.profile.country': country
      })
      .populate('user', 'profile.country')
      .sort({ 'overallStats.totalScore': -1 });

      for (let i = 0; i < countryRankings.length; i++) {
        countryRankings[i].countryRank = i + 1;
        await countryRankings[i].save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated rankings for ${rankings.length} users across ${countries.length} countries`
    });

  } catch (error) {
    console.error('Update rankings error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update rankings"
    });
  }
};