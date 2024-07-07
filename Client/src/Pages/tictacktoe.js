let currentPlayer = 'X';
let gameActive = false;
let playerName = '';

// Function to start the game
function startGame() {
    playerName = document.getElementById('player-name').value.trim();
    playerName = document.getElementById('player-name2').value.trim();
    if (playerName === '' || playerName === '' ) {
        alert('Please enter your name to start the game.');
        return;
    }
    
    // Send player name to the server to store in the database
    insertPlayer(playerName);
    
    gameActive = true;
    document.getElementById('player-info').style.display = 'none';
    document.getElementById('game-board').style.display = 'block';
    document.getElementById('game-result').innerText = '';
    currentPlayer = 'X';
    resetBoard();
}

// Function to reset the game board
function resetBoard() {
    for (let i = 0; i < 9; i++) {
        document.getElementById('cell-' + i).innerText = '';
    }
}

// Function to handle player's move
function handleClick(cellIndex) {
    if (!gameActive) return;
    const cell = document.getElementById('cell-' + cellIndex);
    if (cell.innerText !== '') return;
    cell.innerText = currentPlayer;
    if (checkWin()) {
        document.getElementById('game-result').innerText = `${playerName} wins!`;
        gameActive = false;
        
        // Send game result to the server to record in the database
        recordGameResult(playerName, 'Win');
    } else if (checkDraw()) {
        document.getElementById('game-result').innerText = "It's a draw!";
        gameActive = false;
        
        // Send game result to the server to record in the database
        recordGameResult(playerName, 'Draw');
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }
}

// Function to check for a win
function checkWin() {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    return winningCombinations.some(combination => {
        return combination.every(index => {
            return document.getElementById('cell-' + index).innerText === currentPlayer;
        });
    });
}

// Function to check for a draw
function checkDraw() {
    return [...document.querySelectorAll('.cell')].every(cell => cell.innerText !== '');
}

// Function to send player name to the server to store in the database
function insertPlayer(name) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../scripts/php/tictacktoe.php', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            console.log(xhr.responseText);
        }
    };
    xhr.send('action=insertPlayer&name=' + encodeURIComponent(name));
}

// Function to send game result to the server to record in the database
function recordGameResult(playerName, result) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../scripts/php/tictacktoe.php', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            console.log(xhr.responseText);
        }
    };
    xhr.send('action=recordGameResult&playerName=' + encodeURIComponent(playerName) + '&result=' + encodeURIComponent(result));
}
