import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const S = {
  card:       { background:"var(--color-bg-card)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)" },
  input:      { width:"100%", background:"var(--color-bg-base)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-sm)", padding:"12px 14px", color:"var(--color-text-primary)", fontSize:14, outline:"none", boxSizing:"border-box" },
  btn:        { background:"linear-gradient(135deg,var(--color-gold-soft),var(--color-gold-deep))", color:"var(--color-bg-base)", border:"none", borderRadius:"var(--radius-sm)", padding:"12px 22px", fontWeight:700, cursor:"pointer", fontSize:14, letterSpacing:0.5, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center" },
  label:      { fontSize:12, color:"var(--color-text-secondary)", fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:6, display:"block" },
};

export function EyeIcon({ show }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export function PasswordInput({ value, onChange, onKeyDown, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:"relative", width:"100%" }}>
      <input style={{ ...S.input, paddingRight:42 }} type={show?"text":"password"}
        placeholder={placeholder||"••••••••"} value={value} onChange={onChange} onKeyDown={onKeyDown} />
      <span onClick={() => setShow(s => !s)}
        style={{ position:"absolute", right:13, top:"13px", cursor:"pointer", lineHeight:0 }}>
        <EyeIcon show={show} />
      </span>
    </div>
  );
}

export function PasswordStrength({ password }) {
  if (!password) return null;
  const hasUpper = /[A-Z]/.test(password), hasLower = /[a-z]/.test(password);
  const hasNum = /[0-9]/.test(password), hasSpec = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password);
  const long = password.length >= 8;
  const score = [hasUpper,hasLower,hasNum,hasSpec,long].filter(Boolean).length;
  const label = score<=2?"Weak":score<=3?"Fair":score===4?"Good":"Strong";
  const color = score<=2?"var(--color-danger)":score<=3?"#fbbf24":score===4?"#60a5fa":"var(--color-success)";
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop:6 }}>
      <div style={{ height:4, background:"var(--color-border)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${score*20}%`, background:color, transition:"width .3s,background .3s" }} />
      </div>
      <p style={{ margin:"4px 0 0", fontSize:10, color }}>
        {label}{!long?" — min 8 chars":!hasUpper?" — add uppercase":!hasSpec?" — add special char (!@#…)":""}
      </p>
    </motion.div>
  );
}

export function OTPInput({ value, onChange, onEnter }) {
  return (
    <input style={{ ...S.input, fontSize:32, textAlign:"center", letterSpacing:14, fontWeight:700, color:"var(--color-gold-soft)", fontFamily:"monospace", padding:"14px 0" }}
      placeholder="• • • • • •" maxLength={6} value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g,""))}
      onKeyDown={e => e.key==="Enter" && onEnter?.()} />
  );
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:20 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ background:"var(--color-bg-card)", border:"1px solid var(--color-border)", borderRadius:16, padding:"28px 32px", maxWidth:420, width:"100%", boxShadow:"0 16px 40px rgba(0,0,0,0.5)" }}>
        <h3 style={{ margin:"0 0 10px", color:"var(--color-text-primary)", fontSize:18, fontWeight:700 }}>{title}</h3>
        <p style={{ margin:"0 0 24px", color:"var(--color-text-secondary)", fontSize:14, lineHeight:1.6 }}>{message}</p>
        <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
          <button onClick={onCancel}
            style={{ padding:"10px 20px", background:"transparent", border:"1px solid var(--color-border)", borderRadius:8, color:"var(--color-text-secondary)", cursor:"pointer", fontSize:13, fontWeight:600 }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ padding:"10px 20px", background: danger ? "var(--color-danger-bg)" : "linear-gradient(135deg,var(--color-gold-soft),var(--color-gold-deep))",
              border: danger ? "1px solid rgba(248,113,113,0.35)" : "none",
              borderRadius:8, color: danger ? "var(--color-danger)" : "var(--color-bg-base)",
              cursor:"pointer", fontSize:13, fontWeight:700 }}>
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
