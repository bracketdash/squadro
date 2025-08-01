class SquadroGame {
  constructor() {
    this.horizontalPips = [3, 1, 2, 1, 3];
    this.verticalPips = [1, 3, 2, 3, 1];
    this.history = [
      [
        [" ", "v", "v", "v", "v", "v", " "],
        [">", "+", "+", "+", "+", "+", "-"],
        [">", "+", "+", "+", "+", "+", "-"],
        [">", "+", "+", "+", "+", "+", "-"],
        [">", "+", "+", "+", "+", "+", "-"],
        [">", "+", "+", "+", "+", "+", "-"],
        [" ", "|", "|", "|", "|", "|", " "],
      ],
    ];
    const storedHistory = localStorage?.getItem("history");
    if (storedHistory) {
      let storedHistoryParsed;
      try {
        storedHistoryParsed = JSON.parse(storedHistory);
      } catch (e) {
        console.warn("Could not parse stored history.");
      }
      if (storedHistoryParsed) {
        this.history = storedHistoryParsed;
      } else {
        console.log("Starting a new game.");
      }
    } else {
      console.log("No stored history. Starting a new game.");
    }
  }

  applyMove(state, { ri, ci }) {
    const next = Array(7);
    for (let i = 0; i < 7; i++) {
      next[i] = state[i].slice();
    }
    const piece = state[ri][ci];
    if (!this.isPiece(piece)) {
      return next;
    }
    if ((piece === "^" && ri === 0) || (piece === "<" && ci === 0)) {
      return state;
    }
    const homewardPipMap = [null, 3, 2, 1];
    const isVertical = piece === "v" || piece === "^";
    const index = isVertical ? ci - 1 : ri - 1;
    let dr = 0;
    let dc = 0;
    let speed = 0;
    switch (piece) {
      case "v":
        dr = 1;
        speed = this.verticalPips[index];
        break;
      case "^":
        dr = -1;
        speed = homewardPipMap[this.verticalPips[index]];
        break;
      case ">":
        dc = 1;
        speed = this.horizontalPips[index];
        break;
      case "<":
        dc = -1;
        speed = homewardPipMap[this.horizontalPips[index]];
        break;
    }
    next[ri][ci] = this._getFallbackCell(ri, ci);
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
      if (this.isPiece(target)) {
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
      next[jr][jc] = this._getFallbackCell(jr, jc);
      const homeRow = p === "v" ? 0 : p === "^" ? 6 : jr;
      const homeCol = p === ">" ? 0 : p === "<" ? 6 : jc;
      next[homeRow][homeCol] = p;
    }
    return next;
  }

  evaluate(state, player, depthRemaining) {
    const advances = [];
    const isPlayer1 = player === 1;
    const isPlayer2 = player === 2;
    for (let ri = 0; ri < state.length; ri++) {
      const row = state[ri];
      for (let ci = 0; ci < row.length; ci++) {
        const cell = row[ci];
        if (
          (isPlayer1 && (cell === ">" || cell === "<")) ||
          (isPlayer2 && (cell === "v" || cell === "^"))
        ) {
          advances.push(this._getProgress(cell, ri, ci));
        }
      }
    }
    let score = advances
      .sort((a, b) => b - a)
      .slice(0, 4)
      .reduce((a, b) => a + b, 0);
    let completedJourneys = 0;
    for (let r = 0; r < state.length; r++) {
      for (let c = 0; c < state[r].length; c++) {
        const cell = state[r][c];
        if (
          (isPlayer1 && cell === "<" && c === 0) ||
          (isPlayer2 && cell === "^" && r === 0)
        ) {
          completedJourneys++;
        }
      }
    }
    score += completedJourneys * 50;
    if (completedJourneys > 3) {
      score += 1000 + depthRemaining;
    }
    return score;
  }

  generateMoves(state, player) {
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
  }

  getPiecePlayer(piece) {
    return piece === "<" || piece === ">" ? 1 : 2;
  }

  getState() {
    return this.history[this.history.length - 1];
  }

  isGameOver(state) {
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
  }

  isPiece(candidate) {
    return ["v", "^", ">", "<"].includes(candidate);
  }

  pushState(state) {
    this.history.push(state);
    if (localStorage) {
      localStorage.setItem("history", JSON.stringify(this.history));
    }
  }

  undoMove() {
    if (this.history.length < 2) {
      return;
    }
    this.history.pop();
    if (localStorage) {
      localStorage.setItem("history", JSON.stringify(this.history));
    }
  }

  _getFallbackCell(row, col) {
    if ((row === 0 || row === 6) && col >= 1 && col <= 5) {
      return "|";
    }
    if ((col === 0 || col === 6) && row >= 1 && row <= 5) {
      return "-";
    }
    return "+";
  }

  _getProgress(piece, r, c) {
    let pip;
    let distance;
    if (piece === "v" || piece === "^") {
      const index = c - 1;
      pip = this.verticalPips[index];
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
      pip = this.horizontalPips[index];
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
}
