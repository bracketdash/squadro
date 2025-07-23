const rows = Array.from(document.querySelectorAll(".row"));

function solver() {
  document
    .querySelectorAll(".suggested")
    .forEach((el) => el.classList.remove("suggested"));

  const boardSize = 7;
  const virtualBoard = Array.from({ length: boardSize }, () =>
    Array(boardSize).fill(null)
  );
  const pieces = [];

  rows.forEach((row, r) => {
    Array.from(row.children).forEach((cell, c) => {
      const isOrange = cell.classList.contains("orange");
      const isLime = cell.classList.contains("lime");
      if (!isOrange && !isLime) return;

      const direction = cell.classList.contains("down")
        ? "down"
        : cell.classList.contains("up")
        ? "up"
        : cell.classList.contains("rightward")
        ? "rightward"
        : "leftward";

      const pips = cell.querySelectorAll(".pip").length;

      const piece = {
        type: isOrange ? "orange" : "lime",
        direction,
        pips,
        row: r,
        col: c,
        el: cell,
        id: `${r},${c}`,
      };

      pieces.push(piece);
      virtualBoard[r][c] = piece;
    });
  });

  function getVector(dir) {
    return dir === "down"
      ? [1, 0]
      : dir === "up"
      ? [-1, 0]
      : dir === "rightward"
      ? [0, 1]
      : [-1, 0];
  }

  function hasCrossed(p) {
    return (
      (p.type === "orange" && p.direction === "up") ||
      (p.type === "lime" && p.direction === "leftward")
    );
  }

  function isFinished(p) {
    return (
      hasCrossed(p) &&
      ((p.type === "orange" && p.row === 0) ||
        (p.type === "lime" && p.col === 0))
    );
  }

  function isSetup(p) {
    if (!hasCrossed(p)) return false;
    if (p.type === "orange") {
      return p.row <= p.pips;
    } else {
      return p.col <= p.pips;
    }
  }

  function checkpoint(p) {
    if (p.type === "orange") {
      return { row: p.direction === "down" ? 0 : 6, col: p.col };
    } else {
      return { row: p.row, col: p.direction === "rightward" ? 0 : 6 };
    }
  }

  function simulate(board, allPieces, pieceToMove) {
    const boardCopy = board.map((row) => [...row]);
    const piecesCopy = allPieces.map((p) => ({ ...p }));
    const moving = piecesCopy.find((p) => p.id === pieceToMove.id);
    const [dr, dc] = getVector(moving.direction);
    let { row: r, col: c } = moving;
    boardCopy[r][c] = null;

    for (let i = 0; i < moving.pips; i++) {
      const nr = r + dr,
        nc = c + dc;
      if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) break;

      const target = boardCopy[nr][nc];
      if (target) {
        const jumpR = nr + dr,
          jumpC = nc + dc;
        if (
          jumpR < 0 ||
          jumpR >= boardSize ||
          jumpC < 0 ||
          jumpC >= boardSize ||
          boardCopy[jumpR][jumpC]
        ) {
          return null;
        }
        r = jumpR;
        c = jumpC;
        boardCopy[r][c] = moving;
        moving.row = r;
        moving.col = c;

        const bounceTarget = piecesCopy.find((p) => p.id === target.id);
        const cp = checkpoint(bounceTarget);
        boardCopy[nr][nc] = null;
        if (!boardCopy[cp.row][cp.col]) {
          bounceTarget.row = cp.row;
          bounceTarget.col = cp.col;
          boardCopy[cp.row][cp.col] = bounceTarget;
        }

        return { board: boardCopy, pieces: piecesCopy };
      }

      r = nr;
      c = nc;
    }

    moving.row = r;
    moving.col = c;
    boardCopy[r][c] = moving;

    return { board: boardCopy, pieces: piecesCopy };
  }

  function evaluate(pieces, type) {
    let score = 0;
    for (const p of pieces) {
      const factor = p.type === type ? 1 : -1;
      if (isFinished(p)) {
        score += factor * 1000;
      } else if (isSetup(p)) {
        score += factor * 300;
      }
      const prog =
        p.type === "orange"
          ? p.direction === "down"
            ? p.row
            : 6 - p.row
          : p.direction === "rightward"
          ? p.col
          : 6 - p.col;
      score += factor * prog * 10;
    }
    return score;
  }

  function getBestMove(playerType) {
    const opponentType = playerType === "orange" ? "lime" : "orange";
    const candidates = pieces.filter(
      (p) => p.type === playerType && !isFinished(p)
    );
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of candidates) {
      const result1 = simulate(virtualBoard, pieces, move);
      if (!result1) continue;

      const oppReplies = result1.pieces.filter(
        (p) => p.type === opponentType && !isFinished(p)
      );
      let worstScore = Infinity;

      for (const reply of oppReplies) {
        const result2 = simulate(result1.board, result1.pieces, reply);
        if (!result2) continue;

        const yourFollowUps = result2.pieces.filter(
          (p) => p.type === playerType && !isFinished(p)
        );
        let bestReplyScore = -Infinity;

        for (const follow of yourFollowUps) {
          const result3 = simulate(result2.board, result2.pieces, follow);
          if (!result3) continue;
          const s = evaluate(result3.pieces, playerType);
          if (s > bestReplyScore) bestReplyScore = s;
        }

        if (yourFollowUps.length === 0) {
          bestReplyScore = evaluate(result2.pieces, playerType);
        }

        if (bestReplyScore < worstScore) worstScore = bestReplyScore;
      }

      if (oppReplies.length === 0) {
        worstScore = evaluate(result1.pieces, playerType);
      }

      if (worstScore > bestScore) {
        bestScore = worstScore;
        bestMove = move;
      }
    }

    return bestMove;
  }

  const bestOrange = getBestMove("orange");
  const bestLime = getBestMove("lime");

  if (bestOrange) bestOrange.el.classList.add("suggested");
  if (bestLime) bestLime.el.classList.add("suggested");
}

