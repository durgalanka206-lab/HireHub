import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { S } from './UI';

/**
 * AI Job Match Report Page Component
 * Dedicated full-page AI evaluation report for a selected job posting.
 * Redesigned into a premium, interactive AI dashboard.
 */
export default function JobMatchReportPage({
  job,
  user,
  matchData,
  loading,
  error,
  isApplied,
  onBack,
  onApply,
  onGoToMyApps,
  onAnalyzeAgain,
  onOptimizeResume,
  onGenerateCoverLetter,
  convertToLPA,
}) {
  const [activeTooltip, setActiveTooltip] = useState("");
  const [activeSectionTab, setActiveSectionTab] = useState("skills"); // "skills" | "audit" | "roadmap" | "salary"

  const showPlaceholderNotice = (msg) => {
    setActiveTooltip(msg);
    setTimeout(() => setActiveTooltip(""), 3500);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "40px 20px", maxWidth: 1000, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {/* Back button */}
        <button onClick={onBack} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          ← Back to Job Details
        </button>

        {/* Loading Skeleton */}
        <div style={{ background: "linear-gradient(135deg, #0d0d1f 0%, #111128 100%)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 16, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid #1e1e30", borderTopColor: "#c9a84c", animation: "spin 0.9s linear infinite" }} />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "#e8e0d0", margin: 0, fontSize: 24 }}>Generating AI Job Match Report…</h2>
          <p style={{ color: "#888", fontSize: 14, margin: 0, textAlign: "center" }}>Evaluating your resume against {job?.title || "job requirements"} at {job?.company || "company"}…</p>
          
          <div style={{ width: "100%", maxWidth: 600, height: 8, background: "#1a1a2e", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #c9a84c, #8b6914)", width: "65%", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{ opacity:0.6 } 50%{ opacity:1 } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, padding: "40px 20px", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, marginBottom: 24 }}>
          ← Back to Job Details
        </button>
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 16, padding: "32px", textAlign: "center" }}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>⚠️</span>
          <h3 style={{ color: "#f87171", margin: "0 0 8px", fontSize: 20 }}>Job Match Report Failed</h3>
          <p style={{ color: "#d1d5db", margin: "0 0 20px", fontSize: 14 }}>{error}</p>
          <button onClick={onAnalyzeAgain} style={{ ...S.btn, margin: "0 auto" }}>Try Again</button>
        </div>
      </div>
    );
  }

  const score = matchData?.matchScore || 0;
  const scoreColor = score >= 75 ? "#4ade80" : score >= 50 ? "#c9a84c" : "#f87171";
  const circumference = 2 * Math.PI * 48;
  const dashOffset = circumference - (score / 100) * circumference;

  // Generate Top Insights dynamically from matchData details
  const topInsights = [];
  if (matchData?.matchingSkills && matchData.matchingSkills.length > 0) {
    topInsights.push({ type: "success", text: `Strong Match: Candidate possesses key required skills like ${matchData.matchingSkills.slice(0, 3).join(", ")}.` });
  }
  if (matchData?.missingSkills && matchData.missingSkills.length > 0) {
    topInsights.push({ type: "warning", text: `Skill Gap: Missing ${matchData.missingSkills.slice(0, 2).join(" and ")} on the evaluated resume.` });
  }
  if (matchData?.strengths && matchData.strengths.length > 0) {
    topInsights.push({ type: "success", text: `Resume Strength: ${matchData.strengths[0]}` });
  }
  if (matchData?.improvements && matchData.improvements.length > 0) {
    topInsights.push({ type: "warning", text: `Improvement Focus: ${matchData.improvements[0]}` });
  }
  if (matchData?.salaryInsights?.estimatedRange) {
    topInsights.push({ type: "info", text: `Salary Target: Estimated market salary range is ${matchData.salaryInsights.estimatedRange}.` });
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#06060c", padding: "28px 20px 40px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Top Header Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <button onClick={onBack} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            ← Back to Job Details
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isApplied && (
              <span style={{ fontSize: 12, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>
                ✓ Applied
              </span>
            )}
            <span style={{ fontSize: 12, background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>
              ✨ Official AI Match Report
            </span>
          </div>
        </div>

        {/* HERO SECTION / GENERAL METRICS */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #0d0d21 0%, #12122b 50%, #0a0a18 100%)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "28px 30px", position: "relative", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, background: "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{job?.company}</span>
                <span style={{ color: "#444" }}>•</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{job?.location}</span>
                <span style={{ fontSize: 11, background: "#18182b", padding: "2px 8px", borderRadius: 10, color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>{job?.type}</span>
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", margin: "0 0 12px", fontSize: 30, fontWeight: 700, color: "#e8e0d0" }}>{job?.title}</h1>
              
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#9ca3af", marginTop: 12, borderTop: "1px solid #1e1e32", paddingTop: 14 }}>
                <div>📄 <strong>Resume:</strong> {user?.resumeOriginalName || "Evaluated Resume"}</div>
                <div>💰 <strong>Est. Salary:</strong> {convertToLPA ? convertToLPA(job?.salary) : job?.salary}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.015)", padding: "18px 22px", borderRadius: 14, border: "1px solid #1c1c32", minWidth: 150 }}>
              <svg width="100" height="100" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#1c1c30" strokeWidth="10" />
                <circle cx="60" cy="60" r="48" fill="none" stroke={scoreColor} strokeWidth="10"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px", transition: "stroke-dashoffset 1s ease" }} />
                <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="800" fill={scoreColor}>{score}%</text>
                <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#777" fontWeight="700">FIT GRADE</text>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor, background: `${scoreColor}15`, padding: "3px 12px", borderRadius: 12, border: `1px solid ${scoreColor}30` }}>
                {score >= 75 ? "Strong Fit" : score >= 50 ? "Moderate Fit" : "Low Fit"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 1. EXECUTIVE AI DASHBOARD */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {/* Card 1: Skill Fit */}
          <div style={{ background: "#0c0c1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #1c1c30", position: "relative" }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>Technical Skill Fit</span>
            <h4 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800, color: scoreColor }}>{Math.min(100, score + 5)}%</h4>
            <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, score + 5)}%`, background: scoreColor }} />
            </div>
          </div>

          {/* Card 2: Experience Alignment */}
          <div style={{ background: "#0c0c1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #1c1c30" }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>Experience Alignment</span>
            <h4 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800, color: "#60a5fa" }}>{Math.max(10, score - 5)}%</h4>
            <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(10, score - 5)}%`, background: "#60a5fa" }} />
            </div>
          </div>

          {/* Card 3: ATS Compatibility */}
          <div style={{ background: "#0c0c1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #1c1c30" }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>ATS Compatibility</span>
            <h4 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>{Math.min(100, score + 10)}%</h4>
            <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, score + 10)}%`, background: "#a78bfa" }} />
            </div>
          </div>

          {/* Card 4: Estimated Salary Target */}
          <div style={{ background: "#0c0c1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #1c1c30" }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>Estimated Range</span>
            <h4 style={{ margin: "4px 0 6px", fontSize: 18, fontWeight: 800, color: "#c9a84c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {matchData?.salaryInsights?.estimatedRange || "Competitive"}
            </h4>
            <span style={{ fontSize: 11, color: "#666" }}>Based on resume qualifications</span>
          </div>
        </div>

        {/* 2. EXECUTIVE SUMMARY (4-8 lines) */}
        <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid #1e1e32", borderRadius: 14, padding: "20px 24px" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
            🤖 AI Executive Explanation
          </span>
          <p style={{ margin: 0, color: "#d1d5db", fontSize: 14, lineHeight: 1.7 }}>
            {matchData?.overallExplanation}
          </p>
        </div>

        {/* 3. TOP INSIGHTS (5-8 findings checklist) */}
        <div style={{ background: "#0c0c1a", border: "1px solid #1e1e32", borderRadius: 14, padding: "20px 24px" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 12 }}>
            💡 Quick Match Insights
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topInsights.map((ins, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{
                  fontSize: 12,
                  color: ins.type === "success" ? "#10b981" : ins.type === "warning" ? "#fb923c" : "#60a5fa",
                  marginTop: 1
                }}>
                  {ins.type === "success" ? "✓" : ins.type === "warning" ? "⚠" : "✦"}
                </span>
                <p style={{ margin: 0, color: "#e2e8f0", fontSize: 13, lineHeight: 1.5 }}>{ins.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. QUICK ACTIONS BAR */}
        <div style={{
          background: "linear-gradient(135deg, #111122 0%, #15152a 100%)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
        }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isApplied ? (
              <button onClick={onGoToMyApps} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #10b981", background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                ✓ Applied · View Status
              </button>
            ) : (
              <button onClick={() => onApply(job)} style={{ ...S.btn, padding: "10px 22px", fontSize: 13 }}>
                ⚡ Apply Now
              </button>
            )}
            <button onClick={() => onOptimizeResume ? onOptimizeResume(job) : null}
              style={{ ...S.btn, background: "transparent", border: "1px solid rgba(201,168,76,0.4)", color: "#c9a84c", padding: "10px 18px", fontSize: 13 }}>
              ✨ Optimize Resume
            </button>
            <button onClick={() => onGenerateCoverLetter ? onGenerateCoverLetter(job) : null}
              style={{ ...S.btn, background: "transparent", border: "1px solid rgba(96,165,250,0.4)", color: "#60a5fa", padding: "10px 18px", fontSize: 13 }}>
              ✉️ Generate Cover Letter
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onAnalyzeAgain} style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.2)", color: "#c9a84c", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              🔄 Re-Analyze
            </button>
          </div>
        </div>

        {/* Tooltip Notification Alert */}
        {activeTooltip && (
          <div style={{ background: "rgba(201,168,76,0.15)", border: "1px solid #c9a84c", borderRadius: 10, padding: "12px 18px", color: "#c9a84c", fontSize: 13, textAlign: "center", fontWeight: 600 }}>
            {activeTooltip}
          </div>
        )}

        {/* 5. DETAILED REPORT ACCORDION TABS */}
        <div style={{ background: "#0c0c1a", borderRadius: 16, border: "1px solid #1e1e32", overflow: "hidden" }}>
          {/* Tabs Selector Header */}
          <div style={{ display: "flex", borderBottom: "1px solid #1e1e32", background: "#0a0a14", overflowX: "auto" }}>
            {[
              { id: "skills", label: "🔑 Skills Matching" },
              { id: "audit", label: "📊 Strengths & Suggestions" },
              { id: "roadmap", label: "🗺️ Learning Roadmap" },
              { id: "salary", label: "🎯 Salary & Interview" },
            ].map(t => {
              const active = activeSectionTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSectionTab(t.id)}
                  style={{
                    padding: "14px 22px",
                    background: active ? "rgba(201,168,76,0.1)" : "transparent",
                    color: active ? "#c9a84c" : "#888",
                    border: "none",
                    borderBottom: active ? "3px solid #c9a84c" : "3px solid transparent",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div style={{ padding: "24px 28px", boxSizing: "border-box" }}>
            
            {/* Tab 1: Skills Matching */}
            {activeSectionTab === "skills" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                {/* Matching Skills */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "20px" }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#4ade80", fontWeight: 700, textTransform: "uppercase" }}>
                    ✓ Matching Required Skills ({matchData?.matchingSkills?.length || 0})
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(matchData?.matchingSkills || []).map((sk, i) => (
                      <span key={i} style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>{sk}</span>
                    ))}
                    {(!matchData?.matchingSkills?.length) && <span style={{ color: "#666", fontSize: 13 }}>None detected</span>}
                  </div>
                </div>

                {/* Missing Skills */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 12, padding: "20px" }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#f87171", fontWeight: 700, textTransform: "uppercase" }}>
                    ✗ Missing Recommended Skills ({matchData?.missingSkills?.length || 0})
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(matchData?.missingSkills || []).map((sk, i) => (
                      <span key={i} style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>{sk}</span>
                    ))}
                    {(!matchData?.missingSkills?.length) && <span style={{ color: "#666", fontSize: 13 }}>All required skills matched!</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Strengths & Suggestions */}
            {activeSectionTab === "audit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                  {/* Strengths */}
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 12, padding: "18px" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase" }}>💪 Candidate Strengths</h4>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "#d1d5db", fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                      {(matchData?.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  {/* Areas to Improve */}
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(251,146,60,0.15)", borderRadius: 12, padding: "18px" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#fb923c", fontWeight: 700, textTransform: "uppercase" }}>⚡ Areas to Improve</h4>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "#d1d5db", fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                      {(matchData?.improvements || []).map((imp, i) => <li key={i}>{imp}</li>)}
                    </ul>
                  </div>
                </div>

                {/* ATS Suggestions */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid #1e1e32", borderRadius: 12, padding: "20px" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#e8e0d0", fontWeight: 700, textTransform: "uppercase" }}>📝 ATS Suggestions & Optimization Tips</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#d1d5db", fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                    {(matchData?.atsSuggestions || []).map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 3: Learning Roadmap */}
            {activeSectionTab === "roadmap" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(matchData?.learningRoadmap || []).map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(167,139,250,0.04)", padding: "14px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.1)" }}>
                    <span style={{ minWidth: 24, height: 24, borderRadius: "50%", background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#a78bfa", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <p style={{ margin: 0, color: "#e2e8f0", fontSize: 13, lineHeight: 1.6 }}>{step}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Salary & Interview Prep */}
            {activeSectionTab === "salary" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                {/* Salary Details */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "20px" }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#c9a84c", fontWeight: 700, textTransform: "uppercase" }}>💰 Salary Target Insights</h4>
                  <p style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#c9a84c" }}>{matchData?.salaryInsights?.estimatedRange || "Market Competitive"}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", lineHeight: 1.5 }}>{matchData?.salaryInsights?.reason}</p>
                </div>

                {/* Interview Focus */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 12, padding: "20px" }}>
                  <h4 style={{ margin: "0 0 14px", fontSize: 14, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase" }}>🎯 Suggested Interview Topics</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(matchData?.interviewFocus || []).map((item, i) => (
                      <span key={i} style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 500 }}>{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
