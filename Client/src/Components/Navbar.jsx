import React, { useState } from 'react';
import '../Css/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={`topnav ${isMenuOpen ? 'responsive' : ''}`} id="myTopnav">
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
      <a href="#news">News</a>
      <a href="#home" className="active">Home</a>
      <a href="#" className="icon" onClick={toggleMenu}>
        {isMenuOpen ? <>&#10005;</> : <>&#9776;</>}
      </a>
    </div>
  );
};

export default Navbar;
