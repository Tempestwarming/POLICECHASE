const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// Assets
const img = { player: new Image(), normal: new Image(), bad: new Image() };
img.player.src = 'goodcar.png';
img.normal.src = 'normalcar.png';
img.bad.src = 'badcar.png';

const audio = {
    intro: new Audio('intromusic.mp3'),
    race: new Audio('racemusic.mp3'),
    ignition: new Audio('ignition.wav'),
    boom: new Audio('boom.wav'),
    end: new Audio('endgame.mp3')
};

let gameActive = false;
let score = 0;
let enemies = [];
let gameSpeed = 5;
let spawnRate = 1800;
let lastSpawn = 0;
let playerLane = 1;
let currentLevel = 1;
let highScore = localStorage.getItem('raceHighScore') || 0;

let badCar = { lane: 1, x: 175, y: 70, w: 50, h: 80, targetLane: 1, lastMove: 0 };

function stopAllAudio() {
    Object.values(audio).forEach(track => {
        track.pause();
        track.currentTime = 0;
    });
}

function showOptions() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
    audio.intro.loop = true;
    audio.intro.play().catch(() => {});
}

function startGame(diff) {
    if(diff === 'low') { gameSpeed = 5; spawnRate = 2200; }
    if(diff === 'medium') { gameSpeed = 8; spawnRate = 1800; }
    if(diff === 'high') { gameSpeed = 12; spawnRate = 1400; }
    
    audio.intro.pause();
    audio.ignition.play();
    setTimeout(() => {
        document.getElementById('options-menu').style.display = 'none';
        canvas.style.display = 'block';
        gameActive = true;
        audio.race.loop = true;
        audio.race.play();
        requestAnimationFrame(animate);
    }, 1500);
}

function gameOver() {
    gameActive = false;
    audio.race.pause();
    audio.boom.play();
    
    if (Math.floor(score) > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('raceHighScore', highScore);
    }

    setTimeout(() => {
        stopAllAudio();
        canvas.style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('final-score').innerText = "DISTANCE: " + Math.floor(score);
        document.getElementById('high-score').innerText = "BEST ODO: " + highScore;
        
        // Final Screen Music
        audio.end.loop = true;
        audio.end.play().catch(() => {});
    }, 800);
}

function restartGame() {
    stopAllAudio();
    location.reload();
}

// Pattern Spawner
function spawnTraffic() {
    let patterns = [[0], [1], [2], [0, 2], [0, 1], [1, 2]];
    let patternIndex = (currentLevel > 3 && Math.random() > 0.5) 
        ? Math.floor(Math.random() * patterns.length) 
        : Math.floor(Math.random() * 3);
        
    let selectedPattern = patterns[patternIndex];
    selectedPattern.forEach((lane, index) => {
        enemies.push({ 
            x: lane * (400/3) + (400/6 - 25), 
            y: -100 - (index * 60), 
            w: 50, h: 80 
        });
    });
}

// Input
window.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    const touchX = e.touches[0].clientX;
    const rect = canvas.getBoundingClientRect();
    const relativeX = touchX - rect.left;
    if (relativeX < rect.width / 2) { if (playerLane > 0) playerLane--; }
