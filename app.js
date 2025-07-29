const rows = Array.from(document.querySelectorAll(".row"));
const thinkingIndicator = document.querySelector(".thinking-indicator");

const verticalPips = [1, 3, 2, 3, 1];
const horizontalPips = [3, 1, 2, 1, 3];

let movesAhead = 8;
let history = [getBoard()];

function getFallbackCell(row, col) {
  if ((row === 0 || row === 6) && col >= 1 && col <= 5) {
    return "|";
  }
  if ((col === 0 || col === 6) && row >= 1 && row <= 5) {
    return "-";
  }
  return "+";
}

function isPiece(candidate) {
  return ["v", "^", ">", "<"].includes(candidate);
}

function getNextBoard(board, rowIndex, cellIndex) {
  const next = board.map((row) => row.slice());
  const piece = board[rowIndex][cellIndex];
  if (!isPiece(piece)) {
    return next;
  }
  if (
    (piece === "^" && rowIndex === 0) ||
    (piece === "v" && rowIndex === 6) ||
    (piece === "<" && cellIndex === 0) ||
    (piece === ">" && cellIndex === 6)
  ) {
    return board;
  }
  const homewardPipMap = [null, 3, 2, 1];
  const isVertical = piece === "v" || piece === "^";
  const index = isVertical ? cellIndex - 1 : rowIndex - 1;
  let dr = 0;
  let dc = 0;
  let speed = 0;
  if (piece === "v") {
    dr = 1;
    speed = verticalPips[index];
  } else if (piece === "^") {
    dr = -1;
    speed = homewardPipMap[verticalPips[index]];
  } else if (piece === ">") {
    dc = 1;
    speed = horizontalPips[index];
  } else if (piece === "<") {
    dc = -1;
    speed = homewardPipMap[horizontalPips[index]];
  }
  next[rowIndex][cellIndex] = getFallbackCell(rowIndex, cellIndex);
  const jumped = [];
  let r = rowIndex;
  let c = cellIndex;
  let distanceRemaining = speed;
  let jumpedMode = false;
  while (distanceRemaining > 0 || jumpedMode) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= 7 || nc < 0 || nc >= 7) {
      break;
    }
    const target = next[nr][nc];
    if (isPiece(target)) {
      jumped.push({ r: nr, c: nc, p: target });
      r = nr;
      c = nc;
      jumpedMode = true;
    } else {
      r = nr;
      c = nc;
      if (jumpedMode) {
        break;
      }
      distanceRemaining--;
    }
  }
  let newChar = piece;
  if (piece === "v" && r === 6 && rowIndex !== 6) {
    newChar = "^";
  } else if (piece === "^" && r === 0 && rowIndex !== 0) {
    newChar = "^";
  } else if (piece === ">" && c === 6 && cellIndex !== 6) {
    newChar = "<";
  } else if (piece === "<" && c === 0 && cellIndex !== 0) {
    newChar = "<";
  }
  next[r][c] = newChar;
  for (const { r: jr, c: jc, p } of jumped) {
    next[jr][jc] = getFallbackCell(jr, jc);
    if (p === "v") {
      next[0][jc] = "v";
    }
    if (p === "^") {
      next[6][jc] = "^";
    }
    if (p === ">") {
      next[jr][0] = ">";
    }
    if (p === "<") {
      next[jr][6] = "<";
    }
  }
  return next;
}

function hasGameEnded(board) {
  let orangeHome = 0;
  let limeHome = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      if (cell === "^" && r === 0) {
        orangeHome++;
      }
      if (cell === "<" && c === 0) {
        limeHome++;
      }
    }
  }
  return orangeHome >= 4 || limeHome >= 4;
}

function getPieceColor(piece) {
  return piece === "v" || piece === "^" ? "orange" : "lime";
}

function getOppositeColor(color) {
  return color === "orange" ? "lime" : "orange";
}

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
      const pieceColor = getPieceColor(board[ri][ci]);
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
      const nextBoard = getNextBoard(board, r, c);
      if (moves === 1 || hasGameEnded(nextBoard)) {
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
          color: getOppositeColor(color),
          first: false,
        });
      }
    }
  }
  return results;
}

function getProgress(piece, r, c) {
  const verticalPips = [1, 3, 2, 3, 1];
  const horizontalPips = [3, 1, 2, 1, 3];
  let pip;
  let distance;
  if (piece === "v" || piece === "^") {
    const index = c - 1;
    pip = verticalPips[index];
    if (piece === "v") {
      distance = r;
      if (pip === 1) {
        return Math.floor(distance / pip);
      }
      if (pip === 2) {
        return Math.floor(distance / pip);
      }
      if (pip === 3) {
        return Math.floor(distance / pip);
      }
    } else {
      distance = 6 - r;
      if (pip === 1) {
        return 6 + Math.floor(distance / 3);
      }
      if (pip === 2) {
        return 3 + Math.floor(distance / 2);
      }
      if (pip === 3) {
        return 2 + Math.floor(distance / 1);
      }
    }
  }
  if (piece === ">" || piece === "<") {
    const index = r - 1;
    pip = horizontalPips[index];
    if (piece === ">") {
      distance = c;
      if (pip === 1) {
        return Math.floor(distance / pip);
      }
      if (pip === 2) {
        return Math.floor(distance / pip);
      }
      if (pip === 3) {
        return Math.floor(distance / pip);
      }
    } else {
      distance = 6 - c;
      if (pip === 1) {
        return 6 + Math.floor(distance / 3);
      }
      if (pip === 2) {
        return 3 + Math.floor(distance / 2);
      }
      if (pip === 3) {
        return 2 + Math.floor(distance / 1);
      }
    }
  }
  return 0;
}

function getAdvances(board, color) {
  const advances = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      if (
        (color === "orange" && (cell === "v" || cell === "^")) ||
        (color === "lime" && (cell === ">" || cell === "<"))
      ) {
        advances.push(getProgress(cell, r, c));
      }
    }
  }
  return advances
    .sort((a, b) => b - a)
    .slice(0, 4)
    .reduce((a, b) => a + b, 0);
}

function getMoveScore(board, r, c) {
  const playerColor = getPieceColor(board[r][c]);
  const futureBoards = getFutureBoards(board, r, c, movesAhead);
  return futureBoards.reduce((sum, board) => {
    const myScore = getAdvances(board, playerColor);
    const opponentColor = getOppositeColor(playerColor);
    const opponentScore = getAdvances(board, opponentColor);
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
            isPiece(cell) &&
            (cell !== "^" || r !== 0) &&
            (cell !== "<" || c !== 0)
          ) {
            const score = getMoveScore(board, r, c);
            domCell.setAttribute("data-score", score);
            if (getPieceColor(cell) === "orange" && score > bestOrange.score) {
              bestOrange = { score, r, c };
            } else if (
              getPieceColor(cell) === "lime" &&
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
  if (!isPiece(board[rowIndex][cellIndex]) || hasGameEnded(board)) {
    return;
  }
  const nextBoard = getNextBoard(board, rowIndex, cellIndex);
  history.push(nextBoard);
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
  if (history.length === 1) {
    return;
  }
  history.pop();
  const board = history[history.length - 1];
  updateBoard(board);
  applySuggestions(board);
});
