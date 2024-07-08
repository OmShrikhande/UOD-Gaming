import React, { useState } from 'react';
import "../Css/Sign.css"; 
import Foote from './Foote';
import axios from 'axios';

const Sign = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSign = async (e) => {
    e.preventDefault();

    const newUser = {
      username,
      email,
      password
    };

    try {
      const response = await axios.post('http://localhost:5000/api/v1/user/signup', newUser);
      alert('Signed up successfully!');
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('There was an error signing up!', error);
      alert('Sign up failed. Please try again.');
    }
  };

  return (
    <div>
      <div className="signup-container">
        <form className="signup-form" onSubmit={handleSign}>
          <h2>Sign</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
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
          <button type="submit">Sign</button>
        </form>
      </div>
      <Foote />
    </div>
  );
};

export default Sign;
