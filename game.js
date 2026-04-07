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
let playerLane = 1; // 0, 1, or 2

function showOptions() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
    audio.intro.loop = true;
    audio.intro.play();
}

function startGame(diff) {
    if(diff === 'low') { gameSpeed = 5; spawnRate = 1800; }
    if(diff === 'medium') { gameSpeed = 8; spawnRate = 1300; }
    if(diff === 'high') { gameSpeed = 12; spawnRate = 900; }

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

// Input
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && playerLane > 0) playerLane--;
    if (e.key === 'ArrowRight' && playerLane < 2) playerLane++;
});

function spawnWave() {
    let lanes = [0, 1, 2];
    let spawnedCount = 0;
    lanes.forEach(lane => {
        if (Math.random() < 0.4 && spawnedCount < 2) { // 40% chance per lane, max 2 cars
            const isBad = Math.random() > 0.8;
            enemies.push({
                x: lane * (400/3) + 20,
                y: -100,
                w: 60, h: 90,
                img: isBad ? img.bad : img.normal,
                type: isBad ? 'bad' : 'normal'
            });
            spawnedCount++;
        }
    });
}

function animate(time) {
    if (!gameActive) return;
    ctx.clearRect(0, 0, 400, 600);

    // Spawn
    if (time - lastSpawn > spawnRate) {
        spawnWave();
        lastSpawn = time;
    }

    // Move & Draw Enemies
    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(en.img, en.x, en.y, en.w, en.h);

        // Collision
        let px = playerLane * (400/3) + 20;
        if (px < en.x + en.w && px + 60 > en.x && 500 < en.y + en.h && 590 > en.y) {
            gameActive = false;
            audio.race.pause();
            audio.boom.play();
            setTimeout(() => { audio.end.play(); alert("CRASH! Score: " + score); location.reload(); }, 500);
        }

        if (en.y > 600) { enemies.splice(i, 1); score += 10; }
    });

    // Draw Player
    ctx.drawImage(img.player, playerLane * (400/3) + 20, 500, 60, 90);
    
    // Score
    ctx.fillStyle = "red"; ctx.font = "20px Arial";
    ctx.fillText("SCORE: " + score, 10, 30);

    requestAnimationFrame(animate);
}
