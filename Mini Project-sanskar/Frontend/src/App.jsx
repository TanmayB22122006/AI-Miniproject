/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [mode, setMode] = useState('pvp'); // 'minimax', 'alpha-beta', or 'pvp'
  const [winner, setWinner] = useState(null);
  const [minimaxNodes, setMinimaxNodes] = useState(0);
  const [alphaBetaNodes, setAlphaBetaNodes] = useState(0);
  const [analysis, setAnalysis] = useState([]);
  const [isAiTurn, setIsAiTurn] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState('X');

  // Check winner function
  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  // Effect to analyze board after every move
  useEffect(() => {
    const fetchAnalysis = async () => {
      const winStatus = checkWinner(board);
      const isDraw = !board.includes(null);

      if (winStatus) {
        setWinner(`${winStatus === 'X' ? 'Player 1 (X)' : 'Player 2 (O)'} Wins`);
        setAnalysis([]);
        return;
      }

      if (isDraw) {
        setWinner('Draw');
        setAnalysis([]);
        return;
      }

      if (mode === 'pvp') {
        try {
          const res = await fetch('http://localhost:3001/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ board, player: currentPlayer, mode: 'alpha-beta' }),
          });
          const data = await res.json();
          setAnalysis(data.analysis || []);
          setMinimaxNodes(data.minimaxNodes || 0);
          setAlphaBetaNodes(data.alphaBetaNodes || 0);
        } catch (e) {
          console.error('Error fetching analysis:', e);
        }
      } else {
        // AI mode first move analysis
        if (board.every(cell => cell === null)) {
          try {
            const res = await fetch('http://localhost:3001/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ board, player: 'X', mode }),
            });
            const data = await res.json();
            setAnalysis(data.analysis || []);
            setMinimaxNodes(data.minimaxNodes || 0);
            setAlphaBetaNodes(data.alphaBetaNodes || 0);
          } catch (e) {
            console.error('Error fetching analysis:', e);
          }
        }
      }
    };

    fetchAnalysis();
  }, [board, mode, currentPlayer]);

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setMinimaxNodes(0);
    setAlphaBetaNodes(0);
    setAnalysis([]);
    setIsAiTurn(false);
    setCurrentPlayer('X');
  };

  // Handle cell click
  const handleCellClick = async (index) => {
    if (board[index] || winner || isAiTurn) return;

    if (mode === 'pvp') {
      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      return;
    }

    // AI mode (Player is X, AI is O)
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsAiTurn(true);

    try {
      const startTime = performance.now();
      const response = await fetch('http://localhost:3001/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: newBoard, mode

          
         }),
      });
      const data = await response.json();
      const endTime = performance.now();

      setBoard(data.updatedBoard);
      setWinner(data.winner);
      setMinimaxNodes(data.minimaxNodes || 0);
      setAlphaBetaNodes(data.alphaBetaNodes || 0);
      setAnalysis(data.analysis || []);
    } catch (error) {
      console.error('Error fetching move:', error);
    } finally {
      setIsAiTurn(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Tic-Tac-Toe AI</h1>
        <p className="subtitle">Play against an optimal AI agent</p>
      </header>

      <div className="game-controls">
        <div className="mode-selector">
          <button
            className={mode === 'pvp' ? 'active' : ''}
            onClick={() => { setMode('pvp'); resetGame(); }}
          >
            PvP
          </button>
          <button
            className={mode === 'minimax' ? 'active' : ''}
            onClick={() => { setMode('minimax'); resetGame(); }}
          >
            Minimax
          </button>
          <button
            className={mode === 'alpha-beta' ? 'active' : ''}
            onClick={() => { setMode('alpha-beta'); resetGame(); }}
          >
            Alpha-Beta
          </button>
        </div>
        <button className="restart-btn" onClick={resetGame}>Restart Game</button>
      </div>

      <div className="stats">
        {(mode === 'pvp' || mode === 'minimax') && (
          <div className="stat-card">
            <span className="stat-label">Minimax Nodes:</span>
            <span className="stat-value">{minimaxNodes}</span>
          </div>
        )}
        {(mode === 'pvp' || mode === 'alpha-beta') && (
          <div className="stat-card">
            <span className="stat-label">Alpha-Beta Nodes:</span>
            <span className="stat-value">{alphaBetaNodes}</span>
          </div>
        )}
        <div className="stat-card">
          <span className="stat-label">Mode:</span>
          <span className="stat-value">
            {mode === 'pvp' ? 'PvP' : mode === 'minimax' ? 'Minimax' : 'Alpha-Beta'}
          </span>
        </div>
      </div>

      <div className="main-content">
        <div className="game-section">
          <div className={`status ${winner ? 'game-over' : ''}`}>
            {winner ? (
              <h2>{winner}!</h2>
            ) : (
              <h3>
                {mode === 'pvp'
                  ? `Player ${currentPlayer}'s Turn`
                  : isAiTurn
                  ? "AI is thinking..."
                  : "Your Turn (X)"}
              </h3>
            )}
          </div>

          <div className="board">
            {board.map((cell, index) => (
              <div
                key={index}
                className={`cell ${cell ? cell.toLowerCase() : ''} ${winner ? 'disabled' : ''}`}
                onClick={() => handleCellClick(index)}
              >
                {cell}
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-section">
          <div className="panel-header">
            <h3>🧠 AI Analysis</h3>
          </div>
          {analysis.length > 0 ? (
            <div className="analysis-grid">
              {analysis.map((move, idx) => (
                <div key={idx} className={`analysis-card ${move.isBest ? 'best' : ''}`}>
                  <div className="card-header">
                    <span className="cell-name">{move.cellLabel}</span>
                    {move.isBest && <span className="best-tag">BEST MOVE</span>}
                  </div>
                  <div className="card-body">
                    <div className="score-row">
                      <span className="label">Score:</span>
                      <span
                        className={`value ${
                          move.score > 0
                            ? 'text-win'
                            : move.score < 0
                            ? 'text-loss'
                            : 'text-draw'
                        }`}
                      >
                        {move.score > 0 ? `+${move.score}` : move.score}
                      </span>
                    </div>
                    <div className="verdict">{move.verdict}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-analysis">
              <p>Make a move to see the AI's step-by-step evaluation process.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="explanation">
        <div className="algo-info">
          <h3>Standard Minimax</h3>
          <p>Explores all possible moves in the game tree to find the optimal result.</p>
        </div>
        <div className="separator"></div>
        <div className="algo-info">
          <h3>Alpha-Beta Pruning</h3>
          <p>
            An optimization for Minimax that "prunes" branches that cannot influence the final
            decision, significantly reducing nodes explored.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;