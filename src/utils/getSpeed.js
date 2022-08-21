const speedMap = [1, 3, 2, 3, 1, 3, 1, 2, 1, 3];

export const getSpeed = ({ piece, state }) => {
  let speed = speedMap[piece];
  if (state[piece] > 5 && speed !== 2) {
    speed = speed === 1 ? 3 : 1;
  }
  return speed;
};
