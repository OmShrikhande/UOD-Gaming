import { Payment, Revenue, Withdrawal } from "../Models/payment.model.js";
import User from "../Models/auth.model.js";
import Game from "../Models/game.model.js";
import { sendPaymentVerified, sendPaymentRejected, sendWelcomeSupporter } from "../utils/emailService.js";
import { validationResult } from "express-validator";
import { v4 as uuidv4 } from "uuid";

// Submit payment for game upload
export const submitGameUploadPayment = async (req, res) => {
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
    const { gameTitle, transactionId, upiReference, screenshot } = req.body;

    // Check if user is a supporter
    const user = await User.findById(userId);
    if (user.role !== 'supporter') {
      return res.status(403).json({
        success: false,
        message: "Only supporters can upload games. Please upgrade to supporter first."
      });
    }

    // Check if transaction ID already exists
    const existingPayment = await Payment.findOne({ transactionId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "This transaction ID has already been used"
      });
    }

    // Create new payment record
    const payment = new Payment({
      user: userId,
      transactionId: uuidv4(),
      upiTransactionId: transactionId,
      amount: 50,
      purpose: 'game_upload',
      relatedEntity: {
        entityType: 'Game',
        entityId: null // Will be set when game is created
      },
      paymentDetails: {
        upiReference,
        screenshot,
        gameTitle
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await payment.save();

    // Send notification emails
    const paymentData = {
      transactionId: payment.transactionId,
      upiReference,
      amount: 50,
      purpose: 'Game Upload',
      gameTitle,
      paymentDate: new Date(),
      username: user.username,
      email: user.email,
      paymentId: payment._id,
      screenshot
    };

    // Send emails
    await sendPaymentVerificationRequest(paymentData);
    await sendPaymentConfirmation({ username: user.username, email: user.email }, paymentData);

    res.status(201).json({
      success: true,
      message: "Payment submitted successfully! We'll verify it within 24 hours.",
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        gameTitle,
        createdAt: payment.createdAt
      }
    });

  } catch (error) {
    console.error('Game upload payment error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to submit payment"
    });
  }
};

// Verify payment (Admin only)
export const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { verificationNotes } = req.body;
    const adminId = req.user._id;

    // Check if admin user
    const admin = await User.findById(adminId);
    if (admin.role !== 'admin' || admin.username !== 'omshrikhande') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    const payment = await Payment.findById(paymentId).populate('user');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Payment has already been processed"
      });
    }

    // Update payment status
    payment.status = 'verified';
    payment.verification = {
      verifiedBy: adminId,
      verificationDate: new Date(),
      verificationNotes: verificationNotes || 'Payment verified by admin'
    };
    await payment.save();

    // Update user based on payment purpose
    const user = payment.user;
    
    if (payment.purpose === 'supporter_upgrade') {
      // Upgrade user to supporter
      user.role = 'supporter';
      user.supporterInfo.isPaidSupporter = true;
      user.supporterInfo.supporterSince = new Date();
      await user.save();

      // Send welcome supporter email
      await sendWelcomeSupporter({
        username: user.username,
        email: user.email
      });
    }

    if (payment.purpose === 'game_upload') {
      // Update supporter stats
      user.supporterInfo.gamesUploaded += 1;
      await user.save();
    }

    // Send verification email
    const paymentData = {
      transactionId: payment.transactionId,
      amount: payment.amount,
      gameTitle: payment.paymentDetails?.gameTitle,
      purpose: payment.purpose
    };

    await sendPaymentVerified({
      username: user.username,
      email: user.email
    }, paymentData);

    // Update revenue tracking
    await updateRevenueStats(payment);

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment"
    });
  }
};

// Reject payment (Admin only)
export const rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user._id;

    // Check if admin user
    const admin = await User.findById(adminId);
    if (admin.role !== 'admin' || admin.username !== 'omshrikhande') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    const payment = await Payment.findById(paymentId).populate('user');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Payment has already been processed"
      });
    }

    // Update payment status
    payment.status = 'rejected';
    payment.verification = {
      verifiedBy: adminId,
      verificationDate: new Date(),
      rejectionReason: rejectionReason || 'Payment rejected by admin'
    };
    await payment.save();

    // Send rejection email
    const paymentData = {
      transactionId: payment.transactionId,
      amount: payment.amount,
      gameTitle: payment.paymentDetails?.gameTitle,
      paymentId: payment._id
    };

    await sendPaymentRejected({
      username: payment.user.username,
      email: payment.user.email
    }, paymentData, rejectionReason);

    res.status(200).json({
      success: true,
      message: "Payment rejected",
      payment
    });

  } catch (error) {
    console.error('Payment rejection error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to reject payment"
    });
  }
};

// Get user's payment history
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { user: userId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('relatedEntity.entityId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history"
    });
  }
};

// Get all payments (Admin only)
export const getAllPayments = async (req, res) => {
  try {
    const adminId = req.user._id;
    
    // Check if admin user
    const admin = await User.findById(adminId);
    if (admin.role !== 'admin' || admin.username !== 'omshrikhande') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    const { page = 1, limit = 20, status, purpose, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (purpose) query.purpose = purpose;
    
    if (search) {
      const users = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.$or = [
        { user: { $in: users.map(u => u._id) } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(query)
      .populate('user', 'username email profile.displayName')
      .populate('verification.verifiedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    // Get payment statistics
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      payments,
      stats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments"
    });
  }
};

// Get payment statistics (Admin only)
export const getPaymentStats = async (req, res) => {
  try {
    const adminId = req.user._id;
    
    // Check if admin user
    const admin = await User.findById(adminId);
    if (admin.role !== 'admin' || admin.username !== 'omshrikhande') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    const { period = 'month' } = req.query;
    
    let matchStage = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchStage.createdAt = { $gte: weekAgo };
        break;
      case 'month':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
        break;
      case 'year':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), 0, 1)
        };
        break;
    }

    const stats = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            status: '$status',
            purpose: '$purpose'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get overall totals
    const totalStats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, '$amount', 0] } },
          totalPayments: { $sum: 1 },
          pendingPayments: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          verifiedPayments: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
          rejectedPayments: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats,
      totals: totalStats[0] || {
        totalRevenue: 0,
        totalPayments: 0,
        pendingPayments: 0,
        verifiedPayments: 0,
        rejectedPayments: 0
      }
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics"
    });
  }
};

// Helper function to update revenue statistics
const updateRevenueStats = async (payment) => {
  try {
    const date = new Date(payment.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    let revenue = await Revenue.findOne({
      'period.year': year,
      'period.month': month
    });

    if (!revenue) {
      revenue = new Revenue({
        period: { year, month, date: new Date(year, month - 1, 1) }
      });
    }

    // Update revenue based on purpose
    revenue.revenue.total += payment.amount;
    switch (payment.purpose) {
      case 'game_upload':
        revenue.revenue.gameUploads += payment.amount;
        break;
      case 'supporter_upgrade':
        revenue.revenue.supporterUpgrades += payment.amount;
        revenue.users.supporterUpgrades += 1;
        break;
      case 'tournament_entry':
        revenue.revenue.tournaments += payment.amount;
        break;
      case 'premium_features':
        revenue.revenue.premiumFeatures += payment.amount;
        break;
      case 'donation':
        revenue.revenue.donations += payment.amount;
        break;
    }

    revenue.transactions.successful += 1;
    revenue.transactions.total += 1;
    revenue.updatedAt = new Date();

    await revenue.save();
  } catch (error) {
    console.error('Revenue update error:', error);
  }
};

export {
  updateRevenueStats
};