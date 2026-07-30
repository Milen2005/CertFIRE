"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPassword() {
  const router = useRouter();
  
  // Navigation steps: 1 = Email, 2 = OTP, 3 = New Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Toast Helper
  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Step 1: Send OTP
  const handleSendOtp = (e) => {
    e.preventDefault();
    const emailVal = email.trim();

    if (!emailVal) {
      showToast("Please enter your registered email address.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setLoading(true);
    showToast("Generating verification code...", "info");

    setTimeout(() => {
      // Hardcoded 6-digit code for testing convenience
      const code = "123456";
      setSentOtp(code);
      setLoading(false);
      showToast(`Verification code sent! Your 6-digit OTP is: ${code}`, "success");
      
      // Proceed to Step 2
      setStep(2);
    }, 1200);
  };

  // Step 2: Confirm OTP
  const handleConfirmOtp = (e) => {
    e.preventDefault();
    const otpVal = enteredOtp.trim();

    if (!otpVal) {
      showToast("Please enter the 6-digit verification code.", "error");
      return;
    }

    if (otpVal !== sentOtp) {
      showToast("Invalid verification code. Please check the code and try again.", "error");
      return;
    }

    showToast("Code verified successfully!", "success");
    setStep(3);
  };

  // Step 3: Reset Password
  const handleResetPassword = (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast("Please fill in both password fields.", "error");
      return;
    }

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const emailLower = email.toLowerCase().trim();
      const storedUserJson = localStorage.getItem(emailLower);
      
      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson);
        storedUser.password = newPassword;
        localStorage.setItem(emailLower, JSON.stringify(storedUser));
      } else {
        // Create a stub account so they can log in if they used an untracked email
        const stubUser = {
          email: emailLower,
          username: emailLower.split("@")[0],
          password: newPassword,
          fullName: "Organizer Portal User",
          orgName: "CertFIRE College",
          deptClubName: "FEST ADMIN",
          phoneNumber: "+91 99881 22334"
        };
        localStorage.setItem(emailLower, JSON.stringify(stubUser));
      }

      setLoading(false);
      showToast("Password successfully reset! Redirecting to login...", "success");

      setTimeout(() => {
        router.push("/login?message=password_updated");
      }, 1500);
    }, 1200);
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100vh", 
      justifyContent: "space-between", 
      background: "#07080a", 
      fontFamily: "var(--font-body)", 
      color: "var(--color-text-primary)",
      position: "relative",
      overflow: "hidden"
    }}>
      
      {/* Background Glow Rays */}
      <div className="light-ray orange-ray" style={{ opacity: 0.1, filter: "blur(150px)", top: "-150px", right: "-150px" }}></div>
      <div className="light-ray blue-ray" style={{ opacity: 0.1, filter: "blur(150px)", bottom: "-150px", left: "-150px" }}></div>

      {/* Top Header */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "24px 40px", 
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        background: "rgba(7, 8, 10, 0.8)",
        backdropFilter: "blur(12px)",
        zIndex: 10
      }}>
        <Link href="/" className="logo" style={{ fontSize: "1.4rem", fontWeight: 800 }}>
          Cert<span>FIRE</span>
        </Link>
        <button 
          onClick={() => showToast("Help portal loading...", "info")}
          style={{ 
            color: "var(--color-text-secondary)", 
            background: "none", 
            border: "none", 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center" 
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </header>

      {/* Centered Main Form Container */}
      <main style={{ 
        flexGrow: 1, 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        padding: "40px 24px",
        zIndex: 10
      }}>
        <div style={{ 
          background: "rgba(20, 21, 27, 0.45)", 
          border: "1px solid rgba(255, 255, 255, 0.06)", 
          borderRadius: "20px", 
          padding: "48px 40px", 
          width: "100%", 
          maxWidth: "460px", 
          backdropFilter: "blur(20px)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)"
        }}>
          
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, textAlign: "center", marginBottom: "10px", color: "#ffffff", fontFamily: "var(--font-heading)" }}>
                Reset Your Password
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", textAlign: "center", marginBottom: "32px", lineHeight: 1.5 }}>
                Enter your registered email address and we'll send you a verification code.
              </p>

              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="reset-email" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-cyan)", letterSpacing: "0.05em" }}>
                    EMAIL ADDRESS
                  </label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input 
                      type="email" 
                      id="reset-email" 
                      className="form-input input-with-icon" 
                      placeholder="name@example.com" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ 
                    background: "linear-gradient(135deg, var(--color-cyan) 0%, #a855f7 100%)", 
                    color: "#000000", 
                    fontSize: "0.9rem", 
                    fontWeight: 700, 
                    padding: "14px", 
                    borderRadius: "10px", 
                    border: "none", 
                    cursor: "pointer", 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 15px rgba(0, 210, 255, 0.25)",
                    transition: "transform 0.2s, box-shadow 0.2s" 
                  }}
                >
                  {loading ? "SENDING CODE..." : "SEND VERIFICATION CODE →"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, textAlign: "center", marginBottom: "10px", color: "#ffffff", fontFamily: "var(--font-heading)" }}>
                Verify Your Identity
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", textAlign: "center", marginBottom: "32px", lineHeight: 1.5 }}>
                We've sent a 6-digit verification code to <strong>{email}</strong>.
              </p>

              <form onSubmit={handleConfirmOtp} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="reset-otp" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-cyan)", letterSpacing: "0.05em" }}>
                    EMAIL VERIFICATION OTP
                  </label>
                  <input 
                    type="text" 
                    id="reset-otp" 
                    className="form-input" 
                    placeholder="Enter 6-digit code" 
                    required
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    style={{ 
                      background: "rgba(0,0,0,0.3)",
                      letterSpacing: "0.2em",
                      fontWeight: 700,
                      textAlign: "center"
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  style={{ 
                    background: "linear-gradient(135deg, var(--color-cyan) 0%, #a855f7 100%)", 
                    color: "#000000", 
                    fontSize: "0.9rem", 
                    fontWeight: 700, 
                    padding: "14px", 
                    borderRadius: "10px", 
                    border: "none", 
                    cursor: "pointer", 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 15px rgba(0, 210, 255, 0.25)"
                  }}
                >
                  CONFIRM CODE →
                </button>
              </form>
              
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button 
                  onClick={() => setStep(1)}
                  style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}
                >
                  Back to Email Input
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, textAlign: "center", marginBottom: "10px", color: "#ffffff", fontFamily: "var(--font-heading)" }}>
                Create New Password
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", textAlign: "center", marginBottom: "32px", lineHeight: 1.5 }}>
                Enter your new secure password below to complete the reset process.
              </p>

              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="new-pass" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-cyan)" }}>
                    NEW PASSWORD
                  </label>
                  <input 
                    type="password" 
                    id="new-pass" 
                    className="form-input" 
                    placeholder="Min 8 characters" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="confirm-pass" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-cyan)" }}>
                    CONFIRM NEW PASSWORD
                  </label>
                  <input 
                    type="password" 
                    id="confirm-pass" 
                    className="form-input" 
                    placeholder="Repeat new password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ 
                    background: "linear-gradient(135deg, var(--color-cyan) 0%, #a855f7 100%)", 
                    color: "#000000", 
                    fontSize: "0.9rem", 
                    fontWeight: 700, 
                    padding: "14px", 
                    borderRadius: "10px", 
                    border: "none", 
                    cursor: "pointer", 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 15px rgba(0, 210, 255, 0.25)"
                  }}
                >
                  {loading ? "RESETTING PASSWORD..." : "CONFIRM & RESET PASSWORD →"}
                </button>
              </form>
            </>
          )}

          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <Link 
              href="/login" 
              style={{ 
                fontSize: "0.85rem", 
                color: "var(--color-text-secondary)", 
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
              onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
            >
              ← Back to Login
            </Link>
          </div>

        </div>

        <div style={{ marginTop: "24px", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          Difficulty signing in?{" "}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); showToast("Contact support at security@certfire.io", "success"); }} 
            style={{ color: "var(--color-cyan)", fontWeight: 600, textDecoration: "underline" }}
          >
            Contact our Security Team
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "24px 40px", 
        background: "#07080a",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        fontSize: "0.8rem", 
        color: "var(--color-text-muted)",
        zIndex: 10
      }}>
        <span style={{ fontWeight: 700, color: "var(--color-cyan)" }}>CertFIRE</span>
        <div style={{ display: "flex", gap: "24px" }}>
          <a href="#" onClick={(e) => { e.preventDefault(); showToast("Privacy policy portal...", "info"); }} style={{ color: "var(--color-text-muted)" }} onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}>Privacy Policy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); showToast("Terms of service...", "info"); }} style={{ color: "var(--color-text-muted)" }} onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}>Terms of Service</a>
          <a href="#" onClick={(e) => { e.preventDefault(); showToast("Support ticket generated...", "info"); }} style={{ color: "var(--color-text-muted)" }} onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}>Contact Support</a>
        </div>
        <span>&copy; 2024 CertFire. All rights reserved.</span>
      </footer>

      {/* Toast Alert Container */}
      <div className="alert-toast-container">
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

    </div>
  );
}
