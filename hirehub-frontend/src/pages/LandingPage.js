import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage({ onShowAuth }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    window.history.pushState(null, "", `#${targetId}`);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          // Give layout a tiny moment to settle, then scroll
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 150);
        }
      }
    };

    handleHashScroll();
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, []);

  const technologies = [
    { name: "React", desc: "Interactive Frontend UI", icon: "⚛️" },
    { name: "Node.js", desc: "Scalable Runtime Environment", icon: "🟢" },
    { name: "Express", desc: "Robust Server-side Routing", icon: "🚂" },
    { name: "MongoDB", desc: "Flexible Document Database", icon: "🍃" },
    { name: "Google Gemini", desc: "Advanced AI Model Integration", icon: "✨" },
    { name: "JWT", desc: "Secure User Authentication", icon: "🔑" },
    { name: "OCR", desc: "Optical Character Recognition", icon: "👁️" },
    { name: "REST API", desc: "Standardized API Communication", icon: "🌐" }
  ];

  const features = [
    { title: "AI Resume Analyzer", desc: "Scan your resume against ATS algorithms and receive a comprehensive score with actionable improvement tips.", icon: "📊", status: "Active" },
    { title: "AI Job Match", desc: "Compare your resume directly with job descriptions to see matching percentages, missing keywords, and profile gaps.", icon: "🎯", status: "Active" },
    { title: "AI Resume Optimizer", desc: "Get tailored, line-by-line recommendations and optimized bullet points to maximize your chance of passing screeners.", icon: "✨", status: "Active" },
    { title: "AI Cover Letter Generator", desc: "Generate professional, highly-customized cover letters tailored to specific job listings in seconds.", icon: "✉️", status: "Active" },
    { title: "Interview Preparation", desc: "Practice with AI-generated behavioral and technical questions based on your matched job descriptions.", icon: "🗣️", status: "Coming Soon" },
    { title: "Career Roadmap", desc: "Get a step-by-step career path suggestion based on your skills, experience, and target roles.", icon: "🗺️", status: "Coming Soon" },
    { title: "Career Assistant", desc: "Chat with an AI mentor to get instant career advice, salary negotiation tips, and resume critiques.", icon: "🤖", status: "Coming Soon" }
  ];

  const steps = [
    { title: "Upload Resume", desc: "Upload your PDF or Word resume to kickstart the process." },
    { title: "Analyze Resume", desc: "Our OCR and Gemini integrations scan your experience." },
    { title: "Match Jobs", desc: "Instantly see how well your profile fits open job listings." },
    { title: "Optimize Resume", desc: "Inject highly relevant keywords and improve sentence structure." },
    { title: "Generate Cover Letter", desc: "Draft a compelling cover letter matching the target job description." },
    { title: "Prepare for Interviews", desc: "Get tailored preparation guidelines and mock questions." },
    { title: "Get Hired", desc: "Stand out from the competition and land your dream offer." }
  ];

  const whyChooseUs = [
    { title: "ATS Friendly", desc: "Format and optimize your documents to slide past Automated Tracking Systems easily.", icon: "🤖" },
    { title: "AI Powered", desc: "Harness the power of Google Gemini AI for state-of-the-art analysis and drafting.", icon: "⚡" },
    { title: "Fast Analysis", desc: "Receive detailed, multi-dimensional feedback in under 10 seconds.", icon: "⏱️" },
    { title: "Personalized Reports", desc: "Enjoy feedback specifically tailored to your industry, level, and goals.", icon: "📝" },
    { title: "Professional Resume", desc: "Build an clean, modern resume layout that immediately catches recruiters' eyes.", icon: "💼" },
    { title: "Career Guidance", desc: "Go beyond templates to receive genuine advice on career progression.", icon: "🧭" }
  ];

  const screenshots = [
    { title: "Browse & Match Jobs", desc: "Find roles matching your skills and see matching percentages instantly.", path: "/screenshots/dashboard.png" },
    { title: "AI Resume Optimizer", desc: "Fix your resume sections with side-by-side keyword improvements.", path: "/screenshots/optimizer.png" },
    { title: "AI Cover Letter Generator", desc: "Generate highly professional cover letters using multiple tones.", path: "/screenshots/cover_letter.png" }
  ];

  const testimonials = [
    { name: "Siddharth Mehta", role: "Software Engineer at Google", text: "HireHub's resume optimizer helped me tweak my bullet points using Gemini. The ATS match score was spot-on, and I got callbacks within a week!", avatar: "👨‍💻" },
    { name: "Pooja Sharma", role: "Product Manager at Swiggy", text: "I loved the Cover Letter generator. Writing a different cover letter for 20 jobs used to take days; now it takes 2 minutes. Highly recommend!", avatar: "👩‍💼" },
    { name: "Vikram Malhotra", role: "Full Stack Developer", text: "The Job Match report clearly highlights what keywords you are missing. Adding them increased my response rate from 10% to over 40%.", avatar: "👨‍💻" }
  ];

  const faqs = [
    { q: "How does HireHub analyze my resume?", a: "HireHub uses secure Optical Character Recognition (OCR) to extract text from your uploaded PDF or Word document. It then processes the text using Google Gemini AI, comparing it against modern ATS guidelines and target job specifications." },
    { q: "Is my personal data safe with HireHub?", a: "Absolutely. We do not sell or share your personal data. Resumes are processed securely, and you can delete your account and uploaded data at any time from the Profile tab." },
    { q: "What is an ATS score and how is it calculated?", a: "ATS (Applicant Tracking System) score measures how well your resume matches a specific job description. We calculate this by checking keyword overlap, structure, experience levels, and direct skills match using Gemini's semantic parsing." },
    { q: "Can I generate cover letters for free?", a: "Yes! HireHub offers fully functional AI cover letter drafting for all registered users, allowing you to choose multiple professional tones depending on the role." }
  ];

  return (
    <div style={{ background: "#05050A", color: "#e8e0d0", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* ── GUEST NAVBAR ── */}
      <nav className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 70, borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #c9a84c, #a07830)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(201, 168, 76, 0.2)" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#05050A" }}>H</span>
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#c9a84c", letterSpacing: 2 }}>HIREHUB</span>
        </div>

        <div className="desktop-nav" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Features", "How It Works", "About"].map((link) => {
            const targetId = link.toLowerCase().replace(/\s+/g, '-');
            return (
              <a key={link} href={`#${targetId}`}
                 onClick={(e) => handleNavClick(e, targetId)}
                 style={{ textDecoration: "none", color: "#9ca3af", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
                 onMouseOver={(e) => e.target.style.color = "#c9a84c"}
                 onMouseOut={(e) => e.target.style.color = "#9ca3af"}>
                {link}
              </a>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => onShowAuth('login')} style={{ background: "transparent", border: "1px solid rgba(201, 168, 76, 0.3)", color: "#c9a84c", padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}
                  onMouseOver={(e) => { e.target.style.background = "rgba(201, 168, 76, 0.05)"; e.target.style.borderColor = "#c9a84c"; }}
                  onMouseOut={(e) => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(201, 168, 76, 0.3)"; }}>
            Login
          </button>
          <button onClick={() => onShowAuth('reg1')} style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", border: "none", color: "#05050A", padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s", boxShadow: "0 4px 12px rgba(201, 168, 76, 0.2)" }}
                  onMouseOver={(e) => e.target.style.opacity = 0.9}
                  onMouseOut={(e) => e.target.style.opacity = 1}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* ── 1. PREMIUM HERO SECTION ── */}
      <section style={{ padding: "100px 24px 80px", position: "relative", textAlign: "center", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(201, 168, 76, 0.05) 0%, transparent 70%)", zIndex: -1 }} />
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span style={{ background: "rgba(201, 168, 76, 0.1)", border: "1px solid rgba(201, 168, 76, 0.2)", color: "#c9a84c", padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", display: "inline-block", marginBottom: 24 }}>
            ✨ Next-Gen AI Career Suite
          </span>
          <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, lineHeight: 1.1, marginBottom: 24, letterSpacing: -1 }}>
            Get Hired Faster <br />
            <span className="text-gradient-gold">With Advanced AI</span>
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "clamp(16px, 2vw, 19px)", maxWidth: 680, margin: "0 auto 40px", lineHeight: 1.6, fontWeight: 400 }}>
            Optimize your resume, benchmark skills against industry demands, track applications, and auto-generate highly customized cover letters in seconds. Supercharged by Google Gemini.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => onShowAuth('reg1')} style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", border: "none", color: "#05050A", padding: "14px 32px", borderRadius: 28, cursor: "pointer", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s", boxShadow: "0 8px 24px rgba(201, 168, 76, 0.2)" }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
              Get Started for Free <span style={{ fontSize: 18 }}>→</span>
            </button>
            <button onClick={() => onShowAuth('login')} style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8e0d0", padding: "14px 32px", borderRadius: 28, cursor: "pointer", fontSize: 15, fontWeight: 600, transition: "all 0.2s" }}
                    onMouseOver={(e) => { e.target.style.background = "rgba(255, 255, 255, 0.06)"; e.target.style.borderColor = "rgba(255, 255, 255, 0.15)"; }}
                    onMouseOut={(e) => { e.target.style.background = "rgba(255, 255, 255, 0.03)"; e.target.style.borderColor = "rgba(255, 255, 255, 0.08)"; }}>
              Login
            </button>
          </div>
        </motion.div>

        {/* Layered Showcase with Ambient Glows & Particles */}
        <div style={{ position: "relative", width: "100%", overflow: "visible" }}>
          {/* Style rules */}
          <style>{`
            .showcase-container {
              position: relative;
              width: 100%;
              max-width: 1000px;
              margin: 80px auto 0;
              height: 580px;
              perspective: 1200px;
            }
            .card-left {
              display: block;
              width: 38% !important;
              left: 4% !important;
              top: 100px !important;
            }
            .card-right {
              display: block;
              width: 38% !important;
              right: 4% !important;
              top: 100px !important;
            }
            .card-center {
              width: 60% !important;
              left: 20% !important;
              top: 30px !important;
            }
            @media (max-width: 768px) {
              .showcase-container {
                height: 320px !important;
                margin-top: 40px !important;
              }
              .card-left {
                display: none !important;
              }
              .card-right {
                display: none !important;
              }
              .card-center {
                width: 96% !important;
                left: 2% !important;
                top: 10px !important;
              }
            }
          `}</style>

          {/* Background Blurred Blobs */}
          <div style={{
            position: "absolute",
            width: "350px",
            height: "350px",
            left: "5%",
            top: "20%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
            zIndex: -2,
            pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute",
            width: "350px",
            height: "350px",
            right: "5%",
            top: "10%",
            background: "radial-gradient(circle, rgba(201, 168, 76, 0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
            zIndex: -2,
            pointerEvents: "none"
          }} />

          {/* Central Ambient Glow */}
          <div style={{
            position: "absolute",
            width: "60%",
            height: "60%",
            left: "20%",
            top: "15%",
            background: "radial-gradient(circle, rgba(201, 168, 76, 0.16) 0%, rgba(139, 92, 246, 0.12) 50%, transparent 100%)",
            filter: "blur(80px)",
            zIndex: -1,
            pointerEvents: "none"
          }} />

          {/* Floating light particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                width: i % 2 === 0 ? "4px" : "6px",
                height: i % 2 === 0 ? "4px" : "6px",
                borderRadius: "50%",
                background: i % 3 === 0 ? "#c9a84c" : i % 3 === 1 ? "#8b5cf6" : "#ffffff",
                opacity: 0.3,
                top: `${15 + Math.random() * 70}%`,
                left: `${10 + Math.random() * 80}%`,
                zIndex: -1,
                pointerEvents: "none"
              }}
              animate={{
                y: [0, -35, 0],
                x: [0, (Math.random() - 0.5) * 25, 0],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 7 + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 3
              }}
            />
          ))}

          {/* Overlapping Cards Container */}
          <div className="showcase-container">
            {/* LEFT CARD: AI Resume Optimizer */}
            <motion.div
              className="card-left"
              style={{
                position: "absolute",
                zIndex: 1,
                transformStyle: "preserve-3d",
                transform: "rotateY(14deg) rotateX(4deg) rotateZ(-2deg)",
                willChange: "transform"
              }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{
                scale: 1.05,
                rotateY: 0,
                rotateX: 0,
                rotateZ: 0,
                zIndex: 10,
                transition: { duration: 0.3 }
              }}
            >
              <div style={{
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(10, 10, 20, 0.8)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.55), 0 0 30px rgba(139, 92, 246, 0.05)",
                overflow: "hidden"
              }}>
                {/* Browser bar */}
                <div style={{ height: "34px", background: "rgba(15, 15, 26, 0.95)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", padding: "0 14px", gap: 6 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56" }}></span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e" }}></span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f" }}></span>
                  </div>
                  <div style={{ flex: 1, height: "18px", background: "rgba(255, 255, 255, 0.04)", borderRadius: "4px", fontSize: "9px", color: "rgba(255, 255, 255, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", maxWidth: "200px", margin: "0 auto", fontFamily: "monospace" }}>
                    localhost:3000/optimizer
                  </div>
                </div>
                {/* Screenshot image */}
                <img src="/screenshots/optimizer.png" alt="Resume Optimizer" style={{ width: "100%", display: "block", filter: "brightness(0.95)" }}
                     onError={(e) => {
                       e.target.style.display = "none";
                       e.target.nextSibling.style.display = "flex";
                     }} />
                {/* Fallback mock UI if image fails */}
                <div style={{ display: "none", height: 260, background: "#0c0c18", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>✨</span>
                  <p style={{ color: "#777", fontSize: 12 }}>AI Resume Optimizer</p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT CARD: AI Cover Letter */}
            <motion.div
              className="card-right"
              style={{
                position: "absolute",
                zIndex: 1,
                transformStyle: "preserve-3d",
                transform: "rotateY(-14deg) rotateX(4deg) rotateZ(2deg)",
                willChange: "transform"
              }}
              animate={{ y: [6, -8, 6] }}
              transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              whileHover={{
                scale: 1.05,
                rotateY: 0,
                rotateX: 0,
                rotateZ: 0,
                zIndex: 10,
                transition: { duration: 0.3 }
              }}
            >
              <div style={{
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(10, 10, 20, 0.8)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.55), 0 0 30px rgba(201, 168, 76, 0.04)",
                overflow: "hidden"
              }}>
                {/* Browser bar */}
                <div style={{ height: "34px", background: "rgba(15, 15, 26, 0.95)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", padding: "0 14px", gap: 6 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56" }}></span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e" }}></span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f" }}></span>
                  </div>
                  <div style={{ flex: 1, height: "18px", background: "rgba(255, 255, 255, 0.04)", borderRadius: "4px", fontSize: "9px", color: "rgba(255, 255, 255, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", maxWidth: "200px", margin: "0 auto", fontFamily: "monospace" }}>
                    localhost:3000/cover-letter
                  </div>
                </div>
                {/* Screenshot image */}
                <img src="/screenshots/cover_letter.png" alt="Cover Letter Generator" style={{ width: "100%", display: "block", filter: "brightness(0.95)" }}
                     onError={(e) => {
                       e.target.style.display = "none";
                       e.target.nextSibling.style.display = "flex";
                     }} />
                {/* Fallback mock UI if image fails */}
                <div style={{ display: "none", height: 260, background: "#0c0c18", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>✉️</span>
                  <p style={{ color: "#777", fontSize: 12 }}>AI Cover Letter Generator</p>
                </div>
              </div>
            </motion.div>

            {/* CENTER CARD: Browse Jobs Page */}
            <motion.div
              className="card-center"
              style={{
                position: "absolute",
                zIndex: 2,
                transformStyle: "preserve-3d",
                willChange: "transform"
              }}
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              whileHover={{
                scale: 1.04,
                zIndex: 10,
                transition: { duration: 0.3 }
              }}
            >
              <div style={{
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(8, 8, 16, 0.82)",
                boxShadow: "0 30px 70px rgba(0,0,0,0.85), 0 0 50px rgba(201, 168, 76, 0.08)",
                overflow: "hidden",
                padding: 6
              }}>
                <div style={{ borderRadius: "18px", overflow: "hidden", background: "#05050a" }}>
                  {/* Browser bar */}
                  <div style={{ height: "36px", background: "rgba(15, 15, 26, 0.95)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f56" }}></span>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffbd2e" }}></span>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#27c93f" }}></span>
                    </div>
                    <div style={{ flex: 1, height: "20px", background: "rgba(255, 255, 255, 0.04)", borderRadius: "4px", fontSize: "10px", color: "rgba(255, 255, 255, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", maxWidth: "260px", margin: "0 auto", fontFamily: "monospace" }}>
                      localhost:3000/browse-jobs
                    </div>
                  </div>
                  {/* Screenshot image */}
                  <img src="/screenshots/dashboard.png" alt="Browse Jobs Dashboard" style={{ width: "100%", display: "block", filter: "brightness(0.95)" }}
                       onError={(e) => {
                         e.target.style.display = "none";
                         e.target.nextSibling.style.display = "flex";
                       }} />
                  {/* Fallback mock UI if image fails */}
                  <div style={{ display: "none", height: 380, background: "#0a0a14", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
                    <span style={{ fontSize: 32 }}>📊</span>
                    <p style={{ color: "#888", fontSize: 14 }}>HireHub AI Jobs Dashboard</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUSTED TECHNOLOGIES ── */}
      <section style={{ padding: "60px 24px", borderTop: "1px solid rgba(255, 255, 255, 0.03)", background: "rgba(0, 0, 0, 0.2)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <p style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: 2, color: "#555", fontWeight: 700, marginBottom: 30 }}>TRUSTED & POWERED BY MODERN TECH STACK</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 20, justifyContent: "center" }}>
            {technologies.map((tech) => (
              <div key={tech.name} className="glass-card" style={{ padding: "20px 16px", borderRadius: 12, textAlign: "center", background: "rgba(17, 17, 26, 0.4)", border: "1px solid rgba(255,255,255,0.03)" }}
                   onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(201, 168, 76, 0.2)"; e.currentTarget.style.background = "rgba(17, 17, 26, 0.6)"; }}
                   onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.03)"; e.currentTarget.style.background = "rgba(17, 17, 26, 0.4)"; }}>
                <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>{tech.icon}</span>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#e8e0d0", marginBottom: 2 }}>{tech.name}</h4>
                <p style={{ fontSize: 10, color: "#9ca3af" }}>{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. AI FEATURES ── */}
      <section id="features" style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span style={{ color: "#c9a84c", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Features</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginTop: 10, marginBottom: 16 }}>
            Supercharge Your Career Search
          </h2>
          <p style={{ color: "#9ca3af", maxWidth: 600, margin: "0 auto", fontSize: 15, lineHeight: 1.6 }}>
            From real-time resume scanning to auto-optimized profile matching, get a customized set of tools to secure interview offers.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {features.map((feat, idx) => (
            <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                        className="glass-card" style={{ padding: 32, borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.06)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle, rgba(201, 168, 76, 0.03) 0%, transparent 70%)", pointerEvents: "none" }} />
              
              <div style={{ width: 48, height: 48, borderRadius: 12, background: feat.status === "Active" ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 24 }}>
                {feat.icon}
              </div>
              
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e8e0d0", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                {feat.title}
                {feat.status === "Coming Soon" && (
                  <span style={{ fontSize: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>SOON</span>
                )}
              </h3>
              
              <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.6, flex: 1 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. HOW HIREHUB WORKS ── */}
      <section id="how-it-works" style={{ padding: "100px 24px", background: "rgba(0, 0, 0, 0.15)", borderTop: "1px solid rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.02)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 70 }}>
            <span style={{ color: "#c9a84c", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Workflow</span>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginTop: 10 }}>
              How HireHub AI Works
            </h2>
          </div>

          <div className="timeline-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, position: "relative" }}>
            {steps.map((step, idx) => (
              <div key={step.title} style={{ position: "relative", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#c9a84c", background: "rgba(201, 168, 76, 0.1)" }}>
                    {idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="timeline-line" style={{ flex: 1, height: 1, background: "linear-gradient(to right, #c9a84c, transparent)" }} />
                  )}
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#e8e0d0", marginBottom: 8 }}>{step.title}</h4>
                <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. WHY HIREHUB AI ── */}
      <section id="about" style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 65 }}>
          <span style={{ color: "#c9a84c", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Why Us</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginTop: 10, marginBottom: 16 }}>
            Engineered for Job Seekers
          </h2>
          <p style={{ color: "#9ca3af", maxWidth: 550, margin: "0 auto", fontSize: 14, lineHeight: 1.6 }}>
            HireHub is more than a database of jobs — it's an intelligent workspace built to increase application throughput.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {whyChooseUs.map((item) => (
            <div key={item.title} className="glass-card" style={{ padding: 28, borderRadius: 16, background: "rgba(17, 17, 26, 0.5)", border: "1px solid rgba(255, 255, 255, 0.04)", display: "flex", gap: 20 }}>
              <div style={{ fontSize: 26, marginTop: 2 }}>{item.icon}</div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#e8e0d0", marginBottom: 8 }}>{item.title}</h4>
                <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. SCREENSHOTS SHOWCASE ── */}
      <section style={{ padding: "100px 24px", background: "rgba(0, 0, 0, 0.25)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span style={{ color: "#c9a84c", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Showcase</span>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginTop: 10, marginBottom: 16 }}>
              Inside the Platform
            </h2>
            <p style={{ color: "#9ca3af", maxWidth: 500, margin: "0 auto", fontSize: 14, lineHeight: 1.6 }}>
              Take a closer look at the actual dashboards and tools powered by Gemini.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
            {screenshots.map((screen) => (
              <div key={screen.title} className="glass-card" style={{ padding: 12, borderRadius: 16, background: "rgba(17,17,26,0.6)", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.3s" }}
                   onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                   onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ overflow: "hidden", borderRadius: 10, background: "#0a0a14", marginBottom: 16 }}>
                  <img src={screen.path} alt={screen.title} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                       onError={(e) => {
                         e.target.style.display = "none";
                         e.target.nextSibling.style.display = "flex";
                       }} />
                  <div style={{ display: "none", height: 200, alignItems: "center", justifyContent: "center", flexDirection: "column", background: "rgba(0,0,0,0.4)" }}>
                    <span style={{ fontSize: 32 }}>📁</span>
                  </div>
                </div>
                <div style={{ padding: "0 8px 12px" }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#e8e0d0", marginBottom: 6 }}>{screen.title}</h4>
                  <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.5 }}>{screen.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TESTIMONIALS ── */}
      <section style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span style={{ color: "#c9a84c", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Testimonials</span>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginTop: 10, marginBottom: 16 }}>
            Success Stories
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {testimonials.map((test) => (
            <div key={test.name} className="glass-card" style={{ padding: 32, borderRadius: 16, background: "rgba(17, 17, 26, 0.4)", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <p style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic", lineHeight: 1.7, marginBottom: 24 }}>"{test.text}"</p>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {test.avatar}
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#e8e0d0" }}>{test.name}</h4>
                  <p style={{ color: "#555", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. FAQ SECTION ── */}
      <section style={{ padding: "100px 24px", background: "rgba(0, 0, 0, 0.15)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <span style={{ color: "#c9a84c", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Questions</span>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 44px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginTop: 10 }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="glass-card" style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(17,17,26,0.5)", overflow: "hidden" }}>
                  <button onClick={() => setActiveFaq(isOpen ? null : idx)} style={{ width: "100%", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: isOpen ? "#c9a84c" : "#e8e0d0", transition: "color 0.2s" }}>{faq.q}</span>
                    <span style={{ fontSize: 16, color: "#c9a84c", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>+</span>
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div style={{ padding: "0 24px 20px", color: "#9ca3af", fontSize: 13, lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.02)" }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 9. CTA SECTION ── */}
      <section style={{ padding: "120px 24px", position: "relative", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 800, height: 800, background: "radial-gradient(circle, rgba(201, 168, 76, 0.04) 0%, transparent 60%)", zIndex: -1 }} />
        
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 48px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginBottom: 20 }}>
            Ready to Land Your Dream Job?
          </h2>
          <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
            Join thousands of professionals already optimizing their application pipeline. Let HireHub AI prepare your next career step.
          </p>
          <button onClick={() => onShowAuth('reg1')} style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", border: "none", color: "#05050A", padding: "14px 36px", borderRadius: 28, cursor: "pointer", fontSize: 15, fontWeight: 700, transition: "all 0.2s", boxShadow: "0 8px 24px rgba(201, 168, 76, 0.25)" }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
            Get Started Now
          </button>
        </div>
      </section>

      {/* ── 10. FOOTER ── */}
      <footer style={{ padding: "80px 24px 40px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", background: "rgba(0, 0, 0, 0.4)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, marginBottom: 60 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, background: "linear-gradient(135deg, #c9a84c, #a07830)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#05050A" }}>H</span>
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#c9a84c", letterSpacing: 1.5 }}>HIREHUB</span>
            </div>
            <p style={{ color: "#555", fontSize: 12, lineHeight: 1.6 }}>
              Supercharging recruitment pipelines with AI-powered resume analyzers, optimizers, and automated career templates.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#e8e0d0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Features</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Resume Analyzer", "Job Match Report", "Resume Optimizer", "Cover Letter Drafts"].map((f) => (
                <span key={f} style={{ color: "#9ca3af", fontSize: 12 }}>{f}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#e8e0d0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Legal & Support</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["About Us", "Privacy Policy", "Terms of Service", "Contact Support"].map((l) => (
                <span key={l} style={{ color: "#9ca3af", fontSize: 12 }}>{l}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#e8e0d0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Follow Us</h4>
            <div style={{ display: "flex", gap: 16 }}>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", fontSize: 13, textDecoration: "none" }} onMouseOver={e => e.target.style.color = "#c9a84c"} onMouseOut={e => e.target.style.color = "#9ca3af"}>GitHub</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", fontSize: 13, textDecoration: "none" }} onMouseOver={e => e.target.style.color = "#c9a84c"} onMouseOut={e => e.target.style.color = "#9ca3af"}>LinkedIn</a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", borderTop: "1px solid rgba(255, 255, 255, 0.02)", paddingTop: 30, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <p style={{ color: "#555", fontSize: 11 }}>© 2026 HireHub-AI. All rights reserved.</p>
          <div style={{ display: "flex", gap: 24 }}>
            <span style={{ color: "#555", fontSize: 11 }}>Privacy</span>
            <span style={{ color: "#555", fontSize: 11 }}>Terms</span>
            <span style={{ color: "#555", fontSize: 11 }}>Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
