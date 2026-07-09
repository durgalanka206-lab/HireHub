import React, { useState } from 'react';
import { S } from './UI';

/**
 * CoverLetterToolbar Component
 * Action toolbar offering Copy, Download PDF, Download DOCX, Regenerate, Reset, and Back.
 */
export default function CoverLetterToolbar({
  onCopy,
  onDownloadPDF,
  onDownloadDOCX,
  onRegenerate,
  onReset,
  onBack,
  hasEdits = false,
  isGenerating = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #111122 0%, #15152a 100%)",
      border: "1px solid rgba(201,168,76,0.3)",
      borderRadius: 14,
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    }}>
      {/* Left Back Button */}
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "1px solid #2a2a3e",
          color: "#c9a84c",
          borderRadius: 8,
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back to Job Match
      </button>

      {/* Action Controls Group */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {hasEdits && (
          <button
            onClick={onReset}
            title="Reset text back to AI generated content"
            style={{
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              color: "#f87171",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ↩️ Reset Edits
          </button>
        )}

        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          style={{
            background: "transparent",
            border: "1px solid rgba(201,168,76,0.4)",
            color: "#c9a84c",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 600,
            opacity: isGenerating ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          🔄 {isGenerating ? "Regenerating…" : "Regenerate"}
        </button>

        <button
          onClick={handleCopyClick}
          style={{
            background: copied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)",
            border: copied ? "1px solid #10b981" : "1px solid #2a2a3e",
            color: copied ? "#10b981" : "#e2e8f0",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>

        <button
          onClick={onDownloadDOCX}
          style={{
            background: "rgba(96,165,250,0.12)",
            border: "1px solid rgba(96,165,250,0.4)",
            color: "#60a5fa",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          📥 Download DOCX
        </button>

        <button
          onClick={onDownloadPDF}
          style={{
            background: "linear-gradient(135deg, #c9a84c, #8b6914)",
            border: "none",
            color: "#000",
            borderRadius: 8,
            padding: "8px 18px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 800,
            boxShadow: "0 4px 15px rgba(201,168,76,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          📄 Download PDF
        </button>
      </div>
    </div>
  );
}
