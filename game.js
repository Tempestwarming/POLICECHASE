const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// This function makes sure the game internal resolution matches your screen size
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

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

// Bandit Setup
let badCar = { lane: 1, x: 0, y: 80, w: 50, h: 80, targetLane: 1, lastMove: 0 };

function showOptions() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
    audio.intro.loop = true;
    audio.intro.play().catch(() => {});
}

function startGame(diff) {
    if(diff === 'low') { gameSpeed = 5; spawnRate = 2200; }
    if(diff === 'medium') { gameSpeed = 8; spawnRate = 1600; }
    if(diff === 'high') { gameSpeed = 12; spawnRate = 1000; }

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

// Touch controls based on screen halves
window.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    const touchX = e.touches[0].clientX;
    if (touchX < window.innerWidth / 2) {
        if (playerLane > 0) playerLane--;
    } else {
        if (playerLane < 2) playerLane++;
    }
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
    
    const W = canvas.width;
    const H = canvas.height;
    const L_WIDTH = W / 3;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, W, H);

    // Road Lines
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * L_WIDTH, 0);
        ctx.lineTo(i * L_WIDTH, H);
        ctx.stroke();
    }

    // Bandit (Top Car)
    if (time - badCar.lastMove > 1200) {
        badCar.targetLane = Math.floor(Math.random() * 3);
        badCar.lastMove = time;
    }
    let badTargetX = badCar.targetLane * L_WIDTH + (L_WIDTH / 2 - 25);
    badCar.x += (badTargetX - badCar.x) * 0.05;
    ctx.drawImage(img.bad, badCar.x, badCar.y, 50, 80);

    // Progression
    if (score >= 1000) {
        gameActive = false;
        alert("BANDIT BUSTED!");
        score = 0; gameSpeed += 2; enemies = [];
        gameActive = true;
    }

    // Traffic Spawning
    if (time - lastSpawn > spawnRate) {
        let lane = Math.floor(Math.random() * 3);
        enemies.push({ x: lane * L_WIDTH + (L_WIDTH / 2 - 25), y: -100 });
        lastSpawn = time;
    }

    // Move Traffic
    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(img.normal, en.x, en.y, 50, 80);

        // Hitbox Collision
        let px = playerLane * L_WIDTH + (L_WIDTH / 2 - 25);
        let py = H - 120; // Player sits 120px from bottom
        if (px < en.x + 40 && px + 40 > en.x && py < en.y + 70 && py + 70 > en.y) {
            gameActive = false;
            audio.race.pause(); audio.boom.play();
            setTimeout(() => { location.reload(); }, 500);
        }
        if (en.y > H) { enemies.splice(i, 1); score += 1; }
    });

    if (playerLane === badCar.targetLane) score += 0.2;

    // Player (Flipped 180)
    let playerX = playerLane * L_WIDTH + (L_WIDTH / 2 - 25);
    let playerY = H - 120;
    drawRotatedImage(img.player, playerX, playerY, 50, 80, 180);
    
    // UI Score
    ctx.fillStyle = (playerLane === badCar.targetLane) ? "#0f0" : "#f00";
    ctx.font = "bold 20px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("SCORE: " + Math.floor(score).toString().padStart(4, '0'), W/2, 40);

    requestAnimationFrame(animate);
}
