import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  UserPlus,
  Gamepad2,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import '../styles/Sign.css';
import Foote from './Foote';
import axios from 'axios';

// Pixel-perfect Google SVG Icon
const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine starting tab from URL path
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/sign' ? 'signup' : 'login'
  );

  // Synchronize tab state with navigation
  useEffect(() => {
    setActiveTab(location.pathname === '/sign' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  }, [location.pathname]);

  // Form States
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginValidations, setLoginValidations] = useState({ email: false, password: false });

  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [signupValidations, setSignupValidations] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google Account Chooser State
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

  const mockGoogleAccounts = [
    { name: 'Arya Surkar', email: 'aryasurkar@gmail.com', avatarColor: '#1a73e8', initial: 'A' },
    { name: 'Epic Gamer', email: 'epic.gamer@gmail.com', avatarColor: '#8b5cf6', initial: 'E' },
    { name: 'Guest Player', email: 'guest.player@gmail.com', avatarColor: '#10b981', initial: 'G' }
  ];

  // Tab Switch Handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    if (tab === 'login') {
      navigate('/login');
    } else {
      navigate('/sign');
    }
  };

  // Validation Logic
  const validateLoginField = (name, value) => {
    switch (name) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'password':
        return value.length > 0;
      default:
        return false;
    }
  };

  const validateSignupField = (name, value, currentPassword) => {
    switch (name) {
      case 'username':
        return value.length >= 3 && value.length <= 20;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'password':
        return value.length >= 1;
      case 'confirmPassword':
        return value === currentPassword && value.length > 0;
      default:
        return false;
    }
  };

  // Input Handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    setLoginValidations(prev => ({
      ...prev,
      [name]: validateLoginField(name, value)
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prev => {
      const nextData = { ...prev, [name]: value };
      setSignupValidations(validationPrev => ({
        ...validationPrev,
        [name]: validateSignupField(name, value, nextData.password),
        confirmPassword: name === 'password' || name === 'confirmPassword'
          ? validateSignupField('confirmPassword', name === 'confirmPassword' ? value : nextData.confirmPassword, nextData.password)
          : validationPrev.confirmPassword
      }));
      return nextData;
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Credentials Submit Handlers
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!loginValidations.email || !loginData.password) {
      setError('Please fill in all fields correctly');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/v1/auth/login', {
        email: loginData.email,
        password: loginData.password
      });

      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      setSuccess(response.data.message || 'Login successful! Redirecting to gaming area...');
      setTimeout(() => {
        navigate('/UODGaming');
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const allValid = Object.keys(signupValidations).every(key => signupValidations[key]);
    if (!allValid) {
      setError('Please fill in all fields correctly');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/v1/auth/signup', {
        username: signupData.username,
        email: signupData.email,
        password: signupData.password
      });

      setSuccess('Account created successfully! Auto-logging you in...');
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      setTimeout(() => {
        navigate('/UODGaming');
      }, 1500);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Account Selection Handler (Simulated UI Flow)
  const handleSelectGoogleAccount = async (name, email) => {
    setShowGoogleChooser(false);
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      setSuccess(`Connecting to Google accounts...`);
      await new Promise(resolve => setTimeout(resolve, 1200));

      const mockUser = {
        username: name,
        email: email,
        isGoogle: true
      };
      
      localStorage.setItem('token', 'mock-google-token-' + Math.random().toString(36).substring(7));
      localStorage.setItem('user', JSON.stringify(mockUser));

      setSuccess(`Successfully signed in with Google! Welcome, ${name}!`);
      setTimeout(() => {
        navigate('/UODGaming');
      }, 1500);
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseAnotherAccount = () => {
    const email = prompt("Enter your Google email address:");
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Invalid email address format.");
      return;
    }
    
    const baseName = email.split('@')[0];
    const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    handleSelectGoogleAccount(formattedName, email);
  };

  const inputVariants = {
    focus: { scale: 1.01, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  return (
    <div className="sign-wrapper">
      <div className="sign-background">
        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="sign-container">
        <motion.div 
          className="sign-card glass-card"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="sign-header">
            <motion.div 
              className="sign-icon"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Gamepad2 size={48} />
            </motion.div>
            <h1 className="sign-title text-gaming">
              {activeTab === 'login' ? 'Welcome Back, Player' : 'Join the Revolution'}
            </h1>
            <p className="sign-subtitle">
              {activeTab === 'login' 
                ? 'Log in to resume your epic gaming session' 
                : 'Create your account and start your epic journey'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Log In
            </button>
            <button
              className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => handleTabChange('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Google Sign-In Option Button UI */}
          <div className="google-btn-wrapper">
            <button 
              type="button" 
              className="google-btn" 
              onClick={() => setShowGoogleChooser(true)}
              disabled={isLoading}
            >
              <GoogleIcon />
              <span>{activeTab === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>
          </div>

          {/* OR Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Form */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="sign-form">
              {/* Email Field */}
              <div className="input-group">
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <motion.input
                    variants={inputVariants}
                    whileFocus="focus"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className={`input ${loginValidations.email ? 'valid' : loginData.email ? 'invalid' : ''}`}
                    required
                  />
                  {loginData.email && (
                    <div className="validation-icon">
                      {loginValidations.email ? 
                        <CheckCircle className="valid-icon" size={20} /> :
                        <AlertCircle className="invalid-icon" size={20} />
                      }
                    </div>
                  )}
                </div>
                {loginData.email && !loginValidations.email && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="validation-message"
                  >
                    Please enter a valid email address
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div className="input-group">
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <motion.input
                    variants={inputVariants}
                    whileFocus="focus"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className={`input ${loginData.password ? 'valid' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="error-message"
                  >
                    <AlertCircle size={20} />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="success-message"
                  >
                    <CheckCircle size={20} />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className={`btn btn-primary submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || !loginValidations.email || !loginData.password}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? (
                  <motion.div 
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap size={20} />
                  </motion.div>
                ) : (
                  <>
                    <LogIn size={20} />
                    Access Account
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="sign-form">
              {/* Username Field */}
              <div className="input-group">
                <div className="input-wrapper">
                  <User className="input-icon" />
                  <motion.input
                    variants={inputVariants}
                    whileFocus="focus"
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    value={signupData.username}
                    onChange={handleSignupChange}
                    className={`input ${signupValidations.username ? 'valid' : signupData.username ? 'invalid' : ''}`}
                    required
                  />
                  {signupData.username && (
                    <div className="validation-icon">
                      {signupValidations.username ? 
                        <CheckCircle className="valid-icon" size={20} /> :
                        <AlertCircle className="invalid-icon" size={20} />
                      }
                    </div>
                  )}
                </div>
                {signupData.username && !signupValidations.username && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="validation-message"
                  >
                    Username must be 3-20 characters
                  </motion.p>
                )}
              </div>

              {/* Email Field */}
              <div className="input-group">
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <motion.input
                    variants={inputVariants}
                    whileFocus="focus"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    className={`input ${signupValidations.email ? 'valid' : signupData.email ? 'invalid' : ''}`}
                    required
                  />
                  {signupData.email && (
                    <div className="validation-icon">
                      {signupValidations.email ? 
                        <CheckCircle className="valid-icon" size={20} /> :
                        <AlertCircle className="invalid-icon" size={20} />
                      }
                    </div>
                  )}
                </div>
                {signupData.email && !signupValidations.email && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="validation-message"
                  >
                    Please enter a valid email address
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div className="input-group">
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <motion.input
                    variants={inputVariants}
                    whileFocus="focus"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    className={`input ${signupValidations.password ? 'valid' : signupData.password ? 'invalid' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="input-group">
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <motion.input
                    variants={inputVariants}
                    whileFocus="focus"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    className={`input ${signupValidations.confirmPassword ? 'valid' : signupData.confirmPassword ? 'invalid' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {signupData.confirmPassword && !signupValidations.confirmPassword && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="validation-message"
                  >
                    Passwords do not match
                  </motion.p>
                )}
              </div>

              {/* Error/Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="error-message"
                  >
                    <AlertCircle size={20} />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="success-message"
                  >
                    <CheckCircle size={20} />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className={`btn btn-primary submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={
                  isLoading || 
                  !signupValidations.username || 
                  !signupValidations.email || 
                  !signupValidations.password || 
                  !signupValidations.confirmPassword
                }
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? (
                  <motion.div 
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap size={20} />
                  </motion.div>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Create Account
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Footer Switcher Hint */}
          <div className="sign-footer">
            <p>
              {activeTab === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => handleTabChange('signup')} className="btn-link sign-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                    Sign up here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => handleTabChange('login')} className="btn-link sign-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                    Log in here
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Google Account Chooser Modal Overlay (Simulated UI) */}
      <AnimatePresence>
        {showGoogleChooser && (
          <motion.div 
            className="google-chooser-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="google-chooser-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
              {/* Google Header */}
              <div className="google-chooser-header">
                <div className="google-logo-wrapper">
                  <GoogleIcon />
                </div>
                <h3>Sign in with Google</h3>
                <p>Choose an account to continue to UOD Gaming</p>
              </div>

              {/* Accounts List */}
              <div className="google-accounts-list">
                {mockGoogleAccounts.map((account, index) => (
                  <button 
                    key={index} 
                    className="google-account-item"
                    onClick={() => handleSelectGoogleAccount(account.name, account.email)}
                  >
                    <div className="google-avatar" style={{ backgroundColor: account.avatarColor }}>
                      {account.initial}
                    </div>
                    <div className="google-account-info">
                      <span className="account-name">{account.name}</span>
                      <span className="account-email">{account.email}</span>
                    </div>
                  </button>
                ))}

                {/* Use another account button */}
                <button 
                  className="google-account-item"
                  onClick={handleUseAnotherAccount}
                >
                  <div className="google-avatar" style={{ backgroundColor: '#5f6368' }}>
                    +
                  </div>
                  <div className="google-account-info">
                    <span className="account-name" style={{ color: '#1a73e8' }}>Use another account</span>
                    <span className="account-email">Sign in with a different email</span>
                  </div>
                </button>
              </div>

              {/* Info Disclaimer */}
              <div className="google-chooser-footer">
                To continue, Google will share your name, email address, and profile picture with UOD Gaming.
              </div>

              {/* Close Button */}
              <button className="google-chooser-close" onClick={() => setShowGoogleChooser(false)}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Foote />
    </div>
  );
};

export default Login;
