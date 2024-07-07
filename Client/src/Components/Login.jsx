import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import '../Css/Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === 'user' && password === 'password') {
      onLogin(username);
      go();
    } else {
      setError('Invalid username or password');
    }
  };

  const go=()=>
  {
    if (username === 'user' && password === 'password') {
      alert('Login successful!'); 
      window.location.href="../UODGaming.jsx";
    } else {
      setError('Invalid username or password');
    }
   
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" onSubmit={go()}>Login</button>
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
