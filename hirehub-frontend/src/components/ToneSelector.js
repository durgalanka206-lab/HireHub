import React from 'react';

/**
 * ToneSelector Component
 * Allows candidate to select cover letter tone (Professional, Confident, Friendly, Formal).
 */
export default function ToneSelector({ selectedTone = "Professional", onSelectTone, disabled = false }) {
  const tones = [
    { id: "Professional", label: "💼 Professional", desc: "Balanced, executive, and objective tone" },
    { id: "Confident", label: "🚀 Confident", desc: "Bold, impact-driven, and high-energy tone" },
    { id: "Friendly", label: "😊 Friendly", desc: "Warm, approachable, and personable tone" },
    { id: "Formal", label: "👔 Formal", desc: "Traditional, structured, and diplomatic tone" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 0.8 }}>
        Cover Letter Tone
      </label>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {tones.map((t) => {
          const isActive = selectedTone === t.id;

          return (
            <button
              key={t.id}
              onClick={() => onSelectTone(t.id)}
              disabled={disabled}
              title={t.desc}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: isActive ? "1px solid #c9a84c" : "1px solid #2a2a3e",
                background: isActive ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.02)",
                color: isActive ? "#c9a84c" : "#9ca3af",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div>{t.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
