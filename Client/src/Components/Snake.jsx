import React from 'react';

import '../Css/Snake.css';

const Navbar = () => {
     // Constants
const CANVAS_SIZE = 1200;
const CELL_SIZE = 30;
const INITIAL_SPEED = 150; // in milliseconds

// Variables
let canvas, ctx;
let snake, fruit;
let direction;
let score = 0;
let gameInterval;

// Initialize the game
function init() {
    canvas = document.getElementById("gameCanvas");
    if (!canvas) {
        console.error("Canvas element not found.");
        return;
    }
    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Canvas context not supported.");
        return;
    }
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Initialize snake and fruit objects
    snake = [{ x: 10, y: 10 }];
    fruit = { x: 15, y: 15 };

    // Set initial direction
    direction = "right";

    // Start the game
    gameInterval = setInterval(gameLoop, INITIAL_SPEED);
}

// Main game loop
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move the snake
    moveSnake();

    // Draw the snake and fruit
    drawSnake();
    drawFruit();

    // Check for collisions
    checkCollisions();
}

// Move the snake
function moveSnake() {
    let head = { x: snake[0].x, y: snake[0].y };

    // Move the head in the current direction
    if (direction === "up") head.y--;
    else if (direction === "down") head.y++;
    else if (direction === "left") head.x--;
    else if (direction === "right") head.x++;

    // Add the new head to the beginning of the snake
    snake.unshift(head);

    // Check if the snake ate the fruit
    if (head.x === fruit.x && head.y === fruit.y) {
        // Increase score and generate new fruit
        score++;
        generateFruit();
    } else {
        // Remove the tail segment
        snake.pop();
    }
}

// Draw the snake
function drawSnake() {
    ctx.fillStyle = "green";
    snake.forEach(segment => {
        ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });
    var img = new Image();
    img.onload = function() {
        // Assuming snake[0] is the head of the snake
        ctx.drawImage(img, snake[0].x * CELL_SIZE, snake[0].y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    };
    img.src = 'https://cdn.iconscout.com/icon/premium/png-256-thumb/snake-head-757502.png';
}

// Draw the fruit
function drawFruit() {// Draw fruit as a rectangle
    // ctx.fillStyle = "red";
    // ctx.fillRect(fruit.x * CELL_SIZE, fruit.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    
    // Draw fruit as an image
    var img = new Image();
    img.onload = function() {
        ctx.drawImage(img, fruit.x * CELL_SIZE, fruit.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    };
    img.src = 'https://t4.ftcdn.net/jpg/02/52/93/81/360_F_252938192_JQQL8VoqyQVwVB98oRnZl83epseTVaHe.jpg';
}

// Generate new fruit
function generateFruit() {
    fruit.x = Math.floor(Math.random() * (canvas.width / CELL_SIZE));
    fruit.y = Math.floor(Math.random() * (canvas.height / CELL_SIZE));
}

// Check for collisions
function checkCollisions() {
    // Check if snake hit the wall
    if (
        snake[0].x < 0 || snake[0].x >= canvas.width / CELL_SIZE ||
        snake[0].y < 0 || snake[0].y >= canvas.height / CELL_SIZE
    ) {
        gameOver();
    }

    // Check if snake bit itself
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            gameOver();
        }
    }
}

// Game over
function gameOver() {
    clearInterval(gameInterval);
    alert("Game Over! Your score: " + score);
    // Here you can add code to send player info and game stats to the server
}

// Handle keyboard input
document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowUp" && direction !== "down") direction = "up";
    else if (event.key === "ArrowDown" && direction !== "up") direction = "down";
    else if (event.key === "ArrowLeft" && direction !== "right") direction = "left";
    else if (event.key === "ArrowRight" && direction !== "left") direction = "right";
});

// Start the game when the page loads
window.onload = init;
function gameOver() {
    clearInterval(gameInterval);
    alert("Game Over! Your score: " + score);

    

    // Send player information and game stats to the server
    let data = {
        // Replace with actual player name
        score: score,
        gameResult: "" // Replace with actual game result
    };

    // Send data to the server using AJAX
  
}

  return (
    
<body>
    <canvas id="gameCanvas">
      
</canvas>
    <button id="startButton">Start</button>
    <button id="pauseButton">Pause</button>
    <button id="restartButton">Restart</button>

</body>
  );
};

export default Navbar;
