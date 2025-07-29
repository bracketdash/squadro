const game = new SquadroGame();

const rows = Array.from(document.querySelectorAll(".row"));
const thinkingIndicator = document.querySelector(".thinking-indicator");

let movesAhead = 8;

function getFutureBoards(startBoard, ri, ci, moves, color, first = true) {
  const results = [];
  const stack = [
    {
      board: startBoard,
      ri,
      ci,
      moves,
      color,
      first,
    },
  ];
  while (stack.length > 0) {
    let { board, ri, ci, moves, color, first } = stack.pop();
    if (moves < 1) {
      continue;
    }
    const pieces = [];
    if (first) {
      const pieceColor = game.getPieceColor(board[ri][ci]);
      pieces.push({ r: ri, c: ci });
      color = pieceColor;
    } else {
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          const cell = board[r][c];
          if (
            (color === "orange" && (cell === "v" || cell === "^")) ||
            (color === "lime" && (cell === ">" || cell === "<"))
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
          color: game.getOppositeColor(color),
          first: false,
        });
      }
    }
  }
  return results;
}

function getMoveScore(board, r, c) {
  const playerColor = game.getPieceColor(board[r][c]);
  const futureBoards = getFutureBoards(board, r, c, movesAhead);
  return futureBoards.reduce((sum, board) => {
    const myScore = game.getAdvances(board, playerColor);
    const opponentColor = game.getOppositeColor(playerColor);
    const opponentScore = game.getAdvances(board, opponentColor);
    return sum + myScore - opponentScore;
  }, 0);
}

function getBoard() {
  return rows.map((row) => {
    return Array.from(row.children).map((cell) => {
      const classList = cell.classList;
      if (classList.contains("empty")) {
        return " ";
      }
      if (classList.contains("orange")) {
        return classList.contains("down") ? "v" : "^";
      }
      if (classList.contains("lime")) {
        return classList.contains("rightward") ? ">" : "<";
      }
      if (classList.contains("cross")) {
        return "+";
      }
      if (classList.contains("horizontal")) {
        return "-";
      }
      if (classList.contains("vertical")) {
        return "|";
      }
    });
  });
}

function applySuggestions(board) {
  document
    .querySelectorAll(".suggested")
    .forEach((el) => el.classList.remove("suggested"));
  thinkingIndicator.classList.add("active");
  requestAnimationFrame(() => {
    setTimeout(() => {
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
            if (
              game.getPieceColor(cell) === "orange" &&
              score > bestOrange.score
            ) {
              bestOrange = { score, r, c };
            } else if (
              game.getPieceColor(cell) === "lime" &&
              score > bestLime.score
            ) {
              bestLime = { score, r, c };
            }
          }
        });
      });
      rows[bestOrange.r].children[bestOrange.c].classList.add("suggested");
      rows[bestLime.r].children[bestLime.c].classList.add("suggested");
      thinkingIndicator.classList.remove("active");
    }, 1);
  });
}

function updateBoard(board) {
  board.forEach((row, r) => {
    const domCells = Array.from(rows[r].children);
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

function handleClick(rowIndex, cellIndex) {
  const board = getBoard();
  if (!game.isPiece(board[rowIndex][cellIndex]) || game.hasGameEnded(board)) {
    return;
  }
  const nextBoard = game.applyMove(board, { rowIndex, cellIndex }, true);
  updateBoard(nextBoard);
  applySuggestions(nextBoard);
}

rows.forEach((row, rowIndex) => {
  Array.from(row.children).forEach((cell, cellIndex) => {
    cell.addEventListener("click", () => handleClick(rowIndex, cellIndex));
  });
});

const upButton = document.querySelector(".number-control .up");
const downButton = document.querySelector(".number-control .down");
const movesAheadDepth = document.querySelector(".depth");
const undoButton = document.querySelector(".undo");

function handleDepthChange(delta) {
  if (delta > 0 || movesAhead > 1) {
    movesAhead = movesAhead + delta;
    movesAheadDepth.innerHTML = movesAhead;
    applySuggestions(getBoard());
  }
}

upButton.addEventListener("click", () => {
  handleDepthChange(1);
});

downButton.addEventListener("click", () => {
  handleDepthChange(-1);
});

undoButton.addEventListener("click", () => {
  const board = game.undoMove();
  updateBoard(board);
  applySuggestions(board);
});

movesAheadDepth.innerHTML = movesAhead;
