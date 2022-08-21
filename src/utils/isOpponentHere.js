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
