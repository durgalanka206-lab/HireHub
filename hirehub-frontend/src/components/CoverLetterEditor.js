import React from 'react';

/**
 * CoverLetterEditor Component
 * Professional document editor allowing candidates to edit any text paragraph directly.
 */
export default function CoverLetterEditor({
  value = "",
  onChange,
  candidateName = "Candidate Name",
  candidateEmail = "",
  candidatePhone = "",
  targetJob = {},
}) {
  const currentDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{
      background: "#ffffff",
      color: "#1e293b",
      borderRadius: 14,
      padding: "44px 50px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
      fontFamily: "Inter, system-ui, sans-serif",
      lineHeight: 1.7,
      minHeight: 650,
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}>
      {/* Header Info */}
      <div style={{ borderBottom: "2px solid #c9a84c", paddingBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: 0.5 }}>
          {candidateName}
        </h2>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {[candidateEmail, candidatePhone].filter(Boolean).join(" • ")}
        </div>
      </div>

      {/* Date & Recipient Block */}
      <div style={{ fontSize: 13, color: "#475569", display: "flex", flexDirection: "column", gap: 3 }}>
        <div><strong>Date:</strong> {currentDateStr}</div>
        <div><strong>To:</strong> Hiring Team / Recruitment Manager</div>
        <div><strong>Company:</strong> {targetJob.company || "Target Company"}</div>
        <div><strong>Re:</strong> Application for {targetJob.title || "Target Position"} role</div>
      </div>

      {/* Main Textarea Document Canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write or edit your cover letter text here..."
          style={{
            width: "100%",
            flex: 1,
            minHeight: 450,
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "16px 20px",
            fontSize: 14,
            lineHeight: 1.8,
            color: "#1e293b",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            background: "#fafafa",
            transition: "border-color 0.15s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
          onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
        />
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 6, fontStyle: "italic" }}>
          ✏️ Edit text directly in the box above before downloading.
        </div>
      </div>
    </div>
  );
}
