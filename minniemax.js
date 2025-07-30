class MinnieMax {
  constructor(config) {
    this.applyMove = config.applyMove;
    this.depth = config.depth;
    this.evaluate = config.evaluate;
    this.generateMoves = config.generateMoves;
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
    // TODO
  }
}
