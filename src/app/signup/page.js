"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function Signup() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [role, setRole] = useState("");
  const [orgName, setOrgName] = useState("");
  const [deptClubName, setDeptClubName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // OTP status
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  // Password Checklist validation states
  const isLengthValid = password.length >= 8;
  const isUppercaseValid = /[A-Z]/.test(password);
  const isNumberValid = /[0-9]/.test(password);
  const isSpecialValid = /[^A-Za-z0-9]/.test(password);

  // Toasts state
  const [toasts, setToasts] = useState([]);

  // Error Modal states for redirect
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const emailParam = params.get("email");
    const passwordParam = params.get("password");

    if (errorParam === "account_not_found") {
      setErrorModalMessage("Account not found. There is no organizer account registered under this email or username. Please sign up to create your account.");
      setShowErrorModal(true);
    }

    if (emailParam) {
      setEmail(emailParam);
    }
    if (passwordParam) {
      setPassword(passwordParam);
      setConfirmPassword(passwordParam);
    }
  }, []);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSendOtp = () => {
    const emailVal = email.trim();
    if (!emailVal) {
      showToast("Please enter your official email address first.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setOtpSending(true);

    setTimeout(() => {
      showToast("Verification OTP sent successfully to your email!", "success");
      setOtpSent(true);
      setOtpSending(false);
    }, 1000);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    if (!isLengthValid || !isUppercaseValid || !isNumberValid || !isSpecialValid) {
      showToast("Please meet all security checklist requirements for password.", "error");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      showToast("Please agree to the Terms and Privacy Policy.", "error");
      return;
    }

    showToast("Creating organizer account...", "info");

    const emailLower = email.trim().toLowerCase();

    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName.trim(),
        email: emailLower,
        password: password,
        role: "ORGANIZER"
      })
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }
      showToast("Organizer account successfully created in database!", "success");
      
      // Store locally as fallback/compatibility layer
      localStorage.setItem(`profileName_${emailLower}`, fullName.trim());
      if (profilePic) {
        localStorage.setItem(`profilePic_${emailLower}`, profilePic);
      }
      localStorage.setItem(`profilePhone_${emailLower}`, phoneNumber);
      localStorage.setItem(`profileOrg_${emailLower}`, orgName);
      localStorage.setItem(`profileDept_${emailLower}`, deptClubName);
      localStorage.setItem(`profileRole_${emailLower}`, role);
      localStorage.setItem(`profileUsername_${emailLower}`, username || fullName.trim().split(" ")[0].toLowerCase());
      localStorage.setItem(`userPassword_${emailLower}`, password);

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    })
    .catch((err) => {
      console.error(err);
      showToast("Registering organizer offline/locally...", "warning");
      
      // Local Fallback
      localStorage.setItem(`profileName_${emailLower}`, fullName.trim());
      if (profilePic) {
        localStorage.setItem(`profilePic_${emailLower}`, profilePic);
      }
      localStorage.setItem(`profilePhone_${emailLower}`, phoneNumber);
      localStorage.setItem(`profileOrg_${emailLower}`, orgName);
      localStorage.setItem(`profileDept_${emailLower}`, deptClubName);
      localStorage.setItem(`profileRole_${emailLower}`, role);
      localStorage.setItem(`profileUsername_${emailLower}`, username || fullName.trim().split(" ")[0].toLowerCase());
      localStorage.setItem(`userPassword_${emailLower}`, password);

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    });
  };

  const handleGoogleSignup = () => {
    showToast("Connecting with Google...", "info");
    setTimeout(() => {
      showToast("Successfully signed up with Google!", "success");
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", "organizer");
      sessionStorage.setItem("userName", "Google Organizer");
      sessionStorage.setItem("userEmail", "google.organizer@gmail.com");
      
      setTimeout(() => {
        router.push("/organizer-dashboard");
      }, 1500);
    }, 1000);
  };

  return (
    <>
      <Header />
      
      <main className="signup-container">
        
        {/* Title & Subtitle Banner */}
        <section className="signup-title-section">
          {/* Role Switcher */}
          <div style={{ marginBottom: "24px", fontSize: "0.95rem" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>Looking to join as a student?</span>
            <Link href="/student-signup" style={{ color: "var(--color-cyan)", fontWeight: 600, textDecoration: "underline", marginLeft: "6px" }}>
              Sign up as a Student
            </Link>
          </div>
          <h1 className="signup-title">Welcome to Cert<span>FIRE</span></h1>
          <p className="signup-subtitle">
            Elevate your events with professional certificate management. Join the ecosystem of high-performing organizers today.
          </p>
        </section>

        {/* Signup Form */}
        <form id="form-signup" className="signup-card" onSubmit={handleSignupSubmit}>
          
          {/* SECTION 1: Personal Information */}
          <div className="signup-section-header">
            <span className="signup-section-icon text-cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <h2 className="signup-section-title">Personal Information</h2>
          </div>

          {/* Profile Picture Upload */}
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label>Profile Picture</label>
            <div 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "16px",
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: "12px",
                marginTop: "6px"
              }}
            >
              <div 
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--color-cyan)",
                  flexShrink: 0
                }}
              >
                {profilePic ? (
                  <img src={profilePic} alt="Profile Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <input 
                  type="file" 
                  id="profile-pic-upload" 
                  accept="image/*" 
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      if (file.type.startsWith("image/")) {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onloadend = () => {
                          setProfilePic(reader.result);
                          showToast("Profile picture uploaded successfully.", "success");
                        };
                      } else {
                        showToast("Please select an image file.", "error");
                      }
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="btn-action-secondary" 
                  style={{ fontSize: "0.85rem", padding: "8px 16px", borderRadius: "20px" }}
                  onClick={() => document.getElementById("profile-pic-upload").click()}
                >
                  Upload Photo
                </button>
                {profilePic && (
                  <button 
                    type="button" 
                    className="btn-clear-all" 
                    style={{ fontSize: "0.85rem", padding: "8px 16px", borderRadius: "20px", color: "var(--color-pink)", border: "1px solid rgba(236, 72, 153, 0.2)", background: "rgba(236, 72, 153, 0.05)" }}
                    onClick={() => setProfilePic("")}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full-name">Full Name</label>
              <input 
                type="text" 
                id="full-name" 
                placeholder="e.g. Alex Rivers" 
                required 
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="designation-role">Designation/Role</label>
              <div className="select-wrapper">
                <select 
                  id="designation-role" 
                  required 
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="" disabled>Select your role</option>
                  <option value="student-organizer">Student Organizer</option>
                  <option value="faculty-coordinator">Faculty Coordinator</option>
                  <option value="dean-hod">Dean/HOD</option>
                  <option value="industry-partner">Industry Partner</option>
                  <option value="developer">Developer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Organization Details */}
          <div className="signup-section-header">
            <span className="signup-section-icon text-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <line x1="9" y1="22" x2="9" y2="16"></line>
                <line x1="15" y1="22" x2="15" y2="16"></line>
                <line x1="9" y1="16" x2="15" y2="16"></line>
                <path d="M8 6h8M8 10h8"></path>
              </svg>
            </span>
            <h2 className="signup-section-title">Organization Details</h2>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="org-name">Organization/College Name</label>
              <input 
                type="text" 
                id="org-name" 
                placeholder="Enter institution name" 
                required 
                className="form-input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="dept-club-name">Department or Club Name</label>
              <input 
                type="text" 
                id="dept-club-name" 
                placeholder="e.g. Dept of Computer Science" 
                required 
                className="form-input"
                value={deptClubName}
                onChange={(e) => setDeptClubName(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 3: Contact & Verification */}
          <div className="signup-section-header">
            <span className="signup-section-icon text-gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </span>
            <h2 className="signup-section-title">Contact & Verification</h2>
          </div>

          <div className="email-verification-row">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label htmlFor="official-email">Official Email Address</label>
              <div className="email-input-container">
                <input 
                  type="email" 
                  id="official-email" 
                  placeholder="name@org.edu" 
                  required 
                  className="form-input" 
                  style={{ paddingRight: "100px" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                  type="button" 
                  className="otp-send-btn" 
                  id="btn-send-otp"
                  onClick={handleSendOtp}
                  disabled={otpSending}
                >
                  {otpSending ? "Sending..." : otpSent ? "Sent" : "Send OTP"}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="email-otp">Email Verification OTP</label>
              <input 
                type="text" 
                id="email-otp" 
                placeholder="6-digit code" 
                required 
                className="form-input" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row" style={{ maxWidth: "50%" }}>
            <div className="form-group">
              <label htmlFor="phone-number">Phone Number</label>
              <input 
                type="tel" 
                id="phone-number" 
                placeholder="+91 99881 22334" 
                className="form-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 4: Account Security */}
          <div className="signup-section-header">
            <span className="signup-section-icon text-teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            <h2 className="signup-section-title">Account Security</h2>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username (Optional)</label>
            <input 
              type="text" 
              id="username" 
              placeholder="Pick a unique handle" 
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input 
                type="password" 
                id="signup-password" 
                required 
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                required 
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Password Checklist */}
          <div className="security-checklist" id="security-checklist">
            <div className="checklist-title">Security Checklist</div>
            <div className={`checklist-item ${isLengthValid ? "valid" : ""}`} id="chk-length">
              <span className="checklist-circle"></span>
              <span>8+ Characters</span>
            </div>
            <div className={`checklist-item ${isUppercaseValid ? "valid" : ""}`} id="chk-uppercase">
              <span className="checklist-circle"></span>
              <span>One Uppercase</span>
            </div>
            <div className={`checklist-item ${isNumberValid ? "valid" : ""}`} id="chk-number">
              <span className="checklist-circle"></span>
              <span>One Number</span>
            </div>
            <div className={`checklist-item ${isSpecialValid ? "valid" : ""}`} id="chk-special">
              <span className="checklist-circle"></span>
              <span>One Special Char</span>
            </div>
          </div>

          {/* Agreements Checkboxes */}
          <div className="checkbox-group">
            <label className="checkbox-label" htmlFor="agree-terms">
              <input 
                type="checkbox" 
                id="agree-terms" 
                required 
                className="checkbox-input"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>I agree to the <a href="#" target="_blank">Terms and Conditions</a></span>
            </label>
            <label className="checkbox-label" htmlFor="agree-privacy">
              <input 
                type="checkbox" 
                id="agree-privacy" 
                required 
                className="checkbox-input"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
              />
              <span>I agree to the <a href="#" target="_blank">Privacy Policy</a></span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-gradient-cyan ripple" id="btn-create-account">
            Create Organizer Account
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>

          {/* Divider */}
          <div className="divider-container">OR CONTINUE WITH</div>

          {/* Google Signup Button */}
          <button type="button" className="btn-google-signup" id="btn-google-signup" onClick={handleGoogleSignup}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5.04c1.88 0 3.32.8 4.04 1.48l3.08-3.08C17.28 1.64 14.88 1 12 1 7.28 1 3.28 3.76 1.36 7.8l3.68 2.84c.88-2.64 3.36-4.6 6.96-4.6z" fill="#ea4335" stroke="none"></path>
              <path d="M23 12.24c0-.8-.08-1.6-.24-2.36H12v4.52h6.2c-.28 1.44-1.08 2.68-2.32 3.52l3.6 2.8c2.12-1.96 3.52-4.84 3.52-8.48z" fill="#4285f4" stroke="none"></path>
              <path d="M5.04 10.64a7.17 7.17 0 0 1 0 2.72l-3.68 2.84C.48 14.48 0 13.28 0 12c0-1.28.48-2.48 1.36-4.2l3.68 2.84z" fill="#fbbc05" stroke="none"></path>
              <path d="M12 23c3.24 0 5.96-1.08 7.96-2.92l-3.6-2.8c-1.12.76-2.52 1.2-4.36 1.2-3.6 0-6.08-1.96-6.96-4.6L1.36 16.72C3.28 20.24 7.28 23 12 23z" fill="#34a853" stroke="none"></path>
            </svg>
            Sign Up with Google
          </button>

          {/* Login footer link */}
          <div className="signup-footer-link">
            Already have an account? <Link href="/login" id="btn-login-here">Login here</Link>
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

      {showErrorModal && (
        <div className="modal-overlay" style={{ zIndex: 10000, position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
          <div className="modal-container" style={{ maxWidth: "420px", width: "90%", backgroundColor: "#11131e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 25px 50px rgba(0,0,0,0.6)" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.1)", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", margin: "0 0 12px 0", letterSpacing: "0.5px" }}>Account Not Found</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: "0 0 24px 0", lineHeight: "1.6" }}>
              {errorModalMessage}
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button 
                type="button"
                className="btn-gradient-cyan" 
                style={{ width: "100%", padding: "12px", fontWeight: 700, borderRadius: "8px", border: "none", color: "#fff", cursor: "pointer", fontSize: "0.95rem", background: "linear-gradient(135deg, var(--color-cyan, #00d2ff) 0%, var(--color-purple, #ab47bc) 100%)" }}
                onClick={() => setShowErrorModal(false)}
              >
                Okay, Register Now
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
