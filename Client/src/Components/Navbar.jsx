import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Css/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={`topnav ${isMenuOpen ? 'responsive' : ''}`} id="myTopnav">
      <Link to="/Login" className="active">Login</Link>
      <Link to="/Foote">Contact</Link>
      <Link to="/Download">Games</Link>
      <Link to="/" >Home</Link>
      <a href="#" className="icon" onClick={toggleMenu}>
        {isMenuOpen ? <>&#10005;</> : <>&#9776;</>}
      </a>
    </div>
  );
};

export default Navbar;
