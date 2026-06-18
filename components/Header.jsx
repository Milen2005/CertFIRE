"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(sessionStorage.getItem("isLoggedIn") === "true");
  }, []);

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  return (
    <header className="main-header scrolled">
      <div className="header-container">
        <Link href="/" className="logo" id="header-logo">
          Cert<span>FIRE</span>
        </Link>
        
        <nav className={`nav-links ${mobileOpen ? "mobile-active" : ""}`}>
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
        </nav>

        <div className="header-actions">
          {isLoggedIn ? (
            <>
              <Link href="/create-fest" className="register-btn btn-create-cyan" id="btn-create-event-header">
                Create Event
              </Link>
              
              <button className="nav-icon-btn" id="btn-notification" aria-label="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              
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
            </>
          ) : (
            <>
              <Link href="/login" className="login-btn" id="btn-login">
                Login
              </Link>
              <Link href="/signup" className="register-btn" id="btn-register-header">
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
