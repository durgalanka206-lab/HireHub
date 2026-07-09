import React from 'react';

/**
 * DiffViewer Component
 * Highlights additions and rewrites with GitHub-style diff styling (green pills for added/improved words/phrases).
 */
export default function DiffViewer({ originalText = "", optimizedText = "" }) {
  if (!optimizedText) return <span style={{ color: "#9ca3af" }}>No text provided</span>;

  // Simple token diff algorithm for visual highlight
  const origWords = new Set(
    originalText
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
  );

  const optWords = optimizedText.split(/(\s+)/);

  return (
    <div style={{
      fontSize: 13,
      lineHeight: 1.7,
      color: "#e2e8f0",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {optWords.map((token, idx) => {
        const cleaned = token.toLowerCase().replace(/[^\w]/g, "");
        const isNewWord = cleaned.length > 2 && !origWords.has(cleaned);

        if (isNewWord) {
          return (
            <span
              key={idx}
              style={{
                background: "rgba(16,185,129,0.18)",
                color: "#34d399",
                border: "1px solid rgba(16,185,129,0.35)",
                padding: "2px 5px",
                borderRadius: 4,
                fontWeight: 600,
                margin: "0 1px",
                boxShadow: "0 0 10px rgba(16,185,129,0.1)",
              }}
              title="AI Enhanced Wording / Keyword"
            >
              {token}
            </span>
          );
        }

        return <span key={idx}>{token}</span>;
      })}
    </div>
  );
}
