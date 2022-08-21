import { getOpponentPiece, getSpeed, isOpponentHere } from './utils';

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
  if (ahead < 0) { // max moves ahead
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

export const getMoveScores = ({ player, state }) => {
  return new Promise((resolve) => {
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
      resolve(values);
    });
  });
};
