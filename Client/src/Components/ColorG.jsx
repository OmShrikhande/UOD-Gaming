import React, { useState, useEffect } from 'react';
import "../Css/ColorG.css";
import Foote from '../Components/Foote'

const ColorG = () => {
  const [colors, setColors] = useState([]);
  const [pickedColor, setPickedColor] = useState('');
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    generateColors();
  }, []);

  const generateColors = () => {
    const newColors = generateRandomColors(6);
    setColors(newColors);
    setPickedColor(pickColor(newColors));
  };

  const pickColor = (colors) => {
    const random = Math.floor(Math.random() * colors.length);
    return colors[random];
  };

  const generateRandomColors = (num) => {
    const arr = [];
    for (let i = 0; i < num; i++) {
      arr.push(randomColor());
    }
    return arr;
  };

  const randomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleColorClick = (color) => {
    if (color === pickedColor) {
      setMessage("Correct!");
      changeColors(color);
    } else {
      setMessage("Try Again");
    }
  };

  const changeColors = (color) => {
    setColors(colors.map(() => color));
  };

  const handleReset = () => {
    generateColors();
    setMessage('');
  };

  const handleSaveScore = (event) => {
    event.preventDefault();
    if (username === '') {
      alert('Please enter a username.');
      return;
    }
    const score = message === "Correct!"? 'Win' : 'Lose';
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../scripts/php/color.php', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
      if (xhr.status === 200) {
        alert('Score saved successfully!');
      } else {
        alert('Error saving score.');
      }
    };
    xhr.onerror = function() {
      alert('Error saving score.');
    };
    xhr.send(`username=${username}&score=${score}`);
  };

  return (
    <div>
      <h1>Color Guessing Game</h1>
      <div style={{ backgroundColor: pickedColor }} id="colorDisplay"></div>
      <div id="colorButtons">
        {colors.map((color, index) => (
          <div
            key={index}
            style={{ backgroundColor: color }}
            className="colorButton"
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
      <div id="message">{message}</div>
      <button id="resetButton" onClick={handleReset}>New Colors</button>
      <form id="playerForm" onSubmit={handleSaveScore}>
        <label for="username">Username:</label>
        <input
          type="text"
          id="username"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <button type="submit">Save Score</button>
      </form>
      <Foote />
    </div>
  );
};

export default ColorG;