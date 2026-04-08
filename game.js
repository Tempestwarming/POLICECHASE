// Initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// Variables
let gameActive = false, score = 0, enemies = [], gameSpeed = 5;
let spawnRate = 1800, lastSpawn = 0, playerLane = 1, currentLevel = 1;
let highScore = localStorage.getItem('raceHighScore') || 0;
let badCar = { lane: 1, x: 175, y: 70, w: 50, h: 80, targetLane: 1, lastMove: 0 };

// Audio setup (wrapped in error handling)
const audio = {
    intro: new Audio('intromusic.mp3'),
    race: new Audio('racemusic.mp3'),
    ignition: new Audio('ignition.wav'),
    boom: new Audio('boom.wav'),
    end: new Audio('endgame.mp3')
};

// Image setup
const img = { player: new Image(), normal: new Image(), bad: new Image() };
img.player.src = 'goodcar.png';
img.normal.src = 'normalcar.png';
img.bad.src = 'badcar.png';

// --- BUTTONS ---
document.getElementById('start-btn').onclick = function() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
    audio.intro.loop = true;
    audio.intro.play().catch(() => console.log("Audio waiting for interaction"));
};

window.startGame = function(diff) {
    if(diff === 'low') { gameSpeed = 5; spawnRate = 2200; }
    if(diff === 'medium') { gameSpeed = 8; spawnRate = 1800; }
    if(diff === 'high') { gameSpeed = 12; spawnRate = 1400; }
    
    document.getElementById('options-menu').style.display = 'none';
    audio.intro.pause();
    audio.ignition.play().catch(() => {});

    setTimeout(() => {
        canvas.style.display = 'block';
        gameActive = true;
        audio.race.loop = true;
        audio.race.play().catch(() => {});
        requestAnimationFrame(animate);
    }, 1000);
};

// --- GAME LOGIC ---
window.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const relX = e.touches[0].clientX - rect.left;
    if (relX < rect.width / 2) { if (playerLane > 0) playerLane--; } 
    else { if (playerLane < 2) playerLane++; }
}, {passive: false});

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
    ctx.setLineDash([30, 20]);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(i * 133, 0); ctx.lineTo(i * 133, 600); ctx.stroke();
    }

    // Bandit
    if (time - badCar.lastMove > 1200) { badCar.targetLane = Math.floor(Math.random() * 3); badCar.lastMove = time; }
    badCar.x += ((badCar.targetLane * 133 + 41) - badCar.x) * 0.05;
    ctx.drawImage(img.bad, badCar.x, badCar.y, 50, 80);

    // Levels
    if (score / 100 + 1 > currentLevel && currentLevel < 10) { 
        currentLevel++; gameSpeed += 1.8; 
    }

    // Traffic
    if (time - lastSpawn > spawnRate) {
        let lane = Math.floor(Math.random() * 3);
        enemies.push({ x: lane * 133 + 41, y: -100 });
        lastSpawn = time;
    }

    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(img.normal, en.x, en.y, 50, 80);
        let px = playerLane * 133 + 41;
        if (px < en.x + 40 && px + 40 > en.x && 480 < en.y + 70 && 560 > en.y) {
            gameActive = false;
            audio.race.pause(); audio.boom.play();
            setTimeout(() => {
                canvas.style.display = 'none';
                document.getElementById('game-over-screen').style.display = 'flex';
                document.getElementById('final-score').innerText = "DISTANCE: " + Math.floor(score);
                document.getElementById('high-score').innerText = "BEST ODO: " + highScore;
                if(score > highScore) localStorage.setItem('raceHighScore', Math.floor(score));
                audio.end.play();
            }, 800);
        }
        if (en.y > 600) { enemies.splice(i, 1); score += 1; }
    });

    if (playerLane === badCar.targetLane) score += 0.25;
    drawRotatedImage(img.player, playerLane * 133 + 41, 480, 50, 80, 180);
    
    ctx.fillStyle = (playerLane === badCar.targetLane) ? "#0f0" : "#f00";
    ctx.font = "bold 22px Courier New";
    ctx.textAlign = "left"; ctx.fillText("LEVEL " + currentLevel, 20, 40);
    ctx.textAlign = "right"; ctx.fillText("ODO: " + Math.floor(score), 380, 40);
    requestAnimationFrame(animate);
}
