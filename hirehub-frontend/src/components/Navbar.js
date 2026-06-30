import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5000/api" : "https://hirehub-dx1z.onrender.com/api");

function AccountDropdown({ user, onLogout, onAddAccount, extraStyle }) {
  const [open, setOpen] = useState(false);

  const savedAccounts = (() => {
    try { return JSON.parse(localStorage.getItem("hh_accounts") || "[]"); } catch { return []; }
  })();

  const switchTo = (acc) => {
    localStorage.setItem("hh_switch_email", acc.email);
    onLogout();
  };

  return (
    <div style={{ position:"relative", ...extraStyle }}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        title={user.name}
        style={{ background:"none", border: open ? "2px solid var(--color-gold-soft)" : "2px solid transparent",
          borderRadius:"50%", cursor:"pointer", padding:0, transition:"var(--transition-fast)", display:"flex",
          alignItems:"center", justifyContent:"center", width:36, height:36, flexShrink:0 }}>
        {user.avatar
          ? <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer"
              style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", display:"block" }}
              onError={e => { e.target.style.display="none"; e.target.nextSibling && (e.target.nextSibling.style.display="flex"); }} />
          : <div style={{ width:32, height:32, borderRadius:8,
              background:"linear-gradient(135deg,var(--color-gold-soft),var(--color-gold-deep))",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, color:"var(--color-bg-base)" }}>
              {user.name?.[0]?.toUpperCase()}
            </div>}
      </motion.button>

      <AnimatePresence>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:998 }} />
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ position:"absolute", top:44, right:0, zIndex:999, width:280,
            background:"var(--color-bg-card)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)",
            boxShadow:"0 16px 48px rgba(0,0,0,0.6)", overflow:"hidden" }}>

            <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid var(--color-border)" }}>
              <p style={{ margin:"0 0 2px", fontSize:10, color:"var(--color-text-secondary)",
                textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>Signed in as</p>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer"
                      style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}
                      onError={e => { e.target.onerror=null; e.target.src=""; e.target.style.display="none"; }} />
                  : <div style={{ width:38, height:38, borderRadius:9,
                      background:"linear-gradient(135deg,var(--color-gold-soft),var(--color-gold-deep))",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:15, fontWeight:700, color:"var(--color-bg-base)", flexShrink:0 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:"var(--color-text-primary)",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--color-text-muted)",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</p>
                </div>
              </div>
            </div>

            <div style={{ padding:"8px", borderTop:"1px solid var(--color-border)" }}>
              <button onClick={() => { setOpen(false); onAddAccount(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px",
                  background:"transparent", border:"none", borderRadius:8, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--color-text-secondary)", transition:"var(--transition-fast)",
                  textAlign:"left" }}
                onMouseOver={e => { e.currentTarget.style.background="var(--color-bg-card-hover)"; e.currentTarget.style.color="var(--color-text-primary)"; }}
                onMouseOut={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--color-text-secondary)"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
                </svg>
                Add account
              </button>

              <button onClick={() => { setOpen(false); window.location.href=`${API}/auth/google?prompt=select_account`; }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px",
                  background:"transparent", border:"none", borderRadius:8, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--color-text-secondary)", transition:"var(--transition-fast)",
                  textAlign:"left" }}
                onMouseOver={e => { e.currentTarget.style.background="var(--color-bg-card-hover)"; e.currentTarget.style.color="var(--color-text-primary)"; }}
                onMouseOut={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--color-text-secondary)"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Switch account
              </button>

              <button onClick={() => { setOpen(false); onLogout(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px",
                  background:"transparent", border:"none", borderRadius:8, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--color-text-secondary)", transition:"var(--transition-fast)",
                  textAlign:"left" }}
                onMouseOver={e => { e.currentTarget.style.background="var(--color-danger-bg)"; e.currentTarget.style.color="var(--color-danger)"; }}
                onMouseOut={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--color-text-secondary)"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar({ portalTab, setPortalTab, myApps, user, onLogout, onAddAccount }) {
  return (
    <nav style={{ background:"var(--color-bg-card)", borderBottom:"1px solid var(--color-border)", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, position:"relative", zIndex: 100 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg,var(--color-gold-soft),var(--color-gold-deep))", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(201,168,76,0.3)" }}>
          <span style={{ fontSize:16, fontWeight:800, color:"var(--color-bg-base)" }}>H</span>
        </div>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"var(--color-gold-soft)", letterSpacing:2 }}>HIREHUB</span>
      </div>

      <div style={{ display:"flex", gap:4 }}>
        {[
          { id:"jobs",    label:"Browse Jobs" },
          { id:"myapps", label:"My Applications" },
          { id:"profile", label:"Profile" },
        ].map(t => (
          <button key={t.id} onClick={() => setPortalTab(t.id)}
            style={{ padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"var(--transition-fast)",
              background: portalTab===t.id ? "var(--color-gold-glow)" : "transparent",
              color: portalTab===t.id ? "var(--color-gold-soft)" : "var(--color-text-secondary)",
              borderBottom: portalTab===t.id ? "2px solid var(--color-gold-soft)" : "2px solid transparent" }}
            onMouseOver={e => { if(portalTab!==t.id) e.currentTarget.style.color="var(--color-text-primary)"; }}
            onMouseOut={e => { if(portalTab!==t.id) e.currentTarget.style.color="var(--color-text-secondary)"; }}
          >
            {t.label}
            {t.id==="myapps" && myApps.length>0 && (
              <span style={{ background:"var(--color-success-bg)", color:"var(--color-success)", borderRadius:20, padding:"2px 8px", fontSize:11, marginLeft:8, fontWeight: 700 }}>{myApps.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <AccountDropdown
          user={user}
          onLogout={onLogout}
          onAddAccount={onAddAccount}
        />
      </div>
    </nav>
  );
}
