class MinnieMax {
  constructor(config) {
    this.applyMove = config.applyMove;
    this.depth = config.depth;
    this.evaluate = config.evaluate;
    this.generateMoves = config.generateMoves;
    this.isGameOver = config.isGameOver;
    const storedDepth = localStorage?.getItem("depth");
    if (storedDepth) {
      const storedDepthParsed = parseInt(storedDepth, 10);
      if (storedDepthParsed && !isNaN(storedDepthParsed)) {
        this.depth = storedDepthParsed;
      }
    }
  }

  getDepth() {
    return this.depth;
  }

  setDepth(depth) {
    if (depth > 0) {
      this.depth = depth;
    }
    if (localStorage) {
      localStorage.setItem("depth", this.depth);
    }
    return this.depth;
  }

  getScoredMoves(state, player) {
    const scoredMoves = [];
    this.generateMoves(state, player).forEach((move) => {
      const futureStates = [];
      const stack = [
        {
          state,
          move,
          moves: this.depth,
          player,
          first: true,
        },
      ];
      while (stack.length > 0) {
        const { state, move, moves, player, first } = stack.pop();
        if (moves < 1) {
          continue;
        }
        const newMoves = [];
        if (first) {
          newMoves.push(move);
        } else {
          newMoves.push.apply(newMoves, this.generateMoves(state, player));
        }
        for (const newMove of newMoves) {
          const next = this.applyMove(state, newMove);
          if (moves === 1 || this.isGameOver(next)) {
            const multiplier = Math.pow(5, moves - 1);
            for (let i = 0; i < multiplier; i++) {
              futureStates.push(next);
            }
          } else {
            stack.push({
              state: next,
              newMove,
              moves: moves - 1,
              player: player === 1 ? 2 : 1,
              first: false,
            });
          }
        }
      }
      const score = futureStates.reduce((sum, state) => {
        const myScore = this.evaluate(state, player);
        const opponentScore = this.evaluate(state, player === 1 ? 2 : 1);
        return sum + myScore - opponentScore;
      }, 0);
      scoredMoves.push({ move, score });
    });
    return scoredMoves;
  }
}
