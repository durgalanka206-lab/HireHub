import React from "react";
import { motion } from "framer-motion";

export default function AIRobotMascot({ size = 80, isFloating = true, isGlowing = true }) {
  return (
    <motion.div
      animate={isFloating ? { y: [0, -6, 0] } : {}}
      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        filter: isGlowing ? "drop-shadow(0 0 12px rgba(201, 168, 76, 0.25))" : "none"
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="roboGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a84c" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a0a14" />
            <stop offset="100%" stopColor="#040406" />
          </linearGradient>
        </defs>

        {/* Outer Halo */}
        <circle cx="50" cy="45" r="28" fill="rgba(139, 92, 246, 0.05)" />

        {/* Antenna */}
        <path d="M50 20 L50 9" stroke="url(#roboGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <motion.circle
          cx="50"
          cy="8"
          r="3"
          fill="#c9a84c"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />

        {/* Ears */}
        <rect x="22" y="31" width="6" height="12" rx="3" fill="#2a2a3e" stroke="url(#roboGrad)" strokeWidth="1" />
        <rect x="72" y="31" width="6" height="12" rx="3" fill="#2a2a3e" stroke="url(#roboGrad)" strokeWidth="1" />

        {/* Neck */}
        <rect x="44" y="47" width="12" height="5" rx="1.5" fill="#1e1e2f" stroke="#2a2a3e" strokeWidth="1" />

        {/* Head */}
        <rect x="26" y="17" width="48" height="33" rx="14" fill="#131320" stroke="url(#roboGrad)" strokeWidth="2" />

        {/* Face Screen */}
        <rect x="31" y="22" width="38" height="23" rx="8" fill="url(#screenGrad)" />

        {/* Eyes with blink animation */}
        <motion.ellipse
          cx="43"
          cy="33"
          rx="3"
          ry="3.5"
          fill="#c9a84c"
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ repeat: Infinity, duration: 3.5, times: [0, 0.9, 0.92, 0.94, 1], ease: "easeInOut" }}
          style={{ transformOrigin: "43px 33px" }}
        />
        <motion.ellipse
          cx="57"
          cy="33"
          rx="3"
          ry="3.5"
          fill="#c9a84c"
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ repeat: Infinity, duration: 3.5, times: [0, 0.9, 0.92, 0.94, 1], ease: "easeInOut" }}
          style={{ transformOrigin: "57px 33px" }}
        />

        {/* Smile mouth */}
        <path d="M46 39 Q50 41 54 39" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />

        {/* Main Body */}
        <path d="M32 52 L68 52 Q74 52 73 59 L70 76 Q69 80 64 80 L36 80 Q31 80 30 76 L27 59 Q26 52 32 52 Z" fill="#131320" stroke="url(#roboGrad)" strokeWidth="2" />

        {/* Chest Light */}
        <motion.rect
          x="44"
          y="60"
          width="12"
          height="4"
          rx="2"
          fill="#8b5cf6"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
}
