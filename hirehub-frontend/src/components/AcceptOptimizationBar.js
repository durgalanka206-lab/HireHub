import React from 'react';
import { S } from './UI';

/**
 * AcceptOptimizationBar Component
 * Aligns the Accept button to the bottom-right of the page and Back button to the bottom-left
 */
export default function AcceptOptimizationBar({
  isAccepted,
  onAccept,
  onTogglePreview,
  activeTab,
  onBack,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 20,
        width: "100%",
        marginTop: 26,
        paddingTop: 20,
        borderTop: "1px solid #2a2a3e"
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "1px solid #2a2a3e",
          color: "#c9a84c",
          borderRadius: 8,
          padding: "10px 24px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxSizing: "border-box",
          height: "40px"
        }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", alignItems: "center" }}>
        {!isAccepted ? (
          <button
            onClick={onAccept}
            style={{
              ...S.btn,
              padding: "10px 24px",
              fontSize: 13,
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              border: "none",
              boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
              cursor: "pointer",
              boxSizing: "border-box",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✓ Accept Optimization
          </button>
        ) : (
          <button
            onClick={() => onTogglePreview("preview")}
            style={{
              ...S.btn,
              padding: "10px 22px",
              fontSize: 13,
              background: activeTab === "preview" ? "rgba(201,168,76,0.2)" : "linear-gradient(135deg, #c9a84c, #8b6914)",
              color: activeTab === "preview" ? "#c9a84c" : "#000",
              border: activeTab === "preview" ? "1px solid #c9a84c" : "none",
              cursor: "pointer",
              boxSizing: "border-box",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            📄 Preview & Download Resume →
          </button>
        )}
      </div>
    </div>
  );
}
