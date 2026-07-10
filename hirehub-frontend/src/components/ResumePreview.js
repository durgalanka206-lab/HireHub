import React from 'react';

/**
 * ResumePreview Component
 * Renders a clean formatted resume preview and provides Download PDF / Download DOCX functionality.
 */
export default function ResumePreview({ user = {}, optimizationData = {} }) {
  const {
    professionalSummary = {},
    skills = {},
    experience = [],
    projects = [],
    jobSpecificOptimization = {},
  } = optimizationData;

  const candidateName = user.name || "Candidate Name";
  const candidateEmail = user.email || "";
  const candidatePhone = user.phone || "";
  const candidateLocation = [user.city, user.state, user.country].filter(Boolean).join(", ");

  // Download DOCX handler (generates clean Word-compatible HTML blob)
  const handleDownloadDOCX = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${candidateName} - Optimized Resume</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.5; color: #111; margin: 40px; }
          h1 { font-size: 24pt; color: #000; margin-bottom: 2pt; }
          .contact { font-size: 10pt; color: #444; margin-bottom: 16pt; }
          h2 { font-size: 14pt; color: #8b6914; border-bottom: 1px solid #ddd; padding-bottom: 4pt; margin-top: 16pt; text-transform: uppercase; }
          p, li { font-size: 11pt; color: #222; }
          ul { margin-top: 4pt; margin-bottom: 8pt; padding-left: 20pt; }
          .skill-badge { font-weight: bold; color: #111; }
          .company { font-weight: bold; }
          .role { font-style: italic; color: #555; }
        </style>
      </head>
      <body>
        <h1>${candidateName}</h1>
        <div class="contact">
          ${candidateEmail ? candidateEmail + " | " : ""}${candidatePhone ? candidatePhone + " | " : ""}${candidateLocation}
        </div>

        ${professionalSummary.optimized ? `
          <h2>Professional Summary</h2>
          <p>${professionalSummary.optimized}</p>
        ` : ""}

        ${(skills.recommendedOrdering?.length || skills.atsKeywords?.length) ? `
          <h2>Technical Skills</h2>
          <p><strong>Core Skills:</strong> ${(skills.recommendedOrdering || skills.currentSkills || []).join(", ")}</p>
          <p><strong>ATS & Industry Keywords:</strong> ${[...(skills.atsKeywords || []), ...(skills.industryKeywords || [])].join(", ")}</p>
        ` : ""}

        ${experience.length > 0 ? `
          <h2>Professional Experience</h2>
          ${experience.map(exp => `
            <div style="margin-bottom: 12pt;">
              <span class="company">${exp.company}</span> — <span class="role">${exp.role}</span>
              <ul>
                ${exp.bullets.map(b => `<li>${b.optimizedBullet || b.currentBullet}</li>`).join("")}
              </ul>
            </div>
          `).join("")}
        ` : ""}

        ${projects.length > 0 ? `
          <h2>Projects</h2>
          ${projects.map(p => `
            <div style="margin-bottom: 10pt;">
              <strong>${p.name}</strong>
              <p style="margin-top: 2pt;">${p.optimizedDescription || p.currentDescription}</p>
              ${p.measurableImpact ? `<p style="font-size: 10pt; font-style: italic; color: #444;">Impact: ${p.measurableImpact}</p>` : ""}
            </div>
          `).join("")}
        ` : ""}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${candidateName.replace(/\s+/g, '_')}_Optimized_Resume.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download PDF handler (triggers browser print interface formatted for A4 PDF download)
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups to download PDF preview.");

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${candidateName} - AI Optimized Resume</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #c9a84c; padding-bottom: 14px; margin-bottom: 20px; }
          .name { font-size: 26px; font-weight: bold; color: #0f172a; margin: 0 0 6px; letter-spacing: 0.5px; }
          .contact { font-size: 12px; color: #64748b; }
          .section-title { font-size: 14px; font-weight: 700; color: #8b6914; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 20px 0 10px; }
          p { margin: 0 0 8px; font-size: 13px; color: #334155; }
          ul { margin: 4px 0 12px; padding-left: 20px; }
          li { font-size: 13px; color: #334155; margin-bottom: 4px; }
          .job-title { font-weight: bold; color: #0f172a; font-size: 14px; }
          .company { font-weight: 600; color: #475569; }
          .project-name { font-weight: bold; color: #0f172a; font-size: 14px; }
          .impact { font-size: 12px; color: #0284c7; font-weight: 500; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${candidateName}</div>
          <div class="contact">
            ${candidateEmail ? candidateEmail + " • " : ""}${candidatePhone ? candidatePhone + " • " : ""}${candidateLocation}
          </div>
        </div>

        ${professionalSummary.optimized ? `
          <div class="section-title">Professional Summary</div>
          <p>${professionalSummary.optimized}</p>
        ` : ""}

        ${(skills.recommendedOrdering?.length || skills.atsKeywords?.length) ? `
          <div class="section-title">Core Skills & Competencies</div>
          <p><strong>Recommended Skills:</strong> ${(skills.recommendedOrdering || skills.currentSkills || []).join(" • ")}</p>
          <p><strong>ATS Keywords:</strong> ${[...(skills.atsKeywords || []), ...(skills.industryKeywords || [])].join(" • ")}</p>
        ` : ""}

        ${experience.length > 0 ? `
          <div class="section-title">Professional Experience</div>
          ${experience.map(exp => `
            <div style="margin-bottom: 12px;">
              <span class="job-title">${exp.role}</span> <span class="company">| ${exp.company}</span>
              <ul>
                ${exp.bullets.map(b => `<li>${b.optimizedBullet || b.currentBullet}</li>`).join("")}
              </ul>
            </div>
          `).join("")}
        ` : ""}

        ${projects.length > 0 ? `
          <div class="section-title">Key Projects</div>
          ${projects.map(p => `
            <div style="margin-bottom: 12px;">
              <div class="project-name">${p.name}</div>
              <p style="margin-top: 4px;">${p.optimizedDescription || p.currentDescription}</p>
              ${p.measurableImpact ? `<div class="impact">Impact: ${p.measurableImpact}</div>` : ""}
            </div>
          `).join("")}
        ` : ""}

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div style={{
      background: "#0d0d1c",
      borderRadius: 12,
      border: "1px solid rgba(201,168,76,0.3)",
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Top Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, color: "#e8e0d0", fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>
            📄 Live Optimized Resume Document Preview
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>
            Truthful, ATS-formatted resume ready for export
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleDownloadDOCX}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(96,165,250,0.4)",
              background: "rgba(96,165,250,0.12)",
              color: "#60a5fa",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            📥 Download DOCX
          </button>

          <button
            onClick={handleDownloadPDF}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #c9a84c, #8b6914)",
              color: "#000",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 15px rgba(201,168,76,0.25)",
            }}
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* Rendered Resume Document Body */}
      <div style={{
        background: "#ffffff",
        color: "#1e293b",
        borderRadius: 12,
        padding: "36px 40px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        fontFamily: "Inter, system-ui, sans-serif",
        lineHeight: 1.6,
      }}>
        {/* Header */}
        <div style={{ textTransform: "center", textAlign: "center", borderBottom: "2px solid #c9a84c", paddingBottom: 14, marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: 0.5 }}>
            {candidateName}
          </h2>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {[candidateEmail, candidatePhone, candidateLocation].filter(Boolean).join(" • ")}
          </div>
        </div>

        {/* Professional Summary */}
        {professionalSummary.optimized && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#8b6914", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>
              Professional Summary
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
              {professionalSummary.optimized}
            </p>
          </div>
        )}

        {/* Skills */}
        {(skills.recommendedOrdering?.length > 0 || skills.atsKeywords?.length > 0) && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#8b6914", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>
              Core Technical Skills & Keywords
            </h4>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#334155" }}>
              <strong>Recommended Skills:</strong> {(skills.recommendedOrdering || skills.currentSkills || []).join(" • ")}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
              <strong>ATS Keywords:</strong> {[...(skills.atsKeywords || []), ...(skills.industryKeywords || [])].join(" • ")}
            </p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#8b6914", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>
              Professional Experience
            </h4>
            {experience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  <span>{exp.role}</span>
                  <span style={{ color: "#475569", fontWeight: 600 }}>{exp.company}</span>
                </div>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {exp.bullets.map((b, bIdx) => (
                    <li key={bIdx} style={{ fontSize: 13, color: "#334155", marginBottom: 3 }}>
                      {b.optimizedBullet || b.currentBullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#8b6914", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>
              Projects
            </h4>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  {proj.name}
                </div>
                <p style={{ margin: "3px 0 4px", fontSize: 13, color: "#334155" }}>
                  {proj.optimizedDescription || proj.currentDescription}
                </p>
                {proj.measurableImpact && (
                  <p style={{ margin: 0, fontSize: 12, fontStyle: "italic", color: "#0284c7" }}>
                    Impact: {proj.measurableImpact}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
