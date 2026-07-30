"use client";

import { useEffect } from "react";

export default function EventModal({ isOpen, onClose, event, isRegistered, onRegister }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  let categoryClass = "tech";
  let tagText = "TECH";
  const cc = (event.categoryClass || "").toLowerCase();
  if (cc.includes("music") || cc.includes("rhythm")) {
    categoryClass = "music";
    tagText = "MUSIC";
  } else if (cc.includes("art") || cc.includes("motion")) {
    categoryClass = "art";
    tagText = "ART";
  }

  return (
    <div className="event-modal-overlay active" onClick={(e) => e.target.classList.contains("event-modal-overlay") && onClose()}>
      <div className="event-modal-card">
        <button className="event-modal-close" onClick={onClose} aria-label="Close Modal">&times;</button>
        <div className="event-modal-banner-wrapper">
          <img src={event.image || "/assets/hero_bg.png"} alt={event.title} className="modal-banner-img" />
          <span className={`fest-tag tag-${categoryClass}`}>{tagText}</span>
        </div>
        <div className="event-modal-body">
          <div className="modal-header-row">
            <h2>{event.title}</h2>
            <div className={`fest-date date-${categoryClass}`}>
              <span className="month">{event.dateMonth}</span>
              <span className="day">{event.dateDay}</span>
            </div>
          </div>
          
          <p className="modal-location-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{event.location}</span>
          </p>

          <div className="modal-divider"></div>

          <div className="modal-content-grid">
            <div className="modal-left-content">
              <h3>Description</h3>
              <p style={{ whiteSpace: "pre-line" }}>{event.description}</p>
            </div>
            <div className="modal-right-content">
              <h3>Event Details</h3>
              <ul className="modal-details-list">
                <li><strong>Time:</strong> <span>{event.timeRange || "All Day"}</span></li>
                <li><strong>Deadline:</strong> <span>{event.deadline || "N/A"}</span></li>
                <li><strong>Max Seats:</strong> <span>{event.seats || "Unlimited"}</span></li>
                <li><strong>Fee:</strong> <span>{event.fee || "Free"}</span></li>
                <li><strong>Eligibility:</strong> <span>{event.eligibility || "Open to all"}</span></li>
                <li><strong>Organizer:</strong> <span>{event.organizer || "CertFIRE Organizers Team"}</span></li>
              </ul>
              <div style={{ marginTop: "24px" }}>
                {isRegistered ? (
                  <button 
                    disabled 
                    className="registered-btn"
                    style={{ width: "100%" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px", display: "inline-block", verticalAlign: "middle" }}>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style={{ display: "inline-block", verticalAlign: "middle" }}>Registered</span>
                  </button>
                ) : (
                  <button 
                    className={`register-fest-btn btn-register-${categoryClass}`} 
                    style={{ width: "100%" }}
                    onClick={onRegister}
                  >
                    Register for Fest
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
