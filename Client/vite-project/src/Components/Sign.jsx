import React, {useState} from 'react';
import "../Css/Sign.css"; 

const Sign = ({ onSign }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSign = (e) => {
    e.preventDefault();
    
    const newUser = {
      username,
      email,
      password
    };
    onSign(newUser); 
    alert('Signed up successfully!');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSign}>
        <h2>Sign </h2>
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
        <button type="submit">Sign </button>
      </form>
    </div>
  );
};

export default Sign;
