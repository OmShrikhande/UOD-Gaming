import React from 'react';
import { Link } from 'react-router-dom';
import "../Css/Home.css";
import videoBackground from '../assets/videoplayback.mp4'; // Replace with your video file path

const Home = () => {
  return (
    <div className="home-container">
      <video autoPlay loop muted className="video-bg">
        <source src={videoBackground} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="overlay"></div>
      <header className="header">
        <h1>Welcome to Game Playlist App</h1>
      </header>
      <div className="content">
        <h2>Discover and Manage Your Favorite Games</h2>
        <p>Sign in or create an account to get started!</p>
        <div className="buttons">
          <Link to="/login" className="button">Login</Link>
          <Link to="/sign" className="button">Sign Up</Link>
        </div>
      </div>
      <footer className="footer">
        <p>&copy; 2024 Game Playlist App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
