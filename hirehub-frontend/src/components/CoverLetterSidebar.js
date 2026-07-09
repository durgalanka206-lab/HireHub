import React from 'react';
import ToneSelector from './ToneSelector';

/**
 * CoverLetterSidebar Component
 * Right sidebar displaying Job Info, Resume Used, Tone Selector, ATS Alignment Score, and Word Count.
 */
export default function CoverLetterSidebar({
  targetJob = {},
  resumeName = "Uploaded Resume",
  selectedTone = "Professional",
  onSelectTone,
  atsScore = 88,
  wordCount = 0,
  charCount = 0,
  keyHighlights = [],
  isGenerating = false,
}) {
  const getScoreColor = (s) => (s >= 85 ? "#10b981" : s >= 70 ? "#c9a84c" : "#f59e0b");
  const scoreColor = getScoreColor(atsScore);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 18,
      background: "#0c0c1a",
      borderRadius: 16,
      border: "1px solid #1e1e32",
      padding: "22px 24px",
      height: "fit-content",
      boxShadow: "0 12px 35px rgba(0,0,0,0.4)",
    }}>
      {/* ATS Alignment Badge */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid #1e1e32",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8 }}>
            ATS ALIGNMENT SCORE
          </span>
          <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, marginTop: 2 }}>
            {atsScore}% Match
          </div>
        </div>

        <div style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: `${scoreColor}18`,
          border: `1px solid ${scoreColor}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 800,
          color: scoreColor,
        }}>
          ✓
        </div>
      </div>

      {/* Target Job Meta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid #1e1e32", paddingBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 0.8 }}>
          TARGET POSITION
        </span>
        <h4 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: "#e8e0d0" }}>
          {targetJob.title || "Target Role"}
        </h4>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
          {targetJob.company || "Company"} {targetJob.location ? `• ${targetJob.location}` : ""}
        </p>
      </div>

      {/* Resume Used */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, borderBottom: "1px solid #1e1e32", paddingBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8 }}>
          RESUME EVALUATED
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 14 }}>📄</span>
          <span style={{ fontSize: 12, color: "#d1d5db", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {resumeName}
          </span>
        </div>
      </div>

      {/* Tone Selector */}
      <div style={{ borderBottom: "1px solid #1e1e32", paddingBottom: 16 }}>
        <ToneSelector
          selectedTone={selectedTone}
          onSelectTone={onSelectTone}
          disabled={isGenerating}
        />
      </div>

      {/* Word & Character Count */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: "#131326", padding: "10px 12px", borderRadius: 8, border: "1px solid #1e1e32" }}>
          <span style={{ fontSize: 10, color: "#888", textTransform: "uppercase", fontWeight: 700 }}>WORD COUNT</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e0d0", marginTop: 2 }}>{wordCount}</div>
        </div>
        <div style={{ background: "#131326", padding: "10px 12px", borderRadius: 8, border: "1px solid #1e1e32" }}>
          <span style={{ fontSize: 10, color: "#888", textTransform: "uppercase", fontWeight: 700 }}>CHARACTERS</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e0d0", marginTop: 2 }}>{charCount}</div>
        </div>
      </div>

      {/* Key Highlights Used */}
      {keyHighlights.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 0.8 }}>
            KEY HIGHLIGHTS WEAVED
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {keyHighlights.map((h, idx) => (
              <span key={idx} style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                ✦ {h}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
