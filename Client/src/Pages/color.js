let colors = generateRandomColors(6);
let pickedColor = pickColor();

const colorDisplay = document.getElementById("colorDisplay");
const colorButtons = document.getElementById("colorButtons");
const message = document.getElementById("message");
const resetButton = document.getElementById("resetButton");
const playerForm = document.getElementById("playerForm");

colorDisplay.textContent = pickedColor;
resetButton.addEventListener("click", resetGame);
playerForm.addEventListener("submit", saveScore);

// Create color buttons
for (let i = 0; i < colors.length; i++) {
    const colorButton = document.createElement("div");
    colorButton.classList.add("colorButton");
    colorButton.style.backgroundColor = colors[i];
    colorButton.addEventListener("click", function() {
        const clickedColor = this.style.backgroundColor;
        if (clickedColor === pickedColor) {
            message.textContent = "Correct!";
            changeColors(clickedColor);
            resetButton.textContent = "Play Again?";
        } else {
            this.style.backgroundColor = "#232323";
            message.textContent = "Try Again";
        }
    });
    colorButtons.appendChild(colorButton);
}

function changeColors(color) {
    // Change color of all color buttons to the correct color
    const colorButtons = document.querySelectorAll(".colorButton");
    colorButtons.forEach(button => {
        button.style.backgroundColor = color;
    });
}

function pickColor() {
    // Pick a random color from the colors array
    const random = Math.floor(Math.random() * colors.length);
    return colors[random];
}

function generateRandomColors(num) {
    // Generate 'num' random colors and return as an array
    const arr = [];
    for (let i = 0; i < num; i++) {
        arr.push(randomColor());
    }
    return arr;
}

function randomColor() {
    // Generate a random color in the format "rgb(r, g, b)"
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

function resetGame() {
    // Generate new random colors, pick a new color, update display
    colors = generateRandomColors(6);
    pickedColor = pickColor();
    colorDisplay.textContent = pickedColor;
    const colorButtons = document.querySelectorAll(".colorButton");
    colorButtons.forEach((button, index) => {
        button.style.backgroundColor = colors[index];
    });
    message.textContent = "";
    resetButton.textContent = "New Colors";
}

function saveScore(event) {
    event.preventDefault(); // Prevent form submission
    const username = document.getElementById("username").value.trim();
    if (username === '') {
        alert('Please enter a username.');
        return;
    }
    const score = message.textContent === "Correct!" ? 'Win' : 'Lose'; // Adjust scoring logic as needed
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
}
