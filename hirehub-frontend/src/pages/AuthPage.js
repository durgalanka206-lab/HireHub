import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { S, PasswordInput, PasswordStrength, OTPInput } from '../components/UI';
const API = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5000/api" : "https://hirehub-dx1z.onrender.com/api");

const FAKE_DOMAINS = new Set([
  "mailinator.com","trashmail.com","yopmail.com","tempmail.com","guerrillamail.com",
  "10minutemail.com","throwaway.email","fakeinbox.com","sharklasers.com","spam4.me",
  "dispostable.com","maildrop.cc","temp-mail.org","emailondeck.com","mytemp.email",
  "discard.email","spamgourmet.com","spambox.us","mailnull.com","trashmail.net",
]);

function clientValidateEmail(email) {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email address";
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || !domain.includes(".")) return "Enter a valid email address";
  if (FAKE_DOMAINS.has(domain)) return "Disposable/temporary emails are not allowed";
  return null;
}

export default function AuthPage({ onLogin, onCancel }) {
  const [mode, setMode] = useState(() => {
    try {
      const m = localStorage.getItem("hh_auth_mode") || "reg1";
      localStorage.removeItem("hh_auth_mode");
      return m;
    } catch { return "reg1"; }
  });
  const [email, setEmail] = useState(() => {
    try {
      const sw = localStorage.getItem("hh_switch_email") || "";
      if (sw) localStorage.removeItem("hh_switch_email");
      return sw;
    } catch { return ""; }
  });
  const [savedAccounts, setSavedAccounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hh_accounts") || "[]"); } catch { return []; }
  });
  const [emailErr, setEmailErr] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingToken, setPending] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (v) => { const e = clientValidateEmail(v); setEmailErr(e||""); return !e; };
  const inputStyle = (err) => ({ ...S.input, border:`1px solid ${err?"var(--color-danger)":"var(--color-border)"}` });

  const handleGoogleLogin = () => { window.location.href = `${API}/auth/google?prompt=select_account`; };

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`${API}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password}), signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.json();
      if (!d.success) { setError(d.message); return; }
      localStorage.setItem("hh_token", d.token);
      localStorage.setItem("hh_user", JSON.stringify(d.user));
      onLogin(d.user, d.token);
    } catch (err) {
      if (err.name === "AbortError") setError("Request timed out.");
      else setError("Connection failed.");
    } finally { setLoading(false); }
  };

  const handleReg1 = async () => {
    if (!validateEmail(email)) return;
    setError(""); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`${API}/auth/send-register-otp`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email}), signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.json();
      if (!d.success) { setError(d.message); return; }
      setPending(d.pendingToken); setOtp(""); setMode("reg2"); setSuccess("OTP sent to your email!");
    } catch (err) {
      if (err.name === "AbortError") setError("Request timed out.");
      else setError("Connection failed.");
    } finally { setLoading(false); }
  };

  const handleReg2 = async () => {
    setError(""); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`${API}/auth/verify-register-otp`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({pendingToken,otp}), signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.json();
      if (!d.success) { setError(d.message); return; }
      setMode("reg3"); setSuccess("Email verified!");
    } catch (err) {
      if (err.name === "AbortError") setError("Request timed out.");
      else setError("Connection failed.");
    } finally { setLoading(false); }
  };

  const handleReg3 = async () => {
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`${API}/auth/register`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,password,pendingToken,otp,role:"candidate"}), signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.json();
      if (!d.success) { setError(d.message); return; }
      localStorage.setItem("hh_token", d.token);
      localStorage.setItem("hh_user", JSON.stringify(d.user));
      onLogin(d.user, d.token);
    } catch (err) {
      if (err.name === "AbortError") setError("Request timed out.");
      else setError("Connection failed.");
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!validateEmail(email)) return;
    setError(""); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`${API}/auth/forgot-password-otp`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email}), signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.json();
      if (!d.success) { setError(d.message); return; }
      setResetToken(d.resetToken); setOtp(""); setMode("fp_verify"); setSuccess("OTP sent to your email!");
    } catch (err) {
      if (err.name === "AbortError") setError("Request timed out.");
      else setError("Connection failed.");
    } finally { setLoading(false); }
  };

  const handleFpVerify = async () => {
    setError(""); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`${API}/auth/verify-reset-otp`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({resetToken,otp}), signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.json();
      if (!d.success) { setError(d.message); return; }
      setResetToken(d.resetToken); setMode("fp_reset"); setSuccess("Reset code verified!");
    } catch (err) {
      if (err.name === "AbortError") setError("Request timed out.");
      else setError("Connection failed.");
    } finally { setLoading(false); }
  };

  const handleFpReset = async () => {
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`${API}/auth/reset-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({resetToken,password}), signal: controller.signal });
      clearTimeout(timeoutId);
      const d = await r.json();
      if (!d.success) { setError(d.message); return; }
      setMode("login"); setSuccess("Password reset successfully! Please sign in.");
    } catch (err) {
      if (err.name === "AbortError") setError("Request timed out.");
      else setError("Connection failed.");
    } finally { setLoading(false); }
  };

  const modeConfig = {
    login:    { title:"Sign in", btn:"Sign In", action:handleLogin },
    reg1:     { title:"Create account", btn:"Send OTP", action:handleReg1 },
    reg2:     { title:"Verify email", btn:"Verify OTP", action:handleReg2 },
    reg3:     { title:"Set password", btn:"Create Account", action:handleReg3 },
    forgot:   { title:"Reset password", btn:"Send OTP", action:handleForgot },
    fp_verify:{ title:"Enter OTP", btn:"Verify OTP", action:handleFpVerify },
    fp_reset: { title:"New password", btn:"Reset Password", action:handleFpReset },
  };
  const { title, btn, action } = modeConfig[mode];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight:"100vh", background:"var(--color-bg-base)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50vh", background: "radial-gradient(ellipse at top, rgba(201,168,76,0.1), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width:"100%", maxWidth:400, zIndex: 1 }}>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ textAlign:"center", marginBottom:36 }}>
          <h1 className="text-gradient-gold" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:44, margin:"0 0 6px", letterSpacing:4, fontWeight: 700 }}>HIREHUB</h1>
          <p style={{ color:"var(--color-text-secondary)", fontSize:12, margin:0, letterSpacing:3, textTransform:"uppercase", fontWeight: 600 }}>Career Portal</p>
        </motion.div>
        
        <motion.div className="glass-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ ...S.card, padding:"32px 28px" }}>

          {/* Saved accounts chooser (login page only) */}
          <AnimatePresence>
          {mode === "login" && savedAccounts.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ marginBottom:24, overflow: "hidden" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <p style={{ margin:0, fontSize:11, color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:1.5, fontWeight:700 }}>Choose account</p>
                <button onClick={() => { setSavedAccounts([]); localStorage.removeItem("hh_accounts"); }}
                  style={{ background:"none", border:"none", color:"var(--color-text-muted)", cursor:"pointer", fontSize:11, padding:0, fontWeight:600 }}>
                  Clear all
                </button>
              </div>
              {savedAccounts.map((acc, i) => (
                <motion.div key={acc.email} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:"var(--radius-sm)",
                    border:"1px solid var(--color-border)", marginBottom:8, cursor:"pointer", transition:"var(--transition-fast)",
                    background: email===acc.email ? "var(--color-gold-glow)" : "transparent" }}
                  onMouseOver={e => e.currentTarget.style.borderColor="var(--color-gold-soft)"}
                  onMouseOut={e => e.currentTarget.style.borderColor="var(--color-border)"}
                  onClick={() => setEmail(acc.email)}>
                  {acc.avatar
                    ? <img src={acc.avatar} alt={acc.name} referrerPolicy="no-referrer" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} onError={e => { e.target.onerror=null; e.target.style.display="none"; }} />
                    : <div style={{ width:36, height:36, borderRadius:"var(--radius-sm)", flexShrink:0,
                          background:`linear-gradient(135deg,${["#c9a84c","#60a5fa","#4ade80","#f87171","#a78bfa"][acc.name?.charCodeAt(0)%5||0]},#333)`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff" }}>
                        {acc.name?.[0]?.toUpperCase()}
                      </div>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:"var(--color-text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{acc.name}</p>
                    <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--color-text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{acc.email}</p>
                  </div>
                  <button onClick={e => {
                    e.stopPropagation();
                    const updated = savedAccounts.filter(a => a.email !== acc.email);
                    setSavedAccounts(updated);
                    localStorage.setItem("hh_accounts", JSON.stringify(updated));
                    if (email === acc.email) setEmail("");
                  }}
                    style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)", fontSize:18, padding:"4px", lineHeight:1, transition:"var(--transition-fast)" }}
                    onMouseOver={e => e.currentTarget.style.color="var(--color-danger)"}
                    onMouseOut={e => e.currentTarget.style.color="var(--color-text-muted)"}>
                    ×
                  </button>
                </motion.div>
              ))}
              <div style={{ height:1, background:"var(--color-border)", margin:"16px 0" }} />
            </motion.div>
          )}
          </AnimatePresence>

          {/* Sign In / Register tab switcher */}
          {(mode==="login" || mode==="reg1") && (
            <div style={{ display:"flex", gap:4, background:"rgba(0,0,0,0.3)", borderRadius:"var(--radius-sm)", padding:4, marginBottom:24, border:"1px solid var(--color-border)" }}>
              {[["login","Sign In"],["reg1","Register"]].map(([m,lbl]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  style={{ flex:1, padding:"10px 0", borderRadius:"6px", border:"none", cursor:"pointer",
                    fontWeight:600, fontSize:13, transition:"var(--transition-fast)",
                    background: mode===m ? "linear-gradient(135deg, var(--color-gold-soft), var(--color-gold-deep))" : "transparent",
                    color: mode===m ? "var(--color-bg-base)" : "var(--color-text-secondary)",
                    boxShadow: mode===m ? "0 4px 12px rgba(201,168,76,0.3)" : "none" }}>
                  {lbl}
                </button>
              ))}
            </div>
          )}

          {/* Back button */}
          <AnimatePresence>
          {(mode==="reg2"||mode==="reg3") && (
            <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onClick={() => { setMode(mode==="reg2"?"reg1":"reg2"); setError(""); setSuccess(""); }}
              style={{ background:"none", border:"none", color:"var(--color-text-muted)", cursor:"pointer", fontSize:12, padding:"0 0 16px", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
              ← Back
            </motion.button>
          )}
          {(mode==="forgot"||mode==="fp_verify"||mode==="fp_reset") && (
            <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              style={{ background:"none", border:"none", color:"var(--color-text-muted)", cursor:"pointer", fontSize:12, padding:"0 0 16px", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
              ← Back to sign in
            </motion.button>
          )}
          </AnimatePresence>

          <div style={{ marginBottom:24 }}>
            <h2 style={{ margin:"0 0 6px", fontSize:20, color:"var(--color-text-primary)", fontWeight:700 }}>{title}</h2>
            {mode === "login" && savedAccounts.length === 0 && <p style={{ margin:0, fontSize:13, color:"var(--color-text-secondary)" }}>Welcome back to your career portal.</p>}
          </div>
          
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {mode === "login" && (<>
              <div>
                <label style={S.label}>Email Address</label>
                <input style={S.input} type="email" placeholder="you@company.com" value={email}
                  onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <PasswordInput value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} />
                <div style={{ textAlign:"right", marginTop:8 }}>
                  <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                    style={{ background:"none", border:"none", color:"var(--color-gold-soft)", cursor:"pointer", fontSize:12, padding:0, fontWeight: 600 }}>
                    Forgot password?
                  </button>
                </div>
              </div>
            </>)}
            {mode === "reg1" && (<>
              <div>
                <label style={S.label}>Email Address</label>
                <input style={inputStyle(emailErr)} type="email" placeholder="yourname@gmail.com" value={email}
                  onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }} onKeyDown={e => e.key==="Enter" && handleReg1()} />
                {emailErr
                  ? <p style={{ color:"var(--color-danger)", fontSize:11, margin:"4px 0 0", fontWeight:600 }}>⚠ {emailErr}</p>
                  : email && clientValidateEmail(email)===null
                    ? <p style={{ color:"var(--color-success)", fontSize:11, margin:"4px 0 0", fontWeight:600 }}>✓ Looks good</p>
                    : null}
              </div>
              <p style={{ color:"var(--color-text-muted)", fontSize:12, margin:0, lineHeight:1.6 }}>We'll send a 6-digit OTP to verify your email.</p>
            </>)}
            {mode === "reg2" && (<>
              <div><label style={S.label}>6-Digit OTP</label><OTPInput value={otp} onChange={setOtp} onEnter={handleReg2} /></div>
              <button onClick={() => { setOtp(""); handleReg1(); }} style={{ background:"none", border:"none", color:"var(--color-text-secondary)", cursor:"pointer", fontSize:12, padding:0, fontWeight:600, textAlign:"left" }}>Didn't receive it? Resend OTP</button>
            </>)}
            {mode === "reg3" && (<>
              <div><label style={S.label}>Full Name</label><input style={S.input} placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} /></div>
              <div><label style={S.label}>Password</label><PasswordInput value={password} onChange={e => setPassword(e.target.value)} /><PasswordStrength password={password} /></div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <PasswordInput value={confirmPw} onChange={e => setConfirmPw(e.target.value)} onKeyDown={e => e.key==="Enter" && handleReg3()} />
                {confirmPw && <p style={{ fontSize:11, margin:"4px 0 0", fontWeight:600, color:password===confirmPw?"var(--color-success)":"var(--color-danger)" }}>{password===confirmPw?"✓ Passwords match":"⚠ Passwords do not match"}</p>}
              </div>
            </>)}
            {mode === "forgot" && (<>
              <div>
                <label style={S.label}>Registered Email</label>
                <input style={inputStyle(emailErr)} type="email" placeholder="you@company.com" value={email}
                  onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }} onKeyDown={e => e.key==="Enter" && handleForgot()} />
                {emailErr && <p style={{ color:"var(--color-danger)", fontSize:11, margin:"4px 0 0", fontWeight:600 }}>⚠ {emailErr}</p>}
              </div>
            </>)}
            {mode === "fp_verify" && (<>
              <div><label style={S.label}>Enter OTP</label><OTPInput value={otp} onChange={setOtp} onEnter={handleFpVerify} /></div>
              <button onClick={() => { setOtp(""); handleForgot(); }} style={{ background:"none", border:"none", color:"var(--color-text-secondary)", cursor:"pointer", fontSize:12, padding:0, fontWeight:600, textAlign:"left" }}>Resend OTP</button>
            </>)}
            {mode === "fp_reset" && (<>
              <div><label style={S.label}>New Password</label><PasswordInput value={password} onChange={e => setPassword(e.target.value)} /><PasswordStrength password={password} /></div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <PasswordInput value={confirmPw} onChange={e => setConfirmPw(e.target.value)} onKeyDown={e => e.key==="Enter" && handleFpReset()} />
                {confirmPw && <p style={{ fontSize:11, margin:"4px 0 0", fontWeight:600, color:password===confirmPw?"var(--color-success)":"var(--color-danger)" }}>{password===confirmPw?"✓ Passwords match":"⚠ Passwords do not match"}</p>}
              </div>
            </>)}
            
            <AnimatePresence mode="popLayout">
            {error && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} style={{ color:"var(--color-danger)", fontSize:13, margin:0, fontWeight:600 }}>⚠ {error}</motion.p>}
            {success && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} style={{ color:"var(--color-success)", fontSize:13, margin:0, fontWeight:600 }}>✓ {success}</motion.p>}
            </AnimatePresence>
            
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ ...S.btn, width:"100%", padding:"14px", marginTop:8 }} onClick={action} disabled={loading}>
              {loading ? (
                <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>⟳</motion.span> Please wait…
                </span>
              ) : btn}
            </motion.button>
            
            {mode === "login" && (<>
              <div style={{ display:"flex", alignItems:"center", gap:16, margin:"8px 0" }}>
                <div style={{ flex:1, height:1, background:"var(--color-border)" }} />
                <span style={{ color:"var(--color-text-muted)", fontSize:12, fontWeight:600 }}>OR</span>
                <div style={{ flex:1, height:1, background:"var(--color-border)" }} />
              </div>
              <motion.button whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.98 }} onClick={handleGoogleLogin}
                style={{ width:"100%", padding:"12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--color-border)", background:"transparent", color:"var(--color-text-primary)", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"var(--transition-fast)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </motion.button>
            </>)}
            
            {(mode==="reg1"||mode==="reg2"||mode==="reg3") && (
              <p style={{ textAlign:"center", margin:0, fontSize:13, color:"var(--color-text-secondary)" }}>
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                  style={{ background:"none", border:"none", color:"var(--color-gold-soft)", cursor:"pointer", fontSize:13, fontWeight:600, padding:0 }}>Sign in</button>
              </p>
            )}

            {/* Back to Home Link */}
            {onCancel && (
              <div style={{ textAlign: "center", marginTop: 16, borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
                <button 
                  onClick={onCancel}
                  style={{ background:"none", border:"none", color:"var(--color-text-muted)", cursor:"pointer", fontSize:13, fontWeight:600, padding:0 }}
                  onMouseOver={e => e.currentTarget.style.color="var(--color-gold-soft)"}
                  onMouseOut={e => e.currentTarget.style.color="var(--color-text-muted)"}
                >
                  ← Back to Home
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
