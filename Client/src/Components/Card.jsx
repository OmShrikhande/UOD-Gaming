import React, { useState } from 'react';
import '../Css/Card.css';
import play from '../assets/play.png'

const Card = () => {
 
  return (
    <div className="games" id="games">
      <h1>Wanna Try Out</h1>
      <br/>
<div className="nft">
    <div className='main'>
      <img className='tokenImage' src="https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU" alt="NFT" />
      <h2>Tick Tac Toe</h2>
      <p className='description'>all time favourite of everyone the duo clasher Tick Tac Toe</p>
      <div className='tokenInfo'>
        <div className="price">
          <ins>◘</ins>
          <p>highscore</p>
        </div>
        <div className="duration">
          <ins>◷ 500+ players</ins>
          <p></p>
        </div>
      </div>
      <hr />
      <div className='creator'>
        <div className='wrapper'>
          <a href="../Pages/tictacktoe.html">
          <img src={play}alt="start" /></a>
        </div>
        <p>Let's get into Battle!</p>
      </div>
    </div>
  </div>

  

  <div className="nft">
    <div className='main'>
      <img className='tokenImage' src="https://www.codewithc.com/wp-content/uploads/2014/04/snake-game3.png" alt="NFT" />
      <h2>Snake Game</h2>
      <p className='description'>This is to give you your old memories .</p>
      <div className='tokenInfo'>
        <div className="price">
          <ins>◘</ins>
          <p>highscore</p>
        </div>
        <div className="duration">
          <ins>◷</ins>
          <p>750+ players</p>
        </div>
      </div>
      <hr />
      <div className='creator'>
        <div className='wrapper'>
          
          <a href="../Pages/snake.html">
          <img src={play} alt="start" /></a>

        </div>
        <p>Go Break the highscore !!</p>
      </div>
    </div>
  </div>


  <div className="nft">
    <div className='main'>
      <img className='tokenImage' src="https://play-lh.googleusercontent.com/BE-Z-fyEJKI5Y69ETauqFK_jgNmVB1dn6cvrb-aOk_f6EdE3QVgInezDZym9FjKJJzlx" alt="NFT" />
      <h2>Color Guesser</h2>
      <p className='description'>This is to Test your Luck In your life and your Quickness</p>
      <div className='tokenInfo'>
        <div className="price">
          <ins>◘</ins>
          <p>highscore</p>
        </div>
        <div className="duration">
          <ins>◷</ins>
          <p>600+ players</p>
        </div>
      </div>
      <hr />
      <div className='creator'>
        <div className='wrapper'>
          <a href="../Pages/color.html">
          <img src={play} alt="start" /></a>
        </div>
        <p>Lets Test Luck Today!</p>
      </div>
    </div>
  </div>
  </div>
  );
};

export default Card;

