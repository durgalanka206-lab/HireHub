import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthPage from "./pages/AuthPage";
import SuccessPage from "./pages/SuccessPage";
import JobCard from "./components/JobCard";
import { S, PasswordInput, PasswordStrength, ConfirmModal } from "./components/UI";

const API = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5000/api" : process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL + "/api" : "https://hirehub-dx1z.onrender.com/api");

const SKILL_KEYWORDS = [
  "java","python","javascript","typescript","react","angular","vue","node","nodejs",
  "spring","springboot","spring boot","sql","mysql","postgresql","mongodb","html","css","git",
  "docker","kubernetes","aws","azure","gcp","rest","api","graphql","redux",
  "nlp","machine learning","deep learning","tensorflow","pytorch","pandas",
  "numpy","flask","django","express","tailwind","bootstrap","linux","bash",
  "postman","jira","agile","scrum","ci/cd","devops","microservices","redis",
  "firebase","supabase","vite","webpack","jest","testing","selenium","jenkins",
  "c++","c#","rust","go","kotlin","swift","php","laravel","ruby","rails",
  "debugging","backend","frontend","full stack","algorithms","data structures","oops","oop",
  "markdown","swagger","github","technical writing","api documentation","developer empathy",
];

// ── FIXED: proper USD → INR LPA conversion ──────────────────
// $160K/yr × $1 = ₹83 → $160,000 × 83 ÷ 100,000 = ₹132.8 LPA
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

const matchColor = (pct) => {
  if (pct >= 70) return "#10b981";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
};

const statusStyles = {
  applied:     { bg:"rgba(96,165,250,.12)",  color:"#60a5fa", dot:"#60a5fa", label:"Applied" },
  reviewing:   { bg:"rgba(251,191,36,.12)",  color:"#fbbf24", dot:"#fbbf24", label:"Reviewing" },
  shortlisted: { bg:"rgba(74,222,128,.12)",  color:"#4ade80", dot:"#4ade80", label:"Shortlisted" },
  rejected:    { bg:"rgba(248,113,113,.12)", color:"#f87171", dot:"#f87171", label:"Rejected" },
};

