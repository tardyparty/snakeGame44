import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, limit } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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
const analytics = getAnalytics(app);
const db = getFirestore(app);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
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

document.addEventListener("keydown", handleKeydown);

async function fetchHighScores() {
    const highScoresQuery = query(collection(db, "highScores"), orderBy("score", "desc"), limit(5));
    const querySnapshot = await getDocs(highScoresQuery);
    highScores = querySnapshot.docs.map(doc => doc.data());
    displayHighScores();
}

function handleKeydown(event) {
    if (!gameStarted) {
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
    speed = 150; // Starting speed adjusted to 150ms per frame
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
    if (event.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if (event.keyCode == 38 && d != "DOWN") d = "UP";
    else if (event.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if (event.keyCode == 40 && d != "UP") d = "DOWN";
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "green" : "white";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = "red";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    ctx.fillStyle = "red";
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
            speed -= 2; // Adjust speed decrease rate if needed
        }
    } else {
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height || collision(newHead, snake)) {
        cancelAnimationFrame(game);
        document.getElementById("finalScore").innerText = score;
        document.getElementById("gameOver").style.display = "block";
        checkHighScore();
    }

    snake.unshift(newHead);

    ctx.fillStyle = "white";
    ctx.font = "45px Changa one";
    ctx.fillText(score, 2 * box, 1.6 * box);
}

function checkHighScore() {
    let lowestHighScore = highScores[highScores.length - 1]?.score || 0;
    if (score > lowestHighScore || highScores.length < 5) {
        document.getElementById("nameEntry").style.display = "block";
    }
}

async function saveHighScore() {
    let name = document.getElementById("playerName").value;
    if (!name) return;
    try {
        await addDoc(collection(db, "highScores"), {
            name: name,
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

