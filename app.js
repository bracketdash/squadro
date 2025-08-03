const backwardBase = [0, 6, 3, 2];
const backwardDiv = [0, 3, 2, 1];
const homewardPipMap = [null, 3, 2, 1];
const horPips = [3, 1, 2, 1, 3];
const verPips = [1, 3, 2, 3, 1];

function getFallbackCell(row, col) {
  if ((row === 0 || row === 6) && col >= 1 && col <= 5) {
    return "|";
  }
  if ((col === 0 || col === 6) && row >= 1 && row <= 5) {
    return "-";
  }
  return "+";
}

function getPieceProgress(piece, r, c) {
  let pip;
  switch (piece) {
    case "v":
      return Math.floor(r / verPips[c - 1]);
    case ">":
      return Math.floor(c / horPips[r - 1]);
    case "^":
      pip = verPips[c - 1];
      return backwardBase[pip] + Math.floor((6 - r) / backwardDiv[pip]);
    case "<":
      pip = horPips[r - 1];
      return backwardBase[pip] + Math.floor((6 - c) / backwardDiv[pip]);
    default:
      return 0;
  }
}

function isPiece(candidate) {
  return ["v", "^", ">", "<"].includes(candidate);
}

new MinnieMax({
  el: document.querySelector(".minniemax"),
  localStorageKey: "squadrohelper",
  initialMovesAhead: 8,
  initialState: [
    [" ", "v", "v", "v", "v", "v", " "],
    [">", "+", "+", "+", "+", "+", "-"],
    [">", "+", "+", "+", "+", "+", "-"],
    [">", "+", "+", "+", "+", "+", "-"],
    [">", "+", "+", "+", "+", "+", "-"],
    [">", "+", "+", "+", "+", "+", "-"],
    [" ", "|", "|", "|", "|", "|", " "],
  ],
  getMoves: ({ state, player }) => {
    const moves = [];
    const isPlayer1 = player === 1;
    const isPlayer2 = player === 2;
    for (let ri = 0; ri < state.length; ri++) {
      const row = state[ri];
      for (let ci = 0; ci < row.length; ci++) {
        const cell = row[ci];
        if (
          (isPlayer1 && ((cell === "<" && ci !== 0) || cell === ">")) ||
          (isPlayer2 && ((cell === "^" && ri !== 0) || cell === "v"))
        ) {
          moves.push({ ri, ci });
        }
      }
    }
    return moves;
  },
  getNextState: ({ state, player, move }) => {
    const { ri, ci } = move;
    const next = Array(7);
    for (let i = 0; i < 7; i++) {
      next[i] = state[i].slice();
    }
    const piece = state[ri][ci];
    if (!isPiece(piece)) {
      return next;
    }
    if ((piece === "^" && ri === 0) || (piece === "<" && ci === 0)) {
      return state;
    }
    const isVertical = piece === "v" || piece === "^";
    const index = isVertical ? ci - 1 : ri - 1;
    let dr = 0;
    let dc = 0;
    let speed = 0;
    switch (piece) {
      case "v":
        dr = 1;
        speed = verPips[index];
        break;
      case "^":
        dr = -1;
        speed = homewardPipMap[verPips[index]];
        break;
      case ">":
        dc = 1;
        speed = horPips[index];
        break;
      case "<":
        dc = -1;
        speed = homewardPipMap[horPips[index]];
        break;
    }
    next[ri][ci] = getFallbackCell(ri, ci);
    const jumped = [];
    let r = ri;
    let c = ci;
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
    next[r][c] = piece;
    if (
      (piece === "v" && r === 6 && ri !== 6) ||
      (piece === "^" && r === 0 && ri !== 0)
    ) {
      next[r][c] = "^";
    } else if (
      (piece === ">" && c === 6 && ci !== 6) ||
      (piece === "<" && c === 0 && ci !== 0)
    ) {
      next[r][c] = "<";
    }
    for (const { r: jr, c: jc, p } of jumped) {
      next[jr][jc] = getFallbackCell(jr, jc);
      const homeRow = p === "v" ? 0 : p === "^" ? 6 : jr;
      const homeCol = p === ">" ? 0 : p === "<" ? 6 : jc;
      next[homeRow][homeCol] = p;
    }
    return { state: next, player: player === 1 ? 2 : 1 };
  },
  getStateScore: ({ state, player, movesRemaining }) => {
    const advances = [];
    const isPlayer1 = player === 1;
    const isPlayer2 = player === 2;
    let completedJourneys = 0;
    for (let ri = 0; ri < state.length; ri++) {
      const row = state[ri];
      for (let ci = 0; ci < row.length; ci++) {
        const cell = row[ci];
        if (
          (isPlayer1 && (cell === ">" || cell === "<")) ||
          (isPlayer2 && (cell === "v" || cell === "^"))
        ) {
          const pieceProgress = getPieceProgress(cell, ri, ci);
          if (
            (((ri === 0 && ci === 3) || (ri === 3 && ci === 0)) &&
              pieceProgress > 5) ||
            ((ri === 0 || ci === 0) && pieceProgress > 7)
          ) {
            advances.push(50);
            completedJourneys++;
          } else {
            advances.push(pieceProgress);
          }
        }
      }
    }
    const score = advances
      .sort((a, b) => b - a)
      .slice(0, 4)
      .reduce((a, b) => a + b, 0);
    return completedJourneys > 3 ? score + 1000 + movesRemaining : score;
  },
  isGameOver: ({ state }) => {
    const playerScores = [0, 0];
    for (let r = 0; r < state.length; r++) {
      for (let c = 0; c < state[r].length; c++) {
        const cell = state[r][c];
        if (cell === "<" && c === 0) {
          playerScores[0]++;
        }
        if (cell === "^" && r === 0) {
          playerScores[1]++;
        }
      }
    }
    return playerScores[0] >= 4 || playerScores[1] >= 4;
  },
  onChange: ({ minnie }) => {
    const { state, player } = minnie.getState();
    state.forEach((row, r) => {
      const domCells = Array.from(
        Array.from(document.querySelectorAll(".row"))[r].children
      );
      row.forEach((cell, c) => {
        const classList = domCells[c].classList;
        classList.remove(
          "orange",
          "lime",
          "up",
          "down",
          "leftward",
          "rightward"
        );
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
    document
      .querySelectorAll(".suggested")
      .forEach((el) => el.classList.remove("suggested"));
    minnie.getScoredMoves(state, player).then((scoredMoves) => {
      const { ri, ci } = scoredMoves[0].move;
      document
        .querySelectorAll(".row")
        [ri].children[ci].classList.add("suggested");
    });
  },
  onReady: ({ minnie }) => {
    document.querySelectorAll(".row").forEach((row, ri) => {
      Array.from(row.children).forEach((cell, ci) => {
        cell.addEventListener("click", () => {
          const { state, player } = minnie.getState();
          if (!isPiece(state[ri][ci]) || minnie.isGameOver({ state })) {
            return;
          }
          const { state: nextState, player: nextPlayer } = minnie.getNextState({
            state,
            player,
            move: { ri, ci },
          });
          minnie.pushState(nextState, nextPlayer);
          minnie.onChange({ minnie });
        });
      });
    });
    minnie.onChange({ minnie });
  },
});
