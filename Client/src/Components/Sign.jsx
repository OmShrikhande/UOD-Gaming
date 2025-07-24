import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus,
  Shield,
  CheckCircle,
  AlertCircle,
  Gamepad2,
  Zap
} from 'lucide-react';
import '../styles/Sign.css';
import Foote from './Foote';
import axios from 'axios';

const Sign = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validations, setValidations] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        return value.length >= 3 && value.length <= 20;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'password':
        return value.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value);
      case 'confirmPassword':
        return value === formData.password && value.length > 0;
      default:
        return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    setValidations(prev => ({
      ...prev,
      [name]: validateField(name, value),
      confirmPassword: name === 'password' || name === 'confirmPassword' 
        ? validateField('confirmPassword', name === 'confirmPassword' ? value : formData.confirmPassword)
        : prev.confirmPassword
    }));

    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate all fields
    const allValid = Object.keys(validations).every(key => validations[key]);
    if (!allValid) {
      setError('Please fill in all fields correctly');
      setIsLoading(false);
      return;
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password
    };

    try {
      const response = await axios.post('http://localhost:5000/api/v1/user/signup', userData);
      
      setSuccess('Account created successfully! Redirecting to login...');
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      setValidations({ username: false, email: false, password: false, confirmPassword: false });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
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
            <h1 className="sign-title text-gaming">Join the Gaming Revolution</h1>
            <p className="sign-subtitle">Create your account and start your epic journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="sign-form">
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
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`input ${validations.username ? 'valid' : formData.username ? 'invalid' : ''}`}
                  required
                />
                {formData.username && (
                  <div className="validation-icon">
                    {validations.username ? 
                      <CheckCircle className="valid-icon" size={20} /> :
                      <AlertCircle className="invalid-icon" size={20} />
                    }
                  </div>
                )}
              </div>
              {formData.username && !validations.username && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="validation-message"
                >
                  Username must be 3-20 characters long
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
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input ${validations.email ? 'valid' : formData.email ? 'invalid' : ''}`}
                  required
                />
                {formData.email && (
                  <div className="validation-icon">
                    {validations.email ? 
                      <CheckCircle className="valid-icon" size={20} /> :
                      <AlertCircle className="invalid-icon" size={20} />
                    }
                  </div>
                )}
              </div>
              {formData.email && !validations.email && (
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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input ${validations.password ? 'valid' : formData.password ? 'invalid' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {formData.password && (
                  <div className="validation-icon">
                    {validations.password ? 
                      <CheckCircle className="valid-icon" size={20} /> :
                      <AlertCircle className="invalid-icon" size={20} />
                    }
                  </div>
                )}
              </div>
              {formData.password && !validations.password && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="validation-message"
                >
                  Password must be 8+ characters with uppercase, lowercase, and number
                </motion.p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="input-group">
              <div className="input-wrapper">
                <Shield className="input-icon" />
                <motion.input
                  variants={inputVariants}
                  whileFocus="focus"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`input ${validations.confirmPassword ? 'valid' : formData.confirmPassword ? 'invalid' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {formData.confirmPassword && (
                  <div className="validation-icon">
                    {validations.confirmPassword ? 
                      <CheckCircle className="valid-icon" size={20} /> :
                      <AlertCircle className="invalid-icon" size={20} />
                    }
                  </div>
                )}
              </div>
              {formData.confirmPassword && !validations.confirmPassword && (
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
              disabled={isLoading || !Object.values(validations).every(v => v)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
                  Create Gaming Account
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="sign-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="sign-link">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <Foote />
    </div>
  );
};

export default Sign;