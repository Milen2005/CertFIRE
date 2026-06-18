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

  useEffect(() => {
    // Load custom events from localStorage and merge them
    const custom = JSON.parse(localStorage.getItem("customFests") || "[]");
    const normalizedCustom = custom.map((c) => ({
      ...c,
      categoryClass: c.categoryClass || "hackathon"
    }));
    const combined = [...normalizedCustom, ...PREDEFINED_EVENTS];
    setAllEvents(combined);
    setFilteredEvents(combined);
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
                    <a href="#" className={`view-details-btn ${btnClass}`} onClick={(e) => handleOpenDetails(e, fest)}>
                      View Details
                    </a>
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
      />
    </>
  );
}
