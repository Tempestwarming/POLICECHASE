console.log("Game Script Loaded");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

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

function showOptions() {
    console.log("Showing Options Menu");
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
    audio.intro.loop = true;
    audio.intro.play().catch(e => console.log("Audio blocked"));
}

function startGame(diff) {
    console.log("Starting Game with difficulty:", diff);
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
        canvas.style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('final-score').innerText = "DISTANCE: " + Math.floor(score);
        document.getElementById('high-score').innerText = "BEST ODO: " + highScore;
        audio.end.play().catch(() => {});
    }, 800);
}

function restartGame() {
    location.reload();
}

function spawnTraffic() {
    let patterns = [[0], [1], [2], [0, 2], [0, 1], [1, 2]];
    let patternIndex = (currentLevel > 2 && Math.random() > 0.4) 
        ? Math.floor(Math.random() * patterns.length) 
        : Math.floor(Math.random() * 3);
        
    let selectedPattern = patterns[patternIndex];
    selectedPattern.forEach((lane, index) => {
        enemies.push({ 
            x: lane * (400/3) + (400/6 - 25), 
            y: -100 - (index * 70), 
            w: 50, h: 80 
        });
    });
}

window.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    const touchX = e.touches[0].clientX;
    const rect = canvas.getBoundingClientRect();
    const relativeX = touchX - rect.left;
    if (relativeX < rect.width / 2) { if (playerLane > 0) playerLane--; } 
    else { if (playerLane < 2) playerLane++; }
}, { passive: false });

function drawRotatedImage(image, x, y, width, height, degrees) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
}

function animate(time) {
    if (!gameActive) return;
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 600);

    // Lines
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 20]);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (400/3), 0);
        ctx.lineTo(i * (400/3), 600);
        ctx.stroke();
    }

    // Bandit
    if (time - badCar.lastMove > 1200) {
        badCar.targetLane = Math.floor(Math.random() * 3);
        badCar.lastMove = time;
    }
    let badTargetX = badCar.targetLane * (400/3) + (400/6 - 25);
    badCar.x += (badTargetX - badCar.x) * 0.05;
    ctx.drawImage(img.bad, badCar.x, badCar.y, badCar.w, badCar.h);

    // Leveling
    let newLevel = Math.floor(score / 100) + 1;
    if (newLevel > currentLevel && currentLevel < 10) { 
        currentLevel = newLevel; 
        gameSpeed += 1.8; 
        spawnRate = Math.max(650, spawnRate - 180);
    }

    if (time - lastSpawn > spawnRate) {
        spawnTraffic();
        lastSpawn = time;
    }

    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(img.normal, en.x, en.y, 50, 80);

        let px = playerLane * (400/3) + (400/6 - 25);
        if (px + 12 < en.x + 38 && px + 38 > en.x + 12 && 480 + 12 < en.y + 68 && 560 > en.y + 12) {
            gameOver();
        }
        if (en.y > 600) { enemies.splice(i, 1); score += 1; }
    });

    if (playerLane === badCar.targetLane) score += 0.25;

    drawRotatedImage(img.player, playerLane * (400/3) + (400/6 - 25), 480, 50, 80, 180);
    
    ctx.fillStyle = (playerLane === badCar.targetLane) ? "#0f0" : "#f00";
    ctx.font = "bold 22px Courier New";
    ctx.textAlign = "left";
    ctx.fillText("LEVEL " + currentLevel, 20, 40);
    ctx.textAlign = "right";
    ctx.fillText("ODO: " + Math.floor(score), 380, 40);

    requestAnimationFrame(animate);
}
