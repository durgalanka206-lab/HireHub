import React from 'react';
import { motion } from 'framer-motion';
import { S } from '../components/UI';

const convertToLPA = (salaryStr) => {
  if (!salaryStr) return "Not specified";
  const matches = salaryStr.match(/\$(\d+)K/g);
  if (!matches || matches.length < 2) return salaryStr;
  const min = parseInt(matches[0].replace("$","").replace("K",""));
  const max = parseInt(matches[1].replace("$","").replace("K",""));
  const minLPA = Math.round(min * 83 / 100);
  const maxLPA = Math.round(max * 83 / 100);
  return `₹${minLPA} – ₹${maxLPA} LPA`;
};

export default function SuccessPage({ job, profile, onHome }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight:"100vh", background:"var(--color-bg-base)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 20px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50vh", background: "radial-gradient(ellipse at top, rgba(16,185,129,0.1), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:44, zIndex:1 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,var(--color-gold-soft),var(--color-gold-deep))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"var(--color-bg-deep)" }}>H</div>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:"var(--color-gold-soft)", letterSpacing:3 }}>HIREHUB</span>
      </div>

      <div style={{ width:"100%", maxWidth:500, zIndex:1 }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#14532d,#166534)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 22px", boxShadow:"0 0 40px rgba(74,222,128,0.25)" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:700, color:"var(--color-text-primary)", margin:"0 0 8px" }}>Application Submitted!</h1>
          <p style={{ color:"var(--color-text-secondary)", fontSize:14, margin:0 }}>We'll notify you when there's an update.</p>
        </motion.div>

        <motion.div className="glass-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ ...S.card, padding:"18px 20px", marginBottom:14 }}>
          <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:14, paddingBottom:14, borderBottom:"1px solid var(--color-border)" }}>
            <div style={{ width:46, height:46, borderRadius:11, background:job.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:"#fff", flexShrink:0 }}>{job.logo}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontWeight:700, fontSize:15, color:"var(--color-text-primary)" }}>{job.title}</p>
              <p style={{ margin:"3px 0 0", fontSize:12, color:"var(--color-text-muted)" }}>{job.company} · {job.location}</p>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <p style={{ margin:0, fontSize:13, color:"var(--color-gold-soft)", fontWeight:600 }}>{convertToLPA(job.salary)}</p>
              <p style={{ margin:"3px 0 0", fontSize:10, color:"var(--color-text-muted)" }}>{job.type}</p>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <div>
              <p style={{ margin:"0 0 4px", fontSize:9, color:"var(--color-text-muted)", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Applied as</p>
              <p style={{ margin:0, fontSize:13, color:"var(--color-text-primary)", fontWeight:600 }}>{profile?.name}</p>
            </div>
            <div>
              <p style={{ margin:"0 0 4px", fontSize:9, color:"var(--color-text-muted)", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Status</p>
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"var(--color-success-bg)", color:"var(--color-success)", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"var(--color-success)", flexShrink:0 }}/>Applied
              </span>
            </div>
            <div>
              <p style={{ margin:"0 0 4px", fontSize:9, color:"var(--color-text-muted)", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Date</p>
              <p style={{ margin:0, fontSize:13, color:"var(--color-text-primary)", fontWeight:600 }}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
            </div>
          </div>
        </motion.div>

        <motion.div className="glass-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ ...S.card, padding:"16px 20px", marginBottom:22 }}>
          <p style={{ margin:"0 0 12px", fontSize:9, color:"var(--color-text-muted)", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>What happens next</p>
          <div style={{ display:"flex", gap:0, alignItems:"stretch" }}>
            {[
              { icon:"✓", label:"Submitted",  color:"var(--color-success)", done:true },
              { icon:"⏳", label:"Reviewing",  color:"#fbbf24", done:false },
              { icon:"⭐", label:"Decision",   color:"#a78bfa", done:false },
            ].map((step, i) => (
              <div key={step.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, position:"relative" }}>
                {i > 0 && <div style={{ position:"absolute", left:0, top:16, width:"50%", height:2, background:"var(--color-border)" }} />}
                {i < 2 && <div style={{ position:"absolute", right:0, top:16, width:"50%", height:2, background:"var(--color-border)" }} />}
                <div style={{ width:34, height:34, borderRadius:"50%", zIndex:1,
                  background: step.done ? "var(--color-success-bg)" : "var(--color-bg-card)",
                  border:`2px solid ${step.done ? "var(--color-success)" : "var(--color-border)"}`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
                  {step.icon}
                </div>
                <span style={{ fontSize:10, color: step.done ? step.color : "var(--color-text-muted)", fontWeight: step.done ? 600 : 400 }}>{step.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ ...S.btn, width:"100%", padding:"14px", fontSize:15 }} onClick={onHome}>
          ← Back to All Jobs
        </motion.button>
      </div>
    </motion.div>
  );
}
