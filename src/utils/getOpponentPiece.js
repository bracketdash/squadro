const spaceMap = [
  [null, 5, 6, 7, 8, 9, null, 9, 8, 7, 6, 5],
  [null, 4, 3, 2, 1, 0, null, 0, 1, 2, 3, 4],
];

export const getOpponentPiece = ({
  piece,
  space,
}) => spaceMap[piece < 5 ? 0 : 1][space];
