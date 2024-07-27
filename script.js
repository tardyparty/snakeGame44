// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 25; // Adjusted for the larger canvas size
const canvasSize = 20;
let snake;
let food;
let score;
let d;
let game;
let speed;
let highScores = [];
let gameStarted = false;
let lastTime = 0;
let frameRate = 10;
let frameDelay = 1000 / frameRate;
let personalHighScore = 0;
let currentUser = null;

document.addEventListener("keydown", handleKeydown);

// Authentication elements
const authContainer = document.getElementById("authContainer");
const mainContainer = document.getElementById("mainContainer");
const signInForm = document.getElementById("signInForm");
const signInEmail = document.getElementById("signInEmail");
const signInPassword = document.getElementById("signInPassword");
const showSignUp = document.getElementById("showSignUp");

// Authentication logic
signInForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = signInEmail.value;
    const password = signInPassword.value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log("Signed in as:", user.email);
            fetchHighScores();
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Error signing in:", errorCode, errorMessage);
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
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up
                const user = userCredential.user;
                console.log("Signed up as:", user.email);
                fetchHighScores();
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Error signing up:", errorCode, errorMessage);
            });
    });

    showSignIn.addEventListener("click", () => {
        location.reload();
    });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log("User signed in:", user.email);
        currentUser = user;
        document.getElementById("username").innerText = user.email;
        fetchPersonalHighScore(user.email);
        fetchHighScores();
        authContainer.style.display = "none";
        mainContainer.style.display = "flex";
    } else {
        // User is signed out
        console.log("User signed out");
        currentUser = null;
        authContainer.style.display = "block";
        mainContainer.style.display = "none";
    }
});

async function fetchHighScores() {
    try {
        const highScoresQuery = query(collection(db, "highScores"), orderBy("score", "desc"), limit(5));
        const querySnapshot = await getDocs(highScoresQuery);
        highScores = querySnapshot.docs.map(doc => doc.data());
        displayHighScores();
    } catch (error) {
        console.error("Error fetching high scores: ", error);
    }
}

async function fetchPersonalHighScore(email) {
    try {
        const personalHighScoreQuery = query(collection(db, "highScores"), where("email", "==", email), orderBy("score", "desc"), limit(1));
        const querySnapshot = await getDocs(personalHighScoreQuery);
        if (!querySnapshot.empty) {
            const userHighScore = querySnapshot.docs[0].data().score;
            personalHighScore = userHighScore;
            document.getElementById("personalHighScore").innerText = personalHighScore;
        }
    } catch (error) {
        console.error("Error fetching personal high score: ", error);
    }
}

function handleKeydown(event) {
    console.log("Keydown event detected: ", event.keyCode);
    if (!gameStarted) {
        console.log("Starting game");
        startGame();
        direction(event);
    } else {
        direction(event);
    }
}

function startGame() {
    gameStarted = true;
    document.getElementById("instructions").style.display = "none";
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("nameEntry").style.display = "none";
    snake = [{ x: 9 * box, y: 9 * box }];
    food = {
        x: Math.floor(Math.random() * canvasSize) * box,
        y: Math.floor(Math.random() * canvasSize) * box
    };
    score = 0;
    d = null;
    speed = 150; // Adjusted speed
    lastTime = 0;
    frameRate = 10;
    frameDelay = 1000 / frameRate;
    game = requestAnimationFrame(loop);
}

function resetGame() {
    gameStarted = false;
    document.getElementById("instructions").style.display = "block";
    cancelAnimationFrame(game);
    startGame();
}

function direction(event) {
    console.log("Direction event detected: ", event.keyCode);
    if (event.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if (event.keyCode == 38 && d != "DOWN") d = "UP";
    else if (event.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if (event.keyCode == 40 && d != "UP") d = "DOWN";
    console.log("Direction set to: ", d);
}

function collision(newHead, array) {
    return array.some(segment => segment.x === newHead.x && segment.y === newHead.y);
}

function loop(timestamp) {
    if (timestamp - lastTime >= speed) {
        lastTime = timestamp;
        draw();
    }
    game = requestAnimationFrame(loop);
}

function draw() {
    console.log("Drawing frame");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#00ff00" : "#ffffff";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = "#ff0000";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    ctx.fillStyle = "#ff0000";
    ctx.fillRect(food.x, food.y, box, box);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;

    if (snakeX == food.x && snakeY == food.y) {
        score++;
        food = {
            x: Math.floor(Math.random() * canvasSize) * box,
            y: Math.floor(Math.random() * canvasSize) * box
        };
        if (speed > 50) {
            speed -= 5; // Adjust speed decrease rate if needed
        }
    } else {
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    // Check collision with walls
    if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height || collision(newHead, snake)) {
        cancelAnimationFrame(game);
        document.getElementById("finalScore").innerText = score;
        document.getElementById("gameOver").style.display = "block";
        checkHighScore();
        if (score > personalHighScore) {
            personalHighScore = score;
            document.getElementById("personalHighScore").innerText = personalHighScore;
        }
        gameStarted = false; // Ensure game does not continue after game over
        return;
    }

    snake.unshift(newHead);

    ctx.fillStyle = "white";
    ctx.font = "45px Changa one";
    ctx.fillText(score, 2 * box, 1.6 * box);
}

function checkHighScore() {
    let lowestHighScore = highScores[highScores.length - 1]?.score || 0;
    if (score > lowestHighScore || highScores.length < 5) {
        saveHighScore();
    }
}

window.saveHighScore = async function() {
    if (!currentUser) return;
    const name = currentUser.email;
    try {
        await addDoc(collection(db, "highScores"), {
            name: name,
            email: currentUser.email,
            score: score,
            timestamp: new Date()
        });
        fetchHighScores();
        document.getElementById("nameEntry").style.display = "none";
    } catch (e) {
        console.error("Error adding document: ", e);
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

fetchHighScores();
