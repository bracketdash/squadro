class MinnieMax {
  constructor(config) {
    this.el = config.el;
    this.getMoves = config.getMoves;
    this.getNextState = config.getNextState;
    this.getStateScore = config.getStateScore;
    this.history = [{ state: config.initialState, player: 1 }];
    this.initialState = config.initialState;
    this.isGameOver = config.isGameOver;
    this.localStorageKey = config.localStorageKey;
    this.movesAhead = config.initialMovesAhead;
    this.onChange = config.onChange;
    this.onReady = config.onReady;
    const storedHistory = localStorage?.getItem(config.localStorageKey);
    if (storedHistory) {
      let storedHistoryParsed;
      try {
        storedHistoryParsed = JSON.parse(storedHistory);
      } catch (e) {}
      if (storedHistoryParsed) {
        this.history = storedHistoryParsed;
      }
    }
    this.render();
    this.setupEventListeners();
    if (this.onReady) {
      this.onReady({ minnie: this });
    }
  }

  getScoredMoves(state, player) {
    const thinkingOrb =
      this.el.shadowRoot.querySelector(".thinking-orb").classList;
    thinkingOrb.add("active");
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const scoredMoves = [];
          this.getMoves({ minnie: this, state, player }).forEach((move) => {
            const leafScores = [];
            const stack = [
              {
                state,
                movesRemaining: this.movesAhead,
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
                : this.getMoves({
                    minnie: this,
                    state: currState,
                    player: currPlayer,
                  });
              for (const nextMove of nextMoves) {
                const { state: nextState, player: nextPlayer } =
                  this.getNextState({
                    minnie: this,
                    state: currState,
                    player: currPlayer,
                    move: nextMove,
                  });
                const isTerminal =
                  movesRemaining === 1 ||
                  this.isGameOver({ minnie: this, state: nextState });
                if (isTerminal) {
                  const myScore = this.getStateScore({
                    minnie: this,
                    state: nextState,
                    player,
                    movesRemaining: movesRemaining - 1,
                  });
                  const oppScore = this.getStateScore({
                    minnie: this,
                    state: nextState,
                    player: player === 1 ? 2 : 1,
                    movesRemaining: movesRemaining - 1,
                  });
                  leafScores.push(myScore - oppScore);
                } else {
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
          thinkingOrb.remove("active");
          resolve(scoredMoves.sort((a, b) => (a.score <= b.score ? 1 : -1)));
        }, 5);
      });
    });
  }

  getState() {
    return this.history[this.history.length - 1];
  }

  pushState(state, player) {
    this.history.push({ state, player });
    if (!localStorage) {
      return;
    }
    const key = this.localStorageKey;
    try {
      localStorage.setItem(key, JSON.stringify(this.history));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        while (this.history.length > 0) {
          this.history.shift();
          try {
            localStorage.setItem(key, JSON.stringify(this.history));
            break;
          } catch (e2) {
            if (e2.name !== "QuotaExceededError") {
              throw e2;
            }
          }
        }
      } else {
        throw e;
      }
    }
  }

  render() {
    this.el.attachShadow({ mode: "open" });
    this.el.shadowRoot.innerHTML = `
      <div class="thinking-x-moves-ahead">
        <div>Think</div>
        <div class="number">
          <div class="up">&#9650;</div>
          <div class="value">${this.movesAhead}</div>
          <div class="down">&#9660;</div>
        </div>
        <div>moves ahead:</div>
        <div class="thinking-orb"></div>
      </div>
      <div class="buttons">
        <div class="reset">New Game</div>
        <div class="undo">Undo Move</div>
      </div>
      <style>
        .thinking-x-moves-ahead {
          align-items: center;
          display: flex;
          flex-direction: row;
          gap: 12px;
          justify-content: center;
          margin: 24px auto;
          user-select: none;
          font-size: 18px;
        }

        .number {
          align-items: center;
          border-radius: 6px;
          border: 1px solid #ccc;
          display: flex;
          flex-direction: column;
          font-family: sans-serif;
          overflow: hidden;
          user-select: none;
        }

        .up, .down {
          background: #e5e5e5;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          text-align: center;
          width: 100%;
        }

        .up:hover, .down:hover {
          background: #f0f0f0;
        }

        .up:active, .down:active {
          background: #ddd;
        }

        .value {
          padding: 5px;
          font-size: 24px;
          font-weight: bold;
          background: white;
          width: 100%;
          text-align: center;
        }

        .thinking-orb {
          background: #999;
          border-radius: 50%;
          height: 42px;
          opacity: 0.5;
          overflow: hidden;
          position: relative;
          transform: scale(1);
          transition: opacity 0.6s ease, transform 0.6s ease;
          width: 42px;
        }

        .thinking-orb::before {
          animation: swirl 3s linear infinite;
          background: conic-gradient(from 0deg, #369, #147, #69b, #369);
          border-radius: 50%;
          content: "";
          inset: 0;
          opacity: 0.4;
          pointer-events: none;
          position: absolute;
          transform: rotate(0deg);
          transition: opacity 0.6s ease;
          z-index: 0;
        }

        .thinking-orb::after {
          background: radial-gradient(
            circle at 30% 30%,
            rgba(255, 255, 255, 0.2),
            transparent 50%
          );
          border-radius: 50%;
          content: "";
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: 1;
        }

        .thinking-orb:not(.active)::before {
          animation-play-state: paused;
          opacity: 0;
        }

        .thinking-orb.active {
          animation: pulse 3s ease-in-out infinite;
          background: #369;
          opacity: 1;
          transform: scale(1.05);
        }

        @keyframes swirl {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1.05);
          }
          50% {
            transform: scale(1.15);
          }
        }

        .buttons {
          align-items: center;
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 20px auto;
          user-select: none;
        }

        .buttons > div {
          background: #e5e5e5;
          border-radius: 5px;
          border: 1px solid #bbb;
          cursor: pointer;
          font-size: 14px;
          height: 26px;
          line-height: 26px;
          padding: 0 10px;
          text-align: center;
        }

        .buttons > div:hover {
          background: #f0f0f0;
        }

        .buttons > div:active {
          background: #ddd;
        }
      </style>
    `;
  }

  setupEventListeners() {
    const root = this.el.shadowRoot;
    root.querySelector(".up").addEventListener("click", () => {
      this._increaseMovesAhead();
    });
    root.querySelector(".down").addEventListener("click", () => {
      this._decreaseMovesAhead();
    });
    root.querySelector(".undo").addEventListener("click", () => {
      this._popState();
    });
    root.querySelector(".reset").addEventListener("click", () => {
      this._newGame();
    });
  }

  _decreaseMovesAhead() {
    if (this.movesAhead > 1) {
      this.movesAhead--;
      this.el.shadowRoot.querySelector(".value").innerHTML = this.movesAhead;
      this._onChange();
    }
  }

  _increaseMovesAhead() {
    this.movesAhead++;
    this.el.shadowRoot.querySelector(".value").innerHTML = this.movesAhead;
    this._onChange();
  }

  _newGame() {
    this.history = [{ state: this.initialState, player: 1 }];
    this._updateLocalStorage();
  }

  _onChange() {
    if (this.onChange) {
      this.onChange({ minnie: this });
    }
  }

  _popState() {
    if (this.history.length < 2) {
      return;
    }
    this.history.pop();
    this._updateLocalStorage();
  }

  _updateLocalStorage() {
    this._onChange();
    if (localStorage) {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.history));
    }
  }
}
