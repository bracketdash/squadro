class MinnieMax {
  constructor(config) {
    this.applyMove = config.applyMove;
    this.depth = config.depth;
    this.evaluate = config.evaluate;
    this.generateMoves = config.generateMoves;
    this.getPlayerFromState = config.getPlayerFromState ?? false;
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
      const leafScores = [];
      const stack = [
        {
          state,
          movesRemaining: this.depth,
          player,
          first: true,
        },
      ];
      while (stack.length > 0) {
        const {
          state: currState,
          movesRemaining,
          player: currPlayer,
          first,
        } = stack.pop();
        if (movesRemaining < 1) {
          continue;
        }
        const nextMoves = first
          ? [move]
          : this.generateMoves(currState, currPlayer);
        for (const nextMove of nextMoves) {
          const nextState = this.applyMove(currState, nextMove);
          const isTerminal = movesRemaining === 1 || this.isGameOver(nextState);
          if (isTerminal) {
            const myScore = this.evaluate(
              nextState,
              player,
              movesRemaining - 1
            );
            const oppScore = this.evaluate(
              nextState,
              player === 1 ? 2 : 1,
              movesRemaining - 1
            );
            leafScores.push(myScore - oppScore);
          } else {
            const nextPlayer = this.getPlayerFromState
              ? nextState.player
              : currPlayer === 1
              ? 2
              : 1;
            stack.push({
              state: nextState,
              movesRemaining: movesRemaining - 1,
              player: nextPlayer,
              first: false,
            });
          }
        }
      }
      const score =
        leafScores.length > 0
          ? leafScores.reduce((sum, s) => sum + s, 0) / leafScores.length
          : 0;
      scoredMoves.push({ move, score });
    });
    return scoredMoves;
  }
}
