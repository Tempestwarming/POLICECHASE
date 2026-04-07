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

// "Bad Car" (The Target) Logic
let badCar = { lane: 1, x: 150, y: 50, w: 50, h: 70, targetLane: 1, lastMove: 0 };

function showOptions() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
    audio.intro.loop = true;
    audio.intro.play();
}

function startGame(diff) {
    if(diff === 'low') { gameSpeed = 5; spawnRate = 2000; }
    if(diff === 'medium') { gameSpeed = 8; spawnRate = 1500; }
    if(diff === 'high') { gameSpeed = 12; spawnRate = 1000; }

    audio.intro.pause();
    audio.ignition.play();

    setTimeout(() => {
        document.getElementById('options-menu').style.display = 'none';
        canvas.style.display = 'block';
        gameActive = true;
        audio.race.loop = true;
        audio.race.play();
        animate();
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
        w: 45, h: 70, // Visual size
        hitW: 30, hitH: 50 // Shrunken Hitbox
    });
}

function animate(time) {
    if (!gameActive) return;
    ctx.clearRect(0, 0, 400, 600);

    // 1. DRAW ROADWAY (VFD Style)
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (400/3), 0);
        ctx.lineTo(i * (400/3), 600);
        ctx.stroke();
    }

    // 2. TARGET CAR (BAD CAR) BEHAVIOR
    // Moves side to side randomly at the TOP
    if (time - badCar.lastMove > 1000) {
        badCar.targetLane = Math.floor(Math.random() * 3);
        badCar.lastMove = time;
    }
    let badTargetX = badCar.targetLane * (400/3) + 35;
    badCar.x += (badTargetX - badCar.x) * 0.1;
    ctx.drawImage(img.bad, badCar.x, badCar.y, badCar.w, badCar.h);

    // 3. TRAFFIC (NORMAL CARS)
    if (time - lastSpawn > spawnRate) {
        spawnTraffic();
        lastSpawn = time;
    }

    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(img.normal, en.x, en.y, en.w, en.h);

        // HITBOX DETECTION (Shrunken for precision)
        let px = playerLane * (400/3) + 35;
        let pW = 30; // Player hitbox width
        let pH = 50; // Player hitbox height

        // Check collision with traffic
        if (px < en.x + en.w - 10 && px + pW > en.x + 10 && 500 < en.y + en.h - 10 && 500 + pH > en.y + 10) {
            gameActive = false;
            audio.race.pause();
            audio.boom.play();
            setTimeout(() => { audio.end.play(); alert("CRASH! Odometer: " + Math.floor(score)); location.reload(); }, 500);
        }

        if (en.y > 600) { enemies.splice(i, 1); score += 1; }
    });

    // 4. CHASE SCORING
    // If you are in the same lane as the Bad Car, you gain "Catch" points
    if (playerLane === badCar.targetLane) {
        score += 0.1; // Slowly increase score while chasing
        ctx.fillStyle = "#00ff00"; // Glow green when chasing
    } else {
        ctx.fillStyle = "#ff0000"; // Red when not
    }

    // 5. PLAYER
    ctx.drawImage(img.player, playerLane * (400/3) + 35, 500, 50, 80);
    
    // 6. SCORE (7-Segment Red Style)
    ctx.font = "30px 'Courier New'";
    ctx.fillText("SCORE: " + Math.floor(score).toString().padStart(4, '0'), 110, 40);

    requestAnimationFrame(animate);
}
