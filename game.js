const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
let spawnRate = 1500;
let lastSpawn = 0;
let playerLane = 1;

// Bad Car (The Bandit) - Stays at the top
let badCar = { lane: 1, x: 150, y: 60, w: 50, h: 80, targetLane: 1, lastMove: 0 };

function showOptions() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
    audio.intro.loop = true;
    audio.intro.play();
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
        animate(0);
    }, 1500);
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && playerLane > 0) playerLane--;
    if (e.key === 'ArrowRight' && playerLane < 2) playerLane++;
});

function spawnTraffic() {
    let lane = Math.floor(Math.random() * 3);
    enemies.push({
        x: lane * (400/3) + 35,
        y: -100,
        w: 50, h: 80
    });
}

function drawRotatedImage(image, x, y, width, height, degrees) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
}

function animate(time) {
    if (!gameActive) return;
    
    // 1. CLEAR AND DRAW ROAD
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 600);

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 20]);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (400/3), 0);
        ctx.lineTo(i * (400/3), 600);
        ctx.stroke();
    }

    // 2. THE BAD CAR (CHASE TARGET)
    if (time - badCar.lastMove > 1200) {
        badCar.targetLane = Math.floor(Math.random() * 3);
        badCar.lastMove = time;
    }
    let badTargetX = badCar.targetLane * (400/3) + 35;
    badCar.x += (badTargetX - badCar.x) * 0.05; // Smooth drifting
    ctx.drawImage(img.bad, badCar.x, badCar.y, badCar.w, badCar.h);

    // 3. TRAFFIC
    if (time - lastSpawn > spawnRate) {
        spawnTraffic();
        lastSpawn = time;
    }

    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(img.normal, en.x, en.y, en.w, en.h);

        // SHRUNKEN HITBOX LOGIC
        let px = playerLane * (400/3) + 35;
        if (px + 10 < en.x + en.w - 10 && 
            px + 40 > en.x + 10 && 
            500 + 10 < en.y + en.h - 10 && 
            570 > en.y + 10) {
            
            gameActive = false;
            audio.race.pause();
            audio.boom.play();
            setTimeout(() => { audio.end.play(); alert("CRASH! Odometer: " + Math.floor(score)); location.reload(); }, 500);
        }

        if (en.y > 600) {
            enemies.splice(i, 1);
            score += 1;
        }
    });

    // 4. SCORE LOGIC (Catching the Bad Car)
    if (playerLane === badCar.targetLane) {
        score += 0.2; // Bonus points for stayng behind the bandit
        ctx.fillStyle = "#00ff00"; // Green glow for catching
    } else {
        ctx.fillStyle = "#ff0000"; // Red glow for chasing
    }

    // 5. DRAW PLAYER (FLIPPED 180 DEGREES)
    drawRotatedImage(img.player, playerLane * (400/3) + 35, 500, 50, 80, 180);
    
    // 6. DRAW SCORE ON TOP
    ctx.font = "bold 35px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(score).toString().padStart(4, '0'), 200, 45);

    requestAnimationFrame(animate);
}
