import React from 'react';
import { S } from './UI';

/**
 * AcceptOptimizationBar Component
 * Aligns the Accept button to the bottom-right of the page
 */
export default function AcceptOptimizationBar({
  isAccepted,
  onAccept,
  onTogglePreview,
  activeTab,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        width: "100%",
        marginTop: 32,
        paddingTop: 24,
        borderTop: "1px solid #2a2a3e"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {!isAccepted ? (
          <button
            onClick={onAccept}
            style={{
              ...S.btn,
              padding: "12px 28px",
              fontSize: 14,
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              border: "none",
              boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
              cursor: "pointer",
            }}
          >
            ✓ Accept Optimization
          </button>
        ) : (
          <button
            onClick={() => onTogglePreview("preview")}
            style={{
              ...S.btn,
              padding: "12px 26px",
              fontSize: 14,
              background: activeTab === "preview" ? "rgba(201,168,76,0.2)" : "linear-gradient(135deg, #c9a84c, #8b6914)",
              color: activeTab === "preview" ? "#c9a84c" : "#000",
              border: activeTab === "preview" ? "1px solid #c9a84c" : "none",
              cursor: "pointer",
            }}
          >
            📄 Preview & Download Resume →
          </button>
        )}
      </div>
    </div>
  );
}
