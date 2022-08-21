import './index.css';
import { getMoveScores } from './utils';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
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
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
