// Minimal Snake in vanilla JS + canvas
(function () {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');

  const gridSize = 24; // grid cells per row/col
  const tile = canvas.width / gridSize; // pixels per tile
  const speedBaseMs = 120; // lower is faster

  let snake = [ { x: 12, y: 12 } ];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = spawnFood();
  let score = 0;
  let paused = false;
  let rafId = 0;
  let lastStep = 0;
  let stepEvery = speedBaseMs;

  function spawnFood() {
    while (true) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      if (!snake.some(s => s.x === x && s.y === y)) return { x, y };
    }
  }

  function keyHandler(e) {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'spacebar') { // space to pause
      e.preventDefault();
      paused = !paused;
      return;
    }
    let nd = null;
    if (k === 'arrowup' || k === 'w') nd = { x: 0, y: -1 };
    else if (k === 'arrowdown' || k === 's') nd = { x: 0, y: 1 };
    else if (k === 'arrowleft' || k === 'a') nd = { x: -1, y: 0 };
    else if (k === 'arrowright' || k === 'd') nd = { x: 1, y: 0 };
    if (!nd) return;
    // prevent reversing into yourself
    if (snake.length > 1 && (nd.x === -dir.x && nd.y === -dir.y)) return;
    nextDir = nd;
  }

  function update(dt) {
    if (paused) return;
    lastStep += dt;
    if (lastStep < stepEvery) return;
    lastStep = 0;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // wall collision
    if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize) {
      return gameOver();
    }
    // self collision: allow moving into the current tail cell when not eating
    const willEat = (head.x === food.x && head.y === food.y);
    const bodyToCheck = willEat ? snake : snake.slice(0, -1);
    if (bodyToCheck.some(seg => seg.x === head.x && seg.y === head.y)) {
      return gameOver();
    }
    snake.unshift(head);
    if (willEat) {
      score += 1;
      scoreEl.textContent = String(score);
      food = spawnFood();
      // speed up very slightly every 5 points
      if (score % 5 === 0 && stepEvery > 60) stepEvery -= 6;
    } else {
      snake.pop();
    }
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * tile, y * tile, tile, tile);
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < gridSize; i++) {
      const p = i * tile + 0.5;
      ctx.moveTo(p, 0); ctx.lineTo(p, canvas.height);
      ctx.moveTo(0, p); ctx.lineTo(canvas.width, p);
    }
    ctx.stroke();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    // food
    drawCell(food.x, food.y, '#f472b6');
    // snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const hue = 160 + (i * 6); // slight gradient
      drawCell(seg.x, seg.y, `hsl(${hue} 70% 55%)`);
    }
    if (paused) overlay('Paused');
  }

  function overlay(text) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e6e6ef';
    ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  function gameOver() {
    paused = true;
    render();
    overlay('Game Over - Press R');
  }

  function reset() {
    snake = [ { x: 12, y: 12 } ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    food = spawnFood();
    score = 0;
    stepEvery = speedBaseMs;
    lastStep = 0;
    paused = false;
    scoreEl.textContent = '0';
  }

  // Main loop using rAF with fixed-step tick
  let lastTs = performance.now();
  function loop(ts) {
    const dt = ts - lastTs;
    lastTs = ts;
    update(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') { reset(); return; }
    keyHandler(e);
  });

  // Start
  reset();
  rafId = requestAnimationFrame(loop);
})();
