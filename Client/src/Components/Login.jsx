import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../Css/Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // const response = await axios.post('http://localhost:5000/api/v1/user/login', { email, password });
      // onLogin(response.data.user);
      // alert('Login successful!');
      window.location.href = "/UODGaming"; // Adjust the path as needed
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <br />
      <div className="signup-link">
        <p>Don't have an account?</p>
        <Link to="/sign" className="signup-button">Sign Up</Link>
      </div>
    </div>
  );
};

export default Login;
