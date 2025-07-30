function applySuggestions(minnie, game) {
  const thinker = document.querySelector(".thinker").classList;
  document
    .querySelectorAll(".suggested")
    .forEach((el) => el.classList.remove("suggested"));
  thinker.add("active");
  requestAnimationFrame(() => {
    setTimeout(() => {
      const rows = Array.from(document.querySelectorAll(".row"));
      const state = game.getState();
      [1, 2].forEach((player) => {
        const { ri, ci } = minnie
          .getScoredMoves(state, player)
          .sort((a, b) => a.score > b.score)[0].move;
        rows[ri].children[ci].classList.add("suggested");
      });
      thinker.remove("active");
    }, 1);
  });
}

function handleDepthChange(minnie, game, delta) {
  const currDepth = minnie.getDepth();
  const newDepth = minnie.setDepth(currDepth + delta);
  if (currDepth !== newDepth) {
    document.querySelector(".depth").innerHTML = newDepth;
    applySuggestions(minnie, game);
  }
}

function init() {
  const game = new SquadroGame();
  const minnie = new MinnieMax({
    applyMove: game.applyMove.bind(game),
    depth: 7,
    evaluate: game.evaluate.bind(game),
    generateMoves: game.generateMoves,
    isGameOver: game.isGameOver,
  });
  document.querySelectorAll(".row").forEach((row, ri) => {
    Array.from(row.children).forEach((cell, ci) => {
      cell.addEventListener("click", () => {
        const state = game.getState();
        if (!game.isPiece(state[ri][ci]) || game.isGameOver(state)) {
          return;
        }
        game.applyMove(state, { ri, ci }, true);
        updateDOM(minnie, game);
      });
    });
  });
  const numberControl = document.querySelector(".number-control");
  numberControl.querySelector(".up").addEventListener("click", () => {
    handleDepthChange(minnie, game, 1);
  });
  numberControl.querySelector(".down").addEventListener("click", () => {
    handleDepthChange(minnie, game, -1);
  });
  document.querySelector(".undo").addEventListener("click", () => {
    game.undoMove();
    updateDOM(minnie, game);
  });
  document.querySelector(".depth").innerHTML = minnie.getDepth();
  updateDOM(minnie, game);
}

function updateDOM(minnie, game) {
  game.getState().forEach((row, r) => {
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
  applySuggestions(minnie, game);
}

init();
