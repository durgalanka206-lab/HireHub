import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIRobotMascot from "./AIRobotMascot";

const DEFAULT_MESSAGES = [
  "Reading Resume...",
  "Analyzing Job Description...",
  "Matching Skills...",
  "Generating HR Questions...",
  "Generating Technical Questions...",
  "Creating Personalized Interview...",
  "Almost Ready..."
];

export default function PremiumLoader({ title = "Preparing Your Environment...", messages = DEFAULT_MESSAGES }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [percentage, setPercentage] = useState(5);

  useEffect(() => {
    // Cycle messages every 2.5 seconds
    const msgInterval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 2500);

    // Slowly increment fake percentage
    const pctInterval = setInterval(() => {
      setPercentage(prev => {
        if (prev >= 98) {
          clearInterval(pctInterval);
          return 98;
        }
        const step = Math.floor(Math.random() * 8) + 2; // Add between 2% and 10%
        return Math.min(prev + step, 98);
      });
    }, 800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(pctInterval);
    };
  }, [messages]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(5, 5, 10, 0.96)",
      backdropFilter: "blur(16px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      color: "#e8e0d0",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        
        {/* Outer progress ring animation */}
        <motion.svg width="190" height="190" viewBox="0 0 100 100" style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="glowgrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c9a84c" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke="url(#glowgrad)"
            strokeWidth="2.5"
            strokeDasharray="30 50 15 25"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            style={{ transformOrigin: "50px 50px" }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="#c9a84c"
            strokeWidth="1"
            strokeDasharray="5 15"
            strokeOpacity="0.4"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            style={{ transformOrigin: "50px 50px" }}
          />
        </motion.svg>

        {/* Mascot Robot centering inside ring */}
        <AIRobotMascot size={75} />

        {/* Progress Percentage */}
        <div style={{ position: "absolute", bottom: -20, fontSize: 13, fontWeight: 700, color: "#c9a84c", letterSpacing: 1 }}>
          {percentage}%
        </div>
      </div>

      {/* Dynamic text updates */}
      <div style={{ minHeight: "80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ marginTop: 45, fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, letterSpacing: 1.2, color: "#e8e0d0", margin: "45px 0 6px" }}>
          {title}
        </h2>
        <AnimatePresence mode="wait">
          <motion.h4
            key={msgIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ margin: 0, fontSize: 13, color: "#c9a84c", letterSpacing: 0.5, fontWeight: 600 }}
          >
            {messages[msgIdx]}
          </motion.h4>
        </AnimatePresence>
      </div>
    </div>
  );
}
