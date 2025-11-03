// ===========================================================
// 🎮 XOX MODE — Tic Tac Toe + Pet Animation + Win/Lose Sounds
// ===========================================================
(function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  window._modeName = "xox";

  // === Load pet base images ===
  const basePlay = new Image();
  basePlay.src = "base_play.png";
  const baseLose = new Image();
  baseLose.src = "base_play1.png";
  const baseWin = new Image();
  baseWin.src = "base_play2.png";

  // === Load sounds ===
  const failSound = new Audio("fail.mp3");
  const winSound = new Audio("yuck.mp3");

  // === Game state ===
  let grid = Array(9).fill(null);
  let gameOver = false;
  let difficulty = "Easy";
  let result = null;

  // === Resize and init ===
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawBoard();
  }
  window.addEventListener("resize", resize);
  resize();

  // === Draw Board + Pet ===
  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const size = Math.min(canvas.width, canvas.height) * 0.6;
    const startX = (canvas.width - size) / 2;
    const startY = (canvas.height - size) / 2;
    const cell = size / 3;

    // 🧍‍♂️ Pet position (top-right corner)
    const petSize = size * 0.8; // adjust for bigger/smaller pet
    const petX = canvas.width - petSize - 20; // margin from right edge
    const petY = 20; // margin from top

    // 🧠 Choose which pet image to show
    let petImg = basePlay;
    if (gameOver) {
      if (result === "X") petImg = baseWin;
      else if (result === "O") petImg = baseLose;
    }

    // 🧍‍♂️ Draw pet (always visible)
    ctx.drawImage(petImg, petX, petY, petSize, petSize);

    // === Draw grid ===
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(startX + i * cell, startY);
      ctx.lineTo(startX + i * cell, startY + size);
      ctx.moveTo(startX, startY + i * cell);
      ctx.lineTo(startX + size, startY + i * cell);
      ctx.stroke();
    }

    // === Draw X and O marks ===
    ctx.font = `${cell * 0.6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 9; i++) {
      const mark = grid[i];
      if (!mark) continue;
      const x = startX + (i % 3 + 0.5) * cell;
      const y = startY + (Math.floor(i / 3) + 0.5) * cell;
      ctx.fillStyle = mark === "X" ? "#d33" : "#33d";
      ctx.fillText(mark, x, y);
    }

    // === Overlay if finished ===
    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "48px Arial";
      ctx.fillText(
        result === "Draw" ? "Draw!" : result === "X" ? "You Win!" : "You Lose!",
        canvas.width / 2,
        canvas.height / 2
      );
      ctx.font = "24px Arial";
      ctx.fillText("Tap to restart", canvas.width / 2, canvas.height / 2 + 50);
    }
  }

  // === Check for winner ===
  function checkWinner() {
    const wins = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b, c] of wins) {
      if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) return grid[a];
    }
    return grid.includes(null) ? null : "Draw";
  }

  // === AI move logic ===
  function aiMove() {
    if (difficulty === "Easy") randomMove();
    else if (difficulty === "Medium") {
      if (Math.random() < 0.6) bestMove();
      else randomMove();
    } else bestMove();
  }

  function randomMove() {
    const empty = grid.map((v, i) => (v ? null : i)).filter((i) => i !== null);
    if (!empty.length) return;
    grid[empty[Math.floor(Math.random() * empty.length)]] = "O";
  }

  function bestMove() {
    let bestScore = -Infinity,
      move;
    for (let i = 0; i < 9; i++) {
      if (!grid[i]) {
        grid[i] = "O";
        const score = minimax(grid, 0, false);
        grid[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    if (move != null) grid[move] = "O";
  }

  function minimax(board, depth, isMax) {
    const winner = checkWinner();
    if (winner === "O") return 10 - depth;
    if (winner === "X") return depth - 10;
    if (winner === "Draw") return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = "O";
          best = Math.max(best, minimax(board, depth + 1, false));
          board[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = "X";
          best = Math.min(best, minimax(board, depth + 1, true));
          board[i] = null;
        }
      }
      return best;
    }
  }

  // === Click ===
  canvas.addEventListener("click", (e) => {
    if (gameOver) {
      reset();
      return;
    }

    const size = Math.min(canvas.width, canvas.height) * 0.6;
    const startX = (canvas.width - size) / 2;
    const startY = (canvas.height - size) / 2;
    const cell = size / 3;
    const x = e.clientX - startX;
    const y = e.clientY - startY;
    if (x < 0 || y < 0 || x > size || y > size) return;
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);
    const idx = row * 3 + col;

    if (!grid[idx]) {
      grid[idx] = "X";
      let w = checkWinner();
      if (!w) aiMove();
      w = checkWinner();
      if (w) {
        result = w;
        gameOver = true;

        // 🔊 Play win/lose sound
        if (result === "X") {
          SoundManager.playClone(winSound);
        } else if (result === "O") {
          SoundManager.playClone(failSound);
        }
      }
      drawBoard();
    }
  });

  // === Reset ===
  function reset() {
    grid = Array(9).fill(null);
    result = null;
    gameOver = false;
    drawBoard();
  }

  // === Difficulty Buttons ===
  const container = document.createElement("div");
  container.className = "mode-ui";
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.left = "50%";
  container.style.transform = "translateX(-50%)";
  container.style.display = "flex";
  container.style.gap = "10px";
  container.innerHTML = `
    <button id="easy">Easy</button>
    <button id="medium">Medium</button>
    <button id="hard">Hard</button>
  `;
  document.body.appendChild(container);

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      difficulty = btn.id.charAt(0).toUpperCase() + btn.id.slice(1);
      reset();
    });
  });

  drawBoard();

  // === Cleanup when leaving mode ===
  window._modeCleanup = function () {
    window.removeEventListener("resize", resize);
    container.remove();
  };
})();