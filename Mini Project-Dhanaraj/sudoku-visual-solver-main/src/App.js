import React, { useState, useRef } from 'react';
import './App.css';

const GRID_SIZE = 9;

export default function App() {
  const getEmptyBoard = () => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
  
  const [board, setBoard] = useState(getEmptyBoard());
  const [isSolving, setIsSolving] = useState(false);
  const [message, setMessage] = useState('Enter numbers and click "Solve Sudoku"!');
  
  // 🔥 NEW STATES ADDED FOR VIVA 🔥
  const [nodesExplored, setNodesExplored] = useState(0);
  const [activeCell, setActiveCell] = useState({ r: -1, c: -1 });
  const [speed, setSpeed] = useState(10); // Speed Controller
  
  // stopRef use kiya hai taaki execution ke beech mein reset kar sakein
  const stopSolvingRef = useRef(false);
  const nodesRef = useRef(0); // To keep accurate count during fast recursive loops

  const handleChange = (r, c, value) => {
    if (isSolving) return;
    if (/^[1-9]?$/.test(value)) {
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = value;
      setBoard(newBoard);
      setMessage('Enter numbers and click "Solve Sudoku"!');
    }
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Validation function for solving logic
  const isValid = (b, r, c, num) => {
    for (let i = 0; i < GRID_SIZE; i++) {
      if (b[r][i] === num && i !== c) return false;
      if (b[i][c] === num && i !== r) return false;
    }
    const startRow = Math.floor(r / 3) * 3;
    const startCol = Math.floor(c / 3) * 3;
    for (let i = startRow; i < startRow + 3; i++) {
      for (let j = startCol; j < startCol + 3; j++) {
        if (b[i][j] === num && (i !== r || j !== c)) return false;
      }
    }
    return true;
  };

  // Check if the user's initial input has duplicates
  const isInitialBoardValid = (b) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] !== '') {
          const val = b[r][c];
          if (!isValid(b, r, c, val)) return false;
        }
      }
    }
    return true;
  };

  // 🔥 4. LOAD SAMPLE PUZZLES (VIVA SAVER) 🔥
  const loadSample = (difficulty) => {
    if (isSolving) return;
    stopSolvingRef.current = true;
    let sample = [];
    if (difficulty === 'easy') {
      sample = [
        ['5','3','','','7','','','',''],
        ['6','','','1','9','5','','',''],
        ['','9','8','','','','','6',''],
        ['8','','','','6','','','','3'],
        ['4','','','8','','3','','','1'],
        ['7','','','','2','','','','6'],
        ['','6','','','','','2','8',''],
        ['','','','4','1','9','','','5'],
        ['','','','','8','','','7','9']
      ];
    } else {
      sample = [
        ['','','','','','','','1','2'],
        ['','','','','3','5','','',''],
        ['','','','6','','','','7',''],
        ['7','','','','','','3','',''],
        ['','','','4','','8','','',''],
        ['1','','','','','','','',''],
        ['','1','2','','','','','',''],
        ['','8','','','','','','4',''],
        ['','5','','','','','6','','']
      ];
    }
    setBoard(sample);
    setNodesExplored(0);
    nodesRef.current = 0;
    setActiveCell({ r: -1, c: -1 });
    setMessage(`${difficulty.toUpperCase()} Puzzle Loaded!`);
  };

  const solve = async (b) => {
    if (stopSolvingRef.current) return false;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === '') {
            
          // 🔥 2. ACTIVE CELL HIGHLIGHT 🔥
          setActiveCell({ r, c });

          for (let n = 1; n <= 9; n++) {
            if (stopSolvingRef.current) return false;

            // 🔥 1. NODES EXPLORED TRACKER 🔥
            nodesRef.current += 1;
            if (nodesRef.current % 5 === 0) setNodesExplored(nodesRef.current); // Update UI every 5 steps to avoid lag

            const numStr = n.toString();
            if (isValid(b, r, c, numStr)) {
              b[r][c] = numStr;
              setBoard([...b.map(row => [...row])]); 
              await sleep(speed); // 🔥 3. SPEED CONTROLLER 🔥

              if (await solve(b)) return true;

              // Backtracking...
              b[r][c] = '';
              setBoard([...b.map(row => [...row])]);
              setActiveCell({ r, c }); // Re-highlight when going back
              await sleep(speed);
            }
          }
          return false; 
        }
      }
    }
    return true; 
  };

  const startSolving = async () => {
    stopSolvingRef.current = false;
    nodesRef.current = 0;
    setNodesExplored(0);
    
    if (!isInitialBoardValid(board)) {
      setMessage('Error: Duplicate numbers detected in row, column, or block! ❌');
      return;
    }

    setIsSolving(true);
    setMessage('AI is solving using Backtracking DFS... 🧠');
    
    let currentBoard = JSON.parse(JSON.stringify(board));
    const success = await solve(currentBoard);
    
    if (!stopSolvingRef.current) {
      if (success) {
        setNodesExplored(nodesRef.current); // Final count
        setActiveCell({ r: -1, c: -1 }); // Remove highlight
        setMessage('Sudoku solved successfully! 🎉');
      } else {
        setMessage('No solution exists for this input! ❌');
      }
      setIsSolving(false);
    }
  };

  const resetBoard = () => {
    stopSolvingRef.current = true;
    setIsSolving(false);
    setBoard(getEmptyBoard());
    setNodesExplored(0);
    nodesRef.current = 0;
    setActiveCell({ r: -1, c: -1 });
    setMessage('Board reset. Enter new numbers!');
  };

  return (
    <div style={styles.container}>
      <h2>🔢 Sudoku Visual Solver 🧩</h2>
      <p style={{...styles.message, color: message.includes('Error') ? 'red' : '#555'}}>
        {message}
      </p>

      {/* 🔥 VIVA: Sample Loaders 🔥 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={() => loadSample('easy')} disabled={isSolving} style={styles.btnSample}>Load Easy</button>
        <button onClick={() => loadSample('hard')} disabled={isSolving} style={styles.btnSample}>Load Hard</button>
      </div>

      {/* 🔥 VIVA: Analytics & Speed Controller 🔥 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', alignItems: 'center', backgroundColor: '#f0f4f8', padding: '10px 20px', borderRadius: '10px', border: '1px solid #ccc' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
          Nodes Explored (Search Space): <span style={{ color: '#d946ef' }}>{nodesExplored}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Animation Delay (Speed):</label>
          <input 
            type="range" min="0" max="100" step="5" 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))} 
            disabled={isSolving} 
          />
          <span style={{fontSize: '12px'}}>{speed} ms</span>
        </div>
      </div>

      <div style={styles.board}>
        {board.map((row, r) => (
          <div key={r} style={styles.row}>
            {row.map((cell, c) => {
              const borderBottomStyle = (r + 1) % 3 === 0 && r !== 8 ? '3px solid #333' : '1px solid #ccc';
              const borderRightStyle = (c + 1) % 3 === 0 && c !== 8 ? '3px solid #333' : '1px solid #ccc';
              
              // 🔥 HIGHLIGHT LOGIC 🔥
              let bgStyle = cell !== '' ? '#e8f4f8' : '#fff';
              if (activeCell.r === r && activeCell.c === c) {
                  bgStyle = '#ffe082'; // Yellow highlight for AI "Thinking"
              }

              return (
                <input
                  key={c}
                  type="text"
                  value={cell}
                  onChange={(e) => handleChange(r, c, e.target.value)}
                  disabled={isSolving}
                  style={{
                    ...styles.cell,
                    borderBottom: borderBottomStyle,
                    borderRight: borderRightStyle,
                    backgroundColor: bgStyle,
                    transition: 'background-color 0.1s ease-in-out' // Smooth color transition
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div style={styles.controls}>
        <button onClick={startSolving} disabled={isSolving} style={styles.btnSolve}>
          {isSolving ? 'Solving...' : 'Solve Sudoku'}
        </button>
        <button onClick={resetBoard} style={styles.btnReset}>
          Reset Board
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif', marginTop: '20px', paddingBottom: '40px' },
  message: { fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center', maxWidth: '500px' },
  board: { border: '3px solid #333', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  row: { display: 'flex' },
  cell: {
    width: '45px', height: '45px', fontSize: '22px', textAlign: 'center',
    outline: 'none', cursor: 'pointer', margin: 0, padding: 0
  },
  controls: { marginTop: '25px', display: 'flex', gap: '15px' },
  btnSolve: { padding: '12px 24px', fontSize: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(16,185,129,0.3)' },
  btnReset: { padding: '12px 24px', fontSize: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(239,68,68,0.3)' },
  btnSample: { padding: '8px 16px', fontSize: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};