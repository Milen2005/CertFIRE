"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("Alex Chen");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);

  useEffect(() => {
    setIsLoggedIn(sessionStorage.getItem("isLoggedIn") === "true");
    setUserRole(sessionStorage.getItem("userRole") || "");
    setUserName(sessionStorage.getItem("userName") || "Alex Chen");
    
    // Load notifications from local storage on mount
    const storedNotifs = JSON.parse(localStorage.getItem("systemNotifications") || "[]");
    setNotificationsList(storedNotifs);
  }, []);

  const toggleNotifications = () => {
    if (!showNotifications) {
      // Reload notifications in case a new one was added in another tab/interaction
      const storedNotifs = JSON.parse(localStorage.getItem("systemNotifications") || "[]");
      setNotificationsList(storedNotifs);
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkRead = (id) => {
    const updated = notificationsList.map((n) =>
      n.id === id ? { ...n, unread: false } : n
    );
    setNotificationsList(updated);
    localStorage.setItem("systemNotifications", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setNotificationsList([]);
    localStorage.setItem("systemNotifications", "[]");
  };

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  return (
    <header className="main-header scrolled">
      <div className="header-container">
        <Link href="/" className="logo" id="header-logo">
          Cert<span>FIRE</span>
        </Link>
        
        <nav className={`nav-links ${mobileOpen ? "mobile-active" : ""}`}>
          {isLoggedIn && userRole === "student" ? (
            <>
              <Link href="/browse-fests" className={`nav-link ${pathname === "/browse-fests" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                Explore
              </Link>
              <Link href="/student-dashboard" className={`nav-link ${pathname === "/student-dashboard" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                My Events
              </Link>
              <Link href="/student-dashboard#certificates" className={`nav-link ${pathname === "/student-dashboard#certificates" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                Certificates
              </Link>
              <Link href="/student-dashboard#profile" className={`nav-link ${pathname === "/student-dashboard#profile" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                Profile
              </Link>
            </>
          ) : isLoggedIn && userRole === "organizer" ? (
            <>
              <Link href="/browse-fests" className={`nav-link ${pathname === "/browse-fests" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                Explore
              </Link>
              <Link href="/organizer-dashboard" className={`nav-link ${pathname === "/organizer-dashboard" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                Console Dashboard
              </Link>
              <Link href="/create-fest" className={`nav-link ${pathname === "/create-fest" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                Create Event
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link href="/browse-fests" className={`nav-link ${pathname === "/browse-fests" ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                Browse Fests
              </Link>
              <Link href="/#about-section" className="nav-link" onClick={() => setMobileOpen(false)}>
                About Us
              </Link>
              <Link href="/#newsletter-section" className="nav-link" onClick={() => setMobileOpen(false)}>
                Contact Us
              </Link>
            </>
          )}
        </nav>

        <div className="header-actions">
          {isLoggedIn ? (
            <>
              
              
              <div className="notification-wrapper" style={{ position: "relative" }}>
                <button 
                  className="nav-icon-btn" 
                  id="btn-notification" 
                  aria-label="Notifications" 
                  style={{ position: "relative" }}
                  onClick={toggleNotifications}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {notificationsList.some((n) => n.unread) && (
                    <span className="notif-dot" style={{ position: "absolute", top: "1px", right: "1px", width: "8px", height: "8px", background: "var(--color-pink)", borderRadius: "50%", boxShadow: "0 0 8px var(--color-pink)" }}></span>
                  )}
                </button>

                {showNotifications && (
                  <div 
                    className="notifications-dropdown" 
                    style={{
                      position: "absolute",
                      top: "45px",
                      right: "0",
                      width: "300px",
                      backgroundColor: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border-glass)",
                      borderRadius: "12px",
                      padding: "16px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                      zIndex: 1010,
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notifications</span>
                      {notificationsList.length > 0 && (
                        <button onClick={handleClearAll} style={{ fontSize: "0.75rem", color: "var(--color-pink)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Clear All</button>
                      )}
                    </div>
                    <div className="notifications-list" style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {notificationsList.length > 0 ? (
                        notificationsList.map((notif) => (
                          <div 
                            key={notif.id} 
                            style={{
                              padding: "10px",
                              borderRadius: "8px",
                              backgroundColor: notif.unread ? "rgba(0, 210, 255, 0.05)" : "rgba(255, 255, 255, 0.01)",
                              border: notif.unread ? "1px solid rgba(0, 210, 255, 0.15)" : "1px solid rgba(255, 255, 255, 0.03)",
                              fontSize: "0.8rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              cursor: "pointer"
                            }}
                            onClick={() => handleMarkRead(notif.id)}
                          >
                            <div style={{ color: "var(--color-text-primary)", lineHeight: "1.3", textAlign: "left" }}>{notif.message}</div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>{notif.date}</span>
                              {notif.unread && <span style={{ color: "var(--color-cyan)", fontWeight: 700 }}>New</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", fontStyle: "italic" }}>
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {userRole === "student" ? (
                <div 
                  className="header-student-profile" 
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                  onClick={() => {
                    if (confirm("Do you want to log out?")) {
                      sessionStorage.removeItem("isLoggedIn");
                      sessionStorage.removeItem("userRole");
                      sessionStorage.removeItem("userName");
                      window.location.href = "/";
                    }
                  }}
                >
                  <div className="student-avatar-wrapper" style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--color-cyan)" }}>
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                      alt="Student Avatar" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  </div>
                  <span className="student-profile-name" style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{userName}</span>
                </div>
              ) : (
                <button className="profile-avatar-btn" id="btn-profile" aria-label="Profile" onClick={() => {
                  if (confirm("Do you want to log out?")) {
                    sessionStorage.removeItem("isLoggedIn");
                    sessionStorage.removeItem("userRole");
                    window.location.href = "/";
                  }
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              )}
            </>
          ) : (
            <>
              <Link href="/login" className="login-btn" id="btn-login">
                Login
              </Link>
              <Link href="/student-login?source=register" className="register-btn" id="btn-register-header">
                Register
              </Link>
            </>
          )}
        </div>

        <button className={`mobile-menu-toggle ${mobileOpen ? "open" : ""}`} onClick={toggleMobileMenu} aria-label="Toggle Menu">
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>
    </header>
  );
}
