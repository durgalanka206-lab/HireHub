import React from 'react';
import DiffViewer from './DiffViewer';

/**
 * Reusable ResumeComparison component with GitHub-style diff highlighting.
 */
export default function ResumeComparison({
  currentText = "",
  optimizedText = "",
  title = "",
  explanation = "",
  actionVerbs = [],
  measurableImpact = "",
}) {
  return (
    <div style={{
      background: "#0c0c1a",
      borderRadius: 12,
      border: "1px solid #1e1e32",
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <h5 style={{ margin: 0, fontSize: 14, color: "#c9a84c", fontWeight: 700 }}>
            {title}
          </h5>
          {explanation && (
            <span style={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>
              💡 {explanation}
            </span>
          )}
        </div>
      )}

      {/* Side by side comparison grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
      }}>
        {/* Current Version */}
        <div style={{
          background: "rgba(248,113,113,0.04)",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: 10,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Current Version
            </span>
          </div>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: 13, lineHeight: 1.6 }}>
            {currentText || "No original text available."}
          </p>
        </div>

        {/* AI Optimized Version with Diff Highlighting */}
        <div style={{
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 10,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.5 }}>
                ✨ AI Optimized Version (GitHub Diff View)
              </span>
            </div>
            <span style={{ fontSize: 10, background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
              ATS Enhanced
            </span>
          </div>

          {/* GitHub-style diff viewer */}
          <DiffViewer
            originalText={currentText}
            optimizedText={optimizedText}
          />

          {/* Action Verbs or Measurable Impact Badges */}
          {(actionVerbs.length > 0 || measurableImpact) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 6, borderTop: "1px dashed rgba(16,185,129,0.2)" }}>
              {actionVerbs.map((verb, idx) => (
                <span key={idx} style={{ fontSize: 10, background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                  ⚡ Action Verb: {verb}
                </span>
              ))}
              {measurableImpact && (
                <span style={{ fontSize: 10, background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                  📊 Impact: {measurableImpact}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
