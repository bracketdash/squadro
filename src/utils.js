const spaceMap = [
  [null, 5, 6, 7, 8, 9, null, 9, 8, 7, 6, 5],
  [null, 4, 3, 2, 1, 0, null, 0, 1, 2, 3, 4],
];

export const getOpponentPiece = ({
  piece,
  space,
}) => spaceMap[piece < 5 ? 0 : 1][space];

const speedMap = [1, 3, 2, 3, 1, 3, 1, 2, 1, 3];

export const getSpeed = ({ piece, state }) => {
  let speed = speedMap[piece];
  if (state[piece] > 5 && speed !== 2) {
    speed = speed === 1 ? 3 : 1;
  }
  return speed;
};

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

export const isOpponentHere = ({
  opponentPiece,
  piece,
  state,
}) => checkMap[piece].includes(state[opponentPiece]);
