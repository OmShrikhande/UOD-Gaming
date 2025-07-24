import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    upiTransactionId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [1, "Amount must be at least ₹1"]
    },
    currency: {
        type: String,
        default: 'INR'
    },
    purpose: {
        type: String,
        enum: ['game_upload', 'supporter_upgrade', 'tournament_entry', 'premium_features', 'donation'],
        required: true
    },
    relatedEntity: {
        entityType: { type: String, enum: ['Game', 'Tournament', 'User', 'Group'] },
        entityId: Schema.Types.ObjectId
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'card', 'netbanking', 'wallet'],
        default: 'upi'
    },
    paymentDetails: {
        upiId: { type: String, default: 'omshrikhande73@oksbi' },
        upiReference: String,
        bankReference: String,
        gateway: String,
        gatewayTransactionId: String,
        screenshot: String, // User uploaded payment proof
        paymentApp: String // PhonePe, GPay, Paytm, etc.
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'verified', 'rejected', 'refunded', 'failed'],
        default: 'pending'
    },
    verification: {
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        verificationDate: Date,
        verificationNotes: String,
        autoVerified: { type: Boolean, default: false },
        rejectionReason: String,
        evidenceUrls: [String]
    },
    notifications: {
        userNotified: { type: Boolean, default: false },
        adminNotified: { type: Boolean, default: false },
        emailSent: { type: Boolean, default: false },
        remindersSent: { type: Number, default: 0 }
    },
    refund: {
        refundAmount: Number,
        refundReason: String,
        refundDate: Date,
        refundTransactionId: String,
        refundedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    attempts: [{
        attemptDate: { type: Date, default: Date.now },
        status: String,
        errorMessage: String,
        ipAddress: String,
        userAgent: String
    }],
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceInfo: String,
        location: {
            country: String,
            state: String,
            city: String
        }
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Revenue tracking schema
const revenueSchema = new Schema({
    period: {
        year: { type: Number, required: true },
        month: { type: Number, required: true }, // 1-12
        week: Number, // 1-53
        date: Date
    },
    revenue: {
        total: { type: Number, default: 0 },
        gameUploads: { type: Number, default: 0 },
        supporterUpgrades: { type: Number, default: 0 },
        tournaments: { type: Number, default: 0 },
        premiumFeatures: { type: Number, default: 0 },
        donations: { type: Number, default: 0 }
    },
    transactions: {
        total: { type: Number, default: 0 },
        successful: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        refunded: { type: Number, default: 0 }
    },
    users: {
        totalPayingUsers: { type: Number, default: 0 },
        newPayingUsers: { type: Number, default: 0 },
        supporterUpgrades: { type: Number, default: 0 }
    },
    averages: {
        transactionValue: { type: Number, default: 0 },
        revenuePerUser: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 }
    },
    updatedAt: { type: Date, default: Date.now }
});

// Withdrawal request schema for supporters
const withdrawalSchema = new Schema({
    supporter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [100, "Minimum withdrawal amount is ₹100"]
    },
    availableBalance: Number,
    bankDetails: {
        accountHolderName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        ifscCode: { type: String, required: true },
        bankName: { type: String, required: true },
        branchName: String,
        accountType: { type: String, enum: ['savings', 'current'], default: 'savings' }
    },
    upiDetails: {
        upiId: String,
        verified: { type: Boolean, default: false }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
        default: 'pending'
    },
    processing: {
        processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        processedAt: Date,
        transactionId: String,
        processingNotes: String,
        rejectionReason: String
    },
    fees: {
        processingFee: { type: Number, default: 0 },
        taxDeduction: { type: Number, default: 0 },
        finalAmount: Number
    },
    requestedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for better performance
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

revenueSchema.index({ 'period.year': 1, 'period.month': 1 });
revenueSchema.index({ 'period.date': -1 });

withdrawalSchema.index({ supporter: 1, status: 1 });
withdrawalSchema.index({ status: 1, requestedAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);
const Revenue = mongoose.model("Revenue", revenueSchema);
const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

export { Payment, Revenue, Withdrawal };