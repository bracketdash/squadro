// TODO: move to minnie
function getFutureBoards(startBoard, ri, ci, moves, player, first = true) {
  const results = [];
  const stack = [
    {
      board: startBoard,
      ri,
      ci,
      moves,
      player,
      first,
    },
  ];
  while (stack.length > 0) {
    let { board, ri, ci, moves, player, first } = stack.pop();
    if (moves < 1) {
      continue;
    }
    const pieces = [];
    if (first) {
      player = game.getPiecePlayer(board[ri][ci]);
      pieces.push({ r: ri, c: ci });
    } else {
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          const cell = board[r][c];
          if (
            (player === 1 && (cell === ">" || cell === "<")) ||
            (player === 2 && (cell === "v" || cell === "^"))
          ) {
            pieces.push({ r, c });
          }
        }
      }
    }
    for (const { r, c } of pieces) {
      const nextBoard = game.applyMove(board, { rowIndex: r, cellIndex: c });
      if (moves === 1 || game.hasGameEnded(nextBoard)) {
        const multiplier = Math.pow(5, moves - 1);
        for (let i = 0; i < multiplier; i++) {
          results.push(nextBoard);
        }
      } else {
        stack.push({
          board: nextBoard,
          ri,
          ci,
          moves: moves - 1,
          player: player === 1 ? 2 : 1,
          first: false,
        });
      }
    }
  }
  return results;
}

// TODO: move to minnie
function getMoveScore(board, r, c) {
  const player = game.getPiecePlayer(board[r][c]);
  const futureBoards = getFutureBoards(board, r, c, minnie.getDepth());
  return futureBoards.reduce((sum, board) => {
    const myScore = game.evaluate(board, player);
    const opponentScore = game.evaluate(board, player === 1 ? 2 : 1);
    return sum + myScore - opponentScore;
  }, 0);
}

// TODO: move (partially) to minnie
function applySuggestions(board) {
  const thinker = document.querySelector(".thinker").classList;
  document
    .querySelectorAll(".suggested")
    .forEach((el) => el.classList.remove("suggested"));
  thinker.add("active");
  // TODO: make this non-blocking, maybe with web workers where supported?
  requestAnimationFrame(() => {
    setTimeout(() => {
      const rows = Array.from(document.querySelectorAll(".row"));
      // TODO: just grab the scored moves for each player here, then figure out bestOrange and bestLime from there
      let bestOrange = { score: -Infinity, r: -1, c: -1 };
      let bestLime = { score: -Infinity, r: -1, c: -1 };
      board.forEach((row, r) => {
        const domCells = Array.from(rows[r].children);
        row.forEach((cell, c) => {
          const domCell = domCells[c];
          if (
            game.isPiece(cell) &&
            (cell !== "^" || r !== 0) &&
            (cell !== "<" || c !== 0)
          ) {
            const score = getMoveScore(board, r, c);
            domCell.setAttribute("data-score", score);
            if (game.getPiecePlayer(cell) === 1 && score > bestLime.score) {
              bestLime = { score, r, c };
            } else if (
              game.getPiecePlayer(cell) === 2 &&
              score > bestOrange.score
            ) {
              bestOrange = { score, r, c };
            }
          }
        });
      });

      rows[bestOrange.r].children[bestOrange.c].classList.add("suggested");
      rows[bestLime.r].children[bestLime.c].classList.add("suggested");
      thinker.remove("active");
    }, 1);
  });
}

function updateBoard(board) {
  board.forEach((row, r) => {
    const domCells = Array.from(
      Array.from(document.querySelectorAll(".row"))[r].children
    );
    row.forEach((cell, c) => {
      const domCell = domCells[c];
      const classList = domCell.classList;
      domCell.removeAttribute("data-score");
      classList.remove("orange", "lime", "up", "down", "leftward", "rightward");
      switch (cell) {
        case "v":
          classList.add("orange", "down");
          break;
        case "^":
          classList.add("orange", "up");
          break;
        case ">":
          classList.add("lime", "rightward");
          break;
        case "<":
          classList.add("lime", "leftward");
          break;
        default:
          break;
      }
    });
  });
}

function handleCellClick(rowIndex, cellIndex) {
  const board = game.getState();
  if (!game.isPiece(board[rowIndex][cellIndex]) || game.hasGameEnded(board)) {
    return;
  }
  const nextBoard = game.applyMove(board, { rowIndex, cellIndex }, true);
  updateBoard(nextBoard);
  applySuggestions(nextBoard);
}

function handleDepthChange(delta) {
  const currDepth = minnie.getDepth();
  const newDepth = minnie.setDepth(currDepth + delta);
  if (currDepth !== newDepth) {
    document.querySelector(".depth").innerHTML = newDepth;
    applySuggestions(game.getState());
  }
}

function init() {
  document.querySelectorAll(".row").forEach((row, rowIndex) => {
    Array.from(row.children).forEach((cell, cellIndex) => {
      cell.addEventListener("click", () =>
        handleCellClick(rowIndex, cellIndex)
      );
    });
  });

  document
    .querySelector(".number-control .up")
    .addEventListener("click", () => {
      handleDepthChange(1);
    });

  document
    .querySelector(".number-control .down")
    .addEventListener("click", () => {
      handleDepthChange(-1);
    });

  document.querySelector(".undo").addEventListener("click", () => {
    const board = game.undoMove();
    updateBoard(board);
    applySuggestions(board);
  });

  document.querySelector(".depth").innerHTML = minnie.getDepth();

  const state = game.getState();
  updateBoard(state);
  applySuggestions(state);
}

const game = new SquadroGame();

const minnie = new MinnieMax({
  applyMove: game.applyMove,
  depth: 7,
  evaluate: game.evaluate,
  generateMoves: game.generateMoves,
});

init();