function handleClick({ target }) {
  const classes = target.classList;
  if (
    !classes.contains("orange") &&
    !classes.contains("lime") &&
    !classes.contains("option")
  ) {
    // early exit if cell does not have a clickable class
    return;
  }
  if (classes.contains("selected")) {
    // if they click their selected piece again, switch directions and solve for best moves again
    if (classes.contains("orange")) {
      if (classes.contains("down")) {
        classes.remove("down");
        classes.add("up");
      } else {
        classes.remove("up");
        classes.add("down");
      }
    } else {
      if (classes.contains("rightward")) {
        classes.remove("rightward");
        classes.add("leftward");
      } else {
        classes.remove("leftward");
        classes.add("rightward");
      }
    }
    solver();
  } else if (classes.contains("option")) {
    // if they click a valid new position for their selected piece, move it there and solve for best moves again
    const selected = document.querySelector(".selected");
    if (selected.classList.contains("orange")) {
      target.classList.add("orange");
      if (selected.classList.contains("down")) {
        target.classList.add("down");
      } else {
        target.classList.add("up");
      }
    } else {
      target.classList.add("lime");
      if (selected.classList.contains("rightward")) {
        target.classList.add("rightward");
      } else {
        target.classList.add("leftward");
      }
    }
    selected.classList.remove(
      "down",
      "leftward",
      "lime",
      "orange",
      "rightward",
      "selected",
      "up"
    );
    document
      .querySelectorAll(".option")
      .forEach((el) => el.classList.remove("option"));
    solver();
  } else {
    // if they click an unselected piece, select it (deselecting currently selected piece if there is one)
    const row = target.parentElement;
    const cols = Array.from(row.children);
    const colIndex = cols.indexOf(target);
    document
      .querySelectorAll(".selected")
      .forEach((el) => el.classList.remove("selected"));
    document
      .querySelectorAll(".option")
      .forEach((el) => el.classList.remove("option"));
    target.classList.add("selected");
    if (classes.contains("orange")) {
      rows.forEach((row) => {
        const candidateClasses = Array.from(row.children)[colIndex].classList;
        if (!candidateClasses.contains("lime")) {
          candidateClasses.add("option");
        }
      });
    } else {
      row.querySelectorAll("div").forEach((cell) => {
        const candidateClasses = cell.classList;
        if (!candidateClasses.contains("orange")) {
          candidateClasses.add("option");
        }
      });
    }
  }
}

document.querySelectorAll(".row > div").forEach((cell) => {
  cell.addEventListener("click", handleClick);
});

document.addEventListener("click", (event) => {
  // outside clicks should deselect the selected piece if there is one
  if (!event.target.closest(".container")) {
    document
      .querySelectorAll(".option")
      .forEach((el) => el.classList.remove("option"));
    document
      .querySelectorAll(".selected")
      .forEach((el) => el.classList.remove("selected"));
  }
});
