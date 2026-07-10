import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { S } from './UI';

/**
 * Reusable ResumeSectionCard component for Phase 3 AI Resume Optimizer.
 * Styled with HireHub's premium dark aesthetic.
 * Supports collapsible accordion mode ("View Details").
 */
export default function ResumeSectionCard({
  icon,
  sectionNumber,
  title,
  subtitle,
  badge,
  borderColor = "rgba(201,168,76,0.25)",
  collapsible = false,
  defaultOpen = true,
  children,
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        ...S.card,
        padding: "18px 20px",
        background: "linear-gradient(135deg, #0e0e1e 0%, #121226 100%)",
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        boxShadow: "0 12px 35px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: isOpen ? 12 : 0,
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {/* Card Header */}
      <div
        onClick={() => collapsible && setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          borderBottom: isOpen ? "1px solid #1a1a2e" : "1px solid transparent",
          paddingBottom: isOpen ? 10 : 0,
          cursor: collapsible ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))",
              border: "1px solid rgba(201,168,76,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
            }}>
              {icon}
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {sectionNumber && (
                <span style={{ fontSize: 9, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1 }}>
                  SECTION {sectionNumber}
                </span>
              )}
            </div>
            <h3 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: "#e8e0d0", fontFamily: "'Cormorant Garamond', serif" }}>
              {title}
            </h3>
            {subtitle && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>{subtitle}</p>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {badge && (
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              background: badge.bg || "rgba(201,168,76,0.12)",
              color: badge.color || "#c9a84c",
              border: `1px solid ${badge.border || "rgba(201,168,76,0.3)"}`,
            }}>
              {badge.text}
            </div>
          )}

          {collapsible && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              style={{
                background: isOpen ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.05)",
                border: isOpen ? "1px solid rgba(201,168,76,0.3)" : "1px solid #2a2a3e",
                color: isOpen ? "#c9a84c" : "#9ca3af",
                borderRadius: 8,
                padding: "5px 12px",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              {isOpen ? "Hide Details ▲" : "View Details ▼"}
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <AnimatePresence initial={false}>
        {(!collapsible || isOpen) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
