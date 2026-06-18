"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    showToast("Verifying student credentials...", "info");

    setTimeout(() => {
      showToast("Login successful! Welcome back to CertFIRE.", "success");
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", "student");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    }, 1200);
  };

  const handleGoogleLogin = () => {
    showToast("Connecting with Google...", "info");
    setTimeout(() => {
      showToast("Successfully logged in with Google!", "success");
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", "student");
      
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }, 1000);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    const emailVal = email.trim();
    if (!emailVal) {
      showToast("Please enter your email or Student ID first.", "error");
      return;
    }
    showToast(`Password reset link sent to ${emailVal}`, "success");
  };

  return (
    <div className="login-page" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", justifyContent: "space-between", padding: "40px 24px 0" }}>
      
      {/* Switcher at the very top */}
      <div style={{ textAlign: "center", marginBottom: "12px", fontSize: "0.95rem", zIndex: 10 }}>
        <span style={{ color: "var(--color-text-secondary)" }}>Looking to log in as an Organizer?</span>
        <Link href="/login" style={{ color: "var(--color-cyan)", fontWeight: 600, textDecoration: "underline", marginLeft: "6px" }}>
          Go here
        </Link>
      </div>

      <main className="login-container" style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "24px" }}>
        
        {/* Logo Header */}
        <div className="login-logo-section">
          <Link href="/" className="logo login-portal-logo">
            Cert<span>FIRE</span>
          </Link>
          <h1 className="login-card-title" style={{ marginTop: "24px", fontSize: "2.2rem", fontWeight: 900, textAlign: "center" }}>Welcome back!</h1>
          <p className="login-card-desc" style={{ textAlign: "center", marginBottom: 0, maxWidth: "380px", marginLeft: "auto", marginRight: "auto" }}>
            Sign in to manage your event registrations and certificates.
          </p>
        </div>

        {/* Login Card */}
        <form id="form-login" className="login-card" style={{ marginTop: "12px" }} onSubmit={handleLoginSubmit}>
          
          {/* Email Address or Student ID */}
          <div className="form-group">
            <label htmlFor="login-email">Email Address or Student ID</label>
            <div class="input-icon-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>
                </svg>
              </span>
              <input 
                type="text" 
                id="login-email" 
                placeholder="student@university.edu" 
                required 
                className="form-input input-with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password with Forgot Password link */}
          <div className="form-group">
            <div className="password-header-row">
              <label htmlFor="login-password">Password</label>
              <a href="#" className="forgot-password-link" id="btn-forgot-password" onClick={handleForgotPassword}>Forgot Password?</a>
            </div>
            <div class="input-icon-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                id="login-password" 
                placeholder="••••••••" 
                required 
                className="form-input input-with-icon" 
                style={{ paddingRight: "48px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              {/* visibility toggle */}
              <button 
                type="button" 
                className="password-toggle-btn" 
                id="btn-password-toggle" 
                aria-label="Toggle Password Visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" id="eye-icon">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="checkbox-group" style={{ margin: "16px 0 24px" }}>
            <label className="checkbox-label" htmlFor="remember-me">
              <input 
                type="checkbox" 
                id="remember-me" 
                className="checkbox-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
          </div>

          {/* Login Button */}
          <button type="submit" className="btn-gradient-cyan-purple ripple" id="btn-submit-login">
            Log In
          </button>

          {/* Divider */}
          <div className="divider-container">OR</div>

          {/* Google Signin Button */}
          <button type="button" className="btn-google-signup" id="btn-google-login" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5.04c1.88 0 3.32.8 4.04 1.48l3.08-3.08C17.28 1.64 14.88 1 12 1 7.28 1 3.28 3.76 1.36 7.8l3.68 2.84c.88-2.64 3.36-4.6 6.96-4.6z" fill="#ea4335" stroke="none"></path>
              <path d="M23 12.24c0-.8-.08-1.6-.24-2.36H12v4.52h6.2c-.28 1.44-1.08 2.68-2.32 3.52l3.6 2.8c2.12-1.96 3.52-4.84 3.52-8.48z" fill="#4285f4" stroke="none"></path>
              <path d="M5.04 10.64a7.17 7.17 0 0 1 0 2.72l-3.68 2.84C.48 14.48 0 13.28 0 12c0-1.28.48-2.48 1.36-4.2l3.68 2.84z" fill="#fbbc05" stroke="none"></path>
              <path d="M12 23c3.24 0 5.96-1.08 7.96-2.92l-3.6-2.8c-1.12.76-2.52 1.2-4.36 1.2-3.6 0-6.08-1.96-6.96-4.6L1.36 16.72C3.28 20.24 7.28 23 12 23z" fill="#34a853" stroke="none"></path>
            </svg>
            Continue with Google
          </button>

          {/* Sign Up footer link */}
          <div className="signup-footer-link">
            Don't have an account? <Link href="/student-signup" id="btn-signup-here" style={{ color: "var(--color-purple)" }}>Create Student Account</Link>
          </div>

        </form>

        {/* Inline Floating Alert Messages */}
        <div className="alert-toast-container" id="alert-container">
          {toasts.map((t) => {
            let iconSvg = "";
            if (t.type === "success") {
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              );
            } else if (t.type === "error") {
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              );
            } else {
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              );
            }

            return (
              <div key={t.id} className={`alert-toast ${t.type}`}>
                <span className="toast-icon">{iconSvg}</span>
                <span className="toast-message">{t.message}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="student-login-footer">
        <span>&copy; 2026 CertFIRE. Powered by Digital Neon.</span>
        <div>
          <a href="#">Support</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms</a>
        </div>
      </footer>
    </div>
  );
}
