import React, { useState, useEffect } from 'react';
import "../Css/TTT.css";
import Foote from './Foote';

const TTT = () => {
  const [playerName, setPlayerName] = useState('');
  const [gameActive, setGameActive] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [gameResult, setGameResult] = useState('');
  const [board, setBoard] = useState(Array(9).fill(''));

  useEffect(() => {
    // Send player name to the server to store in the database
    if (playerName) {
      fetch('../scripts/php/tictacktoe.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=insertPlayer&name=${encodeURIComponent(playerName)}`,
      })
      .then(response => response.text())
      .then(data => console.log(data));
    }
  }, [playerName]);

  const startGame = () => {
    const playerNameInput = document.getElementById('player-name').value.trim();
    const playerNameInput2 = document.getElementById('player-name2').value.trim();
    if (playerNameInput === '' || playerNameInput2 === '') {
      alert('Please enter your name to start the game.');
      return;
    }
    setPlayerName(playerNameInput);
    setGameActive(true);
    resetBoard();
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(''));
  };

  const handleClick = (cellIndex) => {
    if (!gameActive) return;
    if (board[cellIndex] !== '') return;
    const newBoard = [...board];
    newBoard[cellIndex] = currentPlayer;
    setBoard(newBoard);
    if (checkWin()) {
      setGameResult(`${playerName} wins!`);
      setGameActive(false);
      // Send game result to the server to record in the database
      fetch('../scripts/php/tictacktoe.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=recordGameResult&playerName=${encodeURIComponent(playerName)}&result=Win`,
      })
      .then(response => response.text())
      .then(data => console.log(data));
    } else if (checkDraw()) {
      setGameResult("It's a draw!");
      setGameActive(false);
      // Send game result to the server to record in the database
      fetch('../scripts/php/tictacktoe.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=recordGameResult&playerName=${encodeURIComponent(playerName)}&result=Draw`,
      })
      .then(response => response.text())
      .then(data => console.log(data));
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const checkWin = () => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    return winningCombinations.some(combination => {
      return combination.every(index => {
        return board[index] === currentPlayer;
      });
    });
  };

  const checkDraw = () => {
    return board.every(cell => cell !== '');
  };

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      <div id="player-info">
        <label for="player-name">Enter Your Name:</label>
        <input type="text" id="player-name" placeholder="O" />
        <label for="player-name2">Enter Your Name:</label>
        <input type="text" id="player-name2" placeholder="X" />
        <button onClick={startGame}>Start Game</button>
      </div>
      <div id="game-board">
        {board.map((cell, index) => (
          <div key={index} className="cell" onClick={() => handleClick(index)}>
            {cell}
          </div>
        ))}
      </div>
      <div id="game-result">{gameResult}</div>
      <Foote />
    </div>
  );
};

export default TTT;