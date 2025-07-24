import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'omshrikhande73@gmail.com',
            pass: process.env.EMAIL_PASSWORD || 'Myname@0803'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Email templates
const emailTemplates = {
    // Payment verification request to admin
    paymentVerificationRequest: (paymentData) => ({
        subject: `🎮 Payment Verification Required - Game Upload Request`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
                        🎮 UOD Gaming - Payment Verification Required
                    </h1>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #495057; margin-top: 0;">Payment Details:</h3>
                        <p><strong>User:</strong> ${paymentData.username} (${paymentData.email})</p>
                        <p><strong>Amount:</strong> ₹${paymentData.amount}</p>
                        <p><strong>Purpose:</strong> ${paymentData.purpose}</p>
                        <p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
                        <p><strong>UPI Reference:</strong> ${paymentData.upiReference || 'N/A'}</p>
                        <p><strong>Game Title:</strong> ${paymentData.gameTitle || 'N/A'}</p>
                        <p><strong>Payment Date:</strong> ${format(new Date(paymentData.paymentDate), 'PPPp')}</p>
                    </div>
                    
                    ${paymentData.screenshot ? `
                        <div style="text-align: center; margin: 20px 0;">
                            <p><strong>Payment Proof:</strong></p>
                            <img src="${paymentData.screenshot}" alt="Payment Proof" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px;">
                        </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.ADMIN_PANEL_URL}/payments/verify/${paymentData.paymentId}" 
                           style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            ✅ Verify Payment
                        </a>
                        <a href="${process.env.ADMIN_PANEL_URL}/payments/reject/${paymentData.paymentId}" 
                           style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin-left: 10px;">
                            ❌ Reject Payment
                        </a>
                    </div>
                    
                    <div style="background: #e9ecef; padding: 15px; border-radius: 8px; font-size: 12px; color: #666;">
                        <p style="margin: 0;">This is an automated notification from UOD Gaming Platform. Please verify the payment details carefully before approving.</p>
                    </div>
                </div>
            </div>
        `
    }),

    // Payment confirmation to user
    paymentReceived: (userData, paymentData) => ({
        subject: `🎉 Payment Received - Your Game Upload is Being Processed!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
                        🎉 Payment Received Successfully!
                    </h1>
                    
                    <p>Dear ${userData.username},</p>
                    
                    <p>We have received your payment for game upload. Your payment is currently being verified by our team.</p>
                    
                    <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #155724; margin-top: 0;">Payment Summary:</h4>
                        <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${paymentData.amount}</p>
                        <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
                        <p style="margin: 5px 0;"><strong>Game Title:</strong> ${paymentData.gameTitle}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> Pending Verification</p>
                    </div>
                    
                    <p><strong>What happens next?</strong></p>
                    <ol style="padding-left: 20px;">
                        <li>Our team will verify your payment within 24 hours</li>
                        <li>Once verified, you'll receive a confirmation email</li>
                        <li>Your game will be reviewed and published to the platform</li>
                        <li>You'll start earning from downloads and plays!</li>
                    </ol>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL}/dashboard/payments" 
                           style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            📊 View Payment Status
                        </a>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404;"><strong>Important:</strong> Please keep your transaction reference safe. If you have any questions, reply to this email with your transaction ID.</p>
                    </div>
                </div>
            </div>
        `
    }),

    // Payment verified notification
    paymentVerified: (userData, paymentData) => ({
        subject: `✅ Payment Verified - Game Upload Approved!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
                        ✅ Payment Verified Successfully!
                    </h1>
                    
                    <p>Congratulations ${userData.username}!</p>
                    
                    <p>Your payment has been verified and your game "<strong>${paymentData.gameTitle}</strong>" is now approved for upload!</p>
                    
                    <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <h3 style="color: #155724; margin-top: 0;">🎮 You're now a Verified Supporter!</h3>
                        <p style="margin: 0; color: #155724;">Enjoy all supporter benefits and start uploading your games!</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL}/upload-game" 
                           style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 10px;">
                            🚀 Upload Your Game
                        </a>
                        <a href="${process.env.CLIENT_URL}/dashboard" 
                           style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 10px;">
                            📊 Go to Dashboard
                        </a>
                    </div>
                    
                    <h4>Supporter Benefits:</h4>
                    <ul style="color: #495057;">
                        <li>✨ Upload unlimited games</li>
                        <li>💬 Join exclusive supporter groups</li>
                        <li>📈 Access to advanced analytics</li>
                        <li>🏆 Priority support</li>
                        <li>💰 Earn revenue from your games</li>
                    </ul>
                </div>
            </div>
        `
    }),

    // Payment rejected notification
    paymentRejected: (userData, paymentData, reason) => ({
        subject: `❌ Payment Issue - Action Required`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
                        ❌ Payment Verification Issue
                    </h1>
                    
                    <p>Dear ${userData.username},</p>
                    
                    <p>We were unable to verify your recent payment. Please review the details below:</p>
                    
                    <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #721c24; margin-top: 0;">Rejection Reason:</h4>
                        <p style="margin: 0; color: #721c24;">${reason}</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #495057; margin-top: 0;">Payment Details:</h4>
                        <p><strong>Amount:</strong> ₹${paymentData.amount}</p>
                        <p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
                        <p><strong>Game Title:</strong> ${paymentData.gameTitle}</p>
                    </div>
                    
                    <p><strong>What you can do:</strong></p>
                    <ol style="padding-left: 20px;">
                        <li>Check your payment details and try again</li>
                        <li>Ensure you're using the correct UPI ID: <strong>omshrikhande73@oksbi</strong></li>
                        <li>Upload a clear screenshot of your payment</li>
                        <li>Contact support if you need assistance</li>
                    </ol>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL}/retry-payment/${paymentData.paymentId}" 
                           style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            🔄 Retry Payment
                        </a>
                    </div>
                </div>
            </div>
        `
    }),

    // Welcome email for new supporters
    welcomeSupporter: (userData) => ({
        subject: `🎉 Welcome to UOD Gaming Supporters Community!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
                        🎉 Welcome to the Supporters Community!
                    </h1>
                    
                    <p>Hey ${userData.username}!</p>
                    
                    <p>Welcome to the exclusive UOD Gaming Supporters community! You're now part of an elite group of game developers and creators.</p>
                    
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <h3 style="margin-top: 0;">🏆 You're now a Verified Supporter!</h3>
                        <p style="margin: 0;">Start creating, sharing, and earning from your games!</p>
                    </div>
                    
                    <h3>🎮 What you can do now:</h3>
                    <div style="display: grid; gap: 15px; margin: 20px 0;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                            <strong>📤 Upload Games:</strong> Share your creations with thousands of players
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                            <strong>💬 Join Groups:</strong> Connect with other developers and gamers
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                            <strong>💰 Earn Revenue:</strong> Get paid for downloads and gameplay
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                            <strong>🏆 Compete:</strong> Participate in tournaments and leaderboards
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL}/supporter-dashboard" 
                           style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 10px;">
                            🚀 Get Started
                        </a>
                        <a href="${process.env.CLIENT_URL}/groups" 
                           style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 10px;">
                            💬 Join Groups
                        </a>
                    </div>
                    
                    <div style="background: #e9ecef; padding: 15px; border-radius: 8px; font-size: 12px; color: #666;">
                        <p style="margin: 0;">Need help? Join our Discord community or email us at support@uodgaming.com</p>
                    </div>
                </div>
            </div>
        `
    })
};

// Email sending functions
export const sendPaymentVerificationRequest = async (paymentData) => {
    try {
        const transporter = createTransporter();
        const template = emailTemplates.paymentVerificationRequest(paymentData);
        
        await transporter.sendMail({
            from: `"UOD Gaming" <${process.env.EMAIL_USER}>`,
            to: 'omshrikhande73@gmail.com',
            subject: template.subject,
            html: template.html
        });
        
        console.log('Payment verification email sent to admin');
        return true;
    } catch (error) {
        console.error('Error sending payment verification email:', error);
        return false;
    }
};

export const sendPaymentConfirmation = async (userData, paymentData) => {
    try {
        const transporter = createTransporter();
        const template = emailTemplates.paymentReceived(userData, paymentData);
        
        await transporter.sendMail({
            from: `"UOD Gaming" <${process.env.EMAIL_USER}>`,
            to: userData.email,
            subject: template.subject,
            html: template.html
        });
        
        console.log('Payment confirmation email sent to user');
        return true;
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        return false;
    }
};

export const sendPaymentVerified = async (userData, paymentData) => {
    try {
        const transporter = createTransporter();
        const template = emailTemplates.paymentVerified(userData, paymentData);
        
        await transporter.sendMail({
            from: `"UOD Gaming" <${process.env.EMAIL_USER}>`,
            to: userData.email,
            subject: template.subject,
            html: template.html
        });
        
        console.log('Payment verified email sent to user');
        return true;
    } catch (error) {
        console.error('Error sending payment verified email:', error);
        return false;
    }
};

export const sendPaymentRejected = async (userData, paymentData, reason) => {
    try {
        const transporter = createTransporter();
        const template = emailTemplates.paymentRejected(userData, paymentData, reason);
        
        await transporter.sendMail({
            from: `"UOD Gaming" <${process.env.EMAIL_USER}>`,
            to: userData.email,
            subject: template.subject,
            html: template.html
        });
        
        console.log('Payment rejected email sent to user');
        return true;
    } catch (error) {
        console.error('Error sending payment rejected email:', error);
        return false;
    }
};

export const sendWelcomeSupporter = async (userData) => {
    try {
        const transporter = createTransporter();
        const template = emailTemplates.welcomeSupporter(userData);
        
        await transporter.sendMail({
            from: `"UOD Gaming" <${process.env.EMAIL_USER}>`,
            to: userData.email,
            subject: template.subject,
            html: template.html
        });
        
        console.log('Welcome supporter email sent to user');
        return true;
    } catch (error) {
        console.error('Error sending welcome supporter email:', error);
        return false;
    }
};

export default {
    sendPaymentVerificationRequest,
    sendPaymentConfirmation,
    sendPaymentVerified,
    sendPaymentRejected,
    sendWelcomeSupporter
};