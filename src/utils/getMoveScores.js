import { move } from './';

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
