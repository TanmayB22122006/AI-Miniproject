import React, { useState, useEffect } from "react";
import "./KruskalVisualizer.css";

const KruskalVisualizer = () => {
  const [nodes, setNodes] = useState([]);
  const [initialEdges, setInitialEdges] = useState([]);

  const [mstEdges, setMstEdges] = useState([]);
  const [rejectedEdges, setRejectedEdges] = useState([]);
  const [currentEdge, setCurrentEdge] = useState(null);
  const [status, setStatus] = useState("Ready! Click 'Start Simulation'.");
  const [sortedEdges, setSortedEdges] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Naya State: Modal show/hide karne ke liye
  const [showFormula, setShowFormula] = useState(false);

  const generateRandomGraph = () => {
    const numNodes = Math.floor(Math.random() * 3) + 5;
    const newNodes = [];
    const labels = ["A", "B", "C", "D", "E", "F", "G"];

    for (let i = 0; i < numNodes; i++) {
      const angle = (i * 2 * Math.PI) / numNodes;
      const radiusX = 180 + Math.random() * 50;
      const radiusY = 120 + Math.random() * 40;
      newNodes.push({
        id: labels[i],
        x: Math.floor(350 + radiusX * Math.cos(angle)),
        y: Math.floor(225 + radiusY * Math.sin(angle)),
      });
    }

    const newEdges = [];
    const edgeSet = new Set();

    const addEdge = (u, v) => {
      const edgeKey = [u, v].sort().join("-");
      if (!edgeSet.has(edgeKey) && u !== v) {
        edgeSet.add(edgeKey);
        newEdges.push({ u, v, w: Math.floor(Math.random() * 20) + 1 });
      }
    };

    for (let i = 0; i < numNodes - 1; i++) {
      addEdge(labels[i], labels[i + 1]);
    }
    if (Math.random() > 0.3) addEdge(labels[0], labels[numNodes - 1]);

    const extraEdgesCount = numNodes;
    for (let i = 0; i < extraEdgesCount; i++) {
      const u = labels[Math.floor(Math.random() * numNodes)];
      const v = labels[Math.floor(Math.random() * numNodes)];
      addEdge(u, v);
    }

    setNodes(newNodes);
    setInitialEdges(newEdges);
    handleReset();
  };

  useEffect(() => {
    generateRandomGraph();
  }, []);

  let parent = {};
  const find = (i) => (parent[i] === i ? i : find(parent[i]));
  const union = (i, j) => {
    let rootI = find(i);
    let rootJ = find(j);
    parent[rootI] = rootJ;
  };

  const handleReset = () => {
    setMstEdges([]);
    setRejectedEdges([]);
    setCurrentEdge(null);
    setSortedEdges([]);
    setIsFinished(false);
    setStatus("Ready! Click 'Start Simulation'.");
  };

  const runKruskal = async () => {
    setIsRunning(true);
    setIsFinished(false);
    setMstEdges([]);
    setRejectedEdges([]);
    setCurrentEdge(null);

    setStatus("Step 1: Sorting edges by weight...");
    const sorted = [...initialEdges].sort((a, b) => a.w - b.w);
    setSortedEdges(sorted);
    await new Promise((r) => setTimeout(r, 1200));

    nodes.forEach((n) => (parent[n.id] = n.id));

    for (let edge of sorted) {
      setCurrentEdge(edge);
      setStatus(`Checking Edge (${edge.u}-${edge.v}) | Weight: ${edge.w}`);
      await new Promise((r) => setTimeout(r, 1200));

      let rootU = find(edge.u);
      let rootV = find(edge.v);

      if (rootU !== rootV) {
        union(rootU, rootV);
        setMstEdges((prev) => [...prev, edge]);
        setStatus(`✅ Accepted! (${edge.u}-${edge.v}) Connected.`);
      } else {
        setRejectedEdges((prev) => [...prev, edge]);
        setStatus(`✂️ Rejected! (${edge.u}-${edge.v}) forms a cycle.`);
      }
      await new Promise((r) => setTimeout(r, 1200));
    }

    setStatus("🎉 Complete! Final MST is ready.");
    setCurrentEdge(null);
    setIsRunning(false);
    setIsFinished(true);
  };

  return (
    <div className="vlab-container">
      <div className="vlab-header">
        <div className="vlab-logo">Virtual Labs</div>
        <h2 className="vlab-title">Kruskal's Algorithm Simulation</h2>
        <div className="vlab-header-buttons">
          <button className="top-btn">Rate Me</button>
        </div>
      </div>
      <div className="orange-bar"></div>

      <div className="top-controls-bar">
        <div className="action-buttons-inline">
          <button
            onClick={generateRandomGraph}
            disabled={isRunning}
            className="btn-action btn-random"
          >
            🔀 New Random Graph
          </button>
          <button
            onClick={runKruskal}
            disabled={isRunning}
            className="btn-action"
          >
            ▶ Start
          </button>
          <button
            onClick={handleReset}
            disabled={isRunning}
            className="btn-action btn-reset"
          >
            ⟳ Reset
          </button>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-frame graph-frame">
          <h3 className="frame-title">Live Process Graph</h3>
          <div className="svg-wrapper">
            <svg viewBox="0 0 700 450" className="responsive-svg">
              {initialEdges.map((edge, i) => {
                const uNode = nodes.find((n) => n.id === edge.u);
                const vNode = nodes.find((n) => n.id === edge.v);
                if (!uNode || !vNode) return null;

                const isMst = mstEdges.includes(edge);
                const isRejected = rejectedEdges.includes(edge);
                const isCurrent = currentEdge === edge;

                let strokeColor = "#bdc3c7";
                let strokeWidth = 3;
                let dash = "0";

                if (isCurrent) {
                  strokeColor = "#f39c12";
                  strokeWidth = 8;
                } else if (isMst) {
                  strokeColor = "#27ae60";
                  strokeWidth = 6;
                } else if (isRejected) {
                  strokeColor = "#e74c3c";
                  strokeWidth = 2;
                  dash = "6,6";
                }

                return (
                  <g key={i}>
                    <line
                      x1={uNode.x}
                      y1={uNode.y}
                      x2={vNode.x}
                      y2={vNode.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dash}
                    />
                    <circle
                      cx={(uNode.x + vNode.x) / 2}
                      cy={(uNode.y + vNode.y) / 2}
                      r="16"
                      fill="#fff"
                      stroke={strokeColor}
                      strokeWidth="2"
                    />
                    <text
                      x={(uNode.x + vNode.x) / 2}
                      y={(uNode.y + vNode.y) / 2 + 5}
                      textAnchor="middle"
                      style={{
                        fontSize: "15px",
                        fontWeight: "bold",
                        fill: "#333",
                      }}
                    >
                      {edge.w}
                    </text>
                  </g>
                );
              })}

              {nodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="25"
                    fill="#2980b9"
                    stroke="#1f618d"
                    strokeWidth="3"
                  />
                  <text
                    x={node.x}
                    y={node.y + 6}
                    textAnchor="middle"
                    fill="white"
                    style={{ fontWeight: "bold", fontSize: "18px" }}
                  >
                    {node.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="dashboard-frame process-frame">
          <h3 className="frame-title">Algorithm Process</h3>

          <div className="status-box">
            <p className="obs-status">{status}</p>
          </div>

          <div className="queue-box">
            <h4>Sorted Edges Queue</h4>
            {sortedEdges.length === 0 && (
              <p className="empty-text">List will appear here...</p>
            )}
            <div className="edge-list">
              {sortedEdges.map((edge, i) => {
                const isCurrent = currentEdge === edge;
                const isAccepted = mstEdges.includes(edge);
                const isRejected = rejectedEdges.includes(edge);

                let boxClass = "edge-item";
                if (isCurrent) boxClass += " checking";
                if (isAccepted) boxClass += " accepted";
                if (isRejected) boxClass += " rejected";

                return (
                  <div key={i} className={boxClass}>
                    {edge.u}-{edge.v}{" "}
                    <span className="weight-badge">{edge.w}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="weight-counter">
            <strong>Current MST Weight:</strong> <br />
            <span className="big-weight">
              {mstEdges.reduce((t, e) => t + e.w, 0)}
            </span>
            {/* NAYA BUTTON */}
            <button
              onClick={() => setShowFormula(true)}
              className="btn-formula"
            >
              📜 View Written Steps & Formula
            </button>
          </div>
        </div>

        <div className="dashboard-frame graph-frame success-frame">
          <h3 className="frame-title success-title">Final MST</h3>
          <div className="svg-wrapper">
            <svg viewBox="0 0 700 450" className="responsive-svg">
              {mstEdges.map((edge, i) => {
                const uNode = nodes.find((n) => n.id === edge.u);
                const vNode = nodes.find((n) => n.id === edge.v);
                return (
                  <g key={i}>
                    <line
                      x1={uNode.x}
                      y1={uNode.y}
                      x2={vNode.x}
                      y2={vNode.y}
                      stroke="#27ae60"
                      strokeWidth="6"
                    />
                    <circle
                      cx={(uNode.x + vNode.x) / 2}
                      cy={(uNode.y + vNode.y) / 2}
                      r="16"
                      fill="#fff"
                      stroke="#27ae60"
                      strokeWidth="2"
                    />
                    <text
                      x={(uNode.x + vNode.x) / 2}
                      y={(uNode.y + vNode.y) / 2 + 5}
                      textAnchor="middle"
                      style={{ fontSize: "15px", fontWeight: "bold" }}
                    >
                      {edge.w}
                    </text>
                  </g>
                );
              })}
              {nodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="25"
                    fill={mstEdges.length > 0 ? "#27ae60" : "#bdc3c7"}
                    stroke={mstEdges.length > 0 ? "#1e8449" : "#95a5a6"}
                    strokeWidth="3"
                  />
                  <text
                    x={node.x}
                    y={node.y + 6}
                    textAnchor="middle"
                    fill="white"
                    style={{ fontWeight: "bold", fontSize: "18px" }}
                  >
                    {node.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* POPUP MODAL FOR FORMULA & WRITTEN LOGIC */}
      {showFormula && (
        <div className="modal-overlay" onClick={() => setShowFormula(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowFormula(false)}>
              ×
            </button>
            <h3 className="modal-title">Kruskal's Algorithm - Written Logic</h3>

            <div className="math-steps">
              <p>
                <strong>Step 1:</strong> Sort all edges by weight in ascending
                order.
              </p>
              <p>
                <strong>Step 2:</strong> Pick the edge with the smallest weight.
              </p>
              <p>
                <strong>Step 3:</strong> Check if adding this edge forms a cycle
                using <em>Disjoint Set (Union-Find)</em>.
              </p>
              <ul>
                <li>
                  If <strong>Find(u) ≠ Find(v)</strong>: No cycle. Apply{" "}
                  <strong>Union(u, v)</strong> and accept the edge.
                </li>
                <li>
                  If <strong>Find(u) == Find(v)</strong>: Cycle detected. Reject
                  the edge.
                </li>
              </ul>
              <p>
                <strong>Step 4:</strong> Repeat until the spanning tree contains
                exactly <code>V - 1</code> edges.
              </p>
            </div>

            <div className="calculation-box">
              <h4>Live Equation & Total Weight</h4>
              <p>
                <strong>Formula:</strong> W = Σ (Weight of accepted edges)
              </p>
              <p>
                <strong>Accepted Weights:</strong>{" "}
                {mstEdges.length > 0
                  ? mstEdges.map((e) => e.w).join(" + ")
                  : "0"}
              </p>
              <p className="final-sum">
                <strong>Total Weight (W):</strong>{" "}
                {mstEdges.reduce((t, e) => t + e.w, 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KruskalVisualizer;
