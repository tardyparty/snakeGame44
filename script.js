<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snake Game with Firebase</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="authContainer">
        <h1>Sign In</h1>
        <form id="signInForm">
            <input type="email" id="signInEmail" placeholder="Email" required>
            <input type="password" id="signInPassword" placeholder="Password" required>
            <button type="submit">Sign In</button>
        </form>
        <p>Don't have an account? <a href="#" id="showSignUp">Sign Up</a></p>
    </div>
    <div id="mainContainer" style="display:none;">
        <div id="highScores">
            <h2>High Scores</h2>
            <ol id="scoreList"></ol>
        </div>
        <div id="gameArea">
            <h1>Snake Game</h1>
            <canvas id="gameCanvas" width="500" height="500"></canvas>
            <div id="gameOver" style="display: none;">
                <h1>Game Over</h1>
                <p>Your Score: <span id="finalScore"></span></p>
                <button onclick="resetGame()">Play Again</button>
            </div>
            <div id="instructions">
                <h1>Snake Game</h1>
                <p>Press any arrow key to start</p>
                <p>Use the arrow keys to control the snake</p>
            </div>
            <div id="nameEntry" style="display: none;">
                <input type="text" id="playerName" placeholder="Enter your name">
                <button onclick="saveHighScore()">Submit</button>
            </div>
            <div id="userInfo">
                <p>Username: <span id="username">Future User</span></p>
                <p>Personal High Score: <span id="personalHighScore">0</span></p>
            </div>
        </div>
        <div id="instructionsArea">
            <h2>Instructions</h2>
            <p>Use arrow keys to move the snake.</p>
            <p>Eat the red food to grow.</p>
            <p>Avoid colliding with walls and yourself.</p>
            <p>Try to beat the high scores!</p>
        </div>
    </div>
    <script type="module" src="./script.js"></script>
</body>
</html>
