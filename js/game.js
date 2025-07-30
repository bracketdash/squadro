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

  applyMove(state, { ri, ci }, pushState = false) {
    const next = state.map((row) => row.slice());
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
    if (piece === "v") {
      dr = 1;
      speed = this.verticalPips[index];
    } else if (piece === "^") {
      dr = -1;
      speed = homewardPipMap[this.verticalPips[index]];
    } else if (piece === ">") {
      dc = 1;
      speed = this.horizontalPips[index];
    } else if (piece === "<") {
      dc = -1;
      speed = homewardPipMap[this.horizontalPips[index]];
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
    let newChar = piece;
    if (piece === "v" && r === 6 && ri !== 6) {
      newChar = "^";
    } else if (piece === "^" && r === 0 && ri !== 0) {
      newChar = "^";
    } else if (piece === ">" && c === 6 && ci !== 6) {
      newChar = "<";
    } else if (piece === "<" && c === 0 && ci !== 0) {
      newChar = "<";
    }
    next[r][c] = newChar;
    for (const { r: jr, c: jc, p } of jumped) {
      next[jr][jc] = this._getFallbackCell(jr, jc);
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
    if (pushState) {
      this.history.push(next);
      if (localStorage) {
        localStorage.setItem("history", JSON.stringify(this.history));
      }
    }
    return next;
  }

  evaluate(state, player) {
    const advances = [];
    for (let r = 0; r < state.length; r++) {
      for (let c = 0; c < state[r].length; c++) {
        const cell = state[r][c];
        if (
          (player === 1 && (cell === ">" || cell === "<")) ||
          (player === 2 && (cell === "v" || cell === "^"))
        ) {
          advances.push(this._getProgress(cell, r, c));
        }
      }
    }
    return advances
      .sort((a, b) => b - a)
      .slice(0, 4)
      .reduce((a, b) => a + b, 0);
  }

  generateMoves(state, player) {
    const moves = [];
    state.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (
          (player === 1 && ((cell === "<" && ci !== 0) || cell === ">")) ||
          (player === 2 && ((cell === "^" && ri !== 0) || cell === "v"))
        ) {
          moves.push({ ri, ci });
        }
      });
    });
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
