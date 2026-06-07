import React from 'react';
import { motion } from 'framer-motion';

export default function JobCard({ job, isActive, isBookmarked, toggleBookmark, onClick, matchColor, convertToLPA }) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isActive ? 1 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      style={{
        padding: "16px",
        cursor: "pointer",
        borderBottom: "1px solid var(--color-border)",
        transition: "var(--transition-fast)",
        background: isActive ? "var(--color-gold-glow)" : "transparent",
        borderLeft: isActive ? "3px solid var(--color-gold-soft)" : "3px solid transparent",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseOver={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      onMouseOut={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {isActive && (
        <motion.div
          layoutId="activeHighlight"
          style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(201,168,76,0.1), transparent)", zIndex: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: job.color || "#635BFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          {job.logo || "J"}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isActive ? "var(--color-gold-soft)" : "var(--color-text-primary)", lineHeight: 1.3, paddingRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {job.title}
            </p>
            <motion.button 
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={e => { e.stopPropagation(); toggleBookmark(job); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0, color: isBookmarked ? "var(--color-gold-soft)" : "var(--color-text-muted)", transition: "var(--transition-fast)" }}
            >
              {isBookmarked ? "★" : "☆"}
            </motion.button>
          </div>
          
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>
            <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{job.company}</span> · {job.location}
          </p>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 12, color: "var(--color-gold-soft)", fontWeight: 600, background: "rgba(201,168,76,0.1)", padding: "2px 8px", borderRadius: 4 }}>
              {convertToLPA(job.salary)}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={matchColor(job.match)} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: matchColor(job.match) }}>{job.match}% match</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
