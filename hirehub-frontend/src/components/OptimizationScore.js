import React from 'react';

/**
 * OptimizationScore Component
 * Shows side-by-side transition: Current ATS Score -> Optimized ATS Score
 * Displays +ATS Improvement and Optimization Rating
 */
export default function OptimizationScore({ currentScore = 78, optimizedScore = 91 }) {
  const scoreVal = typeof optimizedScore === 'number' ? optimizedScore : 90;
  const currVal = typeof currentScore === 'number' ? currentScore : 75;
  const diff = scoreVal - currVal;

  const getScoreColor = (score) => {
    if (score >= 85) return "#10b981";
    if (score >= 70) return "#c9a84c";
    return "#f59e0b";
  };

  const getRatingLabel = (score) => {
    if (score >= 88) return "Excellent Optimization";
    if (score >= 78) return "Strong Optimization";
    return "Good Optimization";
  };

  const currentColor = getScoreColor(currVal);
  const optimizedColor = getScoreColor(scoreVal);
  const ratingText = getRatingLabel(scoreVal);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const currentOffset = circumference - (currVal / 100) * circumference;
  const optimizedOffset = circumference - (scoreVal / 100) * circumference;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0d0d1f 0%, #13132b 50%, #0a0a18 100%)",
      borderRadius: 16,
      padding: "24px 28px",
      border: "1px solid rgba(201,168,76,0.3)",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative glow */}
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, color: "#e8e0d0", fontWeight: 700 }}>
            ATS Compatibility Score Upgrade
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>
            ATS parsing and keyword compatibility score upgrade after AI optimization
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {diff > 0 && (
            <span style={{
              fontSize: 13,
              fontWeight: 800,
              background: "rgba(16,185,129,0.18)",
              color: "#10b981",
              border: "1px solid rgba(16,185,129,0.4)",
              padding: "6px 16px",
              borderRadius: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
              ⚡ +{diff} ATS Improvement
            </span>
          )}
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            background: "rgba(201,168,76,0.15)",
            color: "#c9a84c",
            border: "1px solid rgba(201,168,76,0.35)",
            padding: "6px 14px",
            borderRadius: 20,
          }}>
            {ratingText}
          </span>
        </div>
      </div>

      {/* Main Score Comparison Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap: 24,
        alignItems: "center",
        background: "rgba(255,255,255,0.02)",
        borderRadius: 14,
        padding: "20px 24px",
        border: "1px solid #1e1e32",
      }}>
        {/* Current ATS */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="90" height="90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#1c1c2e" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={currentColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={currentOffset}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50px 50px", transition: "stroke-dashoffset 1s ease" }}
            />
            <text x="50" y="54" textAnchor="middle" fontSize="22" fontWeight="800" fill={currentColor}>
              {currVal}
            </text>
          </svg>
          <div>
            <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
              CURRENT ATS SCORE
            </span>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#d1d5db", marginTop: 2 }}>
              {currVal} / 100
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#666" }}>Original Baseline</p>
          </div>
        </div>

        {/* Transition Arrow */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #c9a84c, #8b6914)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontWeight: 900,
            fontSize: 18,
            boxShadow: "0 4px 15px rgba(201,168,76,0.35)",
          }}>
            ➜
          </div>
          <span style={{ fontSize: 10, color: "#c9a84c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            UPGRADED
          </span>
        </div>

        {/* Optimized ATS */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "flex-end" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, color: "#10b981", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
              OPTIMIZED ATS SCORE
            </span>
            <div style={{ fontSize: 24, fontWeight: 900, color: optimizedColor, marginTop: 2 }}>
              {scoreVal} / 100
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#10b981", fontWeight: 600 }}>
              Post-Optimization
            </p>
          </div>

          <svg width="90" height="90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#1c1c2e" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={optimizedColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={optimizedOffset}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50px 50px", transition: "stroke-dashoffset 1s ease" }}
            />
            <text x="50" y="54" textAnchor="middle" fontSize="22" fontWeight="800" fill={optimizedColor}>
              {scoreVal}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
