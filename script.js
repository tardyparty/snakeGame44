// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCdV-b9VrWRIQXbn9RcXEZf9tZh_ltrdlM",
    authDomain: "snake-150af.firebaseapp.com",
    projectId: "snake-150af",
    storageBucket: "snake-150af.appspot.com",
    messagingSenderId: "896495502826",
    appId: "1:896495502826:web:9a54c439c765ee81d4de93",
    measurementId: "G-C5FVFL7BHM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Authentication elements
const authContainer = document.getElementById("authContainer");
const mainContainer = document.getElementById("mainContainer");
const signInForm = document.getElementById("signInForm");
const signInEmail = document.getElementById("signInEmail");
const signInPassword = document.getElementById("signInPassword");
const showSignUp = document.getElementById("showSignUp");
const gameOverMessage = document.getElementById("gameOverMessage");
const playAgainButton = document.getElementById("playAgainButton");

let currentUser = null;
let personalHighScore = 0;
let highScores = [];
let gameInterval;
let canvas, ctx;
let snake = [];
let direction = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let changingDirection = false;
let gameStarted = false;

// Authentication logic
signInForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = signInEmail.value;
    const password = signInPassword.value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Signed in as:", user.email);
            fetchHighScores();
        })
        .catch((error) => {
            console.error("Error signing in:", error.code, error.message);
        });
});

showSignUp.addEventListener("click", () => {
    signInForm.innerHTML = `
        <h1>Sign Up</h1>
        <input type="email" id="signUpEmail" placeholder="Email" required>
        <input type="password" id="signUpPassword" placeholder="Password" required>
        <button type="submit">Sign Up</button>
        <p>Already have an account? <a href="#" id="showSignIn">Sign In</a></p>
    `;

    const signUpForm = signInForm;
    const signUpEmail = document.getElementById("signUpEmail");
    const signUpPassword = document.getElementById("signUpPassword");
    const showSignIn = document.getElementById("showSignIn");

    signUpForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = signUpEmail.value;
        const password = signUpPassword.value;
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Signed up as:", user.email);
                fetchHighScores();
            })
            .catch((error) => {
                console.error("Error signing up:", error.code, error.message);
            });
    });

    showSignIn.addEventListener("click", () => {
        location.reload();
    });
});

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User signed in:", user.email);
        currentUser = user;
        document.getElementById("username").innerText = user.email;
        fetchPersonalHighScore(user.email);
        fetchHighScores();
        authContainer.style.display = "none";
        mainContainer.style.display = "flex";
    } else {
        console.log("User signed out");
        currentUser = null;
        authContainer.style.display = "block";
        mainContainer.style.display = "none";
    }
});

async function fetchHighScores() {
    try {
        const highScoresQuery = db.collection("highScores").orderBy("score", "desc").limit(5);
        const querySnapshot = await highScoresQuery.get();
        highScores = querySnapshot.docs.map(doc => doc.data());
        displayHighScores();
    } catch (error) {
        console.error("Error fetching high scores: ", error);
    }
}

async function fetchPersonalHighScore(email) {
    try {
        const personalHighScoreQuery = db.collection("highScores")
            .where("email", "==", email)
            .orderBy("score", "desc")
            .limit(1);
        const querySnapshot = await personalHighScoreQuery.get();
        if (!querySnapshot.empty) {
            const userHighScore = querySnapshot.docs[0].data().score;
            personalHighScore = userHighScore;
            document.getElementById("personalHighScore").innerText = personalHighScore;
        }
    } catch (error) {
        console.error("Error fetching personal high score: ", error);
    }
}

function displayHighScores() {
    const scoreList = document.getElementById("scoreList");
    scoreList.innerHTML = "";
    highScores.forEach(({ name, score }) => {
        const li = document.createElement("li");
        li.textContent = `${name} - ${score}`;
        scoreList.appendChild(li);
    });
}

async function saveHighScore() {
    if (!currentUser) return;
    try {
        await db.collection("highScores").add({
            name: currentUser.email,
            score: score,
            timestamp: new Date()
        });
        fetchHighScores();
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

function startGame() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    canvas.width = 560; // 70% of the original 800px width
    canvas.height = 420; // 70% of the original 600px height

    document.addEventListener("keydown", handleFirstKeyDown);

    gameOverMessage.style.display = "none";
    playAgainButton.style.display = "none";

    snake = [
        { x: 50, y: 50 },
        { x: 40, y: 50 }
    ];
    direction = { x: 10, y: 0 };
    score = 0;
    changingDirection = false;
    gameStarted = false;
    createFood();
}

function handleFirstKeyDown(event) {
    const keyPressed = event.keyCode;
    if ([37, 38, 39, 40].includes(keyPressed) && !gameStarted) {
        document.removeEventListener("keydown", handleFirstKeyDown);
        document.addEventListener("keydown", changeDirection);
        gameStarted = true;
        gameInterval = setInterval(main, 100);
    }
}

function main() {
    if (hasGameEnded()) {
        clearInterval(gameInterval);
        saveHighScore();
        gameOverMessage.style.display = "block";
        playAgainButton.style.display = "block";
        return;
    }

    changingDirection = false;
    clearCanvas();
    drawFood();
    advanceSnake();
    drawSnake();
}

function clearCanvas() {
    ctx.fillStyle = "black";
    ctx.strokestyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawFood() {
    ctx.fillStyle = "red";
    ctx.strokestyle = "darkred";
    ctx.fillRect(food.x, food.y, 10, 10);
    ctx.strokeRect(food.x, food.y, 10, 10);
}

function createFood() {
    food.x = Math.floor(Math.random() * 55) * 10;
    food.y = Math.floor(Math.random() * 41) * 10;
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) createFood();
    });
}

function advanceSnake() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        createFood();
    } else {
        snake.pop();
    }
}

function drawSnake() {
    snake.forEach(part => {
        ctx.fillStyle = "lightgreen";
        ctx.strokestyle = "darkgreen";
        ctx.fillRect(part.x, part.y, 10, 10);
        ctx.strokeRect(part.x, part.y, 10, 10);
    });
}

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = direction.y === -10;
    const goingDown = direction.y === 10;
    const goingRight = direction.x === 10;
    const goingLeft = direction.x === -10;

    if (keyPressed === LEFT_KEY && !goingRight) {
        direction = { x: -10, y: 0 };
    }
    if (keyPressed === UP_KEY && !goingDown) {
        direction = { x: 0, y: -10 };
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        direction = { x: 10, y: 0 };
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        direction = { x: 0, y: 10 };
    }

    changingDirection = true;
}

function hasGameEnded() {
    for (let i = 1; i < snake.length; i++) {
        const hasCollided = snake[i].x === snake[0].x && snake[i].y === snake[0].y;
        if (hasCollided) return true;
    }
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= canvas.width;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= canvas.height;

    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
}

playAgainButton.addEventListener("click", () => {
    startGame();
});
