import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ResumeSectionCard from '../components/ResumeSectionCard';
import OptimizationScore from '../components/OptimizationScore';
import ResumeComparison from '../components/ResumeComparison';
import ImprovementTimeline from '../components/ImprovementTimeline';
import ResumePreview from '../components/ResumePreview';
import AcceptOptimizationBar from '../components/AcceptOptimizationBar';
import { S } from '../components/UI';

/**
 * AI Resume Optimizer Page — /ai/resume-optimizer
 * Concise, premium AI SaaS dashboard design with tabbed detailed views.
 */
export default function ResumeOptimizerPage({
  user,
  token,
  targetJob,
  onBack,
  API_URL,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [optimizationData, setOptimizationData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "preview"
  const [activeExpTab, setActiveExpTab] = useState("experience"); // "experience" | "projects"
  const [isAccepted, setIsAccepted] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState("summary"); // "summary" | "skills" | "experience" | "audit" | "jobspecific"

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
      const res = await fetch(`${API_URL}/ai/optimize-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: targetJob?._id || targetJob?.id || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || "Failed to generate resume optimization.");
      }

      setOptimizationData(data.data);
    } catch (err) {
      console.error("[Resume Optimizer] Error:", err);
      setError(err.message || "Failed to analyze and optimize resume.");
    } finally {
      setLoading(false);
      isRunningRef.current = false;
    }
  };

  useEffect(() => {
    if (token && user?.resumeFilename && !optimizationData && !loading && !error && !isRunningRef.current) {
      handleRunOptimization();
    }
  }, [token, user?.resumeFilename, targetJob]);

  const handleAcceptOptimization = () => {
    setIsAccepted(true);
    setActiveTab("preview");
  };

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "36px 20px", maxWidth: 1000, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <button onClick={handleBack} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          ← Back
        </button>

        <div style={{ background: "linear-gradient(135deg, #0d0d1f 0%, #111128 100%)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "44px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #1e1e30", borderTopColor: "#c9a84c", animation: "spin 0.9s linear infinite" }} />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "#e8e0d0", margin: 0, fontSize: 24 }}>
            ✨ Generating Executive Resume Report…
          </h2>
          <p style={{ color: "#888", fontSize: 13, margin: 0, maxWidth: 480 }}>
            {targetJob ? `Optimizing summary, bullet points, and keywords specifically for ${targetJob.title} at ${targetJob.company}…` : "Performing deep ATS parsing analysis and action verb enhancement…"}
          </p>
          <div style={{ width: "100%", maxWidth: 480, height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #c9a84c, #10b981)", width: "70%", borderRadius: 3, animation: "pulse 1.5s infinite" }} />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{ opacity:0.6 } 50%{ opacity:1 } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, padding: "36px 20px", maxWidth: 860, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <button onClick={handleBack} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, marginBottom: 20 }}>
          ← Back
        </button>
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 16, padding: "32px", textAlign: "center" }}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 10 }}>⚠️</span>
          <h3 style={{ color: "#f87171", margin: "0 0 8px", fontSize: 20 }}>Optimization Report Failed</h3>
          <p style={{ color: "#d1d5db", margin: "0 0 18px", fontSize: 14 }}>{error}</p>
          <button onClick={handleRunOptimization} style={{ ...S.btn, margin: "0 auto" }}>
            🔄 Retry Optimization
          </button>
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
    <div style={{ flex: 1, overflowY: "auto", background: "#080811", padding: "24px 20px 40px", boxSizing: "border-box", position: "relative" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Top Header Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <button onClick={handleBack} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {targetJob ? (
              <span style={{ fontSize: 12, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>
                🎯 Role Tailored: {targetJob.title} ({targetJob.company})
              </span>
            ) : (
              <span style={{ fontSize: 12, background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>
                ✨ General ATS Baseline Optimization
              </span>
            )}
          </div>
        </div>

        {/* HERO SECTION: Executive ATS Improvement Summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #0e0e22 0%, #13132e 50%, #0a0a18 100%)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 16, padding: "24px 28px", position: "relative", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
          
          <div style={{ position: "absolute", top: -70, right: -70, width: 240, height: 240, background: "radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "3px 12px", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#c9a84c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Phase 3 • Executive AI Resume Report
                </span>
              </div>
              
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#e8e0d0" }}>
                AI Resume Optimization Executive Summary
              </h1>

              {/* Before vs After / Executive Summary Box */}
              <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "12px 16px", border: "1px solid #1e1e32", marginTop: 8 }}>
                <p style={{ margin: 0, color: "#d1d5db", fontSize: 13, lineHeight: 1.6 }}>
                  {overallAiSummary.whatWasImproved || "Resume reorganized and reworded for maximum ATS compatibility and professional impact."}
                </p>
              </div>
            </div>

            {/* ATS Score Improvement Badge */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.02)", padding: "18px 22px", borderRadius: 14, border: "1px solid #1e1e32", minWidth: 160 }}>
              <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                ATS SCORE UPGRADE
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#888" }}>{currentAtsScore}</span>
                <span style={{ fontSize: 18, color: "#c9a84c", fontWeight: 800 }}>➜</span>
                <span style={{ fontSize: 30, fontWeight: 900, color: "#10b981" }}>{optimizedAtsScore}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", background: "rgba(16,185,129,0.18)", padding: "3px 12px", borderRadius: 12, border: "1px solid rgba(16,185,129,0.4)" }}>
                +{diffScore} ATS Improvement
              </span>
            </div>
          </div>
        </motion.div>

        {/* View Mode Tabs */}
        <div style={{ display: "flex", gap: 10, borderBottom: "1px solid #1e1e32", paddingBottom: 10 }}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: activeTab === "overview" ? "1px solid rgba(201,168,76,0.4)" : "1px solid transparent",
              background: activeTab === "overview" ? "rgba(201,168,76,0.15)" : "transparent",
              color: activeTab === "overview" ? "#c9a84c" : "#888",
              fontSize: 13,
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
              padding: "8px 20px",
              borderRadius: 8,
              border: activeTab === "preview" ? "1px solid rgba(16,185,129,0.4)" : "1px solid transparent",
              background: activeTab === "preview" ? "rgba(16,185,129,0.15)" : "transparent",
              color: activeTab === "preview" ? "#10b981" : isAccepted ? "#d1d5db" : "#555",
              fontSize: 13,
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
            <div style={{ background: "#0c0c1a", borderRadius: 16, border: "1px solid #1e1e32", overflow: "hidden" }}>
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
                        padding: "14px 22px",
                        background: active ? "rgba(201,168,76,0.1)" : "transparent",
                        color: active ? "#c9a84c" : "#888",
                        border: "none",
                        borderBottom: active ? "3px solid #c9a84c" : "3px solid transparent",
                        fontSize: 13,
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
              <div style={{ padding: "24px 28px", boxSizing: "border-box" }}>
                
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* Recommended Skill Ordering */}
                      <div style={{ background: "#0c0c1a", padding: "14px 16px", borderRadius: 10, border: "1px solid #1e1e32" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Recommended Skill Ordering
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          {(skills.recommendedOrdering || skills.currentSkills || []).map((sk, idx) => (
                            <span key={idx} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", borderRadius: 16, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
                              {idx + 1}. {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ATS Keywords & Industry Keywords */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                        <div style={{ background: "#0c0c1a", padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.25)" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Recommended ATS Keywords
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {(skills.atsKeywords || []).map((kw, idx) => (
                              <span key={idx} style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 600 }}>
                                ✓ {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ background: "#0c0c1a", padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.25)" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Industry Standard Terms
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {(skills.industryKeywords || []).map((ik, idx) => (
                              <span key={idx} style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 600 }}>
                                ✦ {ik}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Keyword Rationale */}
                      {skills.keywordReasoning && (
                        <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "14px" }}>
                          <span style={{ fontSize: 12, fontWeight: 750, color: "#c9a84c", display: "block", marginBottom: 6 }}>
                            💡 Keyword Rationale & Alignment Details
                          </span>
                          <p style={{ margin: 0, color: "#d1d5db", fontSize: 13, lineHeight: 1.6 }}>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* Exp vs Projects Subtabs */}
                      <div style={{ display: "flex", gap: 8, background: "#0c0c1a", padding: 4, borderRadius: 8, width: "fit-content", border: "1px solid #1e1e32" }}>
                        <button
                          onClick={() => setActiveExpTab("experience")}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 6,
                            border: "none",
                            background: activeExpTab === "experience" ? "rgba(201,168,76,0.2)" : "transparent",
                            color: activeExpTab === "experience" ? "#c9a84c" : "#888",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          💼 Work Experience ({experience.length})
                        </button>
                        <button
                          onClick={() => setActiveExpTab("projects")}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 6,
                            border: "none",
                            background: activeExpTab === "projects" ? "rgba(201,168,76,0.2)" : "transparent",
                            color: activeExpTab === "projects" ? "#c9a84c" : "#888",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          🚀 Projects ({projects.length})
                        </button>
                      </div>

                      {activeExpTab === "experience" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {experience.map((exp, eIdx) => (
                            <div key={eIdx} style={{ background: "rgba(255,255,255,0.015)", padding: "14px 16px", borderRadius: 10, border: "1px solid #1a1a2e" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyOrigin: "space-between", justifyContent: "space-between", marginBottom: 10 }}>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: 15, color: "#e8e0d0", fontWeight: 700 }}>
                                    {exp.role}
                                  </h4>
                                  <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 600 }}>{exp.company}</span>
                                </div>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {projects.map((proj, pIdx) => (
                            <div key={pIdx} style={{ background: "rgba(255,255,255,0.015)", padding: "14px 16px", borderRadius: 10, border: "1px solid #1a1a2e" }}>
                              <h4 style={{ margin: "0 0 10px", fontSize: 15, color: "#e8e0d0", fontWeight: 700 }}>
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
                    <div style={{ background: "#0c0c1a", padding: "14px", borderRadius: 10, border: "1px solid #1e1e32" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Role Match Highlights
                      </span>
                      <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "#d1d5db", fontSize: 13 }}>
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
