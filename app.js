const rows = Array.from(document.querySelectorAll(".row"));

function getCurrentBoardState() {
  return rows.map((row) => {
    return Array.from(row.children).map((cell) => {
      const classList = cell.classList;
      if (classList.contains("empty")) {
        return " ";
      }
      if (classList.contains("orange")) {
        return classList.contains("down") ? "v" : "^";
      }
      if (classList.contains("lime")) {
        return classList.contains("rightward") ? ">" : "<";
      }
      if (classList.contains("cross")) {
        return "+";
      }
      if (classList.contains("horizontal")) {
        return "-";
      }
      if (classList.contains("vertical")) {
        return "|";
      }
    });
  });
}

function getFallbackCell(row, col) {
  if ((row === 0 || row === 6) && col >= 1 && col <= 5) {
    return "|";
  }
  if ((col === 0 || col === 6) && row >= 1 && row <= 5) {
    return "-";
  }
  return "+";
}

function flipSpeed(s) {
  return s === 1 ? 3 : s === 3 ? 1 : s;
}

function getNextBoardState(board, rowIndex, cellIndex) {
  const next = board.map((row) => row.slice());

  const piece = board[rowIndex][cellIndex];
  if (!["v", "^", ">", "<"].includes(piece)) {
    return next;
  }

  if (
    (piece === "^" && rowIndex === 0) ||
    (piece === "v" && rowIndex === 6) ||
    (piece === "<" && cellIndex === 0) ||
    (piece === ">" && cellIndex === 6)
  ) {
    return board;
  }

  const verticalPips = [1, 3, 2, 3, 1];
  const horizontalPips = [3, 1, 2, 1, 3];

  const isVertical = piece === "v" || piece === "^";
  const index = isVertical ? cellIndex - 1 : rowIndex - 1;

  let dr = 0,
    dc = 0,
    speed = 0;
  if (piece === "v") {
    dr = 1;
    speed = verticalPips[index];
  } else if (piece === "^") {
    dr = -1;
    speed = flipSpeed(verticalPips[index]);
  } else if (piece === ">") {
    dc = 1;
    speed = horizontalPips[index];
  } else if (piece === "<") {
    dc = -1;
    speed = flipSpeed(horizontalPips[index]);
  }

  const originalFallback = getFallbackCell(rowIndex, cellIndex);
  next[rowIndex][cellIndex] = originalFallback;

  let r = rowIndex;
  let c = cellIndex;
  let distanceRemaining = speed;
  const jumped = [];
  let jumpedMode = false;

  while (distanceRemaining > 0 || jumpedMode) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= 7 || nc < 0 || nc >= 7) {
      break;
    }

    const target = next[nr][nc];
    if (["v", "^", ">", "<"].includes(target)) {
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

  if (piece === "v" && r === 6 && rowIndex !== 6) {
    newChar = "^";
  } else if (piece === "^" && r === 0 && rowIndex !== 0) {
    newChar = "^";
  } else if (piece === ">" && c === 6 && cellIndex !== 6) {
    newChar = "<";
  } else if (piece === "<" && c === 0 && cellIndex !== 0) {
    newChar = "<";
  }

  next[r][c] = newChar;

  for (const { r: jr, c: jc, p } of jumped) {
    next[jr][jc] = getFallbackCell(jr, jc);
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

  return next;
}

function updateDOMwithBoardState(board) {
  board.forEach((rowData, rowIndex) => {
    const cells = Array.from(rows[rowIndex].children);
    rowData.forEach((cellChar, colIndex) => {
      const cell = cells[colIndex];
      const classList = cell.classList;

      classList.remove("orange", "lime", "up", "down", "leftward", "rightward");

      if (cellChar === "v") {
        classList.add("orange", "down");
      } else if (cellChar === "^") {
        classList.add("orange", "up");
      } else if (cellChar === ">") {
        classList.add("lime", "rightward");
      } else if (cellChar === "<") {
        classList.add("lime", "leftward");
      }
    });
  });
}

function isAPiece(board, rowIndex, cellIndex) {
  return ["v", "^", ">", "<"].includes(board[rowIndex][cellIndex]);
}

function handleClick(rowIndex, cellIndex) {
  const board = getCurrentBoardState();
  if (!isAPiece(board, rowIndex, cellIndex)) {
    return;
  }
  updateDOMwithBoardState(getNextBoardState(board, rowIndex, cellIndex));
}

function handleMouseenter(rowIndex, cellIndex) {
  const board = getCurrentBoardState();
  if (!isAPiece(board, rowIndex, cellIndex)) {
    return;
  }
  // TODO
  // console.log(`handleMouseenter(${rowIndex}, ${cellIndex})`);
}

function handleMouseleave(rowIndex, cellIndex) {
  const board = getCurrentBoardState();
  if (!isAPiece(board, rowIndex, cellIndex)) {
    return;
  }
  // TODO
  // console.log(`handleMouseleave(${rowIndex}, ${cellIndex})`);
}

rows.forEach((row, rowIndex) => {
  const cells = Array.from(row.children);
  cells.forEach((cell, cellIndex) => {
    cell.addEventListener("click", () => handleClick(rowIndex, cellIndex));
    cell.addEventListener("mouseenter", () =>
      handleMouseenter(rowIndex, cellIndex)
    );
    cell.addEventListener("mouseleave", () =>
      handleMouseleave(rowIndex, cellIndex)
    );
  });
});
