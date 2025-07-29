class MinnieMax {
  constructor(config) {
    this.applyMove = config.applyMove;
    this.depth = config.depth;
    this.evaluate = config.evaluate;
    this.generateMoves = config.generateMoves;
  }

  getDepth() {
    return this.depth;
  }

  setDepth(depth) {
    if (depth > 0) {
      this.depth = depth;
    }
    return this.depth;
  }

  getScoredMoves(state, player) {
    // TODO
  }
}
