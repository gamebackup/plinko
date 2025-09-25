const canvas = document.getElementById('plinko-canvas');
const ctx = canvas.getContext('2d');
const scoreBoxes = Array.from(document.querySelectorAll('.score-box'));
const moneySpan = document.getElementById('money');
const spawnBtn = document.getElementById('spawn-ball');

// Game settings
let money = 250;
const ballCost = 25;
const ballRadius = 10;
const pegRadius = 8;
const gravity = 0.3;
const friction = 0.99;
const pegRows = 7;
const pegsPerRow = 8;
const pegSpacingX = canvas.width / (pegsPerRow + 1);
const pegSpacingY = 60;
const pegOffsetY = 80;

// Pegs
const pegs = [];
for (let row = 0; row < pegRows; row++) {
    for (let col = 0; col < pegsPerRow; col++) {
        // Offset even rows for triangle pattern
        const offset = (row % 2) ? pegSpacingX/2 : 0;
        const x = pegSpacingX * (col + 1) + offset;
        const y = pegOffsetY + pegSpacingY * row;
        pegs.push({ x, y });
    }
}

// Score box positions
const scoreBoxCount = scoreBoxes.length;
const scoreBoxWidth = canvas.width / scoreBoxCount;
const scoreBoxMultipliers = scoreBoxes.map(box =>
    parseFloat(box.getAttribute('data-multiplier'))
);

// Balls
let balls = [];

function drawPegs() {
    ctx.fillStyle = '#fff';
    pegs.forEach(peg => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();
    });
}

function drawBalls() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4136';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPegs();
    drawBalls();
}

function updateBalls() {
    balls.forEach(ball => {
        // Gravity & movement
        ball.vy += gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collision
        if (ball.x - ballRadius < 0) {
            ball.x = ballRadius;
            ball.vx *= -0.4;
        } else if (ball.x + ballRadius > canvas.width) {
            ball.x = canvas.width - ballRadius;
            ball.vx *= -0.4;
        }

        // Peg collision
        pegs.forEach(peg => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < pegRadius + ballRadius) {
                // Simple elastic collision: reflect velocity
                const angle = Math.atan2(dy, dx);
                const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy) * friction;
                ball.vx = speed * Math.cos(angle);
                ball.vy = speed * Math.sin(angle);
                // Move ball out of peg overlap
                const overlap = pegRadius + ballRadius - dist;
                ball.x += Math.cos(angle) * overlap;
                ball.y += Math.sin(angle) * overlap;
            }
        });

        // Floor collision / scoring
        if (!ball.settled && ball.y + ballRadius > canvas.height - 50) {
            ball.settled = true;
            // Determine which box
            const index = Math.floor(ball.x / scoreBoxWidth);
            scoreBoxes.forEach(box => box.classList.remove('active'));
            scoreBoxes[index].classList.add('active');
            // Score
            setTimeout(() => {
                const multiplier = scoreBoxMultipliers[index];
                const win = Math.round(ballCost * multiplier);
                money += win;
                moneySpan.textContent = `Money: $${money}`;
                scoreBoxes[index].classList.remove('active');
                // Remove the ball after scoring
                balls = balls.filter(b => b !== ball);
                checkSpawnButton();
            }, 800); // Highlight for a moment
        }
    });
}

function checkSpawnButton() {
    spawnBtn.disabled = money < ballCost;
}

function gameLoop() {
    updateBalls();
    draw();
    requestAnimationFrame(gameLoop);
}

spawnBtn.addEventListener('click', () => {
    if (money >= ballCost) {
        // Spawn ball at random x near center/top
        const x = canvas.width / 2 + (Math.random() - 0.5) * 60;
        balls.push({
            x, y: ballRadius + 5,
            vx: (Math.random()-0.5)*2,
            vy: 0,
            settled: false
        });
        money -= ballCost;
        moneySpan.textContent = `Money: $${money}`;
        checkSpawnButton();
    }
});

moneySpan.textContent = `Money: $${money}`;
checkSpawnButton();
gameLoop();
