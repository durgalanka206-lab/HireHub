import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ResumeSectionCard from '../components/ResumeSectionCard';
import OptimizationScore from '../components/OptimizationScore';
import ResumeComparison from '../components/ResumeComparison';
import ImprovementTimeline from '../components/ImprovementTimeline';
import ResumePreview from '../components/ResumePreview';
import AcceptOptimizationBar from '../components/AcceptOptimizationBar';
import { fetchWithRetry } from '../utils/fetchHardening';
import AIRobotMascot from '../components/AIRobotMascot';
import PremiumLoader from '../components/PremiumLoader';

/**
 * AI Resume Optimizer Page — /ai/resume-optimizer
 * Concise, premium AI SaaS dashboard design with tabbed detailed views.
 */
export default function ResumeOptimizerPage({
  user,
  token,
  targetJob,
  onBack,
  onUploadResume,
  API_URL,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [optimizationData, setOptimizationData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "preview"
  const [activeExpTab, setActiveExpTab] = useState("experience"); // "experience" | "projects"
  const [isAccepted, setIsAccepted] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState("summary"); // "summary" | "skills" | "experience" | "audit" | "jobspecific"
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
      handleRunOptimization();
    } catch (err) {
      setUploadError(err.message || "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

  const isRunningRef = React.useRef(false);

  const handleBack = () => {
    const navState = window.history.state || {};
    const fromSource = navState.from || "profile";
    const jobId = navState.jobId || (targetJob?._id || targetJob?.id || null);
    onBack(fromSource, jobId);
  };

  const handleRunOptimization = async () => {
    if (loading || isRunningRef.current) return;
    isRunningRef.current = true;
    setLoading(true);
    setError("");

    try {
      const validateResumeOptimizer = (data) => {
        if (!data) return false;
        // Backend returns: professionalSummary, skills, experience, projects, improvements
        if (!data.professionalSummary && !data.skills && !data.experience) return false;
        return true;
      };

      const data = await fetchWithRetry(`${API_URL}/ai/optimize-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: targetJob?._id || targetJob?.id || null,
        }),
      }, validateResumeOptimizer);

      setOptimizationData(data.data);
    } catch (err) {
      console.error("[Resume Optimizer] Error:", err);
      if (err.code === "RESUME_PARSE_ERROR" || (err.message && err.message.includes("not found on server"))) {
        setLocalFileMissing(true);
      } else {
        setError(err.message || "Failed to analyze and optimize resume.");
      }
    } finally {
      setLoading(false);
      isRunningRef.current = false;
    }
  };

  useEffect(() => {
    setOptimizationData(null);
    setLocalFileMissing(false);
  }, [user?.resumeFilename]);

  useEffect(() => {
    if (token && user?.resumeFilename && !optimizationData && !loading && !error && !isRunningRef.current && !localFileMissing) {
      handleRunOptimization();
    }
  }, [token, user?.resumeFilename, targetJob, optimizationData, localFileMissing]);

  const handleAcceptOptimization = () => {
    setIsAccepted(true);
    setActiveTab("preview");
  };

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
            Resume Required for Optimization
          </h3>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: 14, maxWidth: 500, lineHeight: 1.6 }}>
            Please upload your resume to generate a targeted, AI-powered optimization report.
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
            onClick={() => document.getElementById("optimizerResumeInput").click()}
            onMouseOver={e => e.currentTarget.style.borderColor = "#c9a84c"}
            onMouseOut={e => e.currentTarget.style.borderColor = "#2a2a3e"}
          >
            <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>📄</span>
            <span style={{ fontSize: 13, color: "#888", display: "block" }}>
              Click to browse or drag PDF/DOCX file here
            </span>
            <input 
              id="optimizerResumeInput" 
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
    return <PremiumLoader title="Optimizing Your Resume..." />;
  }

  if (error) {
    console.warn("[Resume Optimizer Failure Detail]:", error);
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
              onClick={handleRunOptimization} 
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

  const {
    currentAtsScore = 78,
    optimizedAtsScore = 91,
    overallAiSummary = {},
    professionalSummary = {},
    skills = {},
    experience = [],
    projects = [],
    improvements = {},
    jobSpecificOptimization = {},
  } = optimizationData || {};

  const diffScore = (optimizedAtsScore || 91) - (currentAtsScore || 78);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#080811", padding: "18px 16px 32px", boxSizing: "border-box", position: "relative" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Top Header Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {targetJob ? (
              <span style={{ fontSize: 11, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                🎯 Role Tailored: {targetJob.title} ({targetJob.company})
              </span>
            ) : (
              <span style={{ fontSize: 11, background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                ✨ General ATS Baseline Optimization
              </span>
            )}
          </div>
        </div>

        {/* HERO SECTION: Executive ATS Improvement Summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #0e0e22 0%, #13132e 50%, #0a0a18 100%)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 12, padding: "20px 24px", position: "relative", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
          
          <div style={{ position: "absolute", top: -70, right: -70, width: 240, height: 240, background: "radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "3px 10px", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "#c9a84c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Phase 3 • Executive AI Resume Report
                </span>
              </div>
              
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "#e8e0d0" }}>
                AI Resume Optimization Executive Summary
              </h1>

              {/* Before vs After / Executive Summary Box */}
              <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e1e32", marginTop: 6 }}>
                <p style={{ margin: 0, color: "#d1d5db", fontSize: 12, lineHeight: 1.6 }}>
                  {overallAiSummary.whatWasImproved || "Resume reorganized and reworded for maximum ATS compatibility and professional impact."}
                </p>
              </div>
            </div>

            {/* ATS Score Improvement Badge */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.02)", padding: "14px 18px", borderRadius: 12, border: "1px solid #1e1e32", minWidth: 140 }}>
              <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                ATS SCORE UPGRADE
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ fontSize: 21, fontWeight: 800, color: "#888" }}>{currentAtsScore}</span>
                <span style={{ fontSize: 16, color: "#c9a84c", fontWeight: 800 }}>➜</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#10b981" }}>{optimizedAtsScore}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#10b981", background: "rgba(16,185,129,0.18)", padding: "2px 10px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.4)" }}>
                +{diffScore} ATS Improvement
              </span>
            </div>
          </div>
        </motion.div>

        {/* View Mode Tabs */}
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #1e1e32", paddingBottom: 8 }}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: activeTab === "overview" ? "1px solid rgba(201,168,76,0.4)" : "1px solid transparent",
              background: activeTab === "overview" ? "rgba(201,168,76,0.15)" : "transparent",
              color: activeTab === "overview" ? "#c9a84c" : "#888",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📊 Optimization Report & Diff View
          </button>
          
          <button
            onClick={() => {
              if (isAccepted) {
                setActiveTab("preview");
              } else {
                alert("Please review the proposed changes and click 'Accept Optimization' to unlock the live preview.");
              }
            }}
            title={!isAccepted ? "Accept optimization to unlock preview & download" : "View preview"}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: activeTab === "preview" ? "1px solid rgba(16,185,129,0.4)" : "1px solid transparent",
              background: activeTab === "preview" ? "rgba(16,185,129,0.15)" : "transparent",
              color: activeTab === "preview" ? "#10b981" : isAccepted ? "#d1d5db" : "#555",
              fontSize: 12,
              fontWeight: 700,
              cursor: isAccepted ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {!isAccepted ? "🔒 Live Preview & Download (Locked)" : "📄 Live Preview & Download (Unlocked)"}
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            {/* 5. INTERACTIVE SECTION TABS */}
            <div style={{ background: "#0c0c1a", borderRadius: 12, border: "1px solid #1e1e32", overflow: "hidden" }}>
              {/* Tab Selector Header */}
              <div style={{ display: "flex", borderBottom: "1px solid #1e1e32", background: "#0a0a14", overflowX: "auto" }}>
                {[
                  { id: "summary", label: "✍️ Professional Summary" },
                  { id: "skills", label: "🔑 Skills & Keywords" },
                  { id: "experience", label: "💼 Work Experience & Projects" },
                  { id: "audit", label: "⚡ Quality Audit" },
                  ...(jobSpecificOptimization.isJobSpecific ? [{ id: "jobspecific", label: "🎯 Job-Specific Details" }] : [])
                ].map(t => {
                  const active = activeDetailsTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveDetailsTab(t.id)}
                      style={{
                        padding: "11px 18px",
                        background: active ? "rgba(201,168,76,0.1)" : "transparent",
                        color: active ? "#c9a84c" : "#888",
                        border: "none",
                        borderBottom: active ? "3px solid #c9a84c" : "3px solid transparent",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panel */}
              <div style={{ padding: "18px 22px", boxSizing: "border-box" }}>
                
                {/* Tab: Professional Summary */}
                {activeDetailsTab === "summary" && (
                  <ResumeSectionCard
                    icon="✍️"
                    sectionNumber="1"
                    title="Professional Summary Optimization"
                    subtitle="Truthfully reworded for maximum ATS parser attraction"
                    badge={{ text: "Summary Enhanced", bg: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "rgba(96,165,250,0.3)" }}
                  >
                    <ResumeComparison
                      currentText={professionalSummary.current}
                      optimizedText={professionalSummary.optimized}
                    />
                  </ResumeSectionCard>
                )}

                {/* Tab: Skills & Keywords */}
                {activeDetailsTab === "skills" && (
                  <ResumeSectionCard
                    icon="🔑"
                    sectionNumber="2"
                    title="Skills & Keyword Optimization"
                    subtitle="Recommended skill ordering, ATS keywords, and industry terminology"
                    badge={{ text: `${skills.atsKeywords?.length || 0} ATS Keywords`, bg: "rgba(16,185,129,0.12)", color: "#10b981", border: "rgba(16,185,129,0.3)" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Recommended Skill Ordering */}
                      <div style={{ background: "#0c0c1a", padding: "11px 13px", borderRadius: 10, border: "1px solid #1e1e32" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Recommended Skill Ordering
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                          {(skills.recommendedOrdering || skills.currentSkills || []).map((sk, idx) => (
                            <span key={idx} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", borderRadius: 16, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                              {idx + 1}. {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ATS Keywords & Industry Keywords */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
                        <div style={{ background: "#0c0c1a", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.25)" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Recommended ATS Keywords
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                            {(skills.atsKeywords || []).map((kw, idx) => (
                              <span key={idx} style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>
                                ✓ {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ background: "#0c0c1a", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.25)" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Industry Standard Terms
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                            {(skills.industryKeywords || []).map((ik, idx) => (
                              <span key={idx} style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>
                                ✦ {ik}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Keyword Rationale */}
                      {skills.keywordReasoning && (
                        <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "11px" }}>
                          <span style={{ fontSize: 11, fontWeight: 750, color: "#c9a84c", display: "block", marginBottom: 6 }}>
                            💡 Keyword Rationale & Alignment Details
                          </span>
                          <p style={{ margin: 0, color: "#d1d5db", fontSize: 12, lineHeight: 1.6 }}>
                            {skills.keywordReasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  </ResumeSectionCard>
                )}

                {/* Tab: Work Experience & Projects */}
                {activeDetailsTab === "experience" && (
                  <ResumeSectionCard
                    icon="💼"
                    sectionNumber="3"
                    title="Experience & Projects Diff Optimization"
                    subtitle="Rephrased bullet points and project descriptions with GitHub-style word diff"
                    badge={{ text: `${experience.reduce((acc, e) => acc + (e.bullets?.length || 0), 0)} Bullets`, bg: "rgba(251,146,60,0.12)", color: "#fb923c", border: "rgba(251,146,60,0.3)" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Exp vs Projects Subtabs */}
                      <div style={{ display: "flex", gap: 8, background: "#0c0c1a", padding: 3, borderRadius: 8, width: "fit-content", border: "1px solid #1e1e32" }}>
                        <button
                          onClick={() => setActiveExpTab("experience")}
                          style={{
                            padding: "5px 14px",
                            borderRadius: 6,
                            border: "none",
                            background: activeExpTab === "experience" ? "rgba(201,168,76,0.2)" : "transparent",
                            color: activeExpTab === "experience" ? "#c9a84c" : "#888",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          💼 Work Experience ({experience.length})
                        </button>
                        <button
                          onClick={() => setActiveExpTab("projects")}
                          style={{
                            padding: "5px 14px",
                            borderRadius: 6,
                            border: "none",
                            background: activeExpTab === "projects" ? "rgba(201,168,76,0.2)" : "transparent",
                            color: activeExpTab === "projects" ? "#c9a84c" : "#888",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          🚀 Projects ({projects.length})
                        </button>
                      </div>

                      {activeExpTab === "experience" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {experience.map((exp, eIdx) => (
                            <div key={eIdx} style={{ background: "rgba(255,255,255,0.015)", padding: "11px 13px", borderRadius: 10, border: "1px solid #1a1a2e" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyOrigin: "space-between", justifyContent: "space-between", marginBottom: 10 }}>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: 14, color: "#e8e0d0", fontWeight: 700 }}>
                                    {exp.role}
                                  </h4>
                                  <span style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600 }}>{exp.company}</span>
                                </div>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {exp.bullets.map((b, bIdx) => (
                                  <ResumeComparison
                                    key={bIdx}
                                    currentText={b.currentBullet}
                                    optimizedText={b.optimizedBullet}
                                    title={`Bullet #${bIdx + 1}`}
                                    explanation={b.improvementExplanation}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {projects.map((proj, pIdx) => (
                            <div key={pIdx} style={{ background: "rgba(255,255,255,0.015)", padding: "11px 13px", borderRadius: 10, border: "1px solid #1a1a2e" }}>
                              <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#e8e0d0", fontWeight: 700 }}>
                                🚀 {proj.name}
                              </h4>
                              <ResumeComparison
                                currentText={proj.currentDescription}
                                optimizedText={proj.optimizedDescription}
                                actionVerbs={proj.actionVerbsUsed}
                                measurableImpact={proj.measurableImpact}
                                explanation={proj.atsWordingImprovements}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ResumeSectionCard>
                )}

                {/* Tab: Quality Audit */}
                {activeDetailsTab === "audit" && (
                  <ResumeSectionCard
                    icon="⚡"
                    sectionNumber="4"
                    title="Resume Improvements Audit"
                    subtitle="6-category quality audit across Grammar, Formatting, Keywords, Action Verbs, Readability, and Gaps"
                  >
                    <ImprovementTimeline improvements={improvements} />
                  </ResumeSectionCard>
                )}

                {/* Tab: Job-Specific Details */}
                {activeDetailsTab === "jobspecific" && jobSpecificOptimization.isJobSpecific && (
                  <ResumeSectionCard
                    icon="🎯"
                    sectionNumber="5"
                    title="Job-Specific Optimization Details"
                    subtitle={`Tailored for ${jobSpecificOptimization.jobTitle} at ${jobSpecificOptimization.company}`}
                    borderColor="rgba(16,185,129,0.35)"
                    badge={{ text: "Role Specific", bg: "rgba(16,185,129,0.15)", color: "#10b981", border: "rgba(16,185,129,0.4)" }}
                  >
                    <div style={{ background: "#0c0c1a", padding: "11px", borderRadius: 10, border: "1px solid #1e1e32" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Role Match Highlights
                      </span>
                      <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "#d1d5db", fontSize: 12 }}>
                        {(jobSpecificOptimization.matchHighlights || []).map((item, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </ResumeSectionCard>
                )}

              </div>
            </div>

            {/* Sticky Accept Optimization Review Flow Bar */}
            <AcceptOptimizationBar
              isAccepted={isAccepted}
              onAccept={handleAcceptOptimization}
              onTogglePreview={setActiveTab}
              activeTab={activeTab}
              onBack={handleBack}
            />
          </>
        ) : (
          /* PREVIEW TAB */
          <ResumePreview
            user={user}
            optimizationData={optimizationData}
          />
        )}

      </div>
    </div>
  );
}
