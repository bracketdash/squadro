import { useState } from 'react';

const MAX_MOVES_AHEAD = 0;

const getMoveScores = ({ player, state }) => new Promise((resolve) => {
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
  const [uState, setUState] = useState(Array(10).fill(0).join(','));
  const [uPlayer, setUPlayer] = useState(1);
  const [uScores, setUScores] = useState([0, 0, 0, 0, 0]);
  return (
    <div className="container">
      <p>
        This is bare bones right now.
        Enter the game state and which player you are below.
        Game state is a 10-element array, representing the 10 pieces, with values 0 - 12 representing their position on their track.
        For player, enter 1 if your home row is the clockwise-most starting side.
      </p>
      <p>
        <label>Game state (commas-separated, no brackets or spaces):</label><br />
        <input type="text" defaultValue={uState} onKeyUp={(e) => setUState(e.target.value)} />
      </p>
      <p>
        <label>Player:</label><br />
        <input type="text" defaultValue={uPlayer} onKeyUp={(e) => setUPlayer(e.target.value)} />
      </p>
      <button onClick={() => {
        getMoveScores({
          player: uPlayer,
          state: uState.split(','),
        }).then((scores) => {
          setUScores(scores.map((s) => s.value));
        });
      }}>Get moves scores</button>
      <p>
        <label>Moves scores:</label>
      </p>
      <pre>{uScores.join(' | ')}</pre>
    </div>
  );
}

export default Squadro;
