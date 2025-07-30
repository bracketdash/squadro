function applySuggestions(state) {
  const thinker = document.querySelector(".thinker").classList;
  document
    .querySelectorAll(".suggested")
    .forEach((el) => el.classList.remove("suggested"));
  thinker.add("active");
  // TODO: make this non-blocking, maybe with web workers where supported?
  requestAnimationFrame(() => {
    setTimeout(() => {
      // TODO: move (partially) to minnie, then call minnie.getScoredMoves() here
      const rows = Array.from(document.querySelectorAll(".row"));
      let bestOrange = { score: -Infinity, r: -1, c: -1 };
      let bestLime = { score: -Infinity, r: -1, c: -1 };
      state.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          const player = game.getPiecePlayer(cell);
          if (
            game.isPiece(cell) &&
            (cell !== "^" || ri !== 0) &&
            (cell !== "<" || ci !== 0)
          ) {
            const futureStates = [];
            const stack = [
              {
                state,
                ri,
                ci,
                moves: minnie.getDepth(),
                player,
                first: true,
              },
            ];
            while (stack.length > 0) {
              let { state, ri, ci, moves, player, first } = stack.pop();
              if (moves < 1) {
                continue;
              }
              const pieces = [];
              if (first) {
                player = game.getPiecePlayer(state[ri][ci]);
                pieces.push({ r: ri, c: ci });
              } else {
                for (let r = 0; r < state.length; r++) {
                  for (let c = 0; c < state[r].length; c++) {
                    const cell = state[r][c];
                    if (
                      (player === 1 && (cell === ">" || cell === "<")) ||
                      (player === 2 && (cell === "v" || cell === "^"))
                    ) {
                      pieces.push({ r, c });
                    }
                  }
                }
              }
              for (const { r, c } of pieces) {
                const next = game.applyMove(state, {
                  rowIndex: r,
                  cellIndex: c,
                });
                if (moves === 1 || game.hasGameEnded(next)) {
                  const multiplier = Math.pow(5, moves - 1);
                  for (let i = 0; i < multiplier; i++) {
                    futureStates.push(next);
                  }
                } else {
                  stack.push({
                    state: next,
                    ri,
                    ci,
                    moves: moves - 1,
                    player: player === 1 ? 2 : 1,
                    first: false,
                  });
                }
              }
            }
            const score = futureStates.reduce((sum, state) => {
              const myScore = game.evaluate(state, player);
              const opponentScore = game.evaluate(state, player === 1 ? 2 : 1);
              return sum + myScore - opponentScore;
            }, 0);
            if (player === 1 && score > bestLime.score) {
              bestLime = { score, ri, ci };
            } else if (player === 2 && score > bestOrange.score) {
              bestOrange = { score, ri, ci };
            }
          }
        });
      });
      rows[bestOrange.ri].children[bestOrange.ci].classList.add("suggested");
      rows[bestLime.ri].children[bestLime.ci].classList.add("suggested");
      thinker.remove("active");
    }, 1);
  });
}

function updateDOM(state) {
  state.forEach((row, r) => {
    const domCells = Array.from(
      Array.from(document.querySelectorAll(".row"))[r].children
    );
    row.forEach((cell, c) => {
      const classList = domCells[c].classList;
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
  applySuggestions(state);
}

function handleCellClick(rowIndex, cellIndex) {
  const state = game.getState();
  if (!game.isPiece(state[rowIndex][cellIndex]) || game.hasGameEnded(state)) {
    return;
  }
  updateDOM(game.applyMove(state, { rowIndex, cellIndex }, true));
}

function handleDepthChange(delta) {
  const currDepth = minnie.getDepth();
  const newDepth = minnie.setDepth(currDepth + delta);
  if (currDepth !== newDepth) {
    document.querySelector(".depth").innerHTML = newDepth;
    applySuggestions(game.getState());
  }
}

function init() {
  document.querySelectorAll(".row").forEach((row, rowIndex) => {
    Array.from(row.children).forEach((cell, cellIndex) => {
      cell.addEventListener("click", () =>
        handleCellClick(rowIndex, cellIndex)
      );
    });
  });

  document
    .querySelector(".number-control .up")
    .addEventListener("click", () => {
      handleDepthChange(1);
    });

  document
    .querySelector(".number-control .down")
    .addEventListener("click", () => {
      handleDepthChange(-1);
    });

  document.querySelector(".undo").addEventListener("click", () => {
    updateDOM(game.undoMove());
  });

  document.querySelector(".depth").innerHTML = minnie.getDepth();

  const state = game.getState();
  updateDOM(state);
}

const game = new SquadroGame();

const minnie = new MinnieMax({
  applyMove: game.applyMove,
  depth: 7,
  evaluate: game.evaluate,
  generateMoves: game.generateMoves,
});

init();
