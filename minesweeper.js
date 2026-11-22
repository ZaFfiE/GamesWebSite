// Simple Minesweeper implementation.
// Left click to reveal, right click to toggle flag. First click is always safe.

(function() {
  const gridEl = document.getElementById('grid');
  const timeEl = document.getElementById('time');
  const minesLeftEl = document.getElementById('mines-left');
  const diffSel = document.getElementById('difficulty');
  const resetBtn = document.getElementById('reset');

  const DIFF = {
    beginner: { cols: 9, rows: 9, mines: 10 },
    intermediate: { cols: 16, rows: 16, mines: 40 },
    expert: { cols: 30, rows: 16, mines: 99 },
  };

  let cols = 9, rows = 9, mineCount = 10;
  let board = []; // cells: {mine, revealed, flag, count}
  let firstClick = true;
  let revealed = 0;
  let flags = 0;
  let timerId = null;
  let seconds = 0;
  let ended = false;

  function coords(i) { return { x: i % cols, y: Math.floor(i / cols) }; }
  function index(x, y) { return y * cols + x; }

  function reset(dKey) {
    const d = DIFF[dKey || diffSel.value] || DIFF.beginner;
    cols = d.cols; rows = d.rows; mineCount = d.mines;
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 28px)`;
    gridEl.style.gridTemplateRows = `repeat(${rows}, 28px)`;
    gridEl.innerHTML = '';
    board = new Array(cols * rows).fill(0).map(() => ({ mine: false, revealed: false, flag: false, count: 0 }));
    firstClick = true; revealed = 0; flags = 0; ended = false;
    seconds = 0; timeEl.textContent = '0';
    if (timerId) clearInterval(timerId);
    timerId = null;
    minesLeftEl.textContent = String(mineCount - flags);

    // Render cells
    for (let i = 0; i < board.length; i++) {
      const cellEl = document.createElement('div');
      cellEl.className = 'cell hidden';
      cellEl.setAttribute('role', 'gridcell');
      cellEl.setAttribute('data-i', String(i));
      cellEl.addEventListener('click', onLeftClick);
      cellEl.addEventListener('contextmenu', onRightClick);
      gridEl.appendChild(cellEl);
    }
  }

  function placeMines(skipIndex) {
    let toPlace = mineCount;
    const total = cols * rows;
    const forbidden = new Set([skipIndex]);
    // Also avoid neighbors of first click for a nicer start
    neighborsIndex(skipIndex).forEach(n => forbidden.add(n));
    while (toPlace > 0) {
      const i = Math.floor(Math.random() * total);
      if (forbidden.has(i)) continue;
      if (!board[i].mine) { board[i].mine = true; toPlace--; }
    }
    // Compute counts
    for (let i = 0; i < board.length; i++) {
      board[i].count = neighborsIndex(i).reduce((acc, n) => acc + (board[n].mine ? 1 : 0), 0);
    }
  }

  function neighborsIndex(i) {
    const { x, y } = coords(i);
    const ns = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) ns.push(index(nx, ny));
      }
    }
    return ns;
  }

  function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
      seconds++; timeEl.textContent = String(seconds);
    }, 1000);
  }

  function reveal(i) {
    const c = board[i];
    if (c.revealed || c.flag || ended) return;
    c.revealed = true;
    revealed++;
    const el = gridEl.querySelector(`[data-i="${i}"]`);
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('revealed');
    if (c.mine) {
      el.classList.add('mine');
      el.textContent = '💣';
      endGame(false);
      return;
    }
    if (c.count > 0) {
      el.textContent = String(c.count);
      el.style.color = numberColor(c.count);
    } else {
      // flood fill
      neighborsIndex(i).forEach(n => reveal(n));
    }
    checkWin();
  }

  function numberColor(n) {
    const colors = ['#9ca3af', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#f59e0b'];
    return colors[Math.min(n, colors.length) - 1] || '#e5e7eb';
  }

  function toggleFlag(i) {
    const c = board[i];
    if (c.revealed || ended) return;
    c.flag = !c.flag;
    flags += c.flag ? 1 : -1;
    minesLeftEl.textContent = String(mineCount - flags);
    const el = gridEl.querySelector(`[data-i="${i}"]`);
    if (!el) return;
    if (c.flag) {
      el.classList.add('flag');
      el.textContent = '⚑';
    } else {
      el.classList.remove('flag');
      el.textContent = '';
    }
  }

  function onLeftClick(e) {
    e.preventDefault();
    const i = Number(e.currentTarget.getAttribute('data-i'));
    if (firstClick) {
      placeMines(i);
      firstClick = false;
      startTimer();
    }
    reveal(i);
  }

  function onRightClick(e) {
    e.preventDefault();
    const i = Number(e.currentTarget.getAttribute('data-i'));
    if (firstClick) return; // no flags before first reveal
    toggleFlag(i);
  }

  function endGame(won) {
    ended = true;
    if (timerId) { clearInterval(timerId); timerId = null; }
    // reveal all mines if lost
    if (!won) {
      board.forEach((c, i) => {
        if (c.mine) {
          const el = gridEl.querySelector(`[data-i="${i}"]`);
          if (el) {
            el.classList.remove('hidden');
            el.classList.add('revealed', 'mine');
            if (!el.textContent) el.textContent = '💣';
          }
        }
      });
    }
  }

  function checkWin() {
    const totalSafe = cols * rows - mineCount;
    if (revealed >= totalSafe) {
      endGame(true);
      // mark flags on remaining mines for satisfaction
      board.forEach((c, i) => {
        if (c.mine) {
          const el = gridEl.querySelector(`[data-i="${i}"]`);
          if (el && !el.textContent) { el.textContent = '⚑'; el.classList.add('flag'); }
        }
      });
    }
  }

  resetBtn.addEventListener('click', () => reset());
  diffSel.addEventListener('change', () => reset());

  // Initialize
  reset('beginner');
})();
