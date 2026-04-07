const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// FORCED INTERNAL RESOLUTION
canvas.width = 400;
canvas.height = 600;

const img = { player: new Image(), normal: new Image(), bad: new Image() };
img.player.src = 'goodcar.png';
img.normal.src = 'normalcar.png';
img.bad.src = 'badcar.png';

// ... (Keep your audio and variables the same) ...

let gameActive = false;
let score = 0;
let currentLevel = 1;
let playerLane = 1;
let enemies = [];
let gameSpeed = 5;
let spawnRate = 1800;
let lastSpawn = 0;
let badCar = { lane: 1, x: 150, y: 60, w: 50, h: 80, targetLane: 1, lastMove: 0 };

// ... (Keep showOptions and startGame the same) ...

function animate(time) {
    if (!gameActive) return;
    
    // We use 400 and 600 everywhere now to ensure it fits the canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 600);

    // Cyan Road Lines
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 20]);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (400 / 3), 0);
        ctx.lineTo(i * (400 / 3), 600);
        ctx.stroke();
    }

    // Bandit Logic
    if (time - badCar.lastMove > 1200) {
        badCar.targetLane = Math.floor(Math.random() * 3);
        badCar.lastMove = time;
    }
    let badTargetX = badCar.targetLane * (400 / 3) + (400 / 6 - 25);
    badCar.x += (badTargetX - badCar.x) * 0.05;
    ctx.drawImage(img.bad, badCar.x, badCar.y, badCar.w, badCar.h);

    // Leveling
    let newLevel = Math.floor(score / 100) + 1;
    if (newLevel > currentLevel) {
        currentLevel = newLevel;
        gameSpeed += 0.7;
    }

    // Traffic Spawning
    if (time - lastSpawn > spawnRate) {
        let lane = Math.floor(Math.random() * 3);
        enemies.push({ x: lane * (400 / 3) + (400 / 6 - 25), y: -100, w: 50, h: 80 });
        lastSpawn = time;
    }

    // Move Traffic
    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(img.normal, en.x, en.y, en.w, en.h);

        // Precise Hitbox
        let px = playerLane * (400 / 3) + (400 / 6 - 25);
        if (px + 10 < en.x + 40 && px + 40 > en.x + 10 && 500 + 10 < en.y + 70 && 580 > en.y + 10) {
            gameActive = false;
            audio.race.pause();
            audio.boom.play();
            setTimeout(() => { location.reload(); }, 500);
        }
        if (en.y > 600) { enemies.splice(i, 1); score += 1; }
    });

    if (playerLane === badCar.targetLane) score += 0.2;

    // Player (Positioned safely above the bottom edge)
    drawRotatedImage(img.player, playerLane * (400 / 3) + (400 / 6 - 25), 480, 50, 80, 180);
    
    // UI
    ctx.fillStyle = (playerLane === badCar.targetLane) ? "#0f0" : "#f00";
    ctx.font = "bold 24px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("GEAR " + currentLevel, 70, 40);
    ctx.fillText(Math.floor(score).toString().padStart(4, '0'), 330, 40);

    requestAnimationFrame(animate);
}
