import React from 'react';

/**
 * ImprovementTimeline Component
 * Displays 6 categorized overall resume improvements:
 * Grammar, Formatting, Keyword Density, Action Verbs, Readability, Missing Sections.
 */
export default function ImprovementTimeline({ improvements = {} }) {
  const categories = [
    { key: "grammar", label: "Grammar & Tone", icon: "✍️", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
    { key: "formatting", label: "Formatting & Structure", icon: "📐", color: "#c9a84c", bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.25)" },
    { key: "keywordDensity", label: "Keyword Density", icon: "🔑", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
    { key: "actionVerbs", label: "Action Verbs & Impact", icon: "⚡", color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.25)" },
    { key: "readability", label: "Readability & Flow", icon: "📖", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
    { key: "missingSections", label: "Missing Sections & Gaps", icon: "🧩", color: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
      {categories.map((cat) => {
        const list = Array.isArray(improvements[cat.key]) ? improvements[cat.key] : [];

        return (
          <div
            key={cat.key}
            style={{
              background: "#0c0c1a",
              borderRadius: 12,
              border: `1px solid ${cat.border}`,
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: cat.bg,
                border: `1px solid ${cat.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
              }}>
                {cat.icon}
              </div>
              <div>
                <h5 style={{ margin: 0, fontSize: 14, color: cat.color, fontWeight: 700 }}>
                  {cat.label}
                </h5>
                <span style={{ fontSize: 10, color: "#666" }}>
                  {list.length} improvement item{list.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {list.length > 0 ? (
              <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                {list.map((item, idx) => (
                  <li key={idx} style={{ color: "#d1d5db", fontSize: 12, lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "#666", fontSize: 12, fontStyle: "italic" }}>
                ✓ Optimized & aligned according to ATS standards.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
