"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState("");
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [toasts, setToasts] = useState([]);
  const [modalMessage, setModalMessage] = useState("");
  const [showModalMessage, setShowModalMessage] = useState(false);

  // Message Box Helper
  const showMessageBox = (msg) => {
    setModalMessage(msg);
    setShowModalMessage(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectUrl(params.get("redirect") || "");
    
    const message = params.get("message");
    if (message === "password_updated") {
      setTimeout(() => {
        showToast("Password updated successfully! Please log in with your new password.", "success");
      }, 100);
    }

    const source = params.get("source");
    if (source === "host-event") {
      setRedirectUrl("/create-fest");
      let hasOrganizer = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("userPassword_")) {
          hasOrganizer = true;
          break;
        }
      }
      if (!hasOrganizer) {
        setTimeout(() => {
          showMessageBox("No organizer account found. Please sign up to add an account.");
          showToast("No organizer account found. Please sign up.", "error");
        }, 150);
      }
    }
  }, []);

  // Toast Helper
  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || !password) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    showToast("Verifying credentials...", "info");

    const emailLower = trimmedUsername.includes("@") ? trimmedUsername : `${trimmedUsername}@certfire.io`;

    try {
      // 1. Try NextAuth authentication
      const res = await signIn("credentials", {
        redirect: false,
        email: emailLower,
        password: password
      });

      if (res && !res.error) {
        // Fetch session info
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        
        if (session && session.user) {
          const user = session.user;
          showToast("Login successful! Welcome back.", "success");
          
          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("userRole", user.role ? user.role.toLowerCase() : "organizer");
          sessionStorage.setItem("userName", user.name);
          sessionStorage.setItem("userEmail", user.email);
          sessionStorage.setItem("userId", user.id);

          setTimeout(() => {
            if (redirectUrl) {
              router.push(redirectUrl);
            } else {
              router.push("/organizer-dashboard");
            }
          }, 1500);
          return;
        }
      }

      throw new Error(res?.error || "Invalid database credentials");

    } catch (dbError) {
      console.warn("Database login failed, checking local storage:", dbError.message);

      // Local Fallback validation
      let storedPassword = localStorage.getItem(`userPassword_${emailLower}`);
      let finalEmailLower = emailLower;
      
      if (!storedPassword) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("profileUsername_")) {
            const storedUser = localStorage.getItem(key);
            if (storedUser && storedUser.toLowerCase() === trimmedUsername) {
              finalEmailLower = key.replace("profileUsername_", "");
              storedPassword = localStorage.getItem(`userPassword_${finalEmailLower}`);
              break;
            }
          }
        }
      }

      if (!storedPassword) {
        showToast("Account not found. Redirecting to signup...", "error");
        setTimeout(() => {
          router.push(`/signup?error=account_not_found&email=${encodeURIComponent(trimmedUsername)}&password=${encodeURIComponent(password)}`);
        }, 1200);
        return;
      }

      if (storedPassword !== password) {
        showToast("Invalid username/email or password.", "error");
        return;
      }

      showToast("Login successful (offline mode)!", "success");
      
      const storedName = localStorage.getItem(`profileName_${finalEmailLower}`) || 
                         (finalEmailLower.split("@")[0].charAt(0).toUpperCase() + finalEmailLower.split("@")[0].slice(1));
      
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", "organizer");
      sessionStorage.setItem("userName", storedName);
      sessionStorage.setItem("userEmail", finalEmailLower);

      // Resolve database user ID
      fetch(`/api/profile?email=${encodeURIComponent(finalEmailLower)}`)
        .then(async (r) => {
          if (r.ok) {
            const u = await r.json();
            if (u && u.id) {
              sessionStorage.setItem("userId", u.id);
            }
          }
        })
        .catch((err) => console.warn("Could not resolve database user ID:", err));

      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push("/organizer-dashboard");
        }
      }, 1500);
    }
  };

  const handleGoogleLogin = () => {
    showToast("Connecting with Google...", "info");
    setTimeout(() => {
      showToast("Successfully logged in with Google!", "success");
      const emailLower = "google.organizer@gmail.com";
      localStorage.setItem(`userPassword_${emailLower}`, "google_authenticated");
      localStorage.setItem(`profileName_${emailLower}`, "Google Organizer");
      localStorage.setItem(`profileUsername_${emailLower}`, "googleorganizer");

      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", "organizer");
      sessionStorage.setItem("userName", "Google Organizer");
      sessionStorage.setItem("userEmail", emailLower);
      
      // Resolve database user ID
      fetch(`/api/profile?email=${encodeURIComponent(emailLower)}`)
        .then(async (r) => {
          if (r.ok) {
            const u = await r.json();
            if (u && u.id) {
              sessionStorage.setItem("userId", u.id);
            }
          }
        })
        .catch((err) => console.warn("Could not resolve Google login database user ID:", err));

      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push("/organizer-dashboard");
        }
      }, 1500);
    }, 1000);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    const email = username.trim();
    if (!email) {
      showToast("Please enter your email in the Username/Email field first.", "error");
      return;
    }
    showToast(`Password reset link sent to ${email}`, "success");
  };

  return (
    <div className="login-page">
      <main className="login-container">
        
        {/* Role Switcher */}
        <div style={{ textAlign: "center", marginBottom: "-10px", fontSize: "0.95rem", zIndex: 10 }}>
          <span style={{ color: "var(--color-text-secondary)" }}>Looking to log in as a Student?</span>
          <Link href="/student-login" style={{ color: "var(--color-cyan)", fontWeight: 600, textDecoration: "underline", marginLeft: "6px" }}>
            Go here
          </Link>
        </div>
        
        {/* Logo Header */}
        <div className="login-logo-section">
          <Link href="/" className="logo login-portal-logo">
            Cert<span>FIRE</span>
          </Link>
          <div className="login-subtitle-portal">TECH FESTIVAL PORTAL</div>
        </div>

        {/* Login Card */}
        <form id="form-login" className="login-card" onSubmit={handleLoginSubmit}>
          
          <h1 className="login-card-title">Welcome Back</h1>
          <p className="login-card-desc">Sign in to access your festival dashboard and schedule.</p>

          {/* Username or Email */}
          <div className="form-group">
            <label htmlFor="login-username">Username or Email</label>
            <div class="input-icon-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input 
                type="text" 
                id="login-username" 
                placeholder="cyberpunk@certfire.io" 
                required 
                className="form-input input-with-icon"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Password with Forgot Password link */}
          <div className="form-group">
            <div className="password-header-row">
              <label htmlFor="login-password">Password</label>
              <Link href="/forgot-password" className="forgot-password-link" id="btn-forgot-password">
                Forgot Password?
              </Link>
            </div>
            <div class="input-icon-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input 
                type="password" 
                id="login-password" 
                placeholder="........" 
                required 
                className="form-input input-with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Login Button */}
          <button type="submit" className="btn-gradient-cyan ripple" id="btn-submit-login" style={{ marginTop: "12px" }}>
            Login
          </button>

          {/* Divider */}
          <div className="divider-container">OR</div>

          {/* Google Signin Button */}
          <button type="button" className="btn-google-signup" id="btn-google-login" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5.04c1.88 0 3.32.8 4.04 1.48l3.08-3.08C17.28 1.64 14.88 1 12 1 7.28 1 3.28 3.76 1.36 7.8l3.68 2.84c.88-2.64 3.36-4.6 6.96-4.6z" fill="#ea4335" stroke="none"></path>
              <path d="M23 12.24c0-.8-.08-1.6-.24-2.36H12v4.52h6.2c-.28 1.44-1.08 2.68-2.32 3.52l3.6 2.8c2.12-1.96 3.52-4.84 3.52-8.48z" fill="#4285f4" stroke="none"></path>
              <path d="M5.04 10.64a7.17 7.17 0 0 1 0 2.72l-3.68 2.84C.48 14.48 0 13.28 0 12c0-1.28.48-2.48 1.36-4.2l3.68 2.84z" fill="#fbbc05" stroke="none"></path>
              <path d="M12 23c3.24 0 5.96-1.08 7.96-2.92l-3.6-2.8c-1.12.76-2.52 1.2-4.36 1.2-3.6 0-6.08-1.96-6.96-4.6L1.36 16.72C3.28 20.24 7.28 23 12 23z" fill="#34a853" stroke="none"></path>
            </svg>
            Sign in with Google
          </button>

          {/* Sign Up footer link */}
          <div className="signup-footer-link">
            Don't have an account? <Link href="/signup" id="btn-signup-here">Sign up</Link>
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
      {showModalMessage && (
        <div className="modal-overlay" style={{ zIndex: 10000, position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
          <div className="modal-container" style={{ maxWidth: "420px", width: "90%", backgroundColor: "#11131e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 25px 50px rgba(0,0,0,0.6)" }}>
            <div style={{ background: "rgba(0, 210, 255, 0.1)", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan, #00d2ff)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", margin: "0 0 12px 0", letterSpacing: "0.5px" }}>Verification Notice</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: "0 0 24px 0", lineHeight: "1.6" }}>
              {modalMessage}
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                type="button"
                className="btn-modal-close" 
                style={{ flex: 1, padding: "12px", fontWeight: 700, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", color: "#fff", cursor: "pointer", fontSize: "0.9rem" }}
                onClick={() => setShowModalMessage(false)}
              >
                Close
              </button>
              <Link 
                href="/signup"
                className="btn-gradient-cyan-purple"
                style={{ flex: 1, padding: "12px", fontWeight: 700, borderRadius: "8px", textAlign: "center", textDecoration: "none", color: "#fff", display: "inline-block", background: "linear-gradient(135deg, var(--color-cyan, #00d2ff) 0%, var(--color-purple, #ab47bc) 100%)", boxShadow: "0 4px 15px rgba(0, 210, 255, 0.2)", fontSize: "0.9rem" }}
                onClick={() => setShowModalMessage(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
