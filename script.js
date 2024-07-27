// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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

// Authentication elements
const authContainer = document.getElementById("authContainer");
const mainContainer = document.getElementById("mainContainer");
const signInForm = document.getElementById("signInForm");
const signInEmail = document.getElementById("signInEmail");
const signInPassword = document.getElementById("signInPassword");
const showSignUp = document.getElementById("showSignUp");

let currentUser = null;
let personalHighScore = 0;
let highScores = [];

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
        startPhaserGame();
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
    const name = currentUser.email;
    try {
        await addDoc(collection(db, "highScores"), {
            name: name,
            email: currentUser.email,
            score: score,
            timestamp: new Date()
        });
        fetchHighScores();
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Phaser game setup
let game;
let snake;
let food;
let cursors;
let score = 0;
let scoreText;
let direction = 'RIGHT';
let newDirection = 'RIGHT';

function startPhaserGame() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#000000',
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    game = new Phaser.Game(config);
}

function preload() {
    this.load.image('snake', 'assets/snake.png');
    this.load.image('food', 'assets/food.png');
}

function create() {
    snake = this.physics.add.group();

    for (let i = 0; i < 3; i++) {
        let part = snake.create(100 + i * 16, 100, 'snake');
        part.body.setSize(16, 16);
        part.body.setCollideWorldBounds(true);
    }

    food = this.physics.add.image(200, 200, 'food');
    food.setCollideWorldBounds(true);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFFFFF' });

    cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    if (cursors.left.isDown && direction !== 'RIGHT') {
        newDirection = 'LEFT';
    } else if (cursors.right.isDown && direction !== 'LEFT') {
        newDirection = 'RIGHT';
    } else if (cursors.up.isDown && direction !== 'DOWN') {
        newDirection = 'UP';
    } else if (cursors.down.isDown && direction !== 'UP') {
        newDirection = 'DOWN';
    }

    if (Phaser.Geom.Intersects.RectangleToRectangle(snake.getChildren()[0].getBounds(), food.getBounds())) {
        food.setPosition(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600));
        let newPart = snake.create(-10, -10, 'snake');
        newPart.body.setSize(16, 16);
        score += 10;
        scoreText.setText('Score: ' + score);
    }

    let tail = snake.getChildren().pop();
    tail.x = snake.getChildren()[0].x;
    tail.y = snake.getChildren()[0].y;

    if (newDirection === 'LEFT') {
        tail.x -= 16;
    } else if (newDirection === 'RIGHT') {
        tail.x += 16;
    } else if (newDirection === 'UP') {
        tail.y -= 16;
    } else if (newDirection === 'DOWN') {
        tail.y += 16;
    }

    snake.getChildren().unshift(tail);
    direction = newDirection;

    // Check for collision with self or walls
    if (tail.x < 0 || tail.y < 0 || tail.x >= 800 || tail.y >= 600 || collision(tail, snake.getChildren().slice(1))) {
        this.physics.pause();
        saveHighScore();
        scoreText.setText('Game Over! Score: ' + score);
    }
}

function collision(newHead, array) {
    return array.some(segment => segment.x === newHead.x && segment.y === newHead.y);
}
