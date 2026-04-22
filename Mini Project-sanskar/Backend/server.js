const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Winning combinations for a 3x3 Tic-Tac-Toe board
const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Helper: Check if a specific player has won
function checkWinner(board, player) {
  for (let i = 0; i < winningCombinations.length; i++) {
    const [a, b, c] = winningCombinations[i];
    if (board[a] === player && board[b] === player && board[c] === player) {
      return true;
    }
  }
  return false;
}

// Helper: Get available moves (indices of empty cells)
function getEmptyIndices(board) {
  const empty = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      empty.push(i);
    }
  }
  return empty;
}

let nodesExplored = 0;

// ============================================================
// ALGORITHM 1: STANDARD MINIMAX
// ============================================================
function minimax(board, player, depth) {
  nodesExplored++;
  const availSpots = getEmptyIndices(board);

  // Terminal states: AI (+10), Player (-10), or Draw (0)
  if (checkWinner(board, 'X')) return { score: -10 + depth };
  if (checkWinner(board, 'O')) return { score: 10 - depth };
  if (availSpots.length === 0) return { score: 0 };

  const moves = [];

  for (let i = 0; i < availSpots.length; i++) {
    const move = {};
    move.index = availSpots[i];
    board[availSpots[i]] = player;

    if (player === 'O') {
      const result = minimax(board, 'X', depth + 1);
      move.score = result.score;
    } else {
      const result = minimax(board, 'O', depth + 1);
      move.score = result.score;
    }

    board[availSpots[i]] = null;
    moves.push(move);
  }

  let bestMove;
  if (player === 'O') {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

// ============================================================
// ALGORITHM 2: MINIMAX WITH ALPHA-BETA PRUNING
// ============================================================
function alphaBeta(board, player, depth, alpha, beta) {
  nodesExplored++;
  const availSpots = getEmptyIndices(board);

  if (checkWinner(board, 'X')) return { score: -10 + depth };
  if (checkWinner(board, 'O')) return { score: 10 - depth };
  if (availSpots.length === 0) return { score: 0 };

  if (player === 'O') {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < availSpots.length; i++) {
      board[availSpots[i]] = 'O';
      let result = alphaBeta(board, 'X', depth + 1, alpha, beta);
      board[availSpots[i]] = null;

      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = availSpots[i];
      }

      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Beta cut-off
    }
    return { score: bestScore, index: bestMove };
  } else {
    let bestScore = Infinity;
    let bestMove = -1;

    for (let i = 0; i < availSpots.length; i++) {
      board[availSpots[i]] = 'X';
      let result = alphaBeta(board, 'O', depth + 1, alpha, beta);
      board[availSpots[i]] = null;

      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = availSpots[i];
      }

      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return { score: bestScore, index: bestMove };
  }
}

// Helper: Convert cell index (0-8) to a human-readable label
function cellLabel(index) {
  const labels = [
    'Top-Left', 'Top-Center', 'Top-Right',
    'Mid-Left', 'Center', 'Mid-Right',
    'Bottom-Left', 'Bottom-Center', 'Bottom-Right'
  ];
  return labels[index];
}

