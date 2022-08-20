const MAX_MOVES_AHEAD = 2;

const getMoveScores = ({ player, state }) => {
  const si = player === 1 ? 0 : 5;
  const options = [];
  Array(5).fill(true).forEach((_, i) => {
    const piece = si + i;
    if (state[piece] !== 12) {
      options.push(new Promise((resolve) => {
        move({ piece, resolve, state });
      }));
    }
  });
  Promise.all(options).then((values) => {
    console.log(values);
  });
};

const getOpponentPiece = ({ piece, space }) => {
  let spaceMap;
  if (piece < 5) {
    spaceMap = [null, 5, 6, 7, 8, 9, null, 9, 8, 7, 6, 5];
  } else {
    spaceMap = [null, 4, 3, 2, 1, 0, null, 0, 1, 2, 3, 4];
  }
  return spaceMap[space];
};

const getSpeed = ({ piece, state }) => {
  let speed = [1, 3, 2, 3, 1, 3, 1, 2, 1, 3][piece];
  if (state[piece] > 5 && speed !== 2) {
    speed = speed === 1 ? 3 : 1;
  }
  return speed;
};

const isOpponentHere = ({ opponentPiece, piece, state }) => {
  const checkMap = [
    [5, 7],
    [4, 8],
    [3, 9],
    [2, 10],
    [1, 11],
    [1, 11],
    [2, 10],
    [3, 9],
    [4, 8],
    [5, 7],
  ];
  return checkMap[piece].includes(state[opponentPiece]);
};

const move = ({
  ahead = 0,
  piece,
  player = 1,
  queue = [],
  resolve,
  score = { value: 0 },
  state,
}) => {
  const newState = [...state];
  const speed = getSpeed({ piece, state });
  let currMoveScore = 0;
  let jumped = 0;
  Array(speed).fill(true).forEach(() => {
    if (jumped || [6, 12].includes(newState[piece])) {
      return;
    }
    newState[piece]++;
    currMoveScore++;
    const opponentPiece = getOpponentPiece({ piece, space: newState[piece] });
    if (isOpponentHere({ opponentPiece, piece, state })) {
      let jumping = true;
      while (jumping) {
        const currOpponentPiece = opponentPiece + jumped;
        const opponentPieceOldState = newState[currOpponentPiece];
        newState[currOpponentPiece] = newState[currOpponentPiece] < 6 ? 0 : 6;
        currMoveScore += opponentPieceOldState - newState[currOpponentPiece] + 1;
        newState[piece]++;
        jumped++;
        if (
          [6, 12].includes(newState[piece]) ||
          !isOpponentHere({
            opponentPiece: currOpponentPiece + 1,
            piece,
            state: newState
          })
        ) {
          jumping = false;
        }
      }
    }
  });
  score.value += currMoveScore * player * (1 / (ahead + 1));
  if (ahead < MAX_MOVES_AHEAD) {
    const si = player === 1 ? 0 : 5;
    Array(5).fill(true).forEach((_, i) => {
      const piece = si + i;
      if (newState[piece] !== 12) {
        queue.push({
          piece,
          player: player === 1 ? -1 : 1,
          queue,
          resolve,
          score,
          state: newState,
          ahead: ahead + 1,
        });
      }
    });
  }
  if (!queue.length) {
    resolve(score);
  } else {
    move(queue.pop());
  }
};

// example: new game, player 1

getMoveScores({
  player: 1,
  state: Array(10).fill(0),
});

/////

const Squadro = () => {
  return (
    <div className="container">
    </div>
  );
}

export default Squadro;
