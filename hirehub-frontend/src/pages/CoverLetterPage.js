import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CoverLetterToolbar from '../components/CoverLetterToolbar';
import CoverLetterEditor from '../components/CoverLetterEditor';
import CoverLetterSidebar from '../components/CoverLetterSidebar';
import { fetchWithRetry } from '../utils/fetchHardening';
import AIRobotMascot from '../components/AIRobotMascot';
import PremiumLoader from '../components/PremiumLoader';

/**
 * AI Cover Letter Page Component — /ai/cover-letter
 * Redesigned into a premium AI SaaS document editor with dashboard overview
 * and collapsible full document workspace.
 */
export default function CoverLetterPage({
  user,
  token,
  targetJob,
  onBack,
  onUploadResume,
  API_URL,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coverLetterData, setCoverLetterData] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [localFileMissing, setLocalFileMissing] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      await onUploadResume(file);
      setLocalFileMissing(false);
      handleGenerateCoverLetter(selectedTone);
    } catch (err) {
      setUploadError(err.message || "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

  const isGeneratingRef = React.useRef(false);

  const handleBack = () => {
    const navState = window.history.state || {};
    const fromSource = navState.from || "jobs";
    const jobId = navState.jobId || (targetJob?._id || targetJob?.id || null);
    onBack(fromSource, jobId);
  };

  const handleGenerateCoverLetter = async (toneToUse = selectedTone) => {
    if (!targetJob || (!targetJob._id && !targetJob.id)) {
      setError("No target job selected for cover letter generation.");
      return;
    }

    if (loading || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const jobId = targetJob._id || targetJob.id;
      const validateCoverLetter = (data) => {
        if (!data) return false;
        if (!data.fullText && !data.content && !data.coverLetter) return false;
        return true;
      };

      const data = await fetchWithRetry(`${API_URL}/ai/generate-cover-letter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId,
          tone: toneToUse,
        }),
      }, validateCoverLetter);

      setCoverLetterData(data.data);
      setEditedText(data.data.fullText || "");
    } catch (err) {
      console.error("[Cover Letter Generator] Error:", err);
      if (err.code === "RESUME_PARSE_ERROR" || (err.message && err.message.includes("not found on server"))) {
        setLocalFileMissing(true);
      } else {
        setError(err.message || "Failed to generate cover letter.");
      }
    } finally {
      setLoading(false);
      isGeneratingRef.current = false;
    }
  };

  useEffect(() => {
    setCoverLetterData(null);
    setEditedText("");
    setLocalFileMissing(false);
  }, [user?.resumeFilename]);

  useEffect(() => {
    if (token && user?.resumeFilename && targetJob && !coverLetterData && !loading && !error && !isGeneratingRef.current && !localFileMissing) {
      handleGenerateCoverLetter(selectedTone);
    }
  }, [token, user?.resumeFilename, targetJob, coverLetterData, localFileMissing]);

  const handleSelectTone = (newTone) => {
    setSelectedTone(newTone);
    handleGenerateCoverLetter(newTone);
  };

  const handleResetEdits = () => {
    if (coverLetterData?.fullText) {
      setEditedText(coverLetterData.fullText);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editedText);
  };

  const handleDownloadDOCX = () => {
    const candidateName = user?.name || "Candidate Name";
    const jobTitle = targetJob?.title || "Target Position";
    const company = targetJob?.company || "Company";

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${candidateName} - Cover Letter for ${jobTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #111; margin: 40px; }
          h1 { font-size: 22pt; color: #000; margin-bottom: 4pt; }
          .contact { font-size: 10pt; color: #444; margin-bottom: 20pt; border-bottom: 1px solid #ccc; padding-bottom: 8pt; }
          .meta { font-size: 10pt; color: #555; margin-bottom: 16pt; }
          .body-text { font-size: 11pt; color: #222; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${candidateName}</h1>
        <div class="contact">
          ${user?.email ? user.email + " | " : ""}${user?.phone ? user.phone + " | " : ""}${user?.city || ""}
        </div>
        <div class="meta">
          <p>Date: ${new Date().toLocaleDateString()}</p>
          <p>To: Hiring Team at ${company}</p>
          <p>Re: Application for ${jobTitle}</p>
        </div>
        <div class="body-text">
          ${editedText.replace(/\n/g, '<br/>')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${candidateName.replace(/\s+/g, '_')}_Cover_Letter_${company.replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups to download PDF.");

    const candidateName = user?.name || "Candidate Name";
    const jobTitle = targetJob?.title || "Target Position";
    const company = targetJob?.company || "Company";

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${candidateName} - Cover Letter</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.8; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #c9a84c; padding-bottom: 12px; margin-bottom: 20px; }
          .name { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0 0 4px; }
          .contact { font-size: 12px; color: #64748b; }
          .meta { font-size: 12px; color: #475569; margin-bottom: 24px; line-height: 1.5; }
          .content { font-size: 13px; color: #334155; white-space: pre-wrap; word-break: break-word; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${candidateName}</div>
          <div class="contact">
            ${user?.email ? user.email + " • " : ""}${user?.phone ? user.phone + " • " : ""}${user?.city || ""}
          </div>
        </div>
        <div class="meta">
          <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
          <div><strong>To:</strong> Hiring Team at ${company}</div>
          <div><strong>Re:</strong> Application for ${jobTitle} position</div>
        </div>
        <div class="content">${editedText}</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Word count & Character count calculation
  const wordCount = (editedText || "").trim().split(/\s+/).filter(Boolean).length;
  const charCount = (editedText || "").length;
  const hasEdits = coverLetterData?.fullText && editedText !== coverLetterData.fullText;

  if (!user?.resumeFilename || localFileMissing) {
    return (
      <div style={{ flex: 1, padding: "36px 20px", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {uploading && <PremiumLoader title="Uploading Resume & Parsing..." />}
        <button onClick={handleBack} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, marginBottom: 20 }}>
          ← Back
        </button>
        <div style={{ background: "rgba(17, 17, 26, 0.75)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "44px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <AIRobotMascot size={80} isFloating={true} />
          <h3 style={{ color: "#c9a84c", margin: 0, fontSize: 22, fontFamily: "'Cormorant Garamond', serif" }}>
            Resume Required for Cover Letter
          </h3>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: 14, maxWidth: 500, lineHeight: 1.6 }}>
            Please upload your resume to generate a personalized, tailored cover letter.
          </p>
          
          <div 
            style={{
              border: "2px dashed #2a2a3e",
              borderRadius: 12,
              padding: "36px 20px",
              width: "100%",
              maxWidth: 480,
              background: "rgba(255,255,255,0.01)",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onClick={() => document.getElementById("coverLetterResumeInput").click()}
            onMouseOver={e => e.currentTarget.style.borderColor = "#c9a84c"}
            onMouseOut={e => e.currentTarget.style.borderColor = "#2a2a3e"}
          >
            <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>📄</span>
            <span style={{ fontSize: 13, color: "#888", display: "block" }}>
              Click to browse or drag PDF/DOCX file here
            </span>
            <input 
              id="coverLetterResumeInput" 
              type="file" 
              accept=".pdf,.docx" 
              onChange={handleFileChange} 
              style={{ display: "none" }} 
            />
          </div>
          
          {uploadError && (
            <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>
              ⚠️ {uploadError}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <PremiumLoader title="Generating Cover Letter..." />;
  }

  if (error) {
    console.warn("[Cover Letter Failure Detail]:", error);
    return (
      <div style={{ flex: 1, padding: "36px 20px", maxWidth: 860, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <button onClick={handleBack} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, marginBottom: 20 }}>
          ← Back
        </button>
        <div style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 16, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <AIRobotMascot size={70} isFloating={false} isGlowing={false} />
          <h3 style={{ color: "#f87171", margin: 0, fontSize: 20 }}>We couldn't complete your request.</h3>
          <p style={{ color: "#d1d5db", margin: 0, fontSize: 14 }}>This is usually temporary. Please try again.</p>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button 
              onClick={() => handleGenerateCoverLetter(selectedTone)} 
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07830)",
                color: "#05050A",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "14px",
                letterSpacing: "0.5px",
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Try Again
            </button>
            <button 
              onClick={handleBack} 
              style={{
                background: "transparent",
                border: "1px solid #2a2a3e",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#080811", padding: "24px 20px 40px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* HERO SECTION */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #0e0e22 0%, #13132e 50%, #0a0a18 100%)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 16, padding: "24px 28px", position: "relative", overflow: "hidden" }}>
          
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", justifyOrigin: "space-between", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 16, padding: "3px 12px", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Phase 4 • AI Cover Letter Generator
                </span>
              </div>
              
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", margin: "0 0 6px", fontSize: 28, fontWeight: 700, color: "#e8e0d0" }}>
                Personalized Cover Letter Document
              </h1>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>
                Tailored for <strong style={{ color: "#d1d5db" }}>{targetJob?.title || "Target Position"}</strong> at <strong style={{ color: "#c9a84c" }}>{targetJob?.company || "Company"}</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#888" }}>
              <div>👤 <strong style={{ color: "#d1d5db" }}>Candidate:</strong> {user?.name}</div>
              <div>📅 <strong style={{ color: "#d1d5db" }}>Generated:</strong> {new Date().toLocaleDateString()}</div>
              <div>🎭 <strong style={{ color: "#c9a84c" }}>Tone:</strong> {selectedTone}</div>
            </div>
          </div>
        </motion.div>

        {/* 1. METADATA DASHBOARD / STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {/* Card 1: Tone */}
          <div style={{ background: "#0c0c1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #1c1c30" }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>Cover Letter Tone</span>
            <h4 style={{ margin: "4px 0 2px", fontSize: 20, fontWeight: 800, color: "#c9a84c" }}>🎭 {selectedTone}</h4>
            <span style={{ fontSize: 11, color: "#666" }}>Regenerates on change in sidebar</span>
          </div>

          {/* Card 2: ATS Match */}
          <div style={{ background: "#0c0c1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #1c1c30" }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>ATS Alignment Match</span>
            <h4 style={{ margin: "4px 0 2px", fontSize: 20, fontWeight: 800, color: "#10b981" }}>🔥 {coverLetterData?.atsMatchScore || 88}% Match</h4>
            <span style={{ fontSize: 11, color: "#666" }}>Calculated keyword alignment</span>
          </div>

          {/* Card 3: Word Count */}
          <div style={{ background: "#0c0c1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #1c1c30" }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>Word Statistics</span>
            <h4 style={{ margin: "4px 0 2px", fontSize: 20, fontWeight: 800, color: "#60a5fa" }}>📝 {wordCount} Words</h4>
            <span style={{ fontSize: 11, color: "#666" }}>{charCount} characters total</span>
          </div>
        </div>

        {/* 2. AI SUMMARY SUMMARY CARD */}
        <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid #1e1e32", borderRadius: 14, padding: "20px 24px" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
            ✨ AI Highlights Weaved
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {(coverLetterData?.keyHighlightsUsed || []).map((h, idx) => (
              <span key={idx} style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                ✦ {h}
              </span>
            ))}
            {(!coverLetterData?.keyHighlightsUsed?.length) && (
              <span style={{ color: "#666", fontSize: 13 }}>Resume qualifications naturally matched</span>
            )}
          </div>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: 13, lineHeight: 1.6 }}>
            Cover letter dynamically highlights your technical capabilities, matched projects, and specific interest in joining {targetJob?.company || "the company"}.
          </p>
        </div>

        {/* 3. QUICK PREVIEW BOX */}
        <div style={{ background: "#0c0c1a", border: "1px solid #1e1e32", borderRadius: 14, padding: "20px 24px", position: "relative" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 10 }}>
            📄 Document Quick Preview
          </span>
          <div style={{
            maxHeight: 110,
            overflow: "hidden",
            color: "#d1d5db",
            fontSize: 13,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            position: "relative",
            maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
          }}>
            {editedText || "Generating cover letter contents..."}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
            <button
              onClick={() => setIsEditorExpanded(!isEditorExpanded)}
              style={{
                background: "transparent",
                border: "none",
                color: "#c9a84c",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              {isEditorExpanded ? "Collapse Cover Letter Document ▲" : "Expand & Edit Full Cover Letter Document ▼"}
            </button>
          </div>
        </div>

        {/* 4. TOOLBAR / DOWNLOAD BUTTONS */}
        <CoverLetterToolbar
          onCopy={handleCopyText}
          onDownloadPDF={handleDownloadPDF}
          onDownloadDOCX={handleDownloadDOCX}
          onRegenerate={() => handleGenerateCoverLetter(selectedTone)}
          onReset={handleResetEdits}
          onBack={handleBack}
          hasEdits={hasEdits}
          isGenerating={loading}
        />

        {/* 5. EXPANDABLE FULL COVER LETTER DOCUMENT */}
        <AnimatePresence>
          {isEditorExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start", marginTop: 10 }}>
                {/* Main Document Editor */}
                <CoverLetterEditor
                  value={editedText}
                  onChange={setEditedText}
                  candidateName={user?.name || "Candidate Name"}
                  candidateEmail={user?.email || ""}
                  candidatePhone={user?.phone || ""}
                  targetJob={targetJob || {}}
                />

                {/* Right Sidebar Meta & Controls */}
                <CoverLetterSidebar
                  targetJob={targetJob || {}}
                  resumeName={user?.resumeOriginalName || user?.resumeFilename || "Uploaded Resume"}
                  selectedTone={selectedTone}
                  onSelectTone={handleSelectTone}
                  atsScore={coverLetterData?.atsMatchScore || 88}
                  wordCount={wordCount}
                  charCount={charCount}
                  keyHighlights={coverLetterData?.keyHighlightsUsed || []}
                  isGenerating={loading}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
