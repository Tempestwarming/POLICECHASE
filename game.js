const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// LOCK INTERNAL MATH TO 400x600
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

let badCar = { lane: 1, x: 175, y: 70, w: 50, h: 80, targetLane: 1, lastMove: 0 };

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

// Touch Input relative to the Canvas element
window.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    const touchX = e.touches[0].clientX;
    const rect = canvas.getBoundingClientRect();
    const relativeX = touchX - rect.left;
    if (relativeX < rect.width / 2) {
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
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 600);

    // Road Lines
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 20]);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (400/3), 0);
        ctx.lineTo(i * (400/3), 600);
        ctx.stroke();
    }

    // Bandit (Bad Car)
    if (time - badCar.lastMove > 1200) {
        badCar.targetLane = Math.floor(Math.random() * 3);
        badCar.lastMove = time;
    }
    let badTargetX = badCar.targetLane * (400/3) + (400/6 - 25);
    badCar.x += (badTargetX - badCar.x) * 0.05;
    ctx.drawImage(img.bad, badCar.x, badCar.y, badCar.w, badCar.h);

    // Progression
    let newLevel = Math.floor(score / 100) + 1;
    if (newLevel > currentLevel) { currentLevel = newLevel; gameSpeed += 0.7; }
    if (score >= 1000) {
        gameActive = false;
        alert("BANDIT BUSTED!");
        score = 0; gameSpeed += 2; enemies = [];
        gameActive = true;
    }

    // Traffic
    if (time - lastSpawn > spawnRate) {
        let lane = Math.floor(Math.random() * 3);
        enemies.push({ x: lane * (400/3) + (400/6 - 25), y: -100 });
        lastSpawn = time;
    }

    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(img.normal, en.x, en.y, 50, 80);

        // Hitbox
        let px = playerLane * (400/3) + (400/6 - 25);
        if (px + 10 < en.x + 40 && px + 40 > en.x + 10 && 480 + 10 < en.y + 70 && 560 > en.y + 10) {
            gameActive = false;
            audio.race.pause(); audio.boom.play();
            setTimeout(() => { location.reload(); }, 500);
        }
        if (en.y > 600) { enemies.splice(i, 1); score += 1; }
    });

    if (playerLane === badCar.targetLane) score += 0.2;

    // Player (Positioned at 480y to keep it away from the bottom edge)
    drawRotatedImage(img.player, playerLane * (400/3) + (400/6 - 25), 480, 50, 80, 180);
    
    // UI
    ctx.fillStyle = (playerLane === badCar.targetLane) ? "#0f0" : "#f00";
    ctx.font = "bold 24px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("GEAR " + currentLevel, 70, 40);
    ctx.fillText(Math.floor(score).toString().padStart(4, '0'), 330, 40);

    requestAnimationFrame(animate);
}
