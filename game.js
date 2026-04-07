const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load Assets
const img = {
    player: new Image(),
    normal: new Image(),
    bad: new Image()
};
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

// Game Variables
let gameActive = false;
let score = 0;
let laneWidth = 400 / 3;
let player = { lane: 1, x: 150, y: 500, w: 60, h: 90 };
let enemies = [];
let gameSpeed = 5;
let spawnRate = 1500;
let lastSpawn = 0;

// Screen Switching
function showOptions() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
    audio.intro.loop = true;
    audio.intro.play();
}

function startGame(difficulty) {
    if (difficulty === 'low') { gameSpeed = 5; spawnRate = 2000; }
    if (difficulty === 'medium') { gameSpeed = 8; spawnRate = 1200; }
    if (difficulty === 'high') { gameSpeed = 12; spawnRate = 800; }

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

// Input Handling
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft' && player.lane > 0) player.lane--;
    if (e.key === 'ArrowRight' && player.lane < 2) player.lane++;
});

function spawnEnemy() {
    const lane = Math.floor(Math.random() * 3);
    const isBadCar = Math.random() > 0.8; // 20% chance for the target car
    enemies.push({
        x: lane * laneWidth + (laneWidth / 2 - 30),
        y: -100,
        w: 60,
        h: 90,
        type: isBadCar ? 'bad' : 'normal'
    });
}

function update(time) {
    // Player horizontal smooth transition
    let targetX = player.lane * laneWidth + (laneWidth / 2 - 30);
    player.x += (targetX - player.x) * 0.2;

    // Enemy Spawning
    if (time - lastSpawn > spawnRate) {
        spawnEnemy();
        lastSpawn = time;
    }

    // Move Enemies
    enemies.forEach((enemy, index) => {
        enemy.y += gameSpeed;

        // Collision Detection
        if (player.x < enemy.x + enemy.w &&
            player.x + player.w > enemy.x &&
            player.y < enemy.y + enemy.h &&
            player.y + player.h > enemy.y) {
            gameOver();
        }

        // Score points for passing
        if (enemy.y > 600) {
            enemies.splice(index, 1);
            score += (enemy.type === 'bad' ? 50 : 10);
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Road Lines (Glow Effect)
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, 600);
        ctx.stroke();
    }

    // Draw Player
    ctx.drawImage(img.player, player.x, player.y, player.w, player.h);

    // Draw Enemies
    enemies.forEach(enemy => {
        const sprite = enemy.type === 'bad' ? img.bad : img.normal;
        ctx.drawImage(sprite, enemy.x, enemy.y, enemy.w, enemy.h);
    });

    // Draw Score
    ctx.fillStyle = '#ff0000';
    ctx.font = '20px Courier New';
    ctx.fillText(`SCORE: ${score}`, 20, 30);
}

function animate(time) {
    if (!gameActive) return;
    update(time);
    draw();
    requestAnimationFrame(animate);
}

function gameOver() {
    gameActive = false;
    audio.race.pause();
    audio.boom.play();
    
    setTimeout(() => {
        audio.end.play();
        alert(`GAME OVER! Final Score: ${score}`);
        location.reload(); // Restarts the game
    }, 500);
}
