const pieceSpeedMap = [1, 3, 2, 3, 1, 3, 1, 2, 1, 3];

const move = ({
  ahead = 0,
  piece,
  player = 1,
  queue = [],
  resolve,
  score = 0,
  state,
}) => {
  let speed = pieceSpeedMap[piece];
  if (state[piece] > 5 && speed !== 2) {
    speed = speed === 1 ? 3 : 1;
  }
  Array(speed).fill(true).forEach(() => {
    // TODO: check each space ahead for opponent pieces
  });
};

const getMoveScores = ({ player, state }) => {
  const si = player === 1 ? 0 : 5;
  Promise.all(Array(5).fill(true).map((_, i) => new Promise((resolve) => {
    move({ piece: si + i, resolve, state });
  }))).then((values) => {
    console.log(values);
  });
};

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