// ============================================================
// API ENDPOINT: POST /move
// ============================================================
app.post('/move', (req, res) => {
  const { board, mode } = req.body;
  nodesExplored = 0;

  if (!board || board.length !== 9) {
    return res.status(400).json({ error: "Invalid board" });
  }

  const availSpots = getEmptyIndices(board);
  const analysis = [];
  let minimaxNodesTotal = 0;
  let alphaBetaNodesTotal = 0;

  // Evaluate every possible next move for the AI
  for (let i = 0; i < availSpots.length; i++) {
    const cellIndex = availSpots[i];
    const tempBoard = [...board];

    tempBoard[cellIndex] = 'O';

    nodesExplored = 0;
    minimax(tempBoard, 'X', 1);
    minimaxNodesTotal += nodesExplored;

    nodesExplored = 0;
    let result = alphaBeta(tempBoard, 'X', 1, -Infinity, Infinity);
    alphaBetaNodesTotal += nodesExplored;

    let verdict;
    if (result.score > 0) verdict = 'AI can WIN';
    else if (result.score < 0) verdict = 'AI would LOSE';
    else verdict = 'Leads to DRAW';

    analysis.push({
      cellIndex: cellIndex,
      cellLabel: cellLabel(cellIndex),
      score: result.score,
      verdict: verdict
    });
  }

  // Find the best move from the analysis
  let bestMove = null;
  let highestScore = -Infinity;

  for (const move of analysis) {
    if (move.score > highestScore) {
      highestScore = move.score;
      bestMove = move;
    }
  }

  if (bestMove) {
    analysis.forEach(m => {
      if (m.cellIndex === bestMove.cellIndex) m.isBest = true;
    });
  }

  // Update board with AI's best move
  const updatedBoard = [...board];
  if (bestMove) updatedBoard[bestMove.cellIndex] = 'O';

  // Check for winner after AI move
  let winner = null;
  if (checkWinner(updatedBoard, 'X')) winner = 'Player Wins';
  else if (checkWinner(updatedBoard, 'O')) winner = 'AI Wins';
  else if (getEmptyIndices(updatedBoard).length === 0) winner = 'Draw';

  res.json({
    updatedBoard,
    winner,
    minimaxNodes: minimaxNodesTotal,
    alphaBetaNodes: alphaBetaNodesTotal,
    analysis
  });
});

// ============================================================
// API ENDPOINT: POST /analyze
// ============================================================
app.post('/analyze', (req, res) => {
  const { board, player, mode } = req.body;
  nodesExplored = 0;

  if (!board || board.length !== 9 || !player) {
    return res.status(400).json({ error: "Invalid request" });
  }

  if (checkWinner(board, 'X') || checkWinner(board, 'O') || getEmptyIndices(board).length === 0) {
    return res.json({ analysis: [], nodesExplored: 0 });
  }

  const availSpots = getEmptyIndices(board);
  const analysis = [];
  const nextPlayer = player === 'O' ? 'X' : 'O';
  let minimaxNodesTotal = 0;
  let alphaBetaNodesTotal = 0;

  for (let i = 0; i < availSpots.length; i++) {
    const cellIndex = availSpots[i];
    const tempBoard = [...board];
    tempBoard[cellIndex] = player;

    nodesExplored = 0;
    minimax(tempBoard, nextPlayer, 1);
    minimaxNodesTotal += nodesExplored;

    nodesExplored = 0;
    let result = alphaBeta(tempBoard, nextPlayer, 1, -Infinity, Infinity);
    alphaBetaNodesTotal += nodesExplored;

    const rawScore = result.score;
    const normalizedScore = player === 'O' ? rawScore : -rawScore;

    let verdict;
    if (normalizedScore > 0) verdict = `${player} can WIN`;
    else if (normalizedScore < 0) verdict = `${player} would LOSE`;
    else verdict = 'Leads to DRAW';

    analysis.push({
      cellIndex: cellIndex,
      cellLabel: cellLabel(cellIndex),
      score: normalizedScore,
      verdict: verdict
    });
  }

  // Mark the best move
  let bestMove = null;
  let highestScore = -Infinity;
  for (const move of analysis) {
    if (move.score > highestScore) {
      highestScore = move.score;
      bestMove = move;
    }
  }

  if (bestMove) {
    analysis.forEach(m => {
      if (m.cellIndex === bestMove.cellIndex) m.isBest = true;
    });
  }

  res.json({
    analysis,
    minimaxNodes: minimaxNodesTotal,
    alphaBetaNodes: alphaBetaNodesTotal
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

/*
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/MarvelDevloper/FinalAIProject.git
git push -u origin main
*/