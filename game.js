// --- UPDATED INPUT HANDLING FOR MOBILE ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && playerLane > 0) playerLane--;
    if (e.key === 'ArrowRight' && playerLane < 2) playerLane++;
});

// Touch controls for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Stops the screen from shaking/scrolling
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;

    if (touchX < screenWidth / 2) {
        // Tapped Left Side
        if (playerLane > 0) playerLane--;
    } else {
        // Tapped Right Side
        if (playerLane < 2) playerLane++;
    }
}, { passive: false });


// --- UPDATED ANIMATE FUNCTION FOR FULLSCREEN ---
function animate(time) {
    if (!gameActive) return;
    
    // Clear canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 600);

    // 1. DRAW ROADWAY
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
    badCar.x += (badTargetX - badCar.x) * 0.05;
    ctx.drawImage(img.bad, badCar.x, badCar.y, badCar.w, badCar.h);

    // 3. TRAFFIC
    if (time - lastSpawn > spawnRate) {
        spawnTraffic();
        lastSpawn = time;
    }

    enemies.forEach((en, i) => {
        en.y += gameSpeed;
        ctx.drawImage(img.normal, en.x, en.y, en.w, en.h);

        // HITBOX CHECK (Shrunken)
        let px = playerLane * (400/3) + 35;
        if (px + 10 < en.x + en.w - 10 && px + 40 > en.x + 10 && 
            500 + 10 < en.y + en.h - 10 && 570 > en.y + 10) {
            gameActive = false;
            audio.race.pause();
            audio.boom.play();
            setTimeout(() => { 
                audio.end.play(); 
                alert("CRASH! Odometer: " + Math.floor(score)); 
                location.reload(); 
            }, 500);
        }
        if (en.y > 600) { enemies.splice(i, 1); score += 1; }
    });

    // 4. PLAYER (FLIPPED)
    drawRotatedImage(img.player, playerLane * (400/3) + 35, 500, 50, 80, 180);
    
    // 5. SCORE
    ctx.fillStyle = (playerLane === badCar.targetLane) ? "#0f0" : "#f00";
    ctx.font = "bold 35px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(score).toString().padStart(4, '0'), 200, 45);

    requestAnimationFrame(animate);
}
