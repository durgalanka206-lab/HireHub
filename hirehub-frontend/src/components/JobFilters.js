import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_FILTERS } from "../utils/filterHelpers";

export function getActiveFiltersCount(filters) {
  let count = 0;
  if (filters.experience && filters.experience.length > 0) count++;
  if (filters.type && filters.type.length > 0) count++;
  if (filters.workMode && filters.workMode.length > 0) count++;
  if (filters.minSalary && filters.minSalary !== "") count++;
  if (filters.maxSalary && filters.maxSalary !== "") count++;
  if (filters.location && filters.location.trim() !== "") count++;
  if (filters.company && filters.company.trim() !== "") count++;
  if (filters.skills && filters.skills.trim() !== "") count++;
  if (filters.minMatch && filters.minMatch > 0) count++;
  if (filters.sortBy && filters.sortBy !== "match") count++;
  return count;
}

export default function JobFilters({ filters, onApplyFilters, onResetFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters || DEFAULT_FILTERS);

  // Initialize temp filters when opening the popover
  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters || DEFAULT_FILTERS);
    }
  }, [isOpen, filters]);

  const activeCount = getActiveFiltersCount(filters || DEFAULT_FILTERS);

  const toggleChip = (category, value) => {
    setTempFilters(prev => {
      const current = prev[category] || [];
      const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: next };
    });
  };

  const handleApply = () => {
    onApplyFilters(tempFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    onResetFilters();
    setIsOpen(false);
  };

  // Option definitions
  const experienceOptions = ["Fresher", "1–2 Years", "3–5 Years", "5+ Years"];
  const typeOptions = ["Full Time", "Part Time", "Internship", "Contract"];
  const workModeOptions = ["Remote", "Hybrid", "On-site"];
  const sortByOptions = [
    { value: "match", label: "Match Score" },
    { value: "salary", label: "Salary" },
    { value: "recent", label: "Newest" }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isOpen || activeCount > 0 ? "rgba(201,168,76,0.12)" : "#1a1a2a",
          border: isOpen || activeCount > 0 ? "1px solid rgba(201,168,76,0.4)" : "1px solid #2a2a3e",
          borderRadius: 8,
          padding: "8px 12px",
          color: isOpen || activeCount > 0 ? "#c9a84c" : "#888",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          fontFamily: "inherit",
          transition: "all 0.2s"
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: 6 }}
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filters {activeCount > 0 ? `(${activeCount})` : ""}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop layer to catch clicks outside */}
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 998,
                background: "transparent"
              }}
            />

            {/* Popover Filter Panel */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: "100%",
                left: 16,
                right: 16,
                marginTop: 8,
                zIndex: 999,
                background: "#0f0f1a",
                border: "1px solid #2a2a3e",
                borderRadius: 12,
                boxShadow: "0 20px 40px rgba(0,0,0,0.65)",
                padding: 16,
                maxHeight: "calc(100vh - 220px)",
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: "#2a2a3e #0f0f1a",
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}
            >
              {/* Experience */}
              <div>
                <label style={styles.label}>Experience</label>
                <div style={styles.chipRow}>
                  {experienceOptions.map(opt => {
                    const active = tempFilters.experience?.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleChip("experience", opt)}
                        style={{
                          ...styles.chip,
                          background: active ? "rgba(201,168,76,0.15)" : "#1a1a2a",
                          color: active ? "#c9a84c" : "#888",
                          border: active ? "1px solid rgba(201,168,76,0.5)" : "1px solid #2a2a3e"
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Employment Type */}
              <div>
                <label style={styles.label}>Employment Type</label>
                <div style={styles.chipRow}>
                  {typeOptions.map(opt => {
                    const active = tempFilters.type?.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleChip("type", opt)}
                        style={{
                          ...styles.chip,
                          background: active ? "rgba(201,168,76,0.15)" : "#1a1a2a",
                          color: active ? "#c9a84c" : "#888",
                          border: active ? "1px solid rgba(201,168,76,0.5)" : "1px solid #2a2a3e"
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work Mode */}
              <div>
                <label style={styles.label}>Work Mode</label>
                <div style={styles.chipRow}>
                  {workModeOptions.map(opt => {
                    const active = tempFilters.workMode?.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleChip("workMode", opt)}
                        style={{
                          ...styles.chip,
                          background: active ? "rgba(201,168,76,0.15)" : "#1a1a2a",
                          color: active ? "#c9a84c" : "#888",
                          border: active ? "1px solid rgba(201,168,76,0.5)" : "1px solid #2a2a3e"
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <label style={styles.label}>Salary Range (LPA)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder="Min LPA"
                    value={tempFilters.minSalary}
                    onChange={e =>
                      setTempFilters(prev => ({ ...prev, minSalary: e.target.value }))
                    }
                    style={styles.input}
                  />
                  <span style={{ color: "#444" }}>–</span>
                  <input
                    type="number"
                    placeholder="Max LPA"
                    value={tempFilters.maxSalary}
                    onChange={e =>
                      setTempFilters(prev => ({ ...prev, maxSalary: e.target.value }))
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label style={styles.label}>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Remote"
                  value={tempFilters.location}
                  onChange={e =>
                    setTempFilters(prev => ({ ...prev, location: e.target.value }))
                  }
                  style={styles.input}
                />
              </div>

              {/* Company */}
              <div>
                <label style={styles.label}>Company</label>
                <input
                  type="text"
                  placeholder="e.g. Google"
                  value={tempFilters.company}
                  onChange={e =>
                    setTempFilters(prev => ({ ...prev, company: e.target.value }))
                  }
                  style={styles.input}
                />
              </div>

              {/* Skills */}
              <div>
                <label style={styles.label}>Skills Required</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js"
                  value={tempFilters.skills}
                  onChange={e =>
                    setTempFilters(prev => ({ ...prev, skills: e.target.value }))
                  }
                  style={styles.input}
                />
              </div>

              {/* Match Score */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ ...styles.label, margin: 0 }}>Min Match Score</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c" }}>
                    {tempFilters.minMatch}%+
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={tempFilters.minMatch}
                  onChange={e =>
                    setTempFilters(prev => ({ ...prev, minMatch: parseInt(e.target.value) }))
                  }
                  style={{
                    width: "100%",
                    accentColor: "#c9a84c",
                    cursor: "pointer",
                    background: "#2a2a3e",
                    height: 4,
                    borderRadius: 2,
                    outline: "none"
                  }}
                />
              </div>

              {/* Sort By */}
              <div>
                <label style={styles.label}>Sort By</label>
                <div style={styles.chipRow}>
                  {sortByOptions.map(opt => {
                    const active = tempFilters.sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setTempFilters(prev => ({ ...prev, sortBy: opt.value }))
                        }
                        style={{
                          ...styles.chip,
                          flex: 1,
                          background: active ? "rgba(201,168,76,0.15)" : "#1a1a2a",
                          color: active ? "#c9a84c" : "#888",
                          border: active ? "1px solid rgba(201,168,76,0.5)" : "1px solid #2a2a3e"
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  paddingTop: 12,
                  borderTop: "1px solid #2a2a3e"
                }}
              >
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "transparent",
                    border: "1px solid #2a2a3e",
                    borderRadius: 8,
                    color: "#888",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = "#ef4444";
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = "#2a2a3e";
                    e.currentTarget.style.color = "#888";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Reset Filters
                </button>
                <button
                  onClick={handleApply}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "linear-gradient(135deg, #c9a84c, #8b6914)",
                    border: "none",
                    borderRadius: 8,
                    color: "#0a0a14",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.filter = "brightness(1.1)";
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.filter = "brightness(1)";
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const styles = {
  label: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block"
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6
  },
  chip: {
    padding: "6px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    outline: "none",
    fontFamily: "inherit",
    transition: "all 0.15s",
    boxSizing: "border-box"
  },
  input: {
    width: "100%",
    background: "#1a1a2a",
    border: "1px solid #2a2a3e",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#e8e0d0",
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s"
  }
};
