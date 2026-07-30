"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import EventModal from "../../components/EventModal";
import { PREDEFINED_EVENTS } from "../../constants/events";

export default function BrowseFests() {
  const [allEvents, setAllEvents] = useState(PREDEFINED_EVENTS);
  const [filteredEvents, setFilteredEvents] = useState([]);
  
  // Search & Filter State
  const [searchText, setSearchText] = useState("");
  const [currentCategory, setCurrentCategory] = useState("all");

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [regModalData, setRegModalData] = useState(null);

  const getRegisteredFestsKey = () => {
    const email = typeof window !== "undefined" ? sessionStorage.getItem("userEmail") : "";
    return email ? `registeredFests_${email.toLowerCase().trim()}` : "registeredFests";
  };

  useEffect(() => {
    // Load custom events from localStorage and merge them
    const getCustomFests = () => {
      const list = [];
      const seenIds = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("customFests_")) {
          try {
            const items = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(items)) {
              items.forEach(item => {
                if (item && item.id && !seenIds.has(item.id) && !item.isDraft) {
                  seenIds.add(item.id);
                  list.push(item);
                }
              });
            }
          } catch (e) {}
        }
      }
      try {
        const legacy = JSON.parse(localStorage.getItem("customFests") || "[]");
        if (Array.isArray(legacy)) {
          legacy.forEach(item => {
            if (item && item.id && !seenIds.has(item.id) && !item.isDraft) {
              seenIds.add(item.id);
              list.push(item);
            }
          });
        }
      } catch (e) {}
      return list;
    };
    const custom = getCustomFests();
    const normalizedCustom = custom.map((c) => ({
      ...c,
      categoryClass: c.categoryClass || "hackathon"
    }));
    const combined = [...normalizedCustom, ...PREDEFINED_EVENTS];
    setAllEvents(combined);
    setFilteredEvents(combined);

    fetch("/api/fests")
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        if (Array.isArray(data)) {
          const dbFests = data.map(f => ({
            id: f.id,
            title: f.title,
            description: f.description,
            location: f.venue || "Campus Venue",
            dateMonth: f.date ? new Date(f.date).toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "OCT",
            dateDay: f.date ? new Date(f.date).toLocaleDateString("en-US", { day: "numeric" }) : "10",
            categoryClass: (f.category || "tech").toLowerCase(),
            image: f.image || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=512",
            capacity: f.capacity,
            organiserId: f.organiser_id,
            isDraft: f.is_draft
          })).filter(f => !f.isDraft);

          setAllEvents(prev => {
            const seen = new Set();
            const result = [];
            normalizedCustom.forEach(item => {
              seen.add(item.id);
              result.push(item);
            });
            dbFests.forEach(item => {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                result.push(item);
              }
            });
            PREDEFINED_EVENTS.forEach(item => {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                result.push(item);
              }
            });
            return result;
          });
        }
      })
      .catch(err => console.warn("Could not load fests from database:", err));

    const registered = JSON.parse(localStorage.getItem(getRegisteredFestsKey()) || "[]");
    setRegisteredIds(registered);
  }, []);

  useEffect(() => {
    const q = searchText.toLowerCase().trim();
    const filtered = allEvents.filter((fest) => {
      // Category filter check
      const cc = (fest.categoryClass || "").toLowerCase();
      let matchesCategory = false;
      
      if (currentCategory === "all") {
        matchesCategory = true;
      } else if (currentCategory === "tech") {
        matchesCategory = 
          cc.includes("hackathon") || 
          cc.includes("conference") || 
          cc.includes("webinar") || 
          cc.includes("tech");
      } else if (currentCategory === "music") {
        matchesCategory = 
          cc.includes("music") || 
          cc.includes("rhythm");
      } else if (currentCategory === "art") {
        matchesCategory = 
          cc.includes("art") || 
          cc.includes("motion") || 
          cc.includes("expo");
      }

      // Search text check
      const matchesSearch = 
        fest.title.toLowerCase().includes(q) || 
        fest.description.toLowerCase().includes(q) || 
        fest.location.toLowerCase().includes(q) || 
        (fest.eligibility && fest.eligibility.toLowerCase().includes(q)) || 
        (fest.organizer && fest.organizer.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });

    setFilteredEvents(filtered);
  }, [searchText, currentCategory, allEvents]);

  // Card transform states for hover
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xVal = (x / rect.width) - 0.5;
    const yVal = (y / rect.height) - 0.5;
    const rotX = -(yVal * 8).toFixed(2);
    const rotY = (xVal * 8).toFixed(2);
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)";
    card.style.transition = "transform 0.5s ease";
    card.style.boxShadow = "";
    card.style.borderColor = "";
  };

  const handleCardMouseEnter = (e, categoryClass) => {
    const card = e.currentTarget;
    card.style.transition = "transform 0.1s ease";
    
    if (categoryClass === "tech") {
      card.style.boxShadow = "0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 210, 255, 0.15)";
      card.style.borderColor = "rgba(0, 210, 255, 0.3)";
    } else if (categoryClass === "music") {
      card.style.boxShadow = "0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(192, 132, 252, 0.15)";
      card.style.borderColor = "rgba(192, 132, 252, 0.3)";
    } else {
      card.style.boxShadow = "0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(251, 191, 36, 0.15)";
      card.style.borderColor = "rgba(251, 191, 36, 0.3)";
    }
  };

  const handleOpenDetails = (e, fest) => {
    e.preventDefault();
    setSelectedEvent(fest);
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setSearchText("");
    setCurrentCategory("all");
  };

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const addParticipantToOrganizer = (eventId, festObj) => {
    if (typeof window === "undefined" || !festObj) return null;

    const studentEmail = sessionStorage.getItem("userEmail") || "student@university.edu";
    const studentName = sessionStorage.getItem("userName") || "Sarah Chen";
    const emailLower = studentEmail.toLowerCase().trim();

    const college = localStorage.getItem(`studentCollege_${emailLower}`) || "";
    const dept = localStorage.getItem(`studentDept_${emailLower}`) || "";
    const year = localStorage.getItem(`studentYear_${emailLower}`) || "";
    const studentId = localStorage.getItem(`studentId_${emailLower}`) || "";
    const phone = localStorage.getItem(`studentPhone_${emailLower}`) || "";

    let organizerEmail = "";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("customFests_")) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          if (list.some(f => f.id === eventId)) {
            organizerEmail = key.replace("customFests_", "");
            break;
          }
        } catch (e) {}
      }
    }

    const partKey = organizerEmail ? `importedParticipants_${organizerEmail}` : "importedParticipants";
    let partsList = [];
    try {
      partsList = JSON.parse(localStorage.getItem(partKey) || "[]");
    } catch (e) {}

    const existingPart = partsList.find(p => p.email.toLowerCase() === emailLower && p.fest === festObj.title);
    if (existingPart) {
      return existingPart;
    }

    const newPart = {
      name: studentName,
      email: emailLower,
      fest: festObj.title,
      role: "Participant",
      status: "pending",
      certIssued: false,
      certificate_id: `CF-${festObj.title.substring(0, 3).toUpperCase().replace(/\s+/g, "")}-${Math.floor(100000 + Math.random() * 900000)}`,
      college,
      department: dept,
      year,
      studentId,
      phone,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now()
    };
    partsList.push(newPart);
    localStorage.setItem(partKey, JSON.stringify(partsList));
    return newPart;
  };

  const handleRegister = (eventId) => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    const userRole = sessionStorage.getItem("userRole");
    const userId = sessionStorage.getItem("userId");

    if (!isLoggedIn) {
      showToast("Please log in as a student to register.", "error");
      setTimeout(() => {
        window.location.href = `/student-login?source=register&redirect=/browse-fests`;
      }, 1500);
      return;
    }

    if (userRole !== "student") {
      showToast("Organizers cannot register for fests.", "error");
      return;
    }

    const key = getRegisteredFestsKey();
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    if (!current.includes(eventId)) {
      // 1. Database POST request
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(eventId);
      
      if (userId && isUuid) {
        fetch("/api/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, festId: eventId })
        })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to register in database");
          }
          showToast("Registration saved in database!", "success");
        })
        .catch((err) => {
          console.warn("DB Registration failed, using offline storage:", err.message);
        });
      }

      // 2. Perform Local state and localStorage update (as fallback/offline access)
      const updated = [...current, eventId];
      localStorage.setItem(key, JSON.stringify(updated));
      setRegisteredIds(updated);
      
      const festObj = allEvents.find(f => f.id === eventId);
      let partObj = null;
      if (festObj) {
        partObj = addParticipantToOrganizer(eventId, festObj);
      }
      const title = festObj ? festObj.title : "the festival";
      showToast(`Successfully registered for ${title}!`, "success");

      if (partObj) {
        setRegModalData({
          festTitle: festObj.title,
          certificateId: partObj.certificate_id,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + "/verify?id=" + partObj.certificate_id)}`
        });
      }
    }
  };

  return (
    <>
      <Header />

      <main className="browse-page-container">
        
        {/* Title Banner */}
        <section className="browse-title-section">
          <h1>Explore Festivals</h1>
          <p className="section-subtitle">
            Discover high-octane tech fests, artistic displays, and music frequencies across the ecosystem.
          </p>
        </section>

        {/* Search and Filter Row */}
        <section className="search-filter-row">
          
          {/* Search bar */}
          <div className="search-input-wrapper">
            <span className="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search title, venue, or description..." 
              className="form-input search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Category filter tabs */}
          <div className="filter-tabs" id="filter-tabs">
            <button 
              type="button" 
              className={`filter-tab ${currentCategory === "all" ? "active-all" : ""}`}
              onClick={() => setCurrentCategory("all")}
            >
              All Fests
            </button>
            <button 
              type="button" 
              className={`filter-tab ${currentCategory === "tech" ? "active-tech" : ""}`}
              onClick={() => setCurrentCategory("tech")}
            >
              Technology
            </button>
            <button 
              type="button" 
              className={`filter-tab ${currentCategory === "music" ? "active-music" : ""}`}
              onClick={() => setCurrentCategory("music")}
            >
              Music
            </button>
            <button 
              type="button" 
              className={`filter-tab ${currentCategory === "art" ? "active-art" : ""}`}
              onClick={() => setCurrentCategory("art")}
            >
              Art
            </button>
          </div>

        </section>

        {/* Fests Grid */}
        {filteredEvents.length > 0 ? (
          <section className="fests-grid" id="fests-grid" style={{ marginTop: "20px", minHeight: "300px" }}>
            {filteredEvents.map((fest) => {
              // Match formatting classes
              let categoryClass = "tech";
              let tagText = "TECH";
              let btnClass = "btn-tech";
              let dateClass = "date-tech";

              const cc = (fest.categoryClass || "").toLowerCase();
              if (cc.includes("music") || cc.includes("rhythm")) {
                categoryClass = "music";
                tagText = "MUSIC";
                btnClass = "btn-music";
                dateClass = "date-music";
              } else if (cc.includes("art") || cc.includes("motion") || cc.includes("expo")) {
                categoryClass = "art";
                tagText = "ART";
                btnClass = "btn-art";
                dateClass = "date-art";
              }

              return (
                <div 
                  key={fest.id}
                  className="fest-card"
                  id={`card-${fest.id}`}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  onMouseEnter={(e) => handleCardMouseEnter(e, categoryClass)}
                >
                  <div className="fest-image-wrapper">
                    <img src={fest.image} alt={fest.title} className="fest-img" />
                    <span className={`fest-tag tag-${categoryClass}`}>{tagText}</span>
                    <span className="fest-countdown">
                      {fest.id.toString().startsWith("custom-") ? "NEW EVENT" : "FEATURED"}
                    </span>
                  </div>
                  <div className="fest-card-content">
                    <div className="fest-card-header">
                      <h3 className="fest-title">{fest.title}</h3>
                      <div className={`fest-date ${dateClass}`}>
                        <span className="month">{fest.dateMonth}</span>
                        <span className="day">{fest.dateDay}</span>
                      </div>
                    </div>
                    <p className="fest-location">{fest.location}</p>
                    <div className="card-actions" style={{ display: "flex", gap: "10px", marginTop: "auto", width: "100%" }}>
                      <a href="#" className={`view-details-btn ${btnClass}`} style={{ flex: 1, marginTop: 0 }} onClick={(e) => handleOpenDetails(e, fest)}>
                        View Details
                      </a>
                      {registeredIds.includes(fest.id) ? (
                        <button 
                          disabled 
                          className="registered-btn"
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }}>
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span style={{ display: "inline-block", verticalAlign: "middle" }}>Registered</span>
                        </button>
                      ) : (
                        <button 
                          className={`register-fest-btn btn-register-${categoryClass}`}
                          style={{ flex: 1 }}
                          onClick={(e) => {
                            e.preventDefault();
                            handleRegister(fest.id);
                          }}
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          /* Empty state placeholder */
          <div className="empty-state-container" id="empty-state" style={{ display: "block" }}>
            <div className="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <h3 className="empty-state-title">No Festivals Found</h3>
            <p className="empty-state-desc">
              We couldn't find any fests matching your search and category criteria. Try resetting the filters!
            </p>
            <button type="button" className="btn-reset-filters" id="btn-reset-filters" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        )}

      </main>

      <Footer />

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        event={selectedEvent} 
        isRegistered={selectedEvent ? registeredIds.includes(selectedEvent.id) : false}
        onRegister={() => handleRegister(selectedEvent.id)}
      />

      {regModalData && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: "450px", textAlign: "center", padding: "30px" }}>
            <div className="modal-header" style={{ justifyContent: "center", borderBottom: "none", paddingBottom: 0 }}>
              <div style={{ background: "rgba(0, 210, 255, 0.1)", borderRadius: "50%", width: "60px", height: "60px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px auto" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", margin: "0 0 10px 0" }}>Registration Confirmed!</h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: "0 0 20px 0" }}>
              You have successfully registered for <strong>{regModalData.festTitle}</strong>.
            </p>
            
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "20px", marginBottom: "25px" }}>
              <p style={{ margin: "0 0 5px 0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-text-muted)" }}>Your Certificate ID</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                <code style={{ fontSize: "1.1rem", color: "var(--color-cyan)", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.5px" }}>{regModalData.certificateId}</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(regModalData.certificateId);
                    showToast("Certificate ID copied to clipboard!", "success");
                  }}
                  style={{ background: "none", border: "none", color: "var(--color-cyan)", cursor: "pointer", display: "flex", alignItems: "center" }}
                  title="Copy ID"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
              
              <div style={{ background: "white", padding: "10px", display: "inline-block", borderRadius: "8px", marginBottom: "10px" }}>
                <img src={regModalData.qrCodeUrl} alt="QR Code" style={{ width: "130px", height: "130px", display: "block" }} />
              </div>
              <p style={{ margin: "5px 0 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Scan or save this QR Code to verify certificate</p>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0 0 20px 0" }}>
              ⚠️ Please save this information. You can also view it anytime in your dashboard.
            </p>
            
            <button 
              className="btn-modal-close" 
              style={{ width: "100%", padding: "12px", fontWeight: 700, borderRadius: "8px" }}
              onClick={() => setRegModalData(null)}
            >
              Got it, close
            </button>
          </div>
        </div>
      )}

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
    </>
  );
}
