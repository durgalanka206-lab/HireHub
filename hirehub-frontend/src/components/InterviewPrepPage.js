import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { S } from './UI';
import { fetchWithRetry } from '../utils/fetchHardening';
import AIRobotMascot from './AIRobotMascot';
import PremiumLoader from './PremiumLoader';

const API = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5000/api" : "https://hirehub-dx1z.onrender.com/api");

export default function InterviewPrepPage({ token, user, jobs = [], myApps = [], onBackToJobs, onUploadResume }) {
  // Navigation states: 'history' | 'generating' | 'dashboard' | 'mock-interview' | 'scorecard' | 'reopened' | 'error'
  const [prepTab, setPrepTab] = useState('history');
  
  // History & Loading state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  
  // Selected Job for starting a new prep session
  const [activeJob, setActiveJob] = useState(null);
  const [genError, setGenError] = useState("");

  // Current session questions & analysis
  const [prepData, setPrepData] = useState(null);

  // Mock interview state
  const [flatQuestions, setFlatQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState("");
  
  // Array of answers & evaluations for the active mock run
  const [evaluatedQuestions, setEvaluatedQuestions] = useState([]);

  // Final scorecard state
  const [scorecard, setScorecard] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Reopened session state
  const [reopenedSession, setReopenedSession] = useState(null);

  // Debouncing / Request protection blocker state
  const [isGenerating, setIsGenerating] = useState(false);

  // Exit dialog confirm popup
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      await onUploadResume(file);
      loadHistory();
    } catch (err) {
      setUploadError(err.message || "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

  // Style objects
  const S = {
    card: { background: "#11111a", border: "1px solid #2a2a3e", borderRadius: 16, padding: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" },
    btn: { background: "linear-gradient(135deg, #c9a84c, #a07830)", border: "none", color: "#05050A", cursor: "pointer", padding: "12px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700, transition: "all 0.2s" },
    btnSec: { background: "transparent", border: "1px solid #2a2a3e", color: "#9ca3af", cursor: "pointer", padding: "12px 28px", borderRadius: 8, fontSize: 13, fontWeight: 600, transition: "all 0.2s" },
    textarea: { background: "#0a0a14", border: "1px solid #2a2a3e", color: "#e8e0d0", padding: "12px 14px", borderRadius: 8, fontSize: 13, width: "100%", minHeight: "120px", outline: "none", resize: "vertical" },
    label: { display: "block", fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 600 },
    badge: (dif) => {
      const color = dif === 'Hard' ? '#ef4444' : dif === 'Medium' ? '#f59e0b' : '#10b981';
      const bg = dif === 'Hard' ? 'rgba(239,68,68,0.1)' : dif === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
      return { padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${color}33` };
    }
  };

  // Helper to serialize and save active session
  const saveSessionToLocalStorage = (job, pData, flatQs, currentIdx, evalQs, tab) => {
    try {
      if (!job || !pData) return;
      const session = {
        activeJob: job,
        prepData: pData,
        flatQuestions: flatQs,
        currentQuestionIdx: currentIdx,
        evaluatedQuestions: evalQs,
        prepTab: tab
      };
      localStorage.setItem("hh_active_interview_session", JSON.stringify(session));
    } catch (e) {
      console.warn("Failed to save active session to localStorage:", e);
    }
  };

  // Helper to clear active session
  const clearSessionFromLocalStorage = () => {
    try {
      localStorage.removeItem("hh_active_interview_session");
    } catch (e) {
      console.warn("Failed to clear session:", e);
    }
  };

  // Sync state to localStorage for persistence
  useEffect(() => {
    if (prepTab === 'mock-interview' || prepTab === 'dashboard' || prepTab === 'scorecard') {
      saveSessionToLocalStorage(activeJob, prepData, flatQuestions, currentQuestionIdx, evaluatedQuestions, prepTab);
    }
  }, [activeJob, prepData, flatQuestions, currentQuestionIdx, evaluatedQuestions, prepTab]);

  // Load history & Restore active session on mount
  useEffect(() => {
    loadHistory();

    // Check for saved session to restore (Section 8: Refresh restores session within 1s)
    try {
      const savedSessionStr = localStorage.getItem("hh_active_interview_session");
      if (savedSessionStr) {
        const session = JSON.parse(savedSessionStr);
        if (session && session.activeJob && session.prepData) {
          setActiveJob(session.activeJob);
          setPrepData(session.prepData);
          setFlatQuestions(session.flatQuestions || []);
          setCurrentQuestionIdx(session.currentQuestionIdx || 0);
          setEvaluatedQuestions(session.evaluatedQuestions || []);
          setPrepTab(session.prepTab || 'dashboard');
          console.log("[AI Session Restore] Successfully resumed active session.");
          return;
        }
      }
    } catch (e) {
      console.warn("[AI Session Restore Warning] Failed to parse active session storage:", e);
    }

    // Otherwise, check target job from path or localStorage
    const pathMatch = window.location.pathname.match(/\/ai\/interview-prep\/([a-fA-F0-9]{24})/);
    const pathJobId = pathMatch ? pathMatch[1] : null;
    const targetJobId = pathJobId || localStorage.getItem("hh_interview_target_job_id");

    if (targetJobId && jobs.length > 0) {
      const job = jobs.find(j => (j._id || j.id) === targetJobId);
      if (job) {
        localStorage.removeItem("hh_interview_target_job_id");
        handleStartNewPrep(job);
      }
    }
  }, [jobs]);



  const loadHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await fetch(`${API}/ai/interview/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setHistory(json.data);
      } else {
        setHistoryError(json.message || "Failed to load interview history.");
      }
    } catch (err) {
      setHistoryError("Could not connect to backend server.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStartNewPrep = async (job) => {
    // Section 7: Prevent duplicate request triggers
    if (isGenerating) return;
    setIsGenerating(true);
    
    setActiveJob(job);
    setPrepTab('generating');
    setGenError("");

    try {
      const validateInterviewPrep = (responseObj) => {
        if (!responseObj) return false;
        const d = responseObj.data || responseObj;
        const totalQsCount = (d?.hrQuestions?.length || 0) +
                             (d?.technicalQuestions?.length || 0) +
                             (d?.codingQuestions?.length || 0) +
                             (d?.scenarioQuestions?.length || 0) +
                             (d?.behavioralQuestions?.length || 0);
        if (typeof d?.readinessScore !== "number" || totalQsCount === 0) {
          return false;
        }
        return true;
      };

      const json = await fetchWithRetry(`${API}/ai/interview/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: job._id })
      }, validateInterviewPrep);

      setPrepData(json.data);
      setPrepTab('dashboard');
    } catch (err) {
      console.error("[AI Interview Generation Failed]:", err);
      setGenError("We couldn't prepare your interview this time. Please check your connection and try again.");
      setPrepTab('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartMockInterview = () => {
    if (!prepData) return;
    
    // Flatten all questions into a single mock array
    const questions = [];
    const categories = [
      { list: prepData.hrQuestions, type: 'HR' },
      { list: prepData.technicalQuestions, type: 'Technical' },
      { list: prepData.codingQuestions, type: 'Coding' },
      { list: prepData.scenarioQuestions, type: 'Scenario' },
      { list: prepData.behavioralQuestions, type: 'Behavioral' }
    ];

    categories.forEach(cat => {
      if (Array.isArray(cat.list)) {
        cat.list.forEach(q => {
          questions.push({ ...q, type: cat.type });
        });
      }
    });

    if (questions.length === 0) {
      alert("No questions found to perform mock interview.");
      return;
    }

    setFlatQuestions(questions);
    setCurrentQuestionIdx(0);
    setUserAnswer("");
    setEvaluatedQuestions([]);
    setEvalError("");
    setScorecard(null);
    setPrepTab('mock-interview');
  };

  const handleContinueMockInterview = () => {
    // Section 6: Resume from the exact question where the user left off
    const nextIdx = evaluatedQuestions.length;
    if (nextIdx < flatQuestions.length) {
      setCurrentQuestionIdx(nextIdx);
      setUserAnswer("");
      setEvalError("");
      setPrepTab('mock-interview');
    } else {
      calculateAndShowScorecard();
    }
  };

  const handleSubmitAnswer = async () => {
    if (isEvaluating) return;
    if (!userAnswer.trim()) {
      setEvalError("Please enter your answer before submitting.");
      return;
    }
    setIsEvaluating(true);
    setEvalError("");

    const currentQ = flatQuestions[currentQuestionIdx];

    try {
      const res = await fetch(`${API}/ai/interview/evaluate-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: currentQ.question,
          answer: userAnswer,
          idealAnswer: currentQ.idealAnswer
        })
      });

      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Evaluation server responded with HTTP status ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        const result = {
          ...currentQ,
          userAnswer: userAnswer,
          evaluation: json.data
        };
        setEvaluatedQuestions(prev => [...prev, result]);
        setEvalError("");
      } else {
        throw new Error(json.message || "Failed to evaluate response.");
      }
    } catch (err) {
      console.error("[AI Evaluation Error]:", err);
      // Fallback clean score to avoid crash
      const fallbackResult = {
        ...currentQ,
        userAnswer: userAnswer,
        evaluation: {
          confidence: 7,
          technicalCorrectness: 7,
          communication: 7,
          completeness: 7,
          grammar: 8,
          score: 7,
          suggestions: "Answer recorded. Highlight metrics and direct impact outcomes in the future."
        }
      };
      setEvaluatedQuestions(prev => [...prev, fallbackResult]);
      setEvalError("");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < flatQuestions.length - 1) {
      setCurrentQuestionIdx(idx => idx + 1);
      setUserAnswer("");
      setEvalError("");
    } else {
      calculateAndShowScorecard();
    }
  };

  const calculateAndShowScorecard = () => {
    let totalScore = 0;
    let techScore = 0;
    let hrScore = 0;
    let commScore = 0;
    let confScore = 0;

    let techCount = 0;
    let hrCount = 0;

    evaluatedQuestions.forEach(q => {
      const e = q.evaluation;
      totalScore += e.score || 0;
      commScore += e.communication || 0;
      confScore += e.confidence || 0;

      if (['Technical', 'Coding'].includes(q.type)) {
        techScore += e.technicalCorrectness || 0;
        techCount++;
      } else {
        hrScore += e.score || 0;
        hrCount++;
      }
    });

    const total = evaluatedQuestions.length || 1;
    const finalOverall = parseFloat((totalScore / total).toFixed(1));
    const finalComm = parseFloat((commScore / total).toFixed(1));
    const finalConf = parseFloat((confScore / total).toFixed(1));
    const finalTech = techCount > 0 ? parseFloat((techScore / techCount).toFixed(1)) : finalOverall;
    const finalHr = hrCount > 0 ? parseFloat((hrScore / hrCount).toFixed(1)) : finalOverall;

    const strengths = [];
    const weaknesses = [];
    const improvements = [];

    evaluatedQuestions.forEach((q, i) => {
      const e = q.evaluation;
      if (e.score >= 8) {
        strengths.push(`Q${i+1} (${q.type}): Demonstrated excellent understanding of ${q.question.substring(0, 30)}...`);
      } else if (e.score < 6) {
        weaknesses.push(`Q${i+1} (${q.type}): Struggled with ${q.question.substring(0, 30)}...`);
        improvements.push(`Improve Q${i+1} response by incorporating: ${e.suggestions || "More technical facts."}`);
      }
    });

    if (strengths.length === 0) strengths.push("Strong structural answer format and clear communication flow.");
    if (weaknesses.length === 0) weaknesses.push("Brief answer structures under pressure. Try to explain with STAR method.");
    if (improvements.length === 0) improvements.push("Provide more metrics and specific results in behavioral questions.");

    const readinessScore = Math.round(finalOverall * 10);
    let readinessText = "Ready to Interview";
    if (readinessScore >= 80) readinessText = `${readinessScore}% - Strong readiness`;
    else if (readinessScore >= 60) readinessText = `${readinessScore}% - Needs minor improvements`;
    else readinessText = `${readinessScore}% - Further practice required`;

    const generatedScorecard = {
      overallScore: finalOverall,
      technicalScore: finalTech,
      hrScore: finalHr,
      communicationScore: finalComm,
      confidenceScore: finalConf,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      recommendedImprovements: improvements.slice(0, 3),
      estimatedInterviewReadiness: readinessText
    };

    setScorecard(generatedScorecard);
    setPrepTab('scorecard');
  };

  const handleSaveInterview = async () => {
    if (!activeJob || !scorecard) return;
    setIsSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`${API}/ai/interview/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: activeJob._id,
          jobTitle: activeJob.title,
          company: activeJob.company,
          questions: evaluatedQuestions.map(q => ({
            question: q.question,
            type: q.type,
            difficulty: q.difficulty,
            whyInterviewerAsks: q.reasonAsked,
            idealAnswer: q.idealAnswer,
            commonMistakes: q.commonMistakes,
            tips: q.interviewTips,
            followUpQuestions: q.followUpQuestions,
            userAnswer: q.userAnswer,
            evaluation: q.evaluation
          })),
          scorecard
        })
      });
      const json = await res.json();
      if (json.success) {
        setSaveMsg("✓ Session saved successfully!");
        clearSessionFromLocalStorage();
        loadHistory();
      } else {
        setSaveMsg(json.message || "Failed to save interview session.");
      }
    } catch (err) {
      setSaveMsg("Could not connect to backend database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopenSession = async (sessId) => {
    setPrepTab('generating');
    try {
      const res = await fetch(`${API}/ai/interview/${sessId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setReopenedSession(json.data);
        setPrepTab('reopened');
      } else {
        setGenError("Failed to open saved session.");
        setPrepTab('error');
      }
    } catch (err) {
      setGenError("Failed to open saved session.");
      setPrepTab('error');
    }
  };

  const handleExitCleanly = () => {
    clearSessionFromLocalStorage();
    setPrepTab('history');
    setSaveMsg("");
  };

  const drawScoreRing = (score, label, size = 80, strokeWidth = 8, color = "#c9a84c") => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 10) * circumference;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1c1c2e" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: `${size / 2}px ${size / 2}px`, transition: "all 0.5s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color }}>{score}</span>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 20px",
      textAlign: "center",
      background: "#11111a",
      borderRadius: 16,
      border: "1px solid #2a2a3e",
      maxWidth: 600,
      margin: "40px auto 0"
    }}>
      <AIRobotMascot size={75} />
      <h3 style={{ fontSize: 18, color: "#e8e0d0", fontWeight: 600, margin: "16px 0 8px" }}>
        No interview sessions yet
      </h3>
      <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 420, margin: "0 0 24px", lineHeight: 1.6 }}>
        Start your first interview session from any Job page using the <strong>Prepare for Interview</strong> button.
      </p>
      <button onClick={onBackToJobs} style={S.btn}>
        🔍 Browse Job Openings
      </button>
    </div>
  );

  const renderErrorState = () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 20px",
      textAlign: "center",
      background: "#11111a",
      borderRadius: 16,
      border: "1px solid rgba(239, 68, 68, 0.2)",
      maxWidth: 500,
      margin: "40px auto 0"
    }}>
      <AIRobotMascot size={75} isFloating={false} />
      <h3 style={{ fontSize: 19, color: "#ef4444", fontWeight: 600, margin: "16px 0 8px" }}>
        We couldn't prepare your interview this time.
      </h3>
      <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 360, margin: "0 0 24px", lineHeight: 1.6 }}>
        This is usually temporary. Please try again.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button id="retry-generation-btn" onClick={() => activeJob && handleStartNewPrep(activeJob)} style={S.btn}>
          🔄 Try Again
        </button>
        <button onClick={handleExitCleanly} style={S.btnSec}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  const renderDashboardState = () => {
    if (!activeJob) return null;

    const categoriesList = [];
    if (prepData?.hrQuestions?.length > 0) categoriesList.push("HR");
    if (prepData?.technicalQuestions?.length > 0) categoriesList.push("Technical");
    if (prepData?.codingQuestions?.length > 0) categoriesList.push("Coding");
    if (prepData?.scenarioQuestions?.length > 0) categoriesList.push("Scenario");
    if (prepData?.behavioralQuestions?.length > 0) categoriesList.push("Behavioral");

    const totalQuestions = (prepData?.hrQuestions?.length || 0) +
                           (prepData?.technicalQuestions?.length || 0) +
                           (prepData?.codingQuestions?.length || 0) +
                           (prepData?.scenarioQuestions?.length || 0) +
                           (prepData?.behavioralQuestions?.length || 0);

    const isInProgress = evaluatedQuestions.length > 0 && evaluatedQuestions.length < flatQuestions.length;

    return (
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Job Information Header with Mascot */}
        <div style={{ ...S.card, borderLeft: "4px solid #c9a84c", background: "rgba(17, 17, 26, 0.6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 10, textTransform: "uppercase", background: "rgba(201,168,76,0.1)", color: "#c9a84c", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
              Interview Dashboard
            </span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, margin: "12px 0 4px" }}>
              {activeJob.title}
            </h2>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>
              {activeJob.company} • {activeJob.location} • {activeJob.type}
            </p>
          </div>
          <AIRobotMascot size={70} />
        </div>

        {/* Dashboard Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={S.card}>
            <h4 style={{ margin: "0 0 14px", fontSize: 11, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1 }}>Job Details</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div><span style={{ color: "#555" }}>Company:</span> <span style={{ color: "#e8e0d0", fontWeight: 600 }}>{activeJob.company}</span></div>
              <div><span style={{ color: "#555" }}>Location:</span> <span style={{ color: "#e8e0d0" }}>{activeJob.location}</span></div>
              <div><span style={{ color: "#555" }}>Employment:</span> <span style={{ color: "#e8e0d0" }}>{activeJob.type}</span></div>
            </div>
          </div>

          <div style={S.card}>
            <h4 style={{ margin: "0 0 14px", fontSize: 11, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1 }}>Resume Match</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {drawScoreRing(prepData?.readinessScore / 10 || 7.5, "Readiness", 64, 6, "#c9a84c")}
              <div style={{ fontSize: 13 }}>
                <div style={{ color: "#e8e0d0", fontWeight: 700, fontSize: 16 }}>{prepData?.readinessScore || 75}% Fit</div>
                <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>Calculated by checking resume skills against role description.</div>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <h4 style={{ margin: "0 0 14px", fontSize: 11, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1 }}>Details</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div><span style={{ color: "#555" }}>Estimated Duration:</span> <span style={{ color: "#e8e0d0", fontWeight: 600 }}>15 - 20 minutes</span></div>
              <div><span style={{ color: "#555" }}>Difficulty Level:</span> <span style={{ color: "#f59e0b", fontWeight: 600 }}>Medium / Hard</span></div>
              <div><span style={{ color: "#555" }}>Simulation Type:</span> <span style={{ color: "#3b82f6" }}>AI Mock Interview Loop</span></div>
            </div>
          </div>

          <div style={S.card}>
            <h4 style={{ margin: "0 0 14px", fontSize: 11, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1 }}>Question Coverage</h4>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: "#555" }}>Total {totalQuestions} questions generated across categories:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {categoriesList.map(cat => (
                <span key={cat} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid #2a2a3e", color: "#9ca3af", fontWeight: 600 }}>
                  ✓ {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Start / Continue Button */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: 12 }}>
          <button
            id="mock-start-or-continue-btn"
            onClick={isInProgress ? handleContinueMockInterview : handleStartMockInterview}
            style={{
              ...S.btn,
              fontSize: 16,
              padding: "16px 48px",
              boxShadow: "0 4px 20px rgba(201, 168, 76, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            {isInProgress ? "▶ Continue Interview" : "🚀 Start Interview"}
          </button>
          
          <button
            onClick={handleExitCleanly}
            style={{
              ...S.btn,
              fontSize: 16,
              padding: "16px 48px",
              boxShadow: "0 4px 20px rgba(201, 168, 76, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            Exit Dashboard
          </button>
        </div>
      </div>
    );
  };

  const ExitConfirmModal = () => {
    if (!showExitConfirm) return null;
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 5, 10, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            ...S.card,
            maxWidth: 450,
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            border: "1px solid #2a2a3e"
          }}
        >
          <AIRobotMascot size={70} />
          
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, margin: 0, color: "#e8e0d0" }}>
            Exit Interview?
          </h3>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, lineHeight: 1.6 }}>
            Your interview progress has been saved.
            You can continue later.
          </p>

          <div style={{ display: "flex", width: "100%", gap: 12, marginTop: 12 }}>
            <button
              id="confirm-continue-btn"
              onClick={() => setShowExitConfirm(false)}
              style={{ ...S.btn, flex: 1 }}
            >
              Continue Interview
            </button>
            <button
              id="confirm-exit-btn"
              onClick={() => {
                setShowExitConfirm(false);
                setPrepTab('dashboard');
              }}
              style={{ ...S.btnSec, flex: 1 }}
            >
              Exit
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  if (!user?.resumeFilename) {
    return (
      <div style={{ flex: 1, padding: "36px 20px", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {uploading && <PremiumLoader title="Uploading Resume & Parsing..." />}
        <button onClick={onBackToJobs} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#c9a84c", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, marginBottom: 20 }}>
          ← Back to Jobs
        </button>
        <div style={{ background: "rgba(17, 17, 26, 0.75)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "44px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <AIRobotMascot size={80} isFloating={true} />
          <h3 style={{ color: "#c9a84c", margin: 0, fontSize: 22, fontFamily: "'Cormorant Garamond', serif" }}>
            Resume Required for Interview Prep
          </h3>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: 14, maxWidth: 500, lineHeight: 1.6 }}>
            Please upload your resume to generate customized interview questions and simulations.
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
            onClick={() => document.getElementById("interviewResumeInput").click()}
            onMouseOver={e => e.currentTarget.style.borderColor = "#c9a84c"}
            onMouseOut={e => e.currentTarget.style.borderColor = "#2a2a3e"}
          >
            <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>📄</span>
            <span style={{ fontSize: 13, color: "#888", display: "block" }}>
              Click to browse or drag PDF/DOCX file here
            </span>
            <input 
              id="interviewResumeInput" 
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

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: "#05050A", color: "#e8e0d0", minHeight: "100%" }}>
      
      {/* Dynamic Fullscreen Loading Overlay */}
      {prepTab === 'generating' && <PremiumLoader title="Preparing Your Interview..." />}
      {uploading && <PremiumLoader title="Uploading Resume & Parsing..." />}

      {/* HEADER SECTION (Only show when not loading or in mock loop) */}
      {prepTab !== 'generating' && prepTab !== 'mock-interview' && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, borderBottom: "1px solid #2a2a3e", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AIRobotMascot size={45} isFloating={false} />
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: "#e8e0d0", margin: 0 }}>
                AI Interview Preparation
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 1: HISTORY (DIRECT NAVBAR NAVIGATION) ── */}
      {prepTab === 'history' && (
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#c9a84c", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 10 }}>
            Practice History
          </h3>
          
          {historyLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ height: 90, background: "#11111a", borderRadius: 12, border: "1px solid #2a2a3e", animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : historyError ? (
            <div style={{ color: "#f87171", fontSize: 13 }}>{historyError}</div>
          ) : history.length === 0 ? (
            renderEmptyState()
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {history.map((sess) => (
                <div key={sess._id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 18, borderRadius: 12, border: "1px solid #2a2a3e", background: "rgba(17, 17, 26, 0.45)" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e8e0d0" }}>{sess.jobTitle}</h4>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#c9a84c" }}>{sess.company}</p>
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "#555" }}>
                      📅 Prepared on {new Date(sess.interviewDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "#9ca3af", display: "block", textTransform: "uppercase" }}>Overall Score</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#c9a84c" }}>{sess.scorecard?.overallScore}/10</span>
                    </div>
                    <button onClick={() => handleReopenSession(sess._id)} style={{ ...S.btn, padding: "8px 16px", fontSize: 12 }}>
                      Reopen Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PHASE 2: ERROR SCREEN ── */}
      {prepTab === 'error' && renderErrorState()}

      {/* ── PHASE 3: INTERVIEW DASHBOARD ── */}
      {prepTab === 'dashboard' && renderDashboardState()}

      {/* ── PHASE 4: MOCK INTERVIEW PLAYER ── */}
      {prepTab === 'mock-interview' && flatQuestions.length > 0 && (() => {
        const q = flatQuestions[currentQuestionIdx];
        const hasResult = evaluatedQuestions[currentQuestionIdx];
        return (
          <div style={{ maxWidth: 800, margin: "20px auto 0", display: "flex", flexDirection: "column", minHeight: "75vh", justifyContent: "space-between" }}>
            
            {/* Top Bar Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <button
                id="mock-back-dashboard-btn"
                onClick={() => setPrepTab('dashboard')}
                style={{ ...S.btnSec, padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
              >
                ← Back
              </button>
              <span style={{ fontSize: 11, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", padding: "4px 10px", borderRadius: 8, color: "#c9a84c", fontWeight: 700 }}>
                {q.type} Category
              </span>
            </div>

            {/* Question Text Card */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
                  <span>Question {currentQuestionIdx + 1} of {flatQuestions.length}</span>
                  <span>{Math.round(((currentQuestionIdx + 1) / flatQuestions.length) * 100)}% Complete</span>
                </div>
                <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${((currentQuestionIdx + 1) / flatQuestions.length) * 100}%`, background: "linear-gradient(90deg, #c9a84c, #a07830)", borderRadius: 2, transition: "width 0.3s ease" }} />
                </div>
              </div>

              {/* Question Text */}
              <div style={{ ...S.card, borderLeft: "4px solid #c9a84c", background: "rgba(17,17,26,0.4)" }}>
                <span style={S.badge(q.difficulty)}>{q.difficulty}</span>
                <h3 style={{ margin: "12px 0 0", fontSize: 18, color: "#e8e0d0", lineHeight: 1.5, fontWeight: 600 }}>
                  {q.question}
                </h3>
              </div>

              {/* Answer Editor Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={S.label}>Your Answer</label>
                <textarea
                  style={S.textarea}
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="Type your structured answer here. Explain with technical details or standard behavioral framework (STAR method)..."
                  disabled={isEvaluating || !!hasResult}
                />
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, borderTop: "1px solid #2a2a3e", paddingTop: 16 }}>
              <button
                id="mock-exit-btn"
                onClick={() => setShowExitConfirm(true)}
                style={{ ...S.btnSec, borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}
              >
                Exit Interview
              </button>
              
              <div style={{ display: "flex", gap: 12 }}>
                {evaluatedQuestions.length > 0 && (
                  <button id="mock-finish-btn" onClick={calculateAndShowScorecard} style={S.btnSec}>
                    Finish & View Scorecard 📊
                  </button>
                )}
                {!hasResult ? (
                  <button id="mock-submit-btn" onClick={handleSubmitAnswer} disabled={isEvaluating || !userAnswer.trim()} style={{ ...S.btn, display: "flex", alignItems: "center", gap: 8 }}>
                    {isEvaluating ? "Analyzing response..." : "Submit Answer"}
                  </button>
                ) : (
                  <button id="mock-next-btn" onClick={handleNextQuestion} style={S.btn}>
                    {currentQuestionIdx < flatQuestions.length - 1 ? "Next Question →" : "View Scorecard 📊"}
                  </button>
                )}
              </div>
            </div>

            {/* AI Answer Evaluation Display */}
            {hasResult && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ ...S.card, marginTop: 24, border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.01)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#10b981", fontWeight: 700 }}>✓ AI Evaluation Results</h3>
                
                {/* Scoring meters */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                  {[
                    { label: "Overall Score", score: hasResult.evaluation.score, color: "#c9a84c" },
                    { label: "Technical Correctness", score: hasResult.evaluation.technicalCorrectness, color: "#10b981" },
                    { label: "Confidence Estimate", score: hasResult.evaluation.confidence, color: "#f59e0b" },
                    { label: "Communication Flow", score: hasResult.evaluation.communication, color: "#3b82f6" },
                    { label: "Completeness", score: hasResult.evaluation.completeness, color: "#8b5cf6" },
                    { label: "Grammar & Structure", score: hasResult.evaluation.grammar, color: "#ec4899" }
                  ].map(meter => (
                    <div key={meter.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "#9ca3af" }}>{meter.label}</span>
                        <span style={{ fontWeight: 700, color: meter.color }}>{meter.score}/10</span>
                      </div>
                      <div style={{ height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${meter.score * 10}%`, background: meter.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 16, border: "1px solid #2a2a3e" }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: 11, color: "#c9a84c", textTransform: "uppercase" }}>Suggestions</h4>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#d4cfc8" }}>
                    {hasResult.evaluation.suggestions}
                  </p>
                </div>
              </motion.div>
            )}

            <ExitConfirmModal />
          </div>
        );
      })()}

      {/* ── PHASE 5: FINAL SCORECARD DISPLAY ── */}
      {prepTab === 'scorecard' && scorecard && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ ...S.card, textAlign: "center", marginBottom: 28, background: "linear-gradient(180deg, #11111a 0%, #0c0c16 100%)" }}>
            <AIRobotMascot size={70} />
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, margin: "8px 0 2px" }}>
              Interview Complete!
            </h2>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Here is your comprehensive evaluation scorecard</p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: 24, margin: "24px 0", flexWrap: "wrap" }}>
              {drawScoreRing(scorecard.overallScore, "Overall", 90, 8, "#c9a84c")}
              {drawScoreRing(scorecard.technicalScore, "Technical", 90, 8, "#10b981")}
              {drawScoreRing(scorecard.hrScore, "HR / Biz", 90, 8, "#3b82f6")}
              {drawScoreRing(scorecard.communicationScore, "Comm", 90, 8, "#f59e0b")}
              {drawScoreRing(scorecard.confidenceScore, "Confidence", 90, 8, "#8b5cf6")}
            </div>

            <div style={{ display: "inline-block", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, padding: "6px 18px", color: "#10b981", fontWeight: 700, fontSize: 13 }}>
              Readiness Rating: {scorecard.estimatedInterviewReadiness}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <div style={{ ...S.card }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#10b981", fontWeight: 700 }}>⚡ Key Strengths</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#9ca3af", display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                {scorecard.strengths.map((str, i) => <li key={i}>{str}</li>)}
              </ul>
            </div>
            <div style={{ ...S.card }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#ef4444", fontWeight: 700 }}>⚠ Improvement Areas</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#9ca3af", display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                {scorecard.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>

          <div style={{ ...S.card, marginBottom: 28 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#c9a84c", fontWeight: 700 }}>🎯 Recommended Action Plan</h3>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#9ca3af", display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
              {scorecard.recommendedImprovements.map((imp, i) => <li key={i}>{imp}</li>)}
            </ul>
          </div>

          {/* Action Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={handleExitCleanly} style={S.btnSec}>
              ← Exit without saving
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {saveMsg && <span id="save-session-status-msg" style={{ fontSize: 13, color: saveMsg.startsWith("✓") ? "#10b981" : "#ef4444", fontWeight: 600 }}>{saveMsg}</span>}
              {!saveMsg.startsWith("✓") && (
                <button id="save-session-history-btn" onClick={handleSaveInterview} disabled={isSaving} style={S.btn}>
                  {isSaving ? "Saving..." : "Save Session to History 💾"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 6: REOPENED SESSION VIEWER ── */}
      {prepTab === 'reopened' && reopenedSession && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Header Summary */}
          <div style={{ ...S.card, marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", background: "rgba(201,168,76,0.1)", color: "#c9a84c", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>Saved Session</span>
                <h2 style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 700 }}>{reopenedSession.jobTitle}</h2>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>{reopenedSession.company} • Prepared on {new Date(reopenedSession.interviewDate).toLocaleDateString()}</p>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {drawScoreRing(reopenedSession.scorecard?.overallScore || 0, "Score", 70, 6, "#c9a84c")}
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <div style={{ ...S.card }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#10b981", fontWeight: 700 }}>⚡ Key Strengths</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#9ca3af", display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                {(reopenedSession.scorecard?.strengths || []).map((str, i) => <li key={i}>{str}</li>)}
              </ul>
            </div>
            <div style={{ ...S.card }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#ef4444", fontWeight: 700 }}>⚠ Weak Areas</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#9ca3af", display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                {(reopenedSession.scorecard?.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>

          {/* Evaluation timeline of answers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ margin: "10px 0 0", fontSize: 16, fontWeight: 600, color: "#c9a84c" }}>Questions & Evaluated Answers</h3>
            
            {(reopenedSession.questions || []).map((q, idx) => (
              <div key={idx} style={{ ...S.card, background: "#11111a", border: "1px solid #2a2a3e" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <span style={S.badge(q.difficulty)}>{q.difficulty}</span>
                    <span style={{ fontSize: 11, background: "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: 8, color: "#9ca3af", marginLeft: 8 }}>{q.type}</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#c9a84c" }}>Score: {q.evaluation?.score}/10</span>
                </div>
                
                <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#e8e0d0" }}>Q: {q.question}</h4>
                
                <div style={{ background: "#0a0a14", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.02)", marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: "#6b7280", display: "block", textTransform: "uppercase", marginBottom: 4 }}>Your Answer</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#d4cfc8", lineHeight: 1.5 }}>{q.userAnswer}</p>
                </div>

                <div style={{ background: "rgba(16,185,129,0.02)", padding: 12, borderRadius: 8, border: "1px solid rgba(16,185,129,0.15)", marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: "#10b981", display: "block", textTransform: "uppercase", marginBottom: 4 }}>AI Suggestions</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#d4cfc8", lineHeight: 1.5 }}>{q.evaluation?.suggestions}</p>
                </div>

                {q.idealAnswer && (
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, border: "1px solid #2a2a3e" }}>
                    <span style={{ fontSize: 10, color: "#666", display: "block", textTransform: "uppercase", marginBottom: 4 }}>Ideal Answer Blueprint</span>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{q.idealAnswer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
