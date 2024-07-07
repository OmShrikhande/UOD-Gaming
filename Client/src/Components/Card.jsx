import React, { useState } from 'react';
import '../Css/Card.css';

const Card = () => {
 
  return (
    <div class="games" id="games">
<div class="nft">
    <div class='main'>
      <img class='tokenImage' src="https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU" alt="NFT" />
      <h2>Tick Tac Toe</h2>
      <p class='description'>all time favourite of everyone the duo clasher Tick Tac Toe</p>
      <div class='tokenInfo'>
        <div class="price">
          <ins>◘</ins>
          <p>highscore</p>
        </div>
        <div class="duration">
          <ins>◷ 500+ players</ins>
          <p></p>
        </div>
      </div>
      <hr />
      <div class='creator'>
        <div class='wrapper'>
          <a href="../src/tictacktoe.html">
          <img src="../media/play.png" alt="start" /></a>
        </div>
        <p>Let's get into Battle!</p>
      </div>
    </div>
  </div>

  

  <div class="nft">
    <div class='main'>
      <img class='tokenImage' src="https://files.utilitylog.com/img/Snake-game-on-Google.png" alt="NFT" />
      <h2>Snake Game</h2>
      <p class='description'>This is to give you your old memories .</p>
      <div class='tokenInfo'>
        <div class="price">
          <ins>◘</ins>
          <p>highscore</p>
        </div>
        <div class="duration">
          <ins>◷</ins>
          <p>750+ players</p>
        </div>
      </div>
      <hr />
      <div class='creator'>
        <div class='wrapper'>
          
          <a href="../src/snake.html">
          <img src="../media/play.png" alt="start" /></a>

        </div>
        <p>Go Break the highscore !!</p>
      </div>
    </div>
  </div>


  <div class="nft">
    <div class='main'>
      <img class='tokenImage' src="https://play-lh.googleusercontent.com/BE-Z-fyEJKI5Y69ETauqFK_jgNmVB1dn6cvrb-aOk_f6EdE3QVgInezDZym9FjKJJzlx" alt="NFT" />
      <h2>Color Guesser</h2>
      <p class='description'>This is to Test your Luck In your life and your Quickness</p>
      <div class='tokenInfo'>
        <div class="price">
          <ins>◘</ins>
          <p>highscore</p>
        </div>
        <div class="duration">
          <ins>◷</ins>
          <p>600+ players</p>
        </div>
      </div>
      <hr />
      <div class='creator'>
        <div class='wrapper'>
          <a href="../src/color.html">
          <img src="../media/play.png" alt="start" /></a>
        </div>
        <p>Lets Test Luck Today!</p>
      </div>
    </div>
  </div>
  </div>
  );
};

export default Card;

