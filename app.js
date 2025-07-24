const rows = Array.from(document.querySelectorAll(".row"));

// build a 2D array representation of the board from DOM rows and columns
const board = rows.map((row) => Array.from(row.children));

function solver() {
  // clear any previous move suggestions
  document
    .querySelectorAll(".suggested")
    .forEach((el) => el.classList.remove("suggested"));

  const orangePieces = [];
  const limePieces = [];

  // locate all orange and lime pieces on the board
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      const classes = cell.classList;
      if (classes.contains("orange")) {
        orangePieces.push({ el: cell, row: r, col: c });
      } else if (classes.contains("lime")) {
        limePieces.push({ el: cell, row: r, col: c });
      }
    }
  }

  // check if a piece has completed its round-trip and reached its home edge facing outward
  function isScored(piece, color) {
    const dir = piece.el.classList;
    if (color === "orange") {
      return dir.contains("up") && piece.row === 0;
    } else {
      return dir.contains("leftward") && piece.col === 0;
    }
  }

  const orangeScored = orangePieces.filter((p) => isScored(p, "orange")).length;
  const limeScored = limePieces.filter((p) => isScored(p, "lime")).length;
  if (orangeScored >= 4 && limeScored >= 4) return;

  // count how many pips are visible on one mirrored side (true speed)
  function getPipCount(cell, vertical) {
    const side = vertical
      ? cell.querySelector(".pips-left")
      : cell.querySelector(".pips-top");
    return side ? side.querySelectorAll(".pip").length : 0;
  }

  // simulate a single move and return a scored evaluation of the outcome
  function simulateMove(piece, color) {
    const dir = piece.el.classList;
    const vertical = color === "orange";
    const speed = getPipCount(piece.el, vertical);
    const isForward =
      (color === "orange" && dir.contains("down")) ||
      (color === "lime" && dir.contains("rightward"));

    let dr = 0,
      dc = 0;
    if (vertical) dr = isForward ? 1 : -1;
    else dc = isForward ? 1 : -1;

    let r = piece.row;
    let c = piece.col;
    let remaining = speed;
    let jumpedCount = 0;
    let jumped = false;
    let threatened = false;

    // main move loop: proceed until out of movement or landing after jumps
    while (true) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= board.length || nc < 0 || nc >= board[0].length)
        break;

      const nextCell = board[nr][nc];
      const nextClasses = nextCell.classList;
      const edgeReached =
        (vertical &&
          ((isForward && nr === board.length - 1) ||
            (!isForward && nr === 0))) ||
        (!vertical &&
          ((isForward && nc === board[0].length - 1) ||
            (!isForward && nc === 0)));

      if (!jumped && remaining === 0) break;
      if (edgeReached) {
        // reached turnaround edge, stop and reverse
        r = nr;
        c = nc;
        break;
      }

      const isOpponent =
        (color === "orange" && nextClasses.contains("lime")) ||
        (color === "lime" && nextClasses.contains("orange"));

      if (!jumped && isOpponent) {
        jumped = true;
        jumpedCount++;
      }

      if (!jumped) {
        remaining--;
        r = nr;
        c = nc;
      } else {
        // chain jump logic — continue jumping until we land on an empty cell
        r = nr;
        c = nc;
        const nextJumpR = r + dr;
        const nextJumpC = c + dc;
        if (
          nextJumpR < 0 ||
          nextJumpR >= board.length ||
          nextJumpC < 0 ||
          nextJumpC >= board[0].length
        )
          break;

        const landingCell = board[nextJumpR][nextJumpC];
        const landingClasses = landingCell.classList;
        if (
          landingClasses.contains("orange") ||
          landingClasses.contains("lime")
        ) {
          if (
            (color === "orange" && landingClasses.contains("lime")) ||
            (color === "lime" && landingClasses.contains("orange"))
          ) {
            jumpedCount++;
          }
          continue;
        } else {
          r = nextJumpR;
          c = nextJumpC;
          break;
        }
      }
    }

    // danger detection: would opponent be able to jump this piece next turn?
    const opponentPieces = color === "orange" ? limePieces : orangePieces;
    for (const op of opponentPieces) {
      const opDir = op.el.classList;
      const opForward =
        (color === "orange" && opDir.contains("rightward")) ||
        (color === "lime" && opDir.contains("down"));
      const opVertical = color === "orange";
      const opSpeed = getPipCount(op.el, opVertical);
      const opr = op.row,
        opc = op.col;

      for (let i = 1; i <= opSpeed; i++) {
        const checkR = opr + (opVertical ? (opForward ? 1 : -1) * i : 0);
        const checkC = opc + (!opVertical ? (opForward ? 1 : -1) * i : 0);
        if (checkR === r && checkC === c) {
          threatened = true;
          break;
        }
      }
      if (threatened) break;
    }

    // score this move
    const progress = vertical
      ? isForward
        ? r
        : board.length - 1 - r
      : isForward
      ? c
      : board[0].length - 1 - c;

    const finishBonus =
      (vertical && !isForward && r === 0) ||
      (!vertical && !isForward && c === 0)
        ? 10
        : 0;
    const jumpBonus = jumpedCount * 2;
    const dangerPenalty = threatened ? -3 : 0;

    const score = progress + finishBonus + jumpBonus + dangerPenalty;

    return { score, el: piece.el };
  }

  // evaluate all pieces and return the one with the highest scoring move
  function findBestMove(pieces, color) {
    let best = null;
    for (const p of pieces) {
      if (isScored(p, color)) continue;
      const sim = simulateMove(p, color);
      if (!best || sim.score > best.score) {
        best = sim;
      }
    }
    return best?.el;
  }

  // apply suggested move to each player if they haven't already completed 4
  if (orangeScored < 4) {
    const bestOrange = findBestMove(orangePieces, "orange");
    bestOrange?.classList.add("suggested");
  }
  if (limeScored < 4) {
    const bestLime = findBestMove(limePieces, "lime");
    bestLime?.classList.add("suggested");
  }
}

function handleClick(event) {
  let target = event.target;

  // climb up the DOM tree until we hit an .option or .orange/.lime or row cell
  while (
    target &&
    !target.classList.contains("option") &&
    !target.classList.contains("orange") &&
    !target.classList.contains("lime") &&
    target.parentElement
  ) {
    target = target.parentElement;
  }

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
      Array.from(row.children).forEach((cell) => {
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
