import React, { useState, useEffect } from 'react';

// --- AI LOGIC ---
const getManhattanDistance = (board) => {
  let distance = 0;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== 0) {
      const targetRow = Math.floor((board[i] - 1) / 3);
      const targetCol = (board[i] - 1) % 3;
      const currentRow = Math.floor(i / 3);
      const currentCol = i % 3;
      distance += Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
    }
  }
  return distance;
};

const getNeighbors = (board) => {
  const neighbors = [];
  const emptyIdx = board.indexOf(0);
  const row = Math.floor(emptyIdx / 3);
  const col = emptyIdx % 3;
  const moves = [{ r: row - 1, c: col }, { r: row + 1, c: col }, { r: row, c: col - 1 }, { r: row, c: col + 1 }];
  for (let move of moves) {
    if (move.r >= 0 && move.r < 3 && move.c >= 0 && move.c < 3) {
      const newIdx = move.r * 3 + move.c;
      const newBoard = [...board];
      [newBoard[emptyIdx], newBoard[newIdx]] = [newBoard[newIdx], newBoard[emptyIdx]];
      neighbors.push(newBoard);
    }
  }
  return neighbors;
};

function App() {
  const [board, setBoard] = useState([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  const [initialBoard, setInitialBoard] = useState([1, 2, 3, 4, 5, 6, 7, 8, 0]); // To track where user started
  const [moves, setMoves] = useState(0);
  
  // Stats & Complexity
  const [aStarStats, setAStarStats] = useState({ nodes: 0, steps: 0, time: 0 });
  const [greedyStats, setGreedyStats] = useState({ nodes: 0, steps: 0, time: 0 });
  const [bfsStats, setBfsStats] = useState({ nodes: 0, steps: 0, time: 0 });
  const [solutionPath, setSolutionPath] = useState([]); // For Visualizer
  
  const [initialHeuristic, setInitialHeuristic] = useState(0); 
  const [solvedBy, setSolvedBy] = useState(null); // 'human' or 'ai'
  
  // UI States
  const [isSolving, setIsSolving] = useState(false);
  const [hintTile, setHintTile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisTab, setAnalysisTab] = useState(2); // Default to tab 2 (Difficulty)

  const isSolved = (b) => b.join(',') === '1,2,3,4,5,6,7,8,0';

  // --- MANUAL PLAY ---
  const handleTileClick = (index) => {
    if (isSolving || isSolved(board)) return;
    const emptyIndex = board.indexOf(0);
    const canMove = (idx, emptyIdx) => {
        if (idx === emptyIdx - 1 && emptyIdx % 3 !== 0) return true;
        if (idx === emptyIdx + 1 && idx % 3 !== 0) return true;
        if (idx === emptyIdx - 3) return true;
        if (idx === emptyIdx + 3) return true;
        return false;
    };
    
    if (canMove(index, emptyIndex)) {
      const newBoard = [...board];
      [newBoard[index], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[index]];
      setBoard(newBoard);
      setMoves(moves + 1);
      setHintTile(null);

      // Check if Human solved it
      if (isSolved(newBoard)) {
          setSolvedBy('human');
          runBackgroundOptimalCheck(initialBoard); // Run AI silently to compare
      }
    }
  };

  // Run A* silently to get optimal path for Human vs Machine comparison
  const runBackgroundOptimalCheck = (startState) => {
    const openSetAStar = [{ board: startState, path: [startState], g: 0, h: getManhattanDistance(startState), f: getManhattanDistance(startState) }];
    const visitedAStar = new Set([startState.join(',')]);
    let exploredAStar = 0;
    let optimalPath = [];

    while (openSetAStar.length > 0) {
      openSetAStar.sort((a, b) => a.f - b.f);
      const current = openSetAStar.shift();
      exploredAStar++;
      if (isSolved(current.board)) { optimalPath = current.path; break; }
      for (let n of getNeighbors(current.board)) {
        if (!visitedAStar.has(n.join(','))) {
          visitedAStar.add(n.join(','));
          const g = current.g + 1;
          const h = getManhattanDistance(n);
          openSetAStar.push({ board: n, path: [...current.path, n], g, h, f: g + h });
        }
      }
    }
    setAStarStats({ nodes: exploredAStar, steps: optimalPath.length - 1, time: 0 });
    setSolutionPath(optimalPath);
  };

  const shuffleBoard = () => {
    if (isSolving) return;
    let currentBoard = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    for (let i = 0; i < 50; i++) {
      const neighborsList = getNeighbors(currentBoard);
      currentBoard = neighborsList[Math.floor(Math.random() * neighborsList.length)];
    }
    setBoard(currentBoard);
    setInitialBoard(currentBoard); // Save initial state for analysis
    setMoves(0);
    setInitialHeuristic(getManhattanDistance(currentBoard));
    
    // Reset Everything
    setAStarStats({ nodes: 0, steps: 0, time: 0 });
    setGreedyStats({ nodes: 0, steps: 0, time: 0 });
    setBfsStats({ nodes: 0, steps: 0, time: 0 });
    setSolutionPath([]);
    setSolvedBy(null);
    setHintTile(null);
    setStatusMessage("");
    setShowAnalysis(false);
  };

  // --- BENCHMARKING (AI SOLVE) ---
  const handleSolve = () => {
    if (isSolved(board) || isSolving) return;
    setIsSolving(true);
    setHintTile(null);
    setInitialBoard(board); // Benchmark from current state
    setInitialHeuristic(getManhattanDistance(board));
    setStatusMessage("AI IS BENCHMARKING... 🧠");

    setTimeout(() => {
      // 1. BFS
      let t0 = performance.now();
      const queue = [{ board: board, path: [board] }];
      const visitedBFS = new Set([board.join(',')]);
      let exploredBFS = 0;
      let bfsLimitReached = false;
      let bfsPathLength = 0;

      while (queue.length > 0) {
        const current = queue.shift();
        exploredBFS++;
        if (exploredBFS > 15000) { bfsLimitReached = true; break; }
        if (isSolved(current.board)) { bfsPathLength = current.path.length - 1; break; }
        for (let n of getNeighbors(current.board)) {
          if (!visitedBFS.has(n.join(','))) {
            visitedBFS.add(n.join(','));
            queue.push({ board: n, path: [...current.path, n] });
          }
        }
      }
      let t1 = performance.now();
      setBfsStats({ nodes: bfsLimitReached ? "15000+" : exploredBFS, steps: bfsLimitReached ? "-" : bfsPathLength, time: (t1 - t0).toFixed(1) });

      // 2. Greedy
      t0 = performance.now();
      const openSetGBFS = [{ board: board, path: [board], h: getManhattanDistance(board) }];
      const visitedGBFS = new Set([board.join(',')]);
      let exploredGBFS = 0;
      let greedyPathLength = 0;

      while (openSetGBFS.length > 0) {
        openSetGBFS.sort((a, b) => a.h - b.h);
        const current = openSetGBFS.shift();
        exploredGBFS++;
        if (isSolved(current.board)) { greedyPathLength = current.path.length - 1; break; }
        for (let n of getNeighbors(current.board)) {
          if (!visitedGBFS.has(n.join(','))) {
            visitedGBFS.add(n.join(','));
            openSetGBFS.push({ board: n, path: [...current.path, n], h: getManhattanDistance(n) });
          }
        }
      }
      t1 = performance.now();
      setGreedyStats({ nodes: exploredGBFS, steps: greedyPathLength, time: (t1 - t0).toFixed(1) });

      // 3. A* Search
      t0 = performance.now();
      const openSetAStar = [{ board: board, path: [board], g: 0, h: getManhattanDistance(board), f: getManhattanDistance(board) }];
      const visitedAStar = new Set([board.join(',')]);
      let exploredAStar = 0;
      let solutionAStar = null;

      while (openSetAStar.length > 0) {
        openSetAStar.sort((a, b) => a.f - b.f);
        const current = openSetAStar.shift();
        exploredAStar++;
        if (isSolved(current.board)) { solutionAStar = current.path; break; }
        for (let n of getNeighbors(current.board)) {
          if (!visitedAStar.has(n.join(','))) {
            visitedAStar.add(n.join(','));
            const g = current.g + 1;
            const h = getManhattanDistance(n);
            openSetAStar.push({ board: n, path: [...current.path, n], g, h, f: g + h });
          }
        }
      }
      t1 = performance.now();
      setAStarStats({ nodes: exploredAStar, steps: solutionAStar ? solutionAStar.length - 1 : 0, time: (t1 - t0).toFixed(1) });
      setSolutionPath(solutionAStar);
      setSolvedBy('ai');

      // 4. Animate A*
      if (solutionAStar) {
        let step = 0;
        const interval = setInterval(() => {
          if (step < solutionAStar.length) {
            setBoard(solutionAStar[step]);
            if(step > 0) setMoves((prev) => prev + 1);
            step++;
          } else {
            clearInterval(interval);
            setIsSolving(false);
            setStatusMessage("Solved using Optimal A* Path!");
          }
        }, 500); 
      }
    }, 100);
  };

  const showHint = () => {
    if (isSolved(board) || isSolving) return;
    const openSet = [{ board, path: [], g: 0, h: getManhattanDistance(board), f: getManhattanDistance(board) }];
    const visited = new Set([board.join(',')]);
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      if (isSolved(current.board)) {
          if (current.path.length > 0) {
              const tileToMove = board[current.path[0].indexOf(0)];
              setHintTile(tileToMove);
              setTimeout(() => setHintTile(null), 1500);
          }
          break;
      }
      for (let n of getNeighbors(current.board)) {
        if (!visited.has(n.join(','))) {
          visited.add(n.join(','));
          openSet.push({ board: n, path: [...current.path, n], g: current.g + 1, h: getManhattanDistance(n), f: current.g + 1 + getManhattanDistance(n) });
        }
      }
    }
  };

  const getDifficulty = (score) => {
    if (score === 0) return { text: "Goal State", color: "text-emerald-400" };
    if (score <= 10) return { text: "Easy", color: "text-green-400" };
    if (score <= 16) return { text: "Medium", color: "text-yellow-400" };
    return { text: "Hard", color: "text-red-400" };
  };

  // --- ANALYSIS VIEW ---
  if (showAnalysis) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4 font-sans">
        <div className="w-full max-w-4xl flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight">AI Analytics Lab 🔬</h1>
            <button onClick={() => setShowAnalysis(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold transition-all cursor-pointer">
                ✕ Close Analysis
            </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-800 p-2 rounded-xl border border-gray-700">
            <button onClick={() => setAnalysisTab(1)} disabled={solvedBy !== 'human'} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${analysisTab === 1 ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'} ${solvedBy !== 'human' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                1. Human vs AI
            </button>
            <button onClick={() => setAnalysisTab(2)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${analysisTab === 2 ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                2. Difficulty Score
            </button>
            <button onClick={() => setAnalysisTab(3)} disabled={solvedBy === 'human'} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${analysisTab === 3 ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'} ${solvedBy === 'human' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                3. Complexity Metrics
            </button>
            <button onClick={() => setAnalysisTab(4)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${analysisTab === 4 ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                4. AI Path Visualizer
            </button>
        </div>

        {/* Tab Content */}
        <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl min-h-[400px]">
            
            {/* TAB 1: Human vs Machine */}
            {analysisTab === 1 && (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-200 mb-8 border-b border-gray-700 pb-2 w-full text-center">Optimality Comparison</h2>
                    <div className="flex gap-12 items-center justify-center w-full">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm tracking-widest uppercase mb-2">Your Moves</p>
                            <div className="w-32 h-32 rounded-full border-4 border-yellow-500 flex items-center justify-center text-5xl font-black text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                {moves}
                            </div>
                        </div>
                        <div className="text-4xl font-black text-gray-600">VS</div>
                        <div className="text-center">
                            <p className="text-gray-400 text-sm tracking-widest uppercase mb-2">A* Optimal Moves</p>
                            <div className="w-32 h-32 rounded-full border-4 border-emerald-500 flex items-center justify-center text-5xl font-black text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                {aStarStats.steps}
                            </div>
                        </div>
                    </div>
                    <p className="mt-10 text-gray-300 text-center max-w-lg">
                        {moves === aStarStats.steps 
                            ? "Incredible! You solved it perfectly, matching the AI's optimal path." 
                            : `You solved it, but the AI could have reached the goal taking ${moves - aStarStats.steps} fewer steps using the shortest path.`}
                    </p>
                </div>
            )}

            {/* TAB 2: Difficulty */}
            {analysisTab === 2 && (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-200 mb-8 border-b border-gray-700 pb-2 w-full text-center">Initial State Analysis</h2>
                    <div className="flex flex-col items-center">
                        <div className={`text-6xl font-black ${getDifficulty(initialHeuristic).color} mb-2 tracking-widest uppercase`}>
                            {getDifficulty(initialHeuristic).text}
                        </div>
                        <p className="text-gray-400 text-lg uppercase tracking-wider mb-8">Calculated Level</p>
                        
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 w-full max-w-md text-center">
                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Manhattan Distance</p>
                            <p className="text-5xl font-bold text-white mb-2">{initialHeuristic}</p>
                            <p className="text-gray-500 text-xs mt-4">This is the sum of the distances of all tiles from their goal positions at the start. Higher score = Harder puzzle.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: Complexity */}
            {analysisTab === 3 && (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-200 mb-8 border-b border-gray-700 pb-2 text-center">Space & Time Complexity</h2>
                    
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {/* Space (Nodes) */}
                        <div className="col-span-3">
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-4">Memory Used (Nodes Explored)</h3>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4">
                                    <span className="w-20 text-xs text-purple-400 font-bold">GBFS</span>
                                    <div className="h-6 bg-purple-600 rounded-r-md" style={{ width: `${Math.max(5, (greedyStats.nodes / Math.max(greedyStats.nodes, aStarStats.nodes)) * 100)}%` }}></div>
                                    <span className="text-xs text-white">{greedyStats.nodes}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="w-20 text-xs text-emerald-400 font-bold">A* Search</span>
                                    <div className="h-6 bg-emerald-600 rounded-r-md" style={{ width: `${Math.max(5, (aStarStats.nodes / Math.max(greedyStats.nodes, aStarStats.nodes)) * 100)}%` }}></div>
                                    <span className="text-xs text-white">{aStarStats.nodes}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="w-20 text-xs text-blue-400 font-bold">BFS</span>
                                    <div className="h-6 bg-blue-600 rounded-r-md" style={{ width: '100%' }}></div>
                                    <span className="text-xs text-red-400 font-bold">{bfsStats.nodes} (Exhausted)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-gray-700 pt-6">
                        <div className="text-center">
                            <p className="text-gray-500 text-[10px] uppercase">GBFS Time</p>
                            <p className="text-purple-300 font-mono text-xl">{greedyStats.time} ms</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-500 text-[10px] uppercase">A* Time</p>
                            <p className="text-emerald-300 font-mono text-xl">{aStarStats.time} ms</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-500 text-[10px] uppercase">BFS Time</p>
                            <p className="text-blue-300 font-mono text-xl">{bfsStats.time} ms</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: Visualizer */}
            {analysisTab === 4 && (
                <div className="animate-fade-in flex flex-col h-full">
                    <h2 className="text-2xl font-bold text-gray-200 mb-6 border-b border-gray-700 pb-2 text-center">Optimal AI Path Visualizer</h2>
                    <p className="text-gray-400 text-center text-sm mb-6">Scroll horizontally to see every step the AI took from Start to Goal.</p>
                    
                    {solutionPath.length > 0 ? (
                        <div className="flex overflow-x-auto gap-4 pb-6 pt-2 px-2 custom-scrollbar items-center">
                            {solutionPath.map((stepBoard, stepIdx) => (
                                <div key={stepIdx} className="flex flex-col items-center flex-shrink-0">
                                    <div className="text-xs text-gray-500 mb-2 font-mono">Step {stepIdx}</div>
                                    <div className={`grid grid-cols-3 gap-1 p-1 rounded-md border ${stepIdx === solutionPath.length - 1 ? 'border-emerald-500 bg-emerald-900/20' : 'border-gray-600 bg-gray-900'}`}>
                                        {stepBoard.map((tile, i) => (
                                            <div key={i} className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-sm ${tile === 0 ? 'bg-gray-800 text-transparent' : 'bg-indigo-600 text-white'}`}>
                                                {tile !== 0 ? tile : ''}
                                            </div>
                                        ))}
                                    </div>
                                    {stepIdx < solutionPath.length - 1 && (
                                        <div className="text-gray-600 text-lg mt-4">→</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Path data not available.</div>
                    )}
                </div>
            )}

        </div>
      </div>
    );
  }

  // --- MAIN UI ---
  const diff = getDifficulty(initialHeuristic);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4 font-sans relative">
      
      {/* Top Right Analysis Button (Visible only after solving) */}
      {isSolved(board) && (
        <div className="absolute top-6 right-6">
            <button 
                onClick={() => {
                    // Logic to set default tab
                    if (solvedBy === 'human') setAnalysisTab(1);
                    else setAnalysisTab(3);
                    setShowAnalysis(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all animate-pulse text-sm uppercase tracking-wide cursor-pointer"
            >
                📊 Open AI Analytics
            </button>
        </div>
      )}

      <div className="text-center mb-6 mt-4">
        <h1 className="text-5xl font-extrabold text-blue-400 mb-2">AI 8-Puzzle Solver</h1>
        <p className="text-gray-400 tracking-wide uppercase text-sm font-semibold">Algorithm Performance Benchmarking</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl mb-8 border border-gray-700 relative">
        
        {/* DIFFICULTY SCORE (TOP LEFT OF GRID) */}
        <div className="absolute -top-4 -left-4 bg-gray-900 border-2 border-gray-700 px-4 py-2 rounded-xl shadow-lg transform rotate-[-2deg]">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Difficulty</p>
            <p className={`text-lg font-black ${diff.color} leading-none`}>{diff.text} <span className="text-sm text-gray-500">({initialHeuristic})</span></p>
        </div>

        {isSolving && !isSolved(board) && (
          <div className="absolute inset-0 bg-gray-900/80 rounded-2xl flex items-center justify-center z-10 p-4 text-center">
             <span className="text-emerald-400 font-bold animate-pulse text-2xl tracking-widest uppercase">{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 w-72 h-72 bg-gray-900 p-2 rounded-xl border-2 border-gray-600 mt-4">
          {board.map((tile, index) => (
            <div key={index} onClick={() => handleTileClick(index)}
              className={`flex items-center justify-center text-4xl font-extrabold rounded-lg transition-all duration-300 cursor-pointer
                ${tile === 0 ? 'bg-gray-900' : 
                  tile === hintTile ? 'bg-yellow-500 scale-105 shadow-yellow-500/50' : 
                  isSolved(board) ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
              {tile !== 0 ? tile : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={shuffleBoard} disabled={isSolving} className="px-6 py-3 bg-gray-700 rounded-xl font-bold hover:bg-gray-600 disabled:opacity-50 transition-all cursor-pointer">Shuffle</button>
        <button onClick={showHint} disabled={isSolving || isSolved(board)} className="px-6 py-3 bg-yellow-600 rounded-xl font-bold hover:bg-yellow-500 disabled:opacity-50 transition-all cursor-pointer">💡 Hint</button>
        <button onClick={handleSolve} disabled={isSolving || isSolved(board)} className="px-8 py-3 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer">
            {isSolving ? 'Solving...' : 'Solve with AI'}
        </button>
      </div>

      {/* Main Dashboard Stats */}
      <div className="flex flex-col items-center w-full max-w-4xl font-mono px-4 gap-6">
        <div className="bg-gray-800 px-8 py-3 rounded-2xl border border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center gap-4 transition-all">
            <span className="text-gray-400 uppercase text-sm font-bold tracking-wider">Current Moves:</span>
            <span className="text-white text-3xl font-extrabold">{moves}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2">
            <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-800 text-center flex flex-col justify-center shadow-inner">
                <p className="text-purple-400 text-sm mb-3 uppercase tracking-widest font-bold border-b border-purple-800/50 pb-2">Greedy Search</p>
                <div className="flex justify-around items-center">
                    <div><p className="text-gray-400 text-[10px] tracking-wider">STEPS</p><p className="text-purple-300 text-2xl font-bold">{greedyStats.steps || '-'}</p></div>
                    <div className="w-px h-8 bg-purple-800/50"></div>
                    <div><p className="text-gray-400 text-[10px] tracking-wider">NODES</p><p className="text-purple-300 text-2xl font-bold">{greedyStats.nodes || '-'}</p></div>
                </div>
            </div>

            <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-800 text-center flex flex-col justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider shadow-md">OPTIMAL</div>
                <p className="text-emerald-400 text-sm mb-3 uppercase tracking-widest font-bold border-b border-emerald-800/50 pb-2">A* Search</p>
                <div className="flex justify-around items-center">
                    <div><p className="text-gray-400 text-[10px] tracking-wider">STEPS</p><p className="text-emerald-300 text-2xl font-bold">{aStarStats.steps || '-'}</p></div>
                    <div className="w-px h-8 bg-emerald-800/50"></div>
                    <div><p className="text-gray-400 text-[10px] tracking-wider">NODES</p><p className="text-emerald-300 text-2xl font-bold">{aStarStats.nodes || '-'}</p></div>
                </div>
            </div>
            
            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800 text-center flex flex-col justify-center shadow-inner">
                <p className="text-blue-400 text-sm mb-3 uppercase tracking-widest font-bold border-b border-blue-800/50 pb-2">BFS Search</p>
                <div className="flex justify-around items-center">
                    <div><p className="text-gray-400 text-[10px] tracking-wider">STEPS</p><p className="text-blue-300 text-2xl font-bold">{bfsStats.steps || '-'}</p></div>
                    <div className="w-px h-8 bg-blue-800/50"></div>
                    <div><p className="text-gray-400 text-[10px] tracking-wider">NODES</p><p className="text-blue-300 text-2xl font-bold">{bfsStats.nodes || '-'}</p></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;