/* ══════════════════════════════════════════════════════════════
   CHART COMPONENTS — pure SVG, no library needed
══════════════════════════════════════════════════════════════ */
function LineChart({ data, width=680, height=160 }) {
  if (!data || data.length === 0) return null;
  const pad = { top:16, right:16, bottom:36, left:32 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const pts = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * W,
    y: pad.top + H - (d.count / maxVal) * H,
    ...d,
  }));
  const pathD = pts.map((p, i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${pts[pts.length-1].x},${pad.top+H} L${pts[0].x},${pad.top+H} Z`;
  const [tooltip, setTooltip] = useState(null);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width:"100%", height:"auto", overflow:"visible" }}>
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {[0,0.25,0.5,0.75,1].map(r => (
        <line key={r} x1={pad.left} y1={pad.top+H*r} x2={pad.left+W} y2={pad.top+H*r} stroke="#141428" strokeWidth="1"/>
      ))}
      <path d={areaD} fill="url(#lg1)"/>
      <path d={pathD} fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      {pts.filter((_,i)=>i%2===0).map(p=>(
        <text key={p.date} x={p.x} y={pad.top+H+18} textAnchor="middle" fontSize="9" fill="#3a3a5a">{p.label}</text>
      ))}
      <text x={pad.left-4} y={pad.top+4} textAnchor="end" fontSize="9" fill="#3a3a5a">{maxVal}</text>
      <text x={pad.left-4} y={pad.top+H} textAnchor="end" fontSize="9" fill="#3a3a5a">0</text>
      {pts.map(p=>(
        <g key={p.date} onMouseEnter={()=>setTooltip(p)} onMouseLeave={()=>setTooltip(null)} style={{cursor:"default"}}>
          <circle cx={p.x} cy={p.y} r="8" fill="transparent"/>
          <circle cx={p.x} cy={p.y} r={tooltip?.date===p.date?5:3} fill={p.count>0?"#c9a84c":"#1e1e30"} stroke="#c9a84c" strokeWidth="1.5"/>
          {tooltip?.date===p.date&&(
            <g>
              <rect x={p.x-22} y={p.y-28} width={44} height={20} rx={4} fill="#1e1e30" stroke="#2a2a3e"/>
              <text x={p.x} y={p.y-14} textAnchor="middle" fontSize="11" fill="#c9a84c" fontWeight="700">{p.count}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

function BarChart({ data }) {
  if (!data || data.length===0) return null;
  const maxVal = Math.max(...data.map(d=>d.count),1);
  const [tooltip, setTooltip] = useState(null);
  const colors = ["#c9a84c","#60a5fa","#4ade80","#f87171","#a78bfa","#fb923c"];
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120, padding:"0 4px" }}>
      {data.map((d,i)=>{
        const barH = Math.max((d.count/maxVal)*100, d.count>0?4:0);
        return (
          <div key={d.title} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%", justifyContent:"flex-end" }}
            onMouseEnter={()=>setTooltip(i)} onMouseLeave={()=>setTooltip(null)}>
            {tooltip===i&&(
              <div style={{ background:"#1e1e30", border:"1px solid #2a2a3e", borderRadius:6, padding:"3px 7px", fontSize:11, color:colors[i%colors.length], fontWeight:700, whiteSpace:"nowrap", marginBottom:2 }}>
                {d.count}
              </div>
            )}
            <div style={{ width:"100%", height:`${barH}%`, background:colors[i%colors.length], borderRadius:"3px 3px 0 0", opacity:tooltip===i?1:0.7, transition:"all .2s", minHeight:d.count>0?"4px":"0" }}/>
            <p style={{ margin:0, fontSize:9, color:"#3a3a5a", textAlign:"center", width:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {d.title.length>12?d.title.slice(0,11)+"…":d.title}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }) {
  if (!data||data.length===0) return null;
  const total = data.reduce((s,d)=>s+d.count,0);
  if (total===0) return <p style={{ color:"#3a3a5a", fontSize:13, textAlign:"center", margin:"20px 0" }}>No data yet</p>;
  const size=120,cx=60,cy=60,r=44,stroke=18,circ=2*Math.PI*r;
  let offset=0;
  const slices = data.map(d=>{
    const pct=d.count/total, dash=pct*circ;
    const s={...d,dash,offset}; offset+=dash; return s;
  });
  const [tooltip,setTooltip]=useState(null);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#141428" strokeWidth={stroke}/>
        {slices.map((s,i)=>(
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
            strokeWidth={tooltip===i?stroke+3:stroke}
            strokeDasharray={`${s.dash} ${circ-s.dash}`}
            strokeDashoffset={-s.offset+circ/4}
            style={{ cursor:"default", transition:"stroke-width .15s", transform:"rotate(-90deg)", transformOrigin:`${cx}px ${cy}px` }}
            onMouseEnter={()=>setTooltip(i)} onMouseLeave={()=>setTooltip(null)}/>
        ))}
        <text x={cx} y={cy-5} textAnchor="middle" fontSize="18" fontWeight="700" fill="#e8e0d0">{total}</text>
        <text x={cx} y={cy+9} textAnchor="middle" fontSize="9" fill="#555">total</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
        {data.map((d,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:10,height:10,borderRadius:2,background:d.color,flexShrink:0 }}/>
            <span style={{ fontSize:12,color:"#888",flex:1 }}>{d.label}</span>
            <span style={{ fontSize:13,fontWeight:700,color:d.color }}>{d.count}</span>
            <span style={{ fontSize:11,color:"#3a3a5a" }}>{Math.round(d.count/total*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPANY LOGO — renders <img> for path-based logos, falls back to initials
══════════════════════════════════════════════════════════════ */
function CompanyLogo({ job, size = 44, style = {} }) {
  const [err, setErr] = useState(false);
  const logoPath = job?.logo;
  const isImagePath = logoPath && (logoPath.startsWith('/') || logoPath.startsWith('http') || logoPath.includes('.'));

  if (isImagePath && !err) {
    return (
      <img
        src={logoPath}
        alt={job?.company || 'Company logo'}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.27),
          objectFit: "contain",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          ...style
        }}
      />
    );
  }

  const initial = job?.company ? job.company.charAt(0).toUpperCase() : "J";
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.27),
      background: job?.color || "#1e1e2f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: Math.round(size * 0.4),
      fontWeight: 800,
      color: "#fff",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      ...style
    }}>
      {initial}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ACCOUNT DROPDOWN — profile pic click → shows account switcher
══════════════════════════════════════════════════════════════ */
function AccountDropdown({ user, onLogout, onAddAccount, extraStyle }) {
  const [open, setOpen] = useState(false);

  // Load saved accounts from localStorage (max 5)
  const savedAccounts = (() => {
    try { return JSON.parse(localStorage.getItem("hh_accounts") || "[]"); } catch { return []; }
  })();

  // Other accounts = saved list minus current user
  const otherAccounts = savedAccounts.filter(a => a.email !== (user?.email || ""));

  const removeAccount = (email) => {
    const updated = savedAccounts.filter(a => a.email !== email);
    localStorage.setItem("hh_accounts", JSON.stringify(updated));
    // Force re-render if removed current account
    if (email === (user?.email || "")) onLogout();
  };

  const switchTo = (acc) => {
    // Log out current, let App root know to pre-fill email
    localStorage.setItem("hh_switch_email", acc.email);
    onLogout();
  };

  return (
    <div style={{ position:"relative", ...extraStyle }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        title={(user?.name || "")}
        style={{ background:"none", border: open ? "2px solid #c9a84c" : "2px solid transparent",
          borderRadius:"50%", cursor:"pointer", padding:0, transition:"border .15s", display:"flex",
          alignItems:"center", justifyContent:"center", width:36, height:36, flexShrink:0 }}>
        {user?.avatar
          ? <img src={user?.avatar} alt={(user?.name || "")} referrerPolicy="no-referrer"
              style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", display:"block" }}
              onError={e => { e.target.style.display="none"; e.target.nextSibling && (e.target.nextSibling.style.display="flex"); }} />
          : <div style={{ width:32, height:32, borderRadius:8,
              background:"linear-gradient(135deg,#c9a84c,#8b6914)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, color:"#0a0a14" }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)}
            style={{ position:"fixed", inset:0, zIndex:998 }} />

          <div style={{ position:"absolute", top:44, right:0, zIndex:999, width:280,
            background:"#13131f", border:"1px solid #2a2a3e", borderRadius:14,
            boxShadow:"0 16px 48px rgba(0,0,0,0.6)", overflow:"hidden" }}>

            {/* Current account */}
            <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid #1e1e30" }}>
              <p style={{ margin:"0 0 2px", fontSize:10, color:"#3a3a5a",
                textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Signed in as</p>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
                {user?.avatar
                  ? <img src={user?.avatar} alt={(user?.name || "")} referrerPolicy="no-referrer"
                      style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}
                      onError={e => { e.target.onerror=null; e.target.src=""; e.target.style.display="none"; }} />
                  : <div style={{ width:38, height:38, borderRadius:9,
                      background:"linear-gradient(135deg,#c9a84c,#8b6914)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:15, fontWeight:700, color:"#0a0a14", flexShrink:0 }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#e8e0d0",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{(user?.name || "")}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#555",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{(user?.email || "")}</p>
                </div>

              </div>
            </div>



            {/* Actions — 3 separate buttons */}
            <div style={{ padding:"8px", borderTop:"1px solid #1e1e30" }}>

              {/* 1. Add account → HireHub Register page */}
              <button onClick={() => { setOpen(false); onAddAccount(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px",
                  background:"transparent", border:"none", borderRadius:8, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#9ca3af", transition:"all .15s",
                  textAlign:"left" }}
                onMouseOver={e => { e.currentTarget.style.background="#1a1a2e"; e.currentTarget.style.color="#e8e0d0"; }}
                onMouseOut={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9ca3af"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
                </svg>
                Add account
              </button>

              {/* 2. Switch account → Google account chooser */}
              <button onClick={() => { setOpen(false); window.location.href=`${API}/auth/google?prompt=select_account`; }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px",
                  background:"transparent", border:"none", borderRadius:8, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#9ca3af", transition:"all .15s",
                  textAlign:"left" }}
                onMouseOver={e => { e.currentTarget.style.background="#1a1a2e"; e.currentTarget.style.color="#e8e0d0"; }}
                onMouseOut={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9ca3af"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Switch account
              </button>

              {/* 3. Sign out */}
              <button onClick={() => { setOpen(false); onLogout(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px",
                  background:"transparent", border:"none", borderRadius:8, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#9ca3af", transition:"all .15s",
                  textAlign:"left" }}
                onMouseOver={e => { e.currentTarget.style.background="rgba(248,113,113,0.08)"; e.currentTarget.style.color="#f87171"; }}
                onMouseOut={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9ca3af"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD — with Jobs management tab (UPDATED VERSION)
══════════════════════════════════════════════════════════════ */
const EMPTY_JOB = { title:"", company:"", location:"", type:"Full-time", salary:"", logo:"", color:"#635BFF", tags:"", desc:"", requirements:"", isActive:true };

function AdminDashboard({ user, token, onLogout, onAddAccount }) {
  const [tab, setTab] = useState("overview");
  // Applications state
  const [applications, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilter] = useState("all");
  const [filterJob, setFilterJob] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [selected, setSelected] = useState(null);
  // Jobs state
  const [allJobs, setAllJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobForm, setJobForm] = useState(null);
  const [jobSaving, setJobSaving] = useState(false);
  const [jobFormErr, setJobFormErr] = useState("");
  // Confirm modal
  const [confirmDel, setConfirmDel] = useState(null);

  const authHeader = { Authorization: `Bearer ${token}` };

  // ── Stats & Applications ───────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/applications/stats`, { headers: authHeader });
      const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (d.success) setStats(d.data);
    } finally { setLoading(false); }
  }, [token]);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (search) params.set("search", search);
      if (filterJob !== "all") params.set("jobId", filterJob);
      const r = await fetch(`${API}/applications?${params}`, { headers: authHeader });
      const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (d.success) setApps(d.data);
    } finally { setLoading(false); }
  }, [token, filterStatus, search, filterJob]);

  useEffect(() => { loadStats(); }, [loadStats]);
  
  // Fixed: Added proper dependencies for applications loading
  useEffect(() => {
    if (tab === "applications") {
      loadApps();
    }
  }, [tab, filterStatus, filterJob, search, loadApps]);

  const updateStatus = async (id, status) => {
    const r = await fetch(`${API}/applications/${id}/status`, {
      method:"PATCH", headers:{ ...authHeader, "Content-Type":"application/json" }, body:JSON.stringify({ status }),
    });
    const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
    if (d.success) {
      setApps(prev => prev.map(a => a._id===id ? {...a, status} : a));
      if (selected?._id===id) setSelected(s => ({...s, status}));
      loadStats();
    }
  };

  const deleteApp = async () => {
    const id = confirmDel?.id;
    const r = await fetch(`${API}/applications/${id}`, { method:"DELETE", headers: authHeader });
    const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
    if (d.success) { setApps(prev => prev.filter(a => a._id!==id)); setSelected(null); loadStats(); }
    setConfirmDel(null);
  };

  // ── Jobs ───────────────────────────────────────────────────
  const loadAllJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const r = await fetch(`${API}/jobs/all`, { headers: authHeader });
      const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (d.success) setAllJobs(d.data);
    } finally { setJobsLoading(false); }
  }, [token]);

  useEffect(() => { if (tab === "jobs") loadAllJobs(); }, [tab, loadAllJobs]);

  const saveJob = async () => {
    setJobFormErr(""); setJobSaving(true);
    try {
      const isEdit = !!jobForm._id;
      const payload = {
        ...jobForm,
        tags: typeof jobForm.tags === "string" ? jobForm.tags.split(",").map(t=>t.trim()).filter(Boolean) : jobForm.tags,
        requirements: typeof jobForm.requirements === "string" ? jobForm.requirements.split("\n").map(r=>r.trim()).filter(Boolean) : jobForm.requirements,
      };
      const url = isEdit ? `${API}/jobs/${jobForm._id}` : `${API}/jobs`;
      const r = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { ...authHeader, "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (!d.success) { setJobFormErr(d.message); return; }
      loadAllJobs();
      setJobForm(null);
    } catch { setJobFormErr("Connection failed."); }
    finally { setJobSaving(false); }
  };

  const deleteJob = async () => {
    const id = confirmDel?.id;
    const r = await fetch(`${API}/jobs/${id}`, { method:"DELETE", headers: authHeader });
    const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
    if (d.success) setAllJobs(prev => prev.filter(j => j._id!==id));
    setConfirmDel(null);
  };

  const toggleJobActive = async (job) => {
    const r = await fetch(`${API}/jobs/${job._id}`, {
      method:"PUT", headers:{ ...authHeader, "Content-Type":"application/json" },
      body: JSON.stringify({ isActive: !job.isActive }),
    });
    const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
    if (d.success) setAllJobs(prev => prev.map(j => j._id===job._id ? {...j, isActive:!j.isActive} : j));
  };

  // ── Helpers ────────────────────────────────────────────────
  const initials = (name) => name?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"?";
  const timeAgo = (date) => {
    const mins = Math.floor((Date.now()-new Date(date))/60000);
    if (mins<60) return `${mins}m ago`;
    const hrs = Math.floor(mins/60);
    if (hrs<24) return `${hrs}h ago`;
    return `${Math.floor(hrs/24)}d ago`;
  };
  const avatarColors = ["#c9a84c","#60a5fa","#4ade80","#f87171","#a78bfa","#fb923c","#34d399","#f472b6"];
  const avatarBg = (name) => avatarColors[(name?.charCodeAt(0)||0)%avatarColors.length];

  const statusConfig = {
    applied:     { bg:"rgba(96,165,250,.12)",  color:"#60a5fa", dot:"#60a5fa", label:"Applied" },
    reviewing:   { bg:"rgba(251,191,36,.12)",  color:"#fbbf24", dot:"#fbbf24", label:"Reviewing" },
    shortlisted: { bg:"rgba(74,222,128,.12)",  color:"#4ade80", dot:"#4ade80", label:"Shortlisted" },
    rejected:    { bg:"rgba(248,113,113,.12)", color:"#f87171", dot:"#f87171", label:"Rejected" },
  };

  const navItems = [
    { id:"overview",     label:"Overview",     icon:"⬡" },
    { id:"applications", label:"Applications", icon:"◫" },
    { id:"jobs",         label:"Jobs",         icon:"" },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#07070f", color:"#d4cfc8", fontFamily:"'DM Sans',sans-serif", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirmDel}
        title={confirmDel?.type==="job" ? "Delete job posting?" : "Delete application?"}
        message={`"${confirmDel?.name}" will be permanently removed. This cannot be undone.`}
        onConfirm={confirmDel?.type==="job" ? deleteJob : deleteApp}
        onCancel={() => setConfirmDel(null)}
      />

      {/* Job Form Modal */}
      {jobForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20, overflowY:"auto" }}>
          <div style={{ background:"#13131f", border:"1px solid #2a2a3e", borderRadius:16, padding:"28px 32px", maxWidth:560, width:"100%", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:18, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif" }}>{jobForm._id?"Edit Job":"Add New Job"}</h3>
              <button onClick={() => setJobForm(null)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:20, fontFamily:"inherit" }}>×</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { label:"Job Title *", key:"title", placeholder:"e.g. Senior Frontend Engineer" },
                { label:"Company *", key:"company", placeholder:"e.g. Stripe" },
                { label:"Location *", key:"location", placeholder:"e.g. Remote, Bangalore, India" },
                { label:"Salary", key:"salary", placeholder:"e.g. $120K – $150K" },
                { label:"Logo Text", key:"logo", placeholder:"e.g. S" },
                { label:"Brand Color", key:"color", type:"color" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={S.label}>{label}</label>
                  {type==="color" ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <input type="color" value={jobForm[key]||"#635BFF"} onChange={e => setJobForm(f=>({...f,[key]:e.target.value}))}
                        style={{ width:48, height:36, borderRadius:6, border:"1px solid #2a2a3e", background:"#0f0f1a", cursor:"pointer", padding:2 }} />
                      <span style={{ fontSize:13, color:"#888" }}>{jobForm[key]}</span>
                    </div>
                  ) : (
                    <input style={S.input} placeholder={placeholder} value={jobForm[key]||""} onChange={e => setJobForm(f=>({...f,[key]:e.target.value}))} />
                  )}
                </div>
              ))}
              <div>
                <label style={S.label}>Type</label>
                <select value={jobForm.type||"Full-time"} onChange={e => setJobForm(f=>({...f,type:e.target.value}))}
                  style={{ ...S.input, cursor:"pointer" }}>
                  {["Full-time","Part-time","Contract","Internship"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Tags / Skills <span style={{ color:"#555", textTransform:"none", fontWeight:400 }}>(comma-separated)</span></label>
                <input style={S.input} placeholder="React, TypeScript, Node.js, SQL"
                  value={typeof jobForm.tags==="string" ? jobForm.tags : (jobForm.tags||[]).join(", ")}
                  onChange={e => setJobForm(f=>({...f,tags:e.target.value}))} />
              </div>
              <div>
                <label style={S.label}>Description</label>
                <textarea rows={3} style={{ ...S.input, resize:"vertical", lineHeight:1.6 }} placeholder="Brief description of the role..."
                  value={jobForm.desc||""} onChange={e => setJobForm(f=>({...f,desc:e.target.value}))} />
              </div>
              <div>
                <label style={S.label}>Requirements <span style={{ color:"#555", textTransform:"none", fontWeight:400 }}>(one per line)</span></label>
                <textarea rows={4} style={{ ...S.input, resize:"vertical", lineHeight:1.8 }} placeholder={"3+ years React experience\nTypeScript proficiency\nAPI design experience"}
                  value={typeof jobForm.requirements==="string" ? jobForm.requirements : (jobForm.requirements||[]).join("\n")}
                  onChange={e => setJobForm(f=>({...f,requirements:e.target.value}))} />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input type="checkbox" id="isActive" checked={jobForm.isActive!==false} onChange={e => setJobForm(f=>({...f,isActive:e.target.checked}))}
                  style={{ width:16, height:16, cursor:"pointer", accentColor:"#c9a84c" }} />
                <label htmlFor="isActive" style={{ ...S.label, marginBottom:0, textTransform:"none", letterSpacing:0, color:"#888", cursor:"pointer" }}>Active (visible to candidates)</label>
              </div>
              {jobFormErr && <p style={{ color:"#f87171", fontSize:13, margin:0 }}>⚠ {jobFormErr}</p>}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
                <button onClick={() => setJobForm(null)}
                  style={{ padding:"10px 20px", background:"transparent", border:"1px solid #2a2a3e", borderRadius:8, color:"#888", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
                  Cancel
                </button>
                <button onClick={saveJob} disabled={jobSaving}
                  style={{ ...S.btn, padding:"10px 24px", opacity:jobSaving?0.7:1 }}>
                  {jobSaving ? "Saving…" : (jobForm._id ? "Save Changes" : "Create Job")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width:240, background:"#0b0b17", borderRight:"1px solid #1c1c2e", display:"flex", flexDirection:"column", flexShrink:0, position:"fixed", left:0, top:0, height:"100vh", zIndex:20 }}>
        <div style={{ padding:"32px 24px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#c9a84c,#8b6914)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:14, fontWeight:800, color:"#07070f" }}>H</span>
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:"#c9a84c", letterSpacing:3 }}>HIREHUB</span>
          </div>
          <p style={{ margin:0, fontSize:10, color:"#8a8a9a", letterSpacing:2, textTransform:"uppercase", fontWeight:600, paddingLeft:42 }}>Admin Portal</p>
        </div>
        <nav style={{ flex:1, padding:"8px 12px" }}>
          <p style={{ margin:"0 0 12px 14px", fontSize:11, color:"#7a7a9a", letterSpacing:1.5, textTransform:"uppercase", fontWeight:600 }}>Menu</p>
          {navItems.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                onMouseEnter={e => {
                  if(!active) {
                    e.currentTarget.style.background="rgba(255,255,255,0.04)";
                    e.currentTarget.style.color="#e8e0d0";
                  }
                }}
                onMouseLeave={e => {
                  if(!active) {
                    e.currentTarget.style.background="transparent";
                    e.currentTarget.style.color="#a1a1aa";
                  }
                }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:8, border:active?"1px solid rgba(201,168,76,0.2)":"1px solid transparent", cursor:"pointer", marginBottom:4, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:active?600:500, textAlign:"left", transition:"all .2s",
                  background: active ? "linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))" : "transparent",
                  color: active ? "#c9a84c" : "#a1a1aa" }}>
                <span style={{ fontSize:18, display:"flex", alignItems:"center", opacity:active?1:0.7 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"16px", borderTop:"1px solid #1c1c2e" }}>
          {/* User info row */}
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px", marginBottom:16, background:"#131320", border:"1px solid #1c1c2e", borderRadius:10 }}>
            {user?.avatar
              ? <img src={user?.avatar} alt={(user?.name || "")} referrerPolicy="no-referrer" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} onError={e => { e.target.onerror=null; e.target.style.display="none"; }} />
              : <div style={{ width:36, height:36, borderRadius:9, background:"linear-gradient(135deg,#c9a84c,#8b6914)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#07070f", flexShrink:0 }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8e0d0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{(user?.name || "")}</p>
              <div style={{ marginTop:2 }}>
                <span style={{ fontSize:10, color:"#c9a84c", background:"rgba(201,168,76,0.1)", padding:"2px 6px", borderRadius:4, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, display:"inline-block" }}>Administrator</span>
              </div>
            </div>
          </div>
          {/* 3 action buttons */}
          <button onClick={onAddAccount}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"transparent", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:"#a1a1aa", transition:"all .15s", textAlign:"left", marginBottom:4 }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color="#e8e0d0"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#a1a1aa"; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.8 }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
            </svg>
            Add account
          </button>
          <button onClick={() => { window.location.href=`${API}/auth/google?prompt=select_account`; }}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"transparent", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:"#a1a1aa", transition:"all .15s", textAlign:"left", marginBottom:4 }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color="#e8e0d0"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#a1a1aa"; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.8 }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Switch account
          </button>
          <button onClick={onLogout}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"transparent", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:"#a1a1aa", transition:"all .15s", textAlign:"left" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.08)"; e.currentTarget.style.color="#f87171"; e.currentTarget.querySelector('svg').style.opacity = 1; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#a1a1aa"; e.currentTarget.querySelector('svg').style.opacity = 0.8; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.8, transition:"opacity .15s" }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft:240, flex:1, padding:"32px 28px", overflowY:"auto", minHeight:"100vh" }}>
        <div style={{ maxWidth:1100 }}>

          {/* ── OVERVIEW TAB ───────────────────────────────── */}
          {tab === "overview" && (
            <div>
              <div style={{ marginBottom:28 }}>
                <h1 style={{ margin:"0 0 4px", fontSize:24, fontWeight:700, color:"#d4cfc8", fontFamily:"'Cormorant Garamond',serif" }}>Dashboard</h1>
                <p style={{ margin:0, fontSize:13, color:"#2a2a4a" }}>Overview of all activity</p>
              </div>
              {loading && !stats ? (
                <p style={{ color:"#2a2a4a", fontSize:14 }}>Loading…</p>
              ) : stats && (<>
                {/* Stat Cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                  {[
                    { label:"Total Applications", value:stats.total,       color:"#60a5fa", glow:"rgba(96,165,250,.15)" },
                    { label:"Shortlisted",         value:stats.shortlisted, color:"#4ade80", glow:"rgba(74,222,128,.15)" },
                    { label:"Reviewing",           value:stats.reviewing,   color:"#fbbf24", glow:"rgba(251,191,36,.15)" },
                    { label:"Rejected",            value:stats.rejected,    color:"#f87171", glow:"rgba(248,113,113,.15)" },
                  ].map(k => (
                    <div key={k.label} style={{ background:"#0b0b17", border:"1px solid #141428", borderRadius:14, padding:"22px", transition:"transform .2s", cursor:"default" }}
                      onMouseOver={e => { e.currentTarget.style.transform="translateY(-2px)"; }}
                      onMouseOut={e => { e.currentTarget.style.transform="translateY(0)"; }}>
                      <p style={{ margin:"0 0 14px", fontSize:10, color:"#2a2a4a", textTransform:"uppercase", letterSpacing:2, fontWeight:600 }}>{k.label}</p>
                      <p style={{ margin:0, fontSize:34, fontWeight:700, color:k.color, lineHeight:1 }}>{k.value??"-"}</p>
                    </div>
                  ))}
                </div>

                {/* Line Chart + Donut */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginBottom:14 }}>
                  <div style={{ background:"#0b0b17", border:"1px solid #141428", borderRadius:14, padding:"20px 24px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#d4cfc8" }}>Applications — Last 14 Days</p>
                        <p style={{ margin:"2px 0 0", fontSize:11, color:"#3a3a5a" }}>Daily submission trend</p>
                      </div>
                      <span style={{ fontSize:11, color:"#c9a84c", fontWeight:600 }}>
                        {(stats.charts?.trend||[]).reduce((s,d)=>s+d.count,0)} this period
                      </span>
                    </div>
                    <LineChart data={stats.charts?.trend||[]} />
                  </div>
                  <div style={{ background:"#0b0b17", border:"1px solid #141428", borderRadius:14, padding:"20px 24px" }}>
                    <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:600, color:"#d4cfc8" }}>Match Score Distribution</p>
                    <p style={{ margin:"0 0 16px", fontSize:11, color:"#3a3a5a" }}>Candidate quality breakdown</p>
                    <DonutChart data={stats.charts?.scoreDistrib||[]} />
                  </div>
                </div>

                {/* Bar Chart + Avg Match */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginBottom:20 }}>
                  <div style={{ background:"#0b0b17", border:"1px solid #141428", borderRadius:14, padding:"20px 24px" }}>
                    <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:600, color:"#d4cfc8" }}>Applications per Job</p>
                    <p style={{ margin:"0 0 16px", fontSize:11, color:"#3a3a5a" }}>Top 6 most applied positions</p>
                    <BarChart data={stats.charts?.perJob||[]} />
                  </div>
                  <div style={{ background:"#0b0b17", border:"1px solid #141428", borderRadius:14, padding:"20px 24px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                    <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:600, color:"#d4cfc8" }}>Avg Match Score</p>
                    <p style={{ margin:"0 0 20px", fontSize:11, color:"#3a3a5a" }}>Across all applications</p>
                    <div style={{ textAlign:"center", marginBottom:16 }}>
                      <p style={{ margin:0, fontSize:52, fontWeight:700, color:matchColor(stats.avgMatchPercent), lineHeight:1 }}>{stats.avgMatchPercent}%</p>
                      <p style={{ margin:"6px 0 0", fontSize:11, color:"#3a3a5a" }}>
                        {stats.avgMatchPercent>=70?"Excellent candidate quality":stats.avgMatchPercent>=40?"Good candidate quality":"Low — review job requirements"}
                      </p>
                    </div>
                    <div style={{ height:6, background:"#141428", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${stats.avgMatchPercent}%`, borderRadius:3, background:matchColor(stats.avgMatchPercent), transition:"width 1.2s ease" }} />
                    </div>
                  </div>
                </div>
                <div style={{ background:"#0b0b17", border:"1px solid #141428", borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"20px 28px 16px", borderBottom:"1px solid #141428", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#d4cfc8" }}>Recent Applications</h3>
                    <button onClick={() => setTab("applications")} style={{ background:"transparent", border:"1px solid #1e1e30", borderRadius:6, color:"#c9a84c", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, padding:"4px 12px", marginLeft:"auto" }}>See all →</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"2.5fr 2fr 1fr 1.2fr 1fr", gap:12, padding:"10px 28px", borderBottom:"1px solid #0f0f1e" }}>
                    {["Candidate","Role","Match","Status","Time"].map(h => (
                      <p key={h} style={{ margin:0, fontSize:10, color:"#2a2a4a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>{h}</p>
                    ))}
                  </div>
                  {stats.recentApplications?.length === 0 && (
                    <div style={{ padding:"48px 28px", textAlign:"center" }}>
                      <p style={{ fontSize:32, margin:"0 0 8px" }}>◫</p>
                      <p style={{ color:"#2a2a4a", fontSize:13, margin:0 }}>No applications yet</p>
                    </div>
                  )}
                  {stats.recentApplications?.map((a, i) => {
                    const sc = statusConfig[a.status]||statusConfig.applied;
                    return (
                      <div key={a._id} style={{ display:"grid", gridTemplateColumns:"2.5fr 2fr 1fr 1.2fr 1fr", gap:12, padding:"14px 28px", borderBottom:i<stats.recentApplications.length-1?"1px solid #0f0f1e":"none", transition:"background .15s", cursor:"default" }}
                        onMouseOver={e => e.currentTarget.style.background="#0f0f1c"}
                        onMouseOut={e => e.currentTarget.style.background="transparent"}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:30, height:30, borderRadius:"50%", background:avatarBg(a.candidateName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#07070f", flexShrink:0 }}>{initials(a.candidateName)}</div>
                          <div>
                            <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#c9c4bb" }}>{a.candidateName}</p>
                            <p style={{ margin:0, fontSize:10, color:"#2a2a4a" }}>{a.candidateEmail}</p>
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center" }}>
                          <div>
                            <p style={{ margin:0, fontSize:12, fontWeight:500, color:"#a09a92" }}>{a.jobId?.title}</p>
                            <p style={{ margin:0, fontSize:10, color:"#2a2a4a" }}>{a.jobId?.company}</p>
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center" }}>
                          <span style={{ fontSize:13, fontWeight:700, color:matchColor(a.matchPercent) }}>{a.matchPercent}%</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center" }}>
                          <span style={{ background:sc.bg, color:sc.color, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:sc.dot, flexShrink:0 }} />{sc.label}
                          </span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center" }}>
                          <span style={{ fontSize:11, color:"#2a2a4a" }}>{timeAgo(a.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>)}
            </div>
          )}

          {/* ── APPLICATIONS TAB ── */}
          {tab === "applications" && (
            <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 64px)", margin:"-32px -28px 0", overflow:"hidden" }}>

              {/* ── Modal ── */}
              {selected && (
                <div onClick={() => setSelected(null)}
                  style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                  <div onClick={e => e.stopPropagation()}
                    style={{ background:"#0f0f1a", border:"1px solid #2a2a3e", borderRadius:18, width:"100%", maxWidth:920, maxHeight:"90vh", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>

                    {/* Modal header */}
                    <div style={{ padding:"18px 24px 16px", borderBottom:"1px solid #1a1a2e", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                      <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                        <div style={{ width:46, height:46, borderRadius:12, background:avatarBg(selected.candidateName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:700, color:"#07070f", flexShrink:0 }}>{initials(selected.candidateName)}</div>
                        <div>
                          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:"#e0dbd0", fontFamily:"'Cormorant Garamond',serif" }}>{selected.candidateName}</h2>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#4a5a6a" }}>{selected.candidateEmail} · Applied {timeAgo(selected.createdAt)}</p>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <button onClick={() => { setConfirmDel({ id:selected._id, type:"app", name:selected.candidateName }); setSelected(null); }}
                          style={{ padding:"7px 14px", background:"transparent", color:"#f87171", border:"1px solid rgba(248,113,113,0.3)", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:5, transition:"all .2s" }}
                          onMouseOver={e => { e.currentTarget.style.background="rgba(248,113,113,0.12)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.55)"; }}
                          onMouseOut={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="rgba(248,113,113,0.3)"; }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Delete
                        </button>
                        <button onClick={() => setSelected(null)}
                          style={{ width:32, height:32, borderRadius:8, background:"#1a1a2e", border:"1px solid #2a2a3e", cursor:"pointer", fontSize:18, color:"#555", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit", transition:"all .2s" }}
                          onMouseOver={e => { e.currentTarget.style.color="#c9c4bb"; e.currentTarget.style.borderColor="#3a3a5a"; }}
                          onMouseOut={e => { e.currentTarget.style.color="#555"; e.currentTarget.style.borderColor="#2a2a3e"; }}>×</button>
                      </div>
                    </div>

                    {/* Modal body — two columns */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 290px", flex:1, minHeight:0, overflow:"hidden" }}>

                      {/* LEFT: details */}
                      <div style={{ padding:"20px 24px", overflowY:"auto", borderRight:"1px solid #1a1a2e" }}>

                        {/* Match score */}
                        <div style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:12, padding:"16px 20px", marginBottom:12, display:"flex", gap:18, alignItems:"center" }}>
                          <div style={{ position:"relative", width:68, height:68, flexShrink:0 }}>
                            <svg width="68" height="68" viewBox="0 0 72 72">
                              <circle cx="36" cy="36" r="30" fill="none" stroke="#1a1a2e" strokeWidth="6"/>
                              <circle cx="36" cy="36" r="30" fill="none" stroke={matchColor(selected.matchPercent)} strokeWidth="6"
                                strokeDasharray={`${selected.matchPercent * 1.885} 188.5`}
                                strokeDashoffset="47.1" strokeLinecap="round"
                                style={{ transform:"rotate(-90deg)", transformOrigin:"36px 36px" }}/>
                            </svg>
                            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:13, fontWeight:700, color:matchColor(selected.matchPercent) }}>{selected.matchPercent}%</span>
                            </div>
                          </div>
                          <div style={{ flex:1 }}>
                            <p style={{ margin:"0 0 2px", fontSize:17, fontWeight:700, color:matchColor(selected.matchPercent) }}>{selected.matchPercent}% Match</p>
                            <p style={{ margin:"0 0 5px", fontSize:13, fontWeight:600, color: selected.jobId?.title ? "#c9a84c" : "#3a3a5a" }}>{selected.jobId?.title ? `${selected.jobId.title} · ${selected.jobId.company}` : "Job no longer available"}</p>
                            <p style={{ margin:0, fontSize:11, color:"#4a5a6a" }}>{convertToLPA(selected.jobId?.salary)} · {selected.jobId?.location||"—"} · {new Date(selected.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
                          </div>
                        </div>

                        {/* Skills from resume */}
                        <div style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:12, padding:"14px 18px", marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                            <p style={{ margin:0, fontSize:10, color:"#3a3a5a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Skills from Resume</p>
                            <span style={{ fontSize:11, color:"#3a3a5a" }}>{selected.skills?.length||0} skills</span>
                          </div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {selected.skills?.map(s => {
                              const matched = (selected.jobId?.tags||[]).some(t => t.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(t.toLowerCase()));
                              return (<span key={s} style={{ background: matched ? "rgba(16,185,129,0.08)" : "rgba(201,168,76,.07)", border:`1px solid ${matched ? "rgba(16,185,129,0.2)" : "rgba(201,168,76,.15)"}`, color: matched ? "#10b981" : "#c9a84c", borderRadius:5, padding:"3px 10px", fontSize:12 }}>{matched ? "✓ " : ""}{s}</span>);
                            })}
                            {(!selected.skills || selected.skills.length===0) && <span style={{ color:"#3a3a5a", fontSize:12 }}>No skills extracted from resume</span>}
                          </div>
                        </div>

                        {/* Job skills required */}
                        {selected.jobId?.tags?.length > 0 && (
                          <div style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:12, padding:"14px 18px", marginBottom:12 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                              <p style={{ margin:0, fontSize:10, color:"#3a3a5a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Job Skills Required</p>
                              <span style={{ fontSize:11, color:matchColor(selected.matchPercent), fontWeight:600 }}>{selected.matchPercent}% match</span>
                            </div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                              {selected.jobId.tags.map(t => {
                                const has = (selected.skills||[]).some(s => t.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(t.toLowerCase()));
                                return (<span key={t} style={{ background: has ? "rgba(16,185,129,0.08)" : "rgba(248,113,113,0.07)", border:`1px solid ${has ? "rgba(16,185,129,0.2)" : "rgba(248,113,113,0.18)"}`, color: has ? "#10b981" : "#f87171", borderRadius:5, padding:"3px 10px", fontSize:12 }}>{has ? "✓ " : "✗ "}{t}</span>);
                              })}
                            </div>
                          </div>
                        )}

                        {/* Cover letter */}
                        {selected.coverLetter ? (
                          <div style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:12, padding:"14px 18px", marginBottom:12 }}>
                            <p style={{ margin:"0 0 8px", fontSize:10, color:"#3a3a5a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Cover Letter</p>
                            <p style={{ margin:0, fontSize:13, lineHeight:1.9, color:"#6a7a8a" }}>{selected.coverLetter}</p>
                          </div>
                        ) : (
                          <div style={{ background:"#0d0d1a", border:"1px dashed #1a1a2e", borderRadius:12, padding:"14px 18px", marginBottom:12 }}>
                            <p style={{ margin:0, fontSize:12, color:"#2a2a4a", textAlign:"center" }}>No cover letter provided</p>
                          </div>
                        )}

                        {/* Meta grid */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
                          {[
                            { label:"Job Type", value: selected.jobId?.type, empty:"Not set", icon:"💼" },
                            { label:"Location", value: selected.jobId?.location, empty:"Not specified", icon:"📍" },
                            { label:"Salary",   value: selected.jobId?.salary ? convertToLPA(selected.jobId.salary) : null, empty:"Not specified", icon:"💰" },
                          ].map(item => (
                            <div key={item.label} style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:10, padding:"10px 12px" }}>
                              <p style={{ margin:"0 0 5px", fontSize:9, color:"#3a3a5a", textTransform:"uppercase", letterSpacing:1.2, fontWeight:600 }}>{item.icon} {item.label}</p>
                              <p style={{ margin:0, fontSize:12, fontWeight:item.value ? 600 : 400, color: item.value ? "#c9c4bb" : "#2a2a4a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontStyle: item.value ? "normal" : "italic" }}>{item.value || item.empty}</p>
                            </div>
                          ))}
                        </div>

                        {/* Timeline */}
                        <div style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:12, padding:"14px 18px" }}>
                          <p style={{ margin:"0 0 12px", fontSize:10, color:"#3a3a5a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Application Timeline</p>
                          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                            {[
                              { label:"Applied",     time: new Date(selected.createdAt).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}), done:true, color:"#60a5fa" },
                              { label:"Reviewing",   time: selected.status==="reviewing"||selected.status==="shortlisted"||selected.status==="rejected" ? "In progress" : "Pending", done: selected.status!=="applied", color:"#fbbf24" },
                              { label:"Shortlisted", time: selected.status==="shortlisted" ? "✓ Shortlisted" : selected.status==="rejected" ? "Skipped" : "Pending", done: selected.status==="shortlisted", color:"#4ade80" },
                              { label:"Decision",    time: selected.status==="rejected" ? "Rejected" : selected.status==="shortlisted" ? "Shortlisted" : "Awaiting", done: selected.status==="rejected"||selected.status==="shortlisted", color: selected.status==="rejected"?"#f87171":"#4ade80" },
                            ].map((step, i, arr) => (
                              <div key={step.label} style={{ display:"flex", gap:12, alignItems:"flex-start", paddingBottom: i<arr.length-1 ? 12 : 0, position:"relative" }}>
                                {i < arr.length-1 && <div style={{ position:"absolute", left:7, top:16, width:2, height:"calc(100% - 4px)", background: step.done ? step.color+"44" : "#1a1a2e" }} />}
                                <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, marginTop:1, background: step.done ? step.color : "#1a1a2e", border:`2px solid ${step.done ? step.color : "#2a2a4a"}`, boxShadow: step.done ? `0 0 8px ${step.color}44` : "none" }} />
                                <div>
                                  <p style={{ margin:0, fontSize:12, fontWeight:600, color: step.done ? "#c9c4bb" : "#3a3a5a" }}>{step.label}</p>
                                  <p style={{ margin:"1px 0 0", fontSize:10, color: step.done ? step.color : "#2a2a4a" }}>{step.time}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: actions sidebar */}
                      <div style={{ padding:"16px", overflowY:"auto", display:"flex", flexDirection:"column", gap:14 }}>

                        {/* Resume */}
                        <div>
                          <p style={{ margin:"0 0 10px", fontSize:10, color:"#2a2a4a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Resume</p>
                          {selected.resumeFilename ? (
                            <a href={`${API.replace('/api', '')}/uploads/${selected.resumeFilename}`} target="_blank" rel="noreferrer"
                              style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.18)", borderRadius:9, padding:"10px 12px", textDecoration:"none", transition:"all .2s" }}
                              onMouseOver={e => e.currentTarget.style.borderColor="#c9a84c"}
                              onMouseOut={e => e.currentTarget.style.borderColor="rgba(201,168,76,.18)"}>
                              <div style={{ width:30, height:30, borderRadius:7, background:"rgba(201,168,76,.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#c9a84c" }}>Download PDF</p>
                                <p style={{ margin:"2px 0 0", fontSize:9, color:"#3a3a5a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selected.resumeFilename}</p>
                              </div>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </a>
                          ) : <p style={{ margin:0, fontSize:12, color:"#3a3a5a" }}>No resume uploaded</p>}
                        </div>

                        {/* Skill gap */}
                        <div>
                          <p style={{ margin:"0 0 10px", fontSize:10, color:"#2a2a4a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>
                            {selected.jobId?.tags?.length > 0 ? "Skill Gap" : "Resume Skills"}
                          </p>
                          {(() => {
                            const jobTags = selected.jobId?.tags || [];
                            const skills = selected.skills || [];
                            if (jobTags.length === 0) {
                              return (
                                <div style={{ display:"flex", gap:8 }}>
                                  <div style={{ flex:1, background:"rgba(201,168,76,0.07)", border:"1px solid rgba(201,168,76,0.18)", borderRadius:8, padding:10, textAlign:"center" }}>
                                    <p style={{ margin:0, fontSize:22, fontWeight:700, color:"#c9a84c", lineHeight:1 }}>{skills.length}</p>
                                    <p style={{ margin:"4px 0 0", fontSize:9, color:"#c9a84c", opacity:0.7 }}>Skills in Resume</p>
                                  </div>
                                  <div style={{ flex:1, background:"rgba(96,165,250,0.07)", border:"1px solid rgba(96,165,250,0.18)", borderRadius:8, padding:10, textAlign:"center" }}>
                                    <p style={{ margin:0, fontSize:22, fontWeight:700, color:"#60a5fa", lineHeight:1 }}>{selected.matchPercent}%</p>
                                    <p style={{ margin:"4px 0 0", fontSize:9, color:"#60a5fa", opacity:0.7 }}>Match Score</p>
                                  </div>
                                </div>
                              );
                            }
                            const matched = jobTags.filter(t => skills.some(s => t.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(t.toLowerCase())));
                            const missing = jobTags.filter(t => !skills.some(s => t.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(t.toLowerCase())));
                            return (
                              <>
                                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                                  <div style={{ flex:1, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                                    <p style={{ margin:0, fontSize:18, fontWeight:700, color:"#10b981", lineHeight:1 }}>{matched.length}</p>
                                    <p style={{ margin:"3px 0 0", fontSize:9, color:"#10b981", opacity:0.7 }}>Matched</p>
                                  </div>
                                  <div style={{ flex:1, background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.18)", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                                    <p style={{ margin:0, fontSize:18, fontWeight:700, color:"#f87171", lineHeight:1 }}>{missing.length}</p>
                                    <p style={{ margin:"3px 0 0", fontSize:9, color:"#f87171", opacity:0.7 }}>Missing</p>
                                  </div>
                                  <div style={{ flex:1, background:"rgba(201,168,76,0.07)", border:"1px solid rgba(201,168,76,0.18)", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                                    <p style={{ margin:0, fontSize:18, fontWeight:700, color:"#c9a84c", lineHeight:1 }}>{skills.length}</p>
                                    <p style={{ margin:"3px 0 0", fontSize:9, color:"#c9a84c", opacity:0.7 }}>In Resume</p>
                                  </div>
                                </div>
                                {missing.length > 0 && (
                                  <div>
                                    <p style={{ margin:"0 0 5px", fontSize:9, color:"#2a2a4a", textTransform:"uppercase", letterSpacing:1 }}>Missing skills</p>
                                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                                      {missing.slice(0,4).map(t => (
                                        <span key={t} style={{ fontSize:9, padding:"2px 7px", borderRadius:4, background:"rgba(248,113,113,0.07)", color:"#f87171", border:"1px solid rgba(248,113,113,0.18)" }}>{t}</span>
                                      ))}
                                      {missing.length > 4 && <span style={{ fontSize:9, color:"#3a3a5a" }}>+{missing.length-4}</span>}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Quick actions */}
                        <div>
                          <p style={{ margin:"0 0 10px", fontSize:10, color:"#2a2a4a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Quick Actions</p>
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            <a href={`mailto:${selected.candidateEmail}?subject=Your application for ${selected.jobId?.title||"the position"} at ${selected.jobId?.company||"our company"}`}
                              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"transparent", border:"1px solid #1e1e30", borderRadius:8, textDecoration:"none", color:"#9ca3af", fontSize:12, fontWeight:500, transition:"all .15s" }}
                              onMouseOver={e => { e.currentTarget.style.background="#0f0f1e"; e.currentTarget.style.borderColor="#3a3a5a"; e.currentTarget.style.color="#c9c4bb"; }}
                              onMouseOut={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="#1e1e30"; e.currentTarget.style.color="#9ca3af"; }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                              Send Email
                            </a>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                              {["applied","reviewing","shortlisted","rejected"].map(s => {
                                const sc = statusConfig[s];
                                const active = selected.status===s;
                                return (
                                  <button key={s} onClick={() => updateStatus(selected._id, s)}
                                    style={{ padding:"9px 6px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:600, textTransform:"capitalize", fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:6, background: active ? sc.bg : "transparent", color: active ? sc.color : "#3a3a5a", border:`1px solid ${active ? sc.color : "#1e1e30"}`, userSelect:"none" }}
                                    onMouseEnter={e => { if(!active){ e.currentTarget.style.background=sc.bg; e.currentTarget.style.color=sc.color; e.currentTarget.style.borderColor=sc.color; }}}
                                    onMouseLeave={e => { if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#3a3a5a"; e.currentTarget.style.borderColor="#1e1e30"; }}}>
                                    <span style={{ width:6, height:6, borderRadius:"50%", background:active?sc.dot:"#3a3a5a", flexShrink:0 }}/>
                                    <span>{sc.label}</span>
                                    {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Toolbar ── */}
              <div style={{ padding:"14px 24px", borderBottom:"1px solid #141428", background:"#0b0b17", flexShrink:0, display:"flex", gap:12, alignItems:"center" }}>
                {/* Status filter */}
                <div>
                  <select value={filterStatus} onChange={e => setFilter(e.target.value)}
                    style={{ background:"#0d0d1a", borderRadius:8, padding:"8px 32px 8px 12px", fontSize:12, fontWeight:600, cursor:"pointer", outline:"none", fontFamily:"'DM Sans',sans-serif", appearance:"none", WebkitAppearance:"none", MozAppearance:"none", colorScheme:"dark", backgroundImage:"none", height:36, minWidth:150,
                      border: filterStatus==="all" ? "1px solid rgba(201,168,76,0.4)" : filterStatus==="applied" ? "1px solid rgba(96,165,250,0.4)" : filterStatus==="reviewing" ? "1px solid rgba(251,191,36,0.4)" : filterStatus==="shortlisted" ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(248,113,113,0.4)",
                      color: filterStatus==="all" ? "#c9a84c" : filterStatus==="applied" ? "#60a5fa" : filterStatus==="reviewing" ? "#fbbf24" : filterStatus==="shortlisted" ? "#4ade80" : "#f87171" }}>
                    <option value="all"         style={{ color:"#c9a84c", background:"#0d0d1a" }}>All Candidates</option>
                    <option value="applied"     style={{ color:"#60a5fa", background:"#0d0d1a" }}>● Applied</option>
                    <option value="reviewing"   style={{ color:"#fbbf24", background:"#0d0d1a" }}>● Reviewing</option>
                    <option value="shortlisted" style={{ color:"#4ade80", background:"#0d0d1a" }}>● Shortlisted</option>
                    <option value="rejected"    style={{ color:"#f87171", background:"#0d0d1a" }}>● Rejected</option>
                  </select>
                </div>
                {/* Job filter */}
                <div>
                  <select value={filterJob} onChange={e => setFilterJob(e.target.value)}
                    style={{ background:"#0d0d1a", borderRadius:8, padding:"8px 32px 8px 12px", fontSize:12, fontWeight:600, cursor:"pointer", outline:"none", fontFamily:"'DM Sans',sans-serif", appearance:"none", WebkitAppearance:"none", MozAppearance:"none", colorScheme:"dark", backgroundImage:"none", height:36, minWidth:150,
                      border: filterJob==="all" ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(201,168,76,0.4)",
                      color: "#c9a84c" }}>
                    <option value="all" style={{ color:"#c9a84c", background:"#0d0d1a" }}>All Jobs</option>
                    {[...new Map(applications.map(a => [a.jobId?._id, a.jobId])).values()].filter(Boolean).map(j => (
                      <option key={j._id} value={j._id} style={{ color:"#c9a84c", background:"#0d0d1a" }}>{j.title} · {j.company}</option>
                    ))}
                  </select>
                </div>
                {/* Sort by Match Score */}
                <div>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    style={{ background:"#0d0d1a", borderRadius:8, padding:"8px 32px 8px 12px", fontSize:12, fontWeight:600, cursor:"pointer", outline:"none", fontFamily:"'DM Sans',sans-serif", appearance:"none", WebkitAppearance:"none", MozAppearance:"none", colorScheme:"dark", backgroundImage:"none", height:36, minWidth:150,
                      border:"1px solid rgba(201,168,76,0.4)", color:"#c9a84c" }}>
                    <option value="default">Default Order</option>
                    <option value="high_low">High Score First</option>
                    <option value="low_high">Low Score First</option>
                  </select>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#2a2a4a", marginLeft:"auto" }}>{applications.length} candidate{applications.length!==1?"s":""}</p>
              </div>

              {/* ── Card grid ── */}
              <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
                {loading && <p style={{ color:"#2a2a4a", textAlign:"center", marginTop:40, fontSize:13 }}>Loading…</p>}
                {!loading && applications.length===0 && (
                  <div style={{ textAlign:"center", marginTop:80, color:"#2a2a4a" }}>
                    <p style={{ fontSize:48, margin:"0 0 12px" }}>◫</p>
                    <p style={{ fontSize:14 }}>No candidates found</p>
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14 }}>
                  {[...applications].sort((a, b) => {
                    if (sortBy === "high_low") return b.matchPercent - a.matchPercent;
                    if (sortBy === "low_high") return a.matchPercent - b.matchPercent;
                    return 0;
                  }).map(a => {
                    const sc = statusConfig[a.status]||statusConfig.applied;
                    const jobTags = a.jobId?.tags || [];
                    const skills = a.skills || [];
                    const matchedCount = jobTags.filter(t => skills.some(s => t.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(t.toLowerCase()))).length;
                    return (
                      <div key={a._id} onClick={() => setSelected(a)}
                        style={{ background:"#0f0f1a", border:"1px solid #1e1e30", borderRadius:14, padding:"18px 20px", cursor:"pointer", transition:"all .2s", position:"relative" }}
                        onMouseOver={e => { e.currentTarget.style.borderColor="#c9a84c66"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.4)"; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor="#1e1e30"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>

                        {/* Status badge top-right */}
                        <div style={{ position:"absolute", top:14, right:14 }}>
                          <span style={{ background:sc.bg, color:sc.color, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4 }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:sc.dot, flexShrink:0 }}/>{sc.label}
                          </span>
                        </div>

                        {/* Avatar + name */}
                        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                          <div style={{ width:44, height:44, borderRadius:12, background:avatarBg(a.candidateName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#07070f", flexShrink:0 }}>{initials(a.candidateName)}</div>
                          <div style={{ flex:1, minWidth:0, paddingRight:60 }}>
                            <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:"#e0dbd0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.candidateName}</p>
                            <p style={{ margin:0, fontSize:11, color:"#3a3a5a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.candidateEmail}</p>
                          </div>
                        </div>

                        {/* Job info */}
                        <div style={{ background:"#0a0a14", borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
                          <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:600, color:"#c9a84c", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.jobId?.title||"—"}</p>
                          <p style={{ margin:0, fontSize:11, color:"#3a3a5a" }}>{a.jobId?.company} · {a.jobId?.location}</p>
                        </div>

                        {/* Match score bar */}
                        <div style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                            <span style={{ fontSize:11, color:"#555" }}>Match score</span>
                            <span style={{ fontSize:14, fontWeight:700, color:matchColor(a.matchPercent) }}>{a.matchPercent}%</span>
                          </div>
                          <div style={{ height:5, background:"#141428", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${a.matchPercent}%`, background:matchColor(a.matchPercent), borderRadius:3, transition:"width .6s ease" }}/>
                          </div>
                        </div>

                        {/* Skill pills — top 4 matched */}
                        {skills.length > 0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
                            {skills.slice(0,4).map(s => {
                              const matched = jobTags.some(t => t.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(t.toLowerCase()));
                              return (
                                <span key={s} style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                                  background: matched ? "rgba(16,185,129,0.08)" : "rgba(201,168,76,0.07)",
                                  color: matched ? "#10b981" : "#c9a84c",
                                  border:`1px solid ${matched ? "rgba(16,185,129,0.2)" : "rgba(201,168,76,0.15)"}` }}>
                                  {matched ? "✓ " : ""}{s}
                                </span>
                              );
                            })}
                            {skills.length > 4 && <span style={{ fontSize:10, color:"#2a2a4a", padding:"2px 4px" }}>+{skills.length-4}</span>}
                          </div>
                        )}

                        {/* Footer: time + skill gap summary */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #1a1a2e" }}>
                          <span style={{ fontSize:10, color:"#2a2a4a" }}>{timeAgo(a.createdAt)}</span>
                          {jobTags.length > 0 && (
                            <span style={{ fontSize:10, color:"#3a3a5a" }}>
                              <span style={{ color:"#10b981", fontWeight:600 }}>{matchedCount}</span>/{jobTags.length} skills matched
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
          {/* ── JOBS TAB ────────────────────────────────────── */}
          {tab === "jobs" && (
            <div>
              {/* Floating back → Overview */}
              <button onClick={() => setTab("overview")}
                style={{ position:"fixed", bottom:24, left:268, zIndex:50,
                  display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:20,
                  background:"#0b0b17", border:"1px solid #1e1e30", color:"#555", cursor:"pointer",
                  fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif",
                  boxShadow:"0 4px 16px rgba(0,0,0,0.5)", transition:"all .2s" }}
                onMouseOver={e=>{ e.currentTarget.style.borderColor="#c9a84c44"; e.currentTarget.style.color="#c9a84c"; }}
                onMouseOut={e=>{ e.currentTarget.style.borderColor="#1e1e30"; e.currentTarget.style.color="#555"; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                Overview
              </button>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <div>
                  <h1 style={{ margin:"0 0 4px", fontSize:24, fontWeight:700, color:"#d4cfc8", fontFamily:"'Cormorant Garamond',serif" }}>Job Listings</h1>
                  <p style={{ margin:0, fontSize:13, color:"#2a2a4a" }}>{allJobs.length} job{allJobs.length!==1?"s":""} total</p>
                </div>
                <button onClick={() => setJobForm({ ...EMPTY_JOB })}
                  style={{ ...S.btnOutline, padding:"7px 14px", fontSize:12 }}>
                  + Add New Job
                </button>
              </div>
              {jobsLoading ? (
                <p style={{ color:"#2a2a4a", fontSize:14 }}>Loading jobs…</p>
              ) : allJobs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px" }}>
                  <p style={{ fontSize:48, margin:"0 0 12px" }}>📋</p>
                  <p style={{ color:"#3a3a5a", fontSize:14, marginBottom:16 }}>No jobs yet. Add your first listing.</p>
                  <button onClick={() => setJobForm({ ...EMPTY_JOB })} style={S.btn}>+ Add Job</button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {allJobs.map(job => (
                    <div key={job._id} style={{ background:"#0b0b17", border:"1px solid #141428", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:16, transition:"border-color .2s" }}
                      onMouseOver={e => e.currentTarget.style.borderColor="#2a2a3e"}
                      onMouseOut={e => e.currentTarget.style.borderColor="#141428"}>
                      <CompanyLogo job={job} size={44} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#d4cfc8" }}>{job?.title}</p>
                          {!job.isActive && <span style={{ background:"rgba(248,113,113,.12)", color:"#f87171", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:600, border:"1px solid rgba(248,113,113,.2)" }}>Inactive</span>}
                        </div>
                        <p style={{ margin:0, fontSize:12, color:"#3a3a5a" }}>{job?.company} · {job.location} · {job.type}</p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                          {(job.tags||[]).slice(0,5).map(t => (
                            <span key={t} style={{ background:"rgba(201,168,76,.08)", color:"#c9a84c", borderRadius:12, padding:"2px 8px", fontSize:11, border:"1px solid rgba(201,168,76,.15)" }}>{t}</span>
                          ))}
                          {(job.tags||[]).length > 5 && <span style={{ color:"#2a2a4a", fontSize:11, padding:"2px 4px" }}>+{job.tags.length-5}</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                        <button onClick={() => toggleJobActive(job)}
                          style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #1e1e30", background:"transparent", cursor:"pointer", fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif", color: job.isActive?"#4ade80":"#3a3a5a", transition:"all .15s" }}
                          onMouseOver={e => e.currentTarget.style.borderColor=job.isActive?"#f87171":"#4ade80"}
                          onMouseOut={e => e.currentTarget.style.borderColor="#1e1e30"}>
                          {job.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => setJobForm({ ...job, tags:(job.tags||[]).join(", "), requirements:(job.requirements||[]).join("\n") })}
                          style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #1e1e30", background:"transparent", cursor:"pointer", fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif", color:"#c9a84c" }}>
                          Edit
                        </button>
                        <button onClick={() => setConfirmDel({ id:job._id, type:"job", name:job?.title })}
                          style={{ padding:"4px 10px", borderRadius:6, border:"1px solid rgba(248,113,113,.25)", background:"transparent", cursor:"pointer", fontSize:11, fontWeight:500, fontFamily:"'DM Sans',sans-serif", color:"#f87171" }}
                          onMouseOver={e => e.currentTarget.style.background="rgba(248,113,113,.08)"}
                          onMouseOut={e => e.currentTarget.style.background="transparent"}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   JOB PORTAL — with My Applications + Profile tabs
══════════════════════════════════════════════════════════════ */
function JobPortal({ user: initialUser, token, onLogout, onAddAccount, onShowAuth }) {
  const [user, setUser] = useState(initialUser);
  // Skip upload if: (a) profile saved in localStorage, OR (b) Google user (has avatar)
  const savedProfile = (() => {
    try {
      if (!initialUser) return null;
      const stored = JSON.parse(localStorage.getItem(`hh_profile_${(initialUser?.email || "guest")}`) || "null");
      if (stored) return stored;
      // Google users get a default profile so they skip upload
      if (initialUser.avatar) {
        const gp = { name: initialUser.name, skills: [], summary: "Google account — upload resume to match skills." };
        localStorage.setItem(`hh_profile_${(initialUser?.email || "guest")}`, JSON.stringify(gp));
        return gp;
      }
      return null;
    } catch { return null; }
  })();
  const [phase, setPhase] = useState(initialUser ? (savedProfile ? "portal" : "upload") : "portal");
  const [portalTab, setPortalTab] = useState("jobs");
  const [resume, setResume] = useState(null);
  const [profile, setProfile] = useState(savedProfile);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(false);
  const [selectedJob, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [coverNote, setCover] = useState("");
  const [applied, setApplied] = useState({});
  const [applying, setApp] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadStep, setStep] = useState(0);
  const [dragging, setDrag] = useState(false);
  const [successJob, setSuccessJob] = useState(null);
  const [applyError, setApplyError] = useState("");
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hh_bookmarks")||"[]"); } catch { return []; }
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  // My Applications
  const [myApps, setMyApps] = useState([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);
  const [viewApp, setViewApp] = useState(null);
  const [withdrawAppId, setWithdrawAppId] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  // Profile editing
  const [editProfile, setEditProfile] = useState({
    name: user?.name||"", phone: user?.phone||"", city: user?.city||"", state: user?.state||"", country: user?.country||"", dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : "", headline: user?.headline||"", about: user?.about||"",
    preferredRole: user?.preferredRole||"", preferredLocation: user?.preferredLocation||"", employmentType: user?.employmentType||"", expectedSalary: user?.expectedSalary||"", experienceLevel: user?.experienceLevel||"", workPreference: user?.workPreference||"",
    socialLinkedIn: user?.socialLinkedIn||"", socialGitHub: user?.socialGitHub||"", socialPortfolio: user?.socialPortfolio||"", socialLeetCode: user?.socialLeetCode||"", socialHackerRank: user?.socialHackerRank||"",
    skills: user?.skills || []
  });
  const [editMsg, setEditMsg] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpMsg, setCpMsg] = useState("");
  const [cpLoading, setCpLoading] = useState(false);

  const fileRef = useRef();
  const authHeader = { Authorization:`Bearer ${token}` };

  // Load jobs from API
  useEffect(() => {
    setJobsLoading(true);
    fetch(`${API}/jobs`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setJobs(d.data); setSel(d.data[0]); setJobsError(false);
        } else { setJobsError(true); }
      })
      .catch(() => setJobsError(true))
      .finally(() => setJobsLoading(false));
  }, []);

  // Load my applications when tab is active
  const loadMyApps = useCallback(async () => {
    if (!user || !token) { 
      setMyAppsLoading(false); 
      setMyApps([]);
      setApplied({});
      return; 
    }
    setMyAppsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`${API}/applications/my`, { headers: authHeader, signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (d.success) {
        setMyApps(d.data);
        const map = {};
        d.data.forEach(a => { 
          if (a.jobId) map[a.jobId._id || a.jobId] = true; 
          else if (a.job) map[a.job] = true; // Fallback
        });
        setApplied(map); // Set exactly from backend data
      }
    } catch (e) {
      console.error("Failed to load apps", e);
    } finally { setMyAppsLoading(false); }
  }, [user?.email, token]);

  useEffect(() => {
    loadMyApps();
  }, [loadMyApps]);

  const toggleBookmark = (jobId) => {
    setBookmarks(prev => {
      const next = prev.includes(jobId) ? prev.filter(id=>id!==jobId) : [...prev, jobId];
      localStorage.setItem("hh_bookmarks", JSON.stringify(next));
      return next;
    });
  };

  const calcMatch = useCallback((job) => {
    if (!profile?.skills?.length || !job) return 0;
    const userSkills = (profile?.skills || []).map(s => s.toLowerCase());
    const matched = (job.tags||[]).filter(t => userSkills.some(u => t.toLowerCase().includes(u)||u.includes(t.toLowerCase())));
    return job.tags?.length ? Math.round((matched.length/job.tags.length)*100) : 0;
  }, [profile]);

  const extractSkills = (text) => {
    const lower = text.toLowerCase();
    const found = SKILL_KEYWORDS.filter(k => lower.includes(k));
    const lines = text.split(/\n|\r/).map(l=>l.trim()).filter(Boolean);
    const nameMatch = lines[0]?.match(/^([A-Za-z]+(?: [A-Za-z]+)+)$/);
    return {
      name: nameMatch?.[1]?.split(" ")[0] || (user?.name || ""),
      skills: [...new Set(found)],
      summary: found.length>0 ? `Skilled in ${found.slice(0,4).join(", ")} and more.` : "No skills detected.",
    };
  };

  const loadPdfJs = () => new Promise(resolve => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    document.head.appendChild(script);
  });

  const loadMammoth = () => new Promise(resolve => {
    if (window.mammoth) { resolve(window.mammoth); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.onload = () => resolve(window.mammoth);
    document.head.appendChild(script);
  });

  const handleFile = async (file) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx");
    if (!isPdf && !isDocx) { alert("Only PDF or DOCX files are accepted."); return; }
    setResume(file); setStep(1);
    try {
      let text = "";
      if (isPdf) {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i=1; i<=pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(it=>it.str).join(" ") + "\n";
        }
      } else {
        // DOCX — use mammoth from CDN
        const mammoth = await loadMammoth();
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      }
      setStep(2);
      const parsed = extractSkills(text);
      setProfile(parsed);
      try { localStorage.setItem(`hh_profile_${user?.email || "guest"}`, JSON.stringify(parsed)); } catch {}
      setStep(3);
      setTimeout(() => setPhase("portal"), 800);
    } catch (err) {
      const fallback = extractSkills("");
      setProfile(fallback);
      try { localStorage.setItem(`hh_profile_${user?.email || "guest"}`, JSON.stringify(fallback)); } catch {}
      setStep(3);
      setTimeout(() => setPhase("portal"), 800);
    }
  };

  const handleProfileResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx");
    if (!isPdf && !isDocx) { alert("Only PDF or DOCX files are accepted."); return; }
    
    setEditLoading(true); setEditMsg("Extracting skills...");
    try {
      let text = "";
      if (isPdf) {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i=1; i<=pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(it=>it.str).join(" ") + "\n";
        }
      } else {
        const mammoth = await loadMammoth();
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      }
      
      const parsed = extractSkills(text);
      const newSkills = Array.from(new Set([...editProfile.skills, ...(parsed.skills||[])]));
      
      setEditMsg("Uploading resume...");
      const fd = new FormData();
      fd.append("resume", file);
      fd.append("skills", JSON.stringify(newSkills));
      
      const res = await fetch(`${API}/auth/upload-resume`, { method: "POST", headers: authHeader, body: fd });
      const d = await res.json();
      if (d.success) {
        setUser(d.user);
        localStorage.setItem("hh_user", JSON.stringify(d.user));
        setEditProfile(prev => ({...prev, skills: newSkills}));
        setEditMsg("✓ Resume uploaded & skills extracted");
      } else { setEditMsg(d.message || "Failed to upload resume"); }
    } catch (err) {
      setEditMsg("Failed to process resume");
    } finally {
      setTimeout(() => setEditMsg(""), 3000);
      setEditLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm("Delete your resume?")) return;
    setEditLoading(true); setEditMsg("Deleting resume...");
    try {
      const res = await fetch(`${API}/auth/delete-resume`, { method: "DELETE", headers: authHeader });
      const d = await res.json();
      if (d.success) {
        setUser(d.user);
        localStorage.setItem("hh_user", JSON.stringify(d.user));
        setEditMsg("✓ Resume deleted");
      } else { setEditMsg(d.message || "Failed to delete resume"); }
    } catch (err) {
      setEditMsg("Failed to delete resume");
    } finally {
      setTimeout(() => setEditMsg(""), 3000);
      setEditLoading(false);
    }
  };

  const jobKey = (j) => j?._id || j?.id;

  const doApply = async () => {
    if (!user) { onShowAuth('login'); return; }
    if ((!resume && !user?.resumeFilename) || !selectedJob) return;
    const matchPct = calcMatch(selectedJob);
    if (matchPct < 40) return;
    if (!selectedJob?._id) { setApplyError("Job data not loaded from database. Please refresh."); return; }
    setApp(true); setApplyError("");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const fd = new FormData();
      fd.append("jobId", selectedJob?._id);
      fd.append("candidateName", profile?.name||(user?.name || ""));
      fd.append("candidateEmail", (user?.email || ""));
      fd.append("skills", (profile?.skills||[]).join(","));
      fd.append("matchPercent", matchPct);
      fd.append("coverLetter", coverNote||"");
      if (resume) fd.append("resume", resume);
      const res = await fetch(`${API}/applications`, { method:"POST", headers: authHeader, body: fd, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (!data.success) { 
        if (data.message && data.message.toLowerCase().includes("already applied")) {
          setApplied(prev => ({...prev, [selectedJob?._id]:true}));
          loadMyApps();
          setApplyError("");
          setApp(false);
          setSuccessJob(selectedJob);
          setPhase("success");
          return;
        }
        setApplyError("" + data.message); 
        return; 
      }
      setApplied(prev => ({...prev, [selectedJob?._id]:true}));
      if (data.data) {
        setMyApps(prev => [data.data, ...prev]);
      }
      setCover(""); setApplyError(""); setSuccessJob(selectedJob); 
      setPhase("success");
    } catch (err) {
      if (err.name === "AbortError") setApplyError("Request timed out. Please try again.");
      else setApplyError("Could not connect to backend. " + err.message);
    } finally { setApp(false); }
  };

  const handleWithdraw = async (appId, jobId) => {
    setWithdrawLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API}/applications/${appId}/withdraw`, { method: "DELETE", headers: authHeader, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (data.success) {
        setMyApps(prev => prev.filter(a => a._id !== appId));
        setApplied(prev => { const next = {...prev}; delete next[jobId]; return next; });
      } else {
        alert("Failed to withdraw application: " + data.message);
      }
    } catch (err) {
      alert("Failed to withdraw application.");
    } finally {
      setWithdrawLoading(false);
      setWithdrawAppId(null);
    }
  };

  const handleUpdateProfile = async () => {
    setEditLoading(true); setEditMsg("");
    try {
      const r = await fetch(`${API}/auth/update-profile`, {
        method:"POST", headers:{ ...authHeader, "Content-Type":"application/json" },
        body: JSON.stringify(editProfile),
      });
      const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (d.success) {
        setUser(d.user);
        localStorage.setItem("hh_user", JSON.stringify(d.user));
        setEditMsg("✓ Profile updated successfully.");
      } else { setEditMsg("⚠ " + d.message); }
    } catch { setEditMsg("⚠ Connection failed."); }
    finally { setEditLoading(false); setTimeout(() => setEditMsg(""), 3000); }
  };

  const handleProfileChange = (field, val) => setEditProfile(prev => ({...prev, [field]: val}));

  const handleChangePassword = async () => {
    if (cpNew !== cpConfirm) { setCpMsg("⚠ New passwords do not match."); return; }
    setCpLoading(true); setCpMsg("");
    try {
      const r = await fetch(`${API}/auth/change-password`, {
        method:"POST", headers:{ ...authHeader, "Content-Type":"application/json" },
        body: JSON.stringify({ currentPassword:cpCurrent, newPassword:cpNew }),
      });
      const d = await r.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } });
      if (d.success) { setCpMsg("✓ Password changed successfully."); setCpCurrent(""); setCpNew(""); setCpConfirm(""); }
      else { setCpMsg("⚠ " + d.message); }
    } catch { setCpMsg("⚠ Connection failed."); }
    finally { setCpLoading(false); }
  };

  // ── Success page ────────────────────────────────────────────
  if (phase==="success" && successJob) {
    return (
      <SuccessPage job={successJob} profile={profile}
        onHome={() => { setPhase("portal"); setSuccessJob(null); }} />
    );
  }

  // ── Upload phase ────────────────────────────────────────────
  if (phase==="upload") return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:"100%", maxWidth:480, padding:"0 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:36 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:"#c9a84c", margin:0, letterSpacing:3 }}>HIREHUB</h1>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {profile && (
              <button onClick={() => setPhase("portal")}
                style={{ ...S.btnOutline, padding:"6px 14px", fontSize:12 }}>
                Browse Jobs →
              </button>
            )}
            <AccountDropdown user={user} onLogout={onLogout} onAddAccount={onAddAccount} />
          </div>
        </div>
        {jobsError && (
          <div style={{ background:"rgba(251,191,36,.08)", border:"1px solid rgba(251,191,36,.3)", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#fbbf24" }}>
             Could not load jobs from database. Make sure your backend is running:<br/>
            <code style={{ fontSize:12, color:"#f59e0b" }}>cd hirehub-backend &amp;&amp; npm run dev</code>
          </div>
        )}
        <div style={{ ...S.card, padding:36, textAlign:"center" }}>
          <h2 style={{ margin:"0 0 8px", fontSize:22 }}>{profile ? "Update Your Resume" : "Upload Your Resume"}</h2>
          <p style={{ color:"#555", margin:"0 0 30px", fontSize:14 }}>
            {profile ? `Replacing resume for ${(user?.name || "")} · Upload new PDF or DOCX to refresh skills` : "We'll extract your skills and match jobs for you"}
          </p>
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, marginBottom:28 }}>
            {["Upload","Parsing","Matching"].map((s,i) => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
                  background: uploadStep>i ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#1a1a2e",
                  color: uploadStep>i ? "#0a0a14" : "#444" }}>
                  {uploadStep>i ? "✓" : i+1}
                </div>
                <span style={{ fontSize:12, color:uploadStep>=i?"#c9a84c":"#444" }}>{s}</span>
                {i<2 && <span style={{ color:"#222", fontSize:16 }}>—</span>}
              </div>
            ))}
          </div>
          {uploadStep===0 && (
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${dragging?"#c9a84c":"#2a2a3e"}`, borderRadius:12, padding:"44px 30px", cursor:"pointer",
                background:dragging?"#1a1a2e":"#0a0a14", transition:"all .2s" }}>
              <p style={{ fontSize:40, margin:"0 0 14px" }}>📄</p>
              <p style={{ margin:"0 0 6px", fontWeight:600, fontSize:15 }}>Drag & drop your resume</p>
              <p style={{ color:"#555", margin:"0 0 18px", fontSize:13 }}>or click to browse</p>
              <div style={{ display:"inline-block", padding:"9px 22px", borderRadius:8, background:"linear-gradient(135deg,#c9a84c,#a07830)", color:"#0a0a14", fontSize:13, fontWeight:700 }}>Choose PDF / DOCX File</div>
              <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
          )}
          {uploadStep>0 && (
            <div style={{ padding:"24px 0" }}>
              <p style={{ margin:"0 0 18px", color:"#888", fontSize:14 }}>
                {uploadStep===1 && "📖 Reading your PDF…"}
                {uploadStep===2 && "🔍 Extracting skills…"}
                {uploadStep===3 && "✅ Done! Opening portal…"}
              </p>
              <div style={{ background:"#0a0a14", borderRadius:8, height:6, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:8, transition:"width .6s ease", background:"linear-gradient(90deg,#c9a84c,#a07830)",
                  width:uploadStep===1?"30%":uploadStep===2?"70%":"100%" }} />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Floating back — only if profile already saved */}
      {profile && (
        <button onClick={() => setPhase("portal")}
          style={{ position:"fixed", bottom:24, left:24, zIndex:50,
            display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:20,
            background:"#13131f", border:"1px solid #2a2a3e", color:"#888", cursor:"pointer",
            fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif",
            boxShadow:"0 4px 16px rgba(0,0,0,0.4)", transition:"all .2s" }}
          onMouseOver={e=>{ e.currentTarget.style.borderColor="#c9a84c"; e.currentTarget.style.color="#c9a84c"; }}
          onMouseOut={e=>{ e.currentTarget.style.borderColor="#2a2a3e"; e.currentTarget.style.color="#888"; }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Jobs
        </button>
      )}
    </div>
  );

  if (!selectedJob && !jobsError) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"#555" }}>Loading jobs…</p>
    </div>
  );

  // ── Filtered jobs for jobs tab ──────────────────────────────
  const matchPct = calcMatch(selectedJob);
  const filtered = jobs
    .filter(j => filter==="All" || j.type===filter || (filter==="Remote" && j.location==="Remote"))
    .filter(j => !showBookmarksOnly || bookmarks.includes(j._id||j.id))
    .filter(j => !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      (j.tags||[]).some(t => t.toLowerCase().includes(search.toLowerCase()))
    )
    .map(j => ({...j, match:calcMatch(j)}))
    .sort((a,b) => b.match-a.match);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0a0a14", color:"#e8e0d0", height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <nav style={{ background:"#0f0f1a", borderBottom:"1px solid #2a2a3e", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg,#c9a84c,#8b6914)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:16, fontWeight:800, color:"#0a0a14" }}>H</span>
          </div>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:"#c9a84c", letterSpacing:2 }}>HIREHUB</span>
        </div>

        {/* Tab navigation */}
        <div style={{ display:"flex", gap:4 }}>
          {[
            { id:"jobs",    label:"Browse Jobs" },
            ...(user ? [
              { id:"myapps", label:"My Applications" },
              { id:"profile", label:"Profile" }
            ] : [])
          ].map(t => (
            <button key={t.id} onClick={() => setPortalTab(t.id)}
              style={{ padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all .2s",
                background: portalTab===t.id ? "rgba(201,168,76,0.15)" : "transparent",
                color: portalTab===t.id ? "#c9a84c" : "#555",
                borderBottom: portalTab===t.id ? "2px solid #c9a84c" : "2px solid transparent" }}>
              {t.label}
              {t.id==="myapps" && myApps.length>0 && (
                <span style={{ background:"rgba(96,165,250,.2)", color:"#60a5fa", borderRadius:20, padding:"1px 7px", fontSize:11, marginLeft:6 }}>{myApps.length}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {user ? (
            <AccountDropdown
              user={user}
              onLogout={onLogout}
              onAddAccount={onAddAccount}
            />
          ) : (
            <>
              <button onClick={() => onShowAuth('login')} style={{ background:"transparent", border:"1px solid #c9a84c", color:"#c9a84c", padding:"6px 16px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:600 }}>Sign In</button>
              <button onClick={() => onShowAuth('reg1')} style={{ background:"#c9a84c", border:"none", color:"#0a0a14", padding:"6px 16px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:600 }}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* ── MY APPLICATIONS TAB ──────────────────────────────── */}
      {portalTab==="myapps" && (
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
          <div style={{ maxWidth:900, margin:"0 auto" }}>
            <h2 style={{ margin:"0 0 20px", fontSize:20, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif", letterSpacing:1 }}>My Applications</h2>
            {myAppsLoading ? (
              <p style={{ color:"#555", textAlign:"center", marginTop:60, fontSize:14 }}>Loading your applications…</p>
            ) : myApps.length===0 ? (
              <div style={{ textAlign:"center", marginTop:60 }}>
                <p style={{ fontSize:48, margin:"0 0 14px" }}>📋</p>
                <p style={{ color:"#555", fontSize:16, marginBottom:8 }}>No applications yet</p>
                <p style={{ color:"#3a3a5a", fontSize:13, marginBottom:20 }}>Upload your resume and apply to jobs to track them here.</p>
                <button style={S.btn} onClick={() => setPortalTab("jobs")}>Browse Jobs →</button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {myApps.map(app => {
                  const job = app.jobId;
                  const sc = statusStyles[app.status]||statusStyles.applied;
                  return (
                    <div key={app._id} style={{ background:"#13131f", border:"1px solid #2a2a3e", borderRadius:14, padding:"20px 24px", display:"flex", alignItems:"center", gap:18, transition:"border-color .2s" }}
                      onMouseOver={e => e.currentTarget.style.borderColor="#c9a84c"}
                      onMouseOut={e => e.currentTarget.style.borderColor="#2a2a3e"}>
                      <CompanyLogo job={job} size={50} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:"0 0 4px", fontSize:15, fontWeight:700, color:"#e8e0d0" }}>{job?.title||"Job"}</p>
                        <p style={{ margin:0, fontSize:13, color:"#666" }}>{job?.company} · {job?.location}</p>
                        <p style={{ margin:"6px 0 0", fontSize:11, color:"#3a3a5a" }}>Applied {new Date(app.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
                      </div>
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <p style={{ margin:"0 0 4px", fontSize:22, fontWeight:700, color:matchColor(app.matchPercent) }}>{app.matchPercent}%</p>
                        <p style={{ margin:0, fontSize:11, color:"#555" }}>Match</p>
                      </div>
                      <div style={{ flexShrink:0, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                        <span style={{ background:sc.bg, color:sc.color, borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:sc.color, flexShrink:0 }} />{sc.label}
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setViewApp(app)} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#e8e0d0", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", transition: "all .2s" }} onMouseOver={e => e.currentTarget.style.background = "#1a1a2e"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>View Application</button>
                          <button onClick={() => setWithdrawAppId(app)} style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#f87171", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", transition: "all .2s" }} onMouseOver={e => {e.currentTarget.style.background = "rgba(248,113,113,0.1)"; e.currentTarget.style.borderColor = "#f87171"}} onMouseOut={e => {e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2a2a3e"}}>Withdraw</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* View Application Modal */}
          {viewApp && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
              <div style={{ background:"#13131f", border:"1px solid #2a2a3e", borderRadius:16, padding:"28px 32px", maxWidth:500, width:"100%", maxHeight:"90vh", overflowY:"auto" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <h3 style={{ margin:0, fontSize:20, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif" }}>Application Details</h3>
                  <button onClick={() => setViewApp(null)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:24, padding: 0 }}>×</button>
                </div>
                
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <p style={{ margin:0, fontSize:12, color:"#888" }}>Company & Job Title</p>
                    <p style={{ margin:"4px 0 0", fontSize:16, color:"#e8e0d0", fontWeight:600 }}>{viewApp.jobId?.company} - {viewApp.jobId?.title}</p>
                  </div>
                  <div style={{ display: "flex", gap: 32 }}>
                    <div>
                      <p style={{ margin:0, fontSize:12, color:"#888" }}>Location</p>
                      <p style={{ margin:"4px 0 0", fontSize:14, color:"#d4cfc8" }}>{viewApp.jobId?.location}</p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:12, color:"#888" }}>Salary</p>
                      <p style={{ margin:"4px 0 0", fontSize:14, color:"#d4cfc8" }}>{viewApp.jobId?.salary || "Not specified"}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 32 }}>
                    <div>
                      <p style={{ margin:0, fontSize:12, color:"#888" }}>Applied Date</p>
                      <p style={{ margin:"4px 0 0", fontSize:14, color:"#d4cfc8" }}>{new Date(viewApp.createdAt).toLocaleDateString("en-IN", {day:"numeric", month:"long", year:"numeric"})}</p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:12, color:"#888" }}>Match Score</p>
                      <p style={{ margin:"4px 0 0", fontSize:14, color:matchColor(viewApp.matchPercent), fontWeight:600 }}>{viewApp.matchPercent}%</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ margin:0, fontSize:12, color:"#888" }}>Current Status</p>
                    <div style={{ marginTop: 6, display: "inline-block" }}>
                      <span style={{ background:(statusStyles[viewApp.status]||statusStyles.applied).bg, color:(statusStyles[viewApp.status]||statusStyles.applied).color, borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:(statusStyles[viewApp.status]||statusStyles.applied).color, flexShrink:0 }} />{(statusStyles[viewApp.status]||statusStyles.applied).label}
                      </span>
                    </div>
                  </div>
                  {viewApp.resumeFilename && (
                    <div>
                      <p style={{ margin:0, fontSize:12, color:"#888" }}>Resume</p>
                      <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 20 }}>📄</span>
                        <p style={{ margin: 0, fontSize: 13, color: "#d4cfc8", wordBreak: "break-all" }}>{viewApp.resumeFilename.split('-').slice(1).join('-') || viewApp.resumeFilename}</p>
                        <a href={`${API.replace('/api', '')}/uploads/${viewApp.resumeFilename}`} target="_blank" rel="noreferrer" style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", padding: "4px 10px", borderRadius: 6, fontSize: 11, textDecoration: "none", fontWeight: 600 }}>View / Download</a>
                      </div>
                    </div>
                  )}
                  {viewApp.coverLetter && (
                    <div>
                      <p style={{ margin:0, fontSize:12, color:"#888" }}>Cover Letter</p>
                      <div style={{ marginTop: 6, background: "#0b0b17", padding: 12, borderRadius: 8, border: "1px solid #1a1a2e", fontSize: 13, color: "#d4cfc8", whiteSpace: "pre-wrap" }}>
                        {viewApp.coverLetter}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Confirm Modal */}
          <ConfirmModal
            open={!!withdrawAppId}
            title="Withdraw Application?"
            message={`Are you sure you want to withdraw your application for ${withdrawAppId?.jobId?.title} at ${withdrawAppId?.jobId?.company}?`}
            onConfirm={() => handleWithdraw(withdrawAppId._id, withdrawAppId.jobId?._id || withdrawAppId.jobId)}
            onCancel={() => setWithdrawAppId(null)}
          />

        </div>
      )}

      {/* ── PROFILE TAB ──────────────────────────────────────── */}
      {portalTab==="profile" && (
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
          <div style={{ maxWidth: 800, margin:"0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ margin:0, fontSize:24, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif", letterSpacing:1 }}>Professional Profile</h2>

            {/* Header / Basic Info */}
            <div style={{ ...S.card, padding:"32px", display:"flex", gap:24, alignItems:"center", flexWrap: "wrap" }}>
              {user?.avatar ? <img src={user?.avatar} alt={user?.name||""} referrerPolicy="no-referrer" style={{ width:100, height:100, borderRadius:20, objectFit:"cover" }} />
                : <div style={{ width:100, height:100, borderRadius:20, background:"linear-gradient(135deg,#c9a84c,#8b6914)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, fontWeight:700, color:"#0a0a14" }}>{user?.name?.[0]?.toUpperCase()}</div>}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ margin:"0 0 8px", fontSize:26, fontWeight:700, color:"#e8e0d0" }}>{user?.name||""}</h3>
                <p style={{ margin:"0 0 12px", fontSize:15, color:"#a8a8b8" }}>{user?.headline || "Add a professional headline"}</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: "#888" }}>
                  <span>📧 {user?.email}</span>
                  {user?.phone && <span>📱 {user?.phone}</span>}
                  {user?.city && <span>📍 {user?.city}{user?.country ? `, ${user?.country}` : ""}</span>}
                </div>
                <div style={{ marginTop: 12 }}>
                  <span style={{ background:"rgba(96,165,250,.15)", color:"#60a5fa", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 }}>
                    {user?.role==="admin" ? "Administrator" : "Member"}
                  </span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#555" }}>
                    Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
              <div style={{ ...S.card, padding: "20px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}>Applications</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e8e0d0" }}>{myApps.length}</p>
              </div>
              <div style={{ ...S.card, padding: "20px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}>Saved Jobs</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e8e0d0" }}>{bookmarks.length}</p>
              </div>
              <div style={{ ...S.card, padding: "20px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}>Profile Match</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#c9a84c" }}>{user?.skills?.length ? Math.min(100, user.skills.length * 5) : 0}%</p>
              </div>
            </div>

            {/* Editable Personal Info */}
            <div style={{ ...S.card, padding:"24px" }}>
              <h3 style={{ margin:"0 0 20px", fontSize:18, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif" }}>Personal Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={S.label}>Full Name</label><input style={S.input} value={editProfile.name} onChange={e => handleProfileChange("name", e.target.value)} /></div>
                <div><label style={S.label}>Phone Number</label><input style={S.input} value={editProfile.phone} onChange={e => handleProfileChange("phone", e.target.value)} /></div>
                <div><label style={S.label}>Headline</label><input style={S.input} value={editProfile.headline} onChange={e => handleProfileChange("headline", e.target.value)} placeholder="e.g. Senior Software Engineer" /></div>
                <div><label style={S.label}>Date of Birth</label><input type="date" style={{...S.input, colorScheme: "dark"}} value={editProfile.dob} onChange={e => handleProfileChange("dob", e.target.value)} /></div>
                <div><label style={S.label}>City</label><input style={S.input} value={editProfile.city} onChange={e => handleProfileChange("city", e.target.value)} /></div>
                <div><label style={S.label}>Country</label><input style={S.input} value={editProfile.country} onChange={e => handleProfileChange("country", e.target.value)} /></div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>About Me</label>
                  <textarea style={{ ...S.input, height: 100, resize: "vertical" }} value={editProfile.about} onChange={e => handleProfileChange("about", e.target.value)} placeholder="Brief summary of your background..." />
                </div>
              </div>
            </div>

            {/* Resume Section */}
            <div style={{ ...S.card, padding:"24px" }}>
              <h3 style={{ margin:"0 0 16px", fontSize:18, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif" }}>Resume</h3>
              {user?.resumeFilename ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: 12, flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "#d4cfc8" }}>{user.resumeOriginalName || user.resumeFilename.split('-').slice(1).join('-')}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Uploaded {user.resumeUploadedAt ? new Date(user.resumeUploadedAt).toLocaleDateString() : "recently"}</p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <a href={`${API.replace('/api', '')}/uploads/${user.resumeFilename}`} target="_blank" rel="noreferrer" style={{ ...S.btn, textDecoration: "none", background: "transparent", border: "1px solid #c9a84c", color: "#c9a84c", padding: "8px 16px", fontSize: 12 }}>Download</a>
                    <button onClick={() => document.getElementById("profileResumeReplace").click()} style={{ ...S.btn, padding: "8px 16px", fontSize: 12 }}>Replace</button>
                    <button onClick={handleDeleteResume} style={{ ...S.btn, background: "transparent", border: "1px solid #f87171", color: "#f87171", padding: "8px 16px", fontSize: 12 }}>Delete</button>
                    <input type="file" id="profileResumeReplace" hidden accept=".pdf,.docx" onChange={handleProfileResume} />
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px", border: "2px dashed #2a2a3e", borderRadius: 12 }}>
                  <p style={{ margin: "0 0 16px", color: "#888", fontSize: 14 }}>No resume uploaded yet. Upload a resume to automatically extract skills.</p>
                  <button onClick={() => document.getElementById("profileResumeInput").click()} style={{...S.btn, padding: "10px 24px"}}>Upload Resume</button>
                  <input type="file" id="profileResumeInput" hidden accept=".pdf,.docx" onChange={handleProfileResume} />
                </div>
              )}
            </div>

            {/* Career Preferences & Social */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              <div style={{ ...S.card, padding:"24px" }}>
                <h3 style={{ margin:"0 0 20px", fontSize:18, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif" }}>Career Preferences</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><label style={S.label}>Preferred Role</label><input style={S.input} value={editProfile.preferredRole} onChange={e => handleProfileChange("preferredRole", e.target.value)} placeholder="e.g. Frontend Developer" /></div>
                  <div><label style={S.label}>Employment Type</label>
                    <select style={{ ...S.input, appearance: "none" }} value={editProfile.employmentType} onChange={e => handleProfileChange("employmentType", e.target.value)}>
                      <option value="" style={{color:"#000"}}>Select...</option><option value="Full-time" style={{color:"#000"}}>Full-time</option><option value="Part-time" style={{color:"#000"}}>Part-time</option><option value="Contract" style={{color:"#000"}}>Contract</option><option value="Internship" style={{color:"#000"}}>Internship</option>
                    </select>
                  </div>
                  <div><label style={S.label}>Expected Salary</label><input style={S.input} value={editProfile.expectedSalary} onChange={e => handleProfileChange("expectedSalary", e.target.value)} placeholder="e.g. ₹20 LPA or $100k" /></div>
                  <div><label style={S.label}>Work Preference</label>
                    <select style={{ ...S.input, appearance: "none" }} value={editProfile.workPreference} onChange={e => handleProfileChange("workPreference", e.target.value)}>
                      <option value="" style={{color:"#000"}}>Select...</option><option value="Remote" style={{color:"#000"}}>Remote</option><option value="Hybrid" style={{color:"#000"}}>Hybrid</option><option value="Onsite" style={{color:"#000"}}>Onsite</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ ...S.card, padding:"24px" }}>
                <h3 style={{ margin:"0 0 20px", fontSize:18, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif" }}>Social Links</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><label style={S.label}>LinkedIn</label><input style={S.input} value={editProfile.socialLinkedIn} onChange={e => handleProfileChange("socialLinkedIn", e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
                  <div><label style={S.label}>GitHub</label><input style={S.input} value={editProfile.socialGitHub} onChange={e => handleProfileChange("socialGitHub", e.target.value)} placeholder="https://github.com/..." /></div>
                  <div><label style={S.label}>Portfolio</label><input style={S.input} value={editProfile.socialPortfolio} onChange={e => handleProfileChange("socialPortfolio", e.target.value)} placeholder="https://yourwebsite.com" /></div>
                  <div><label style={S.label}>LeetCode / HackerRank</label><input style={S.input} value={editProfile.socialLeetCode} onChange={e => handleProfileChange("socialLeetCode", e.target.value)} /></div>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div style={{ ...S.card, padding:"24px" }}>
              <h3 style={{ margin:"0 0 20px", fontSize:18, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif" }}>Skills</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                {editProfile.skills.map((sk, i) => (
                  <div key={i} style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", padding: "6px 12px", borderRadius: 20, fontSize: 13, color: "#e8e0d0", display: "flex", alignItems: "center", gap: 8 }}>
                    {sk}
                    <button onClick={() => handleProfileChange("skills", editProfile.skills.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontSize: 14, padding: 0, display: "flex", alignItems: "center" }}>×</button>
                  </div>
                ))}
                {editProfile.skills.length === 0 && <span style={{ color: "#555", fontSize: 13 }}>No skills added.</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Add a skill (e.g. React, Python)" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { if (!editProfile.skills.includes(e.target.value.trim())) { handleProfileChange("skills", [...editProfile.skills, e.target.value.trim()]); } e.target.value = ""; } }} />
                <button style={{ ...S.btn, padding: "0 20px" }} onClick={e => { const inp = e.target.previousSibling; if (inp.value.trim() && !editProfile.skills.includes(inp.value.trim())) { handleProfileChange("skills", [...editProfile.skills, inp.value.trim()]); inp.value = ""; } }}>Add</button>
              </div>
            </div>

            {/* Save Profile Button */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={handleUpdateProfile} disabled={editLoading} style={{ ...S.btn, padding:"12px 32px", fontSize:15, opacity:editLoading?0.7:1 }}>
                {editLoading ? "Saving Profile..." : "Save All Changes"}
              </button>
              {editMsg && <span style={{ fontSize:14, fontWeight: 600, color: editMsg.startsWith("✓")?"#4ade80":"#f87171" }}>{editMsg}</span>}
            </div>

            {/* Account Settings */}
            <div style={{ ...S.card, padding:"24px", marginTop: 10 }}>
              <h3 style={{ margin:"0 0 16px", fontSize:18, color:"#e8e0d0", fontFamily:"'Cormorant Garamond',serif" }}>Account Settings</h3>
              {!user?.avatar ? (
                <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth: 400 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 14, color: "#888" }}>Change Password</p>
                  <div><label style={S.label}>Current Password</label><PasswordInput value={cpCurrent} onChange={e => setCpCurrent(e.target.value)} /></div>
                  <div><label style={S.label}>New Password</label><PasswordInput value={cpNew} onChange={e => setCpNew(e.target.value)} /><PasswordStrength password={cpNew} /></div>
                  <div>
                    <label style={S.label}>Confirm New Password</label>
                    <PasswordInput value={cpConfirm} onChange={e => setCpConfirm(e.target.value)} />
                    {cpConfirm && <p style={{ margin:"4px 0 0", fontSize:11, color:cpNew===cpConfirm?"#4ade80":"#f87171" }}>{cpNew===cpConfirm?"✓ Passwords match":"⚠ Passwords do not match"}</p>}
                  </div>
                  {cpMsg && <p style={{ margin:0, fontSize:12, color:cpMsg.startsWith("✓")?"#4ade80":"#f87171" }}>{cpMsg}</p>}
                  <button onClick={handleChangePassword} disabled={cpLoading}
                    style={{ ...S.btn, padding:"10px 24px", fontSize:13, opacity:cpLoading?0.7:1, alignSelf: "flex-start" }}>
                    {cpLoading ? "Updating…" : "Change Password"}
                  </button>
                </div>
              ) : (
                <p style={{ margin:0, fontSize:13, color:"#555", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}> 
                  <span style={{ color: "#4285F4", fontWeight: "bold" }}>G</span> You signed in with Google. Password management is handled by your Google account.
                </p>
              )}
              
              <div style={{ marginTop: 32, borderTop: "1px solid rgba(248,113,113,0.2)", paddingTop: 20 }}>
                <h4 style={{ margin: "0 0 8px", color: "#f87171", fontSize: 15 }}>Danger Zone</h4>
                <p style={{ margin: "0 0 12px", color: "#888", fontSize: 13 }}>Once you delete your account, there is no going back. Please be certain.</p>
                <button onClick={() => {
                  if (window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
                    fetch(`${API}/auth/delete-account`, { method: "DELETE", headers: authHeader }).then(() => onLogout()).catch(() => alert("Failed to delete account"));
                  }
                }} style={{ ...S.btn, background: "transparent", border: "1px solid #f87171", color: "#f87171", padding: "10px 24px", fontSize: 13 }}>Delete Account</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── JOBS TAB ─────────────────────────────────────────── */}
      {portalTab==="jobs" && (
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {/* Left panel — job list */}
          <div style={{ width:340, borderRight:"1px solid #2a2a3e", display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
            {/* Search + filters */}
            <div style={{ padding:"16px", borderBottom:"1px solid #2a2a3e", background:"#0f0f1a" }}>
              <div style={{ position:"relative", marginBottom:10 }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, skills…"
                  style={{ ...S.input, paddingLeft:36, height:38, borderRadius:8, fontSize:13 }} />
                <span style={{ position:"absolute", left:10, top:10, color:"#555", fontSize:15 }}>🔍</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                  style={{ flex:1, background:"#1a1a2a", border:"1px solid #2a2a3e", borderRadius:8, padding:"6px 10px", color: filter!=="All" ? "#c9a84c" : "#888", fontSize:12, fontWeight:600, cursor:"pointer", outline:"none", fontFamily:"inherit" }}>
                  {["All","Full-time","Part-time","Contract","Internship","Remote"].map(f => (
                    <option key={f} value={f} style={{ background:"#1a1a2a", color:"#e8e0d0" }}>{f}</option>
                  ))}
                </select>
                <button onClick={() => setShowBookmarksOnly(b=>!b)}
                  style={{ padding:"6px 12px", borderRadius:8, border: showBookmarksOnly ? "1px solid rgba(251,191,36,0.4)" : "1px solid #2a2a3e", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", whiteSpace:"nowrap",
                    background: showBookmarksOnly ? "rgba(251,191,36,0.12)" : "#1a1a2a",
                    color: showBookmarksOnly ? "#fbbf24" : "#666" }}>
                  ★ Saved
                </button>
              </div>
            </div>
            {/* Job list */}
            <div style={{ flex:1, overflowY:"auto" }}>
              {filtered.length===0 && (
                <div style={{ textAlign:"center", padding:"40px 20px" }}>
                  <p style={{ fontSize:32, margin:"0 0 10px" }}>🔍</p>
                  <p style={{ color:"#555", fontSize:13 }}>{showBookmarksOnly ? "No saved jobs yet" : "No jobs match your search"}</p>
                </div>
              )}
              {filtered.map(j => {
                const jk = jobKey(j);
                const isActive = selectedJob && jobKey(selectedJob)===jk;
                const isBookmarked = bookmarks.includes(jk);
                return (
                  <JobCard
                    key={jk}
                    job={j}
                    isActive={isActive}
                    isBookmarked={isBookmarked}
                    toggleBookmark={() => toggleBookmark(jk)}
                    onClick={() => setSel(j)}
                    matchColor={matchColor}
                    convertToLPA={convertToLPA}
                  />
                );
              })}
            </div>
          </div>

          {/* Center — job detail */}
          <div style={{ flex:1, overflowY:"auto", padding:"28px 32px", background:"#0a0a14" }}>
            {!selectedJob ? (
              <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"#333" }}>
                <p>Select a job to see details</p>
              </div>
            ) : (<>
              <div style={{ display:"flex", gap:18, alignItems:"flex-start", marginBottom:24 }}>
                <CompanyLogo job={selectedJob} size={64} />
                <div style={{ flex:1 }}>
                  <h2 style={{ fontFamily:"'Cormorant Garamond',serif", margin:0, fontSize:28, fontWeight:600, color:"#e8e0d0", marginBottom:8 }}>{selectedJob?.title}</h2>
                  <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:14, color:"#c9a84c", fontWeight:500 }}>{selectedJob?.company}</span>
                    <span style={{ fontSize:12, color:"#6b7280" }}>•</span>
                    <span style={{ fontSize:13, color:"#9ca3af" }}>{selectedJob?.location}</span>
                    <span style={{ fontSize:12, background:"#1a1a2a", padding:"4px 10px", borderRadius:16, color:"#9ca3af" }}>{selectedJob?.type}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:0, fontSize:20, fontWeight:600, color:"#c9a84c", marginBottom:4 }}>{convertToLPA(selectedJob?.salary)}</p>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#1a1a2a", padding:"6px 12px", borderRadius:20 }}>
                    <span style={{ fontSize:14, fontWeight:600, color:matchColor(matchPct) }}>{matchPct}%</span>
                    <span style={{ fontSize:11, color:"#9ca3af" }}>Match</span>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:24 }}>
                <h4 style={{ fontSize:12, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Skills Required</h4>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {(selectedJob?.tags||[]).map(t => {
                    const has = profile?.skills?.some(s => t.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(t.toLowerCase()));
                    return (
                      <span key={t} style={{ padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:500,
                        background: has ? "rgba(16,185,129,0.1)" : "#1a1a2a",
                        color: has ? "#10b981" : "#9ca3af",
                        border: has ? "1px solid rgba(16,185,129,0.2)" : "1px solid #2a2a3e" }}>
                        {t}{has && " ✓"}
                      </span>
                    );
                  })}
                </div>
              </div>
              {selectedJob?.desc && (
                <div style={{ marginBottom:24, background:"#0f0f1a", border:"1px solid #2a2a3e", borderRadius:12, padding:"20px" }}>
                  <h4 style={{ fontSize:12, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>About the Role</h4>
                  <p style={{ margin:0, fontSize:14, lineHeight:1.8, color:"#d1d5db" }}>{selectedJob?.desc}</p>
                </div>
              )}
              {(selectedJob?.requirements||[]).length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <h4 style={{ fontSize:12, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Requirements</h4>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {selectedJob?.requirements.map((r,i) => (
                      <div key={i} style={{ display:"flex", gap:12, alignItems:"center", background:"#0f0f1a", border:"1px solid #2a2a3e", borderRadius:8, padding:"12px 16px" }}>
                        <span style={{ width:20, height:20, borderRadius:"50%", background:"#1a1a2a", color:"#c9a84c", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, flexShrink:0 }}>{i+1}</span>
                        <span style={{ fontSize:13, color:"#d1d5db" }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {applyError && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#ef4444", marginBottom:16 }}>{applyError}</div>}
            </>)}
          </div>

          {/* Right — apply panel */}
          <div style={{ width:280, borderLeft:"1px solid #2a2a3e", background:"#0f0f1a", display:"flex", flexDirection:"column", overflowY:"auto" }}>
            {selectedJob && (<>
              <div style={{ padding:"18px", borderBottom:"1px solid #2a2a3e" }}>
                <h4 style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Your Profile</h4>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  {user ? (
                    <>
                      {user?.avatar ? <img src={user?.avatar} alt={(user?.name || "")} referrerPolicy="no-referrer" style={{ width:40, height:40, borderRadius:10, objectFit:"cover" }} onError={e => { e.target.onerror=null; e.target.style.display="none"; }} />
                        : <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#c9a84c,#8b6914)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#0a0a14" }}>{user?.name?.[0]?.toUpperCase()}</div>}
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8e0d0" }}>{profile?.name||(user?.name || "")}</p>
                        <p style={{ margin:0, fontSize:11, color:"#666" }}>{(user?.email || "")}</p>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding:"4px 0" }}>
                      <p style={{ margin:0, fontSize:12, color:"#9ca3af", marginBottom:10 }}>Sign in to view your profile and apply.</p>
                      <button onClick={() => onShowAuth('login')} style={{ background:"transparent", border:"1px solid #c9a84c", color:"#c9a84c", padding:"4px 12px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600 }}>Sign In</button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding:"16px 18px", borderBottom:"1px solid #2a2a3e" }}>
                <p style={{ margin:"0 0 12px", fontSize:10, color:"#3a3a5a", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Match Score</p>
                <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:10 }}>
                  {/* Circular ring */}
                  <div style={{ position:"relative", width:64, height:64, flexShrink:0 }}>
                    <svg width="64" height="64" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="30" fill="none" stroke="#1a1a2e" strokeWidth="6"/>
                      <circle cx="36" cy="36" r="30" fill="none" stroke={matchColor(matchPct)} strokeWidth="6"
                        strokeDasharray={`${matchPct * 1.885} 188.5`}
                        strokeDashoffset="47.1" strokeLinecap="round"
                        style={{ transform:"rotate(-90deg)", transformOrigin:"36px 36px", transition:"stroke-dasharray 0.8s ease" }}/>
                    </svg>
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:matchColor(matchPct) }}>{matchPct}%</span>
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 3px", fontSize:16, fontWeight:700, color:matchColor(matchPct), lineHeight:1 }}>{matchPct}%</p>
                    <p style={{ margin:"0 0 6px", fontSize:10, color:"#555" }}>
                      {matchPct>=70?"Strong match":matchPct>=40?"Moderate match":"Low match"}
                    </p>
                    <div style={{ height:4, background:"#1a1a2e", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${matchPct}%`, borderRadius:2, background:matchColor(matchPct), transition:"width 0.8s ease" }}/>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {(selectedJob?.tags||[]).filter(t => profile?.skills?.some(s => t.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(t.toLowerCase()))).map(t => (
                    <span key={t} style={{ fontSize:10, padding:"3px 8px", borderRadius:12, background:"rgba(16,185,129,0.08)", color:"#10b981", border:"1px solid rgba(16,185,129,0.2)" }}>✓ {t}</span>
                  ))}
                  {matchPct===0 && <span style={{ fontSize:10, color:"#333", fontStyle:"italic" }}>Upload resume to see matches</span>}
                </div>
              </div>
              <div style={{ padding:"18px", borderBottom:"1px solid #2a2a3e" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <h4 style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, margin:0 }}>Resume</h4>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, color:"#c9a84c",
                      fontWeight:600, fontFamily:"inherit", padding:0, transition:"opacity .15s" }}
                    onMouseOver={e => e.currentTarget.style.opacity="0.7"}
                    onMouseOut={e => e.currentTarget.style.opacity="1"}>
                    ↑ Upload new
                  </button>
                </div>
                {resume || user?.resumeFilename ? (
                  <div style={{ display:"flex", gap:10, alignItems:"center", background:"rgba(201,168,76,0.06)",
                    border:"1px solid rgba(201,168,76,0.2)", borderRadius:8, padding:"10px 12px" }}>
                    <span style={{ fontSize:18 }}>📄</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#c9a84c", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {resume ? resume.name : (user?.resumeOriginalName || user?.resumeFilename.split('-').slice(1).join('-') || "Saved Resume.pdf")}
                      </p>
                      <p style={{ margin:0, fontSize:10, color:"#6b7280" }}>PDF / DOCX · Ready to submit</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    style={{ width:"100%", display:"flex", gap:10, alignItems:"center", background:"#1a1a2a",
                      border:"1px dashed #2a2a3e", borderRadius:8, padding:"12px", cursor:"pointer",
                      transition:"all .2s", fontFamily:"inherit" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor="#c9a84c"; e.currentTarget.style.background="rgba(201,168,76,0.05)"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor="#2a2a3e"; e.currentTarget.style.background="#1a1a2a"; }}>
                    <div style={{ width:32, height:32, borderRadius:7, background:"rgba(201,168,76,0.1)",
                      border:"1px solid rgba(201,168,76,0.2)", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:14, flexShrink:0 }}>📄</div>
                    <div style={{ textAlign:"left" }}>
                      <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#c9a84c" }}>Upload Resume</p>
                      <p style={{ margin:"2px 0 0", fontSize:10, color:"#6b7280" }}>PDF / DOCX · required to apply</p>
                    </div>
                  </button>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display:"none" }}
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
              {profile?.skills?.length > 0 && (
                <div style={{ padding:"18px", borderBottom:"1px solid #2a2a3e" }}>
                  <h4 style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
                    Skills <span style={{ color:"#6b7280", fontWeight:400 }}>({(profile?.skills || []).length})</span>
                  </h4>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {(profile?.skills || []).slice(0,10).map(s => (
                      <span key={s} style={{ fontSize:11, padding:"3px 8px", borderRadius:12, background:"#1a1a2a", color:"#9ca3af", border:"1px solid #2a2a3e" }}>{s}</span>
                    ))}
                    {(profile?.skills || []).length > 10 && <span style={{ fontSize:11, padding:"3px 8px", color:"#555" }}>+{(profile?.skills || []).length-10} more</span>}
                  </div>
                </div>
              )}
              <div style={{ padding:"18px", borderBottom:"1px solid #2a2a3e" }}>
                <h4 style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Cover Note <span style={{ color:"#555", textTransform:"none", fontWeight:400 }}>(optional)</span></h4>
                <textarea value={coverNote} onChange={e => setCover(e.target.value)}
                  placeholder={`Message to ${selectedJob?.company}…`} rows={3}
                  style={{ width:"100%", background:"#1a1a2a", border:"1px solid #2a2a3e", borderRadius:8, padding:"10px", color:"#e8e0d0", fontSize:13, lineHeight:1.6, resize:"vertical", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
              </div>
              <div style={{ padding:"18px" }}>
                {applied[jobKey(selectedJob)] ? (
                  <button disabled
                    style={{ width:"100%", padding:"13px", borderRadius:8, border:"1px solid #10b981", cursor:"not-allowed",
                      background:"rgba(16,185,129,0.1)", color:"#10b981", fontSize:15, fontWeight:700 }}>
                    ✓ Applied
                  </button>
                ) : matchPct >= 40 ? (
                  <button onClick={doApply} disabled={applying}
                    style={{ width:"100%", padding:"13px", borderRadius:8, border:"none", cursor:applying?"not-allowed":"pointer",
                      background:applying?"#2a2a3e":"linear-gradient(135deg,#c9a84c,#a07830)",
                      color:applying?"#9ca3af":"#0a0a14", fontSize:15, fontWeight:700, transition:"all .2s",
                      boxShadow:applying?"none":"0 2px 8px rgba(201,168,76,0.3)" }}
                    onMouseOver={e => { if(!applying){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 12px rgba(201,168,76,0.4)";}}}
                    onMouseOut={e => { if(!applying){e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(201,168,76,0.3)";}}}>
                    {applying ? "SUBMITTING…" : "APPLY NOW"}
                  </button>
                ) : (
                  <div style={{ background:"#1a1a2a", border:"1px solid #2a2a3e", borderRadius:8, padding:"18px", textAlign:"center" }}>
                    <span style={{ fontSize:22, display:"block", marginBottom:8 }}>⚠️</span>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#ef4444" }}>Not Eligible</p>
                    <p style={{ margin:"4px 0 0", fontSize:11, color:"#6b7280" }}>Match score below 40%</p>
                  </div>
                )}
              </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════════════════════════ */
export default function App() {
  const savedUser  = (() => { try { return JSON.parse(localStorage.getItem("hh_user")); } catch { return null; } })();
  const savedToken = localStorage.getItem("hh_token");
  const [user, setUser]   = useState(savedUser);
  const [token, setToken] = useState(savedToken);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      // Google OAuth callback with token in URL
      fetch(`${API}/auth/google-success`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token:t}) })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            localStorage.setItem("hh_token", d.token);
            localStorage.setItem("hh_user", JSON.stringify(d.user));
            setUser(d.user); setToken(d.token);
            window.history.replaceState({}, document.title, "/");
          }
        })
        .catch(err => console.error("Google auth error:", err));
    } else if (savedToken) {
      // Refresh user data from DB on every page load so resume, profile, skills are always fresh
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.user) {
            localStorage.setItem("hh_user", JSON.stringify(d.user));
            setUser(d.user);
          } else {
            // Token is invalid/expired — clear session
            localStorage.removeItem("hh_token");
            localStorage.removeItem("hh_user");
            setUser(null); setToken(null);
          }
        })
        .catch(() => { /* Network error – keep cached user */ });
    }
  }, []); // run once on mount

  const handleLogin = (u, t) => {
    setUser(u); setToken(t);
    setShowAuth(false);
    // Save to accounts list for switcher
    try {
      const saved = JSON.parse(localStorage.getItem("hh_accounts") || "[]");
      const filtered = saved.filter(a => a.email !== u.email);
      const updated = [{ name:u.name, email:u.email, avatar:u.avatar||null, role:u.role }, ...filtered].slice(0,5);
      localStorage.setItem("hh_accounts", JSON.stringify(updated));
    } catch {}
  };
  const handleLogout = () => {
    localStorage.removeItem("hh_token");
    localStorage.removeItem("hh_user");
    setUser(null); setToken(null);
  };

  // "Add account" → go to Register tab
  const handleAddAccount = () => {
    localStorage.removeItem("hh_token");
    localStorage.removeItem("hh_user");
    localStorage.setItem("hh_auth_mode", "reg1"); // signal AuthPage to open Register
    setUser(null); setToken(null);
    setShowAuth(true);
  };

  if (showAuth) return <AuthPage onLogin={handleLogin} />;
  if (user?.role === "admin") return <AdminDashboard user={user} token={token} onLogout={handleLogout} onAddAccount={handleAddAccount} />;
  return <JobPortal user={user} token={token} onLogout={handleLogout} onAddAccount={handleAddAccount} onShowAuth={(mode) => {
    localStorage.setItem("hh_auth_mode", mode);
    setShowAuth(true);
  }} />;
}