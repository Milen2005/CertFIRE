"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EventModal from "../components/EventModal";
import { PREDEFINED_EVENTS } from "../constants/events";

export default function Home() {
  const [fests, setFests] = useState(PREDEFINED_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Newsletter state
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState("");
  const [subscribeClass, setSubscribeClass] = useState("subscribe-message");
  const [subscribing, setSubscribing] = useState(false);
  
  // Refs for animation
  const heroRef = useRef(null);

  useEffect(() => {
    // 1. Load custom events from localStorage and merge them
    const custom = JSON.parse(localStorage.getItem("customFests") || "[]");
    setFests([...custom, ...PREDEFINED_EVENTS]);

    // 2. Scroll reveal system using Intersection Observer
    const revealOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const revealCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(revealCallback, revealOptions);
    const elements = document.querySelectorAll(".scroll-reveal, .animate-on-scroll");
    elements.forEach(el => observer.observe(el));

    // 3. Parallax scroll effect for hero background
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      if (heroRef.current && scrollPos < window.innerHeight) {
        heroRef.current.style.backgroundPositionY = `calc(30% + ${scrollPos * 0.4}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 4. 3D Tilt Card mouse move handlers
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
  };

  const handleCardMouseEnter = (e) => {
    const card = e.currentTarget;
    card.style.transition = "transform 0.1s ease";
  };

  // 5. Open details Modal
  const openDetails = (e, fest) => {
    e.preventDefault();
    setSelectedEvent(fest);
    setIsModalOpen(true);
  };

  // 6. Handle Newsletter signup submission
  const handleSubscribeSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubscribing(true);
    
    setTimeout(() => {
      setSubscribeStatus("Awesome! Check your inbox for exclusive updates.");
      setSubscribeClass("subscribe-message success");
      setEmail("");
      setSubscribing(false);

      setTimeout(() => {
        setSubscribeStatus("");
        setSubscribeClass("subscribe-message");
      }, 5000);
    }, 1200);
  };

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-bg-overlay"></div>
        <div className="hero-container">
          <h1 className="hero-title animate-reveal" id="hero-heading">Where Energy Meets the Stage</h1>
          <p className="hero-subtitle animate-reveal-delayed" id="hero-desc">
            Register for campus events, participate in fests, and receive verified digital certificates.
          </p>
          <div className="hero-cta animate-reveal-delayed" id="hero-buttons">
            <Link href="/signup" className="cta-primary ripple" id="btn-register-hero">Register Now</Link>
            <Link href="/browse-fests" className="cta-secondary" id="btn-explore-hero">Explore Fests</Link>
          </div>
          
          <div className="light-ray orange-ray"></div>
          <div className="light-ray blue-ray"></div>
          
          <a href="#audience-section" className="scroll-down" id="scroll-arrow" aria-label="Scroll Down">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      {/* Audiences Section */}
      <section className="audience-section scroll-reveal" id="audience-section">
        <div className="section-container audience-grid">
          
          {/* Card 1: For Students */}
          <div 
            className="audience-card hover-glow-cyan animate-on-scroll" 
            id="card-students"
            style={{ cursor: "pointer" }}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            onMouseEnter={handleCardMouseEnter}
            onClick={() => window.location.href = "/student-signup"}
          >
            <div className="audience-card-header">
              <div className="audience-icon-bg bg-cyan">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan">
                  <path d="M22 10V15C22 16.5 19 18 12 18C5 18 2 16.5 2 15V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 2L22 7L12 12L2 7L12 2Z" stroke="currentColor" stroke-width="2" strokeLinecap="round" stroke-linejoin="round"/>
                  <path d="M6 9.5V14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h2 className="audience-title">For Students</h2>
            </div>
            
            <ul className="audience-features">
              <li>
                <svg className="check-icon text-cyan" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span><strong>Verified Credentials:</strong> Instantly shareable on LinkedIn and portfolios.</span>
              </li>
              <li>
                <svg className="check-icon text-cyan" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span><strong>Global Networking:</strong> Connect with like-minded peers and industry leaders.</span>
              </li>
              <li>
                <svg className="check-icon text-cyan" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span><strong>Skill Showcasing:</strong> Build a digital legacy of your festival participation.</span>
              </li>
            </ul>

            <Link href="/student-signup" className="audience-link link-cyan" id="link-students-cta" onClick={(e) => e.stopPropagation()}>
              Start Learning
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Card 2: For Organizers */}
          <div 
            className="audience-card hover-glow-purple animate-on-scroll" 
            id="card-organizers"
            style={{ cursor: "pointer" }}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            onMouseEnter={handleCardMouseEnter}
            onClick={() => window.location.href = "/signup"}
          >
            <div className="audience-card-header">
              <div className="audience-icon-bg bg-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2 className="audience-title">For Organizers</h2>
            </div>
            
            <ul className="audience-features">
              <li>
                <svg className="check-icon text-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span><strong>Automated Delivery:</strong> Instant certificate generation for thousands of participants.</span>
              </li>
              <li>
                <svg className="check-icon text-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span><strong>Participant Tracking:</strong> Real-time dashboard for engagement and attendance.</span>
              </li>
              <li>
                <svg className="check-icon text-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span><strong>Branding Tools:</strong> Custom certificate designs that reflect your brand identity.</span>
              </li>
            </ul>

            <Link href="/signup" className="audience-link link-purple" id="link-organizers-cta" onClick={(e) => e.stopPropagation()}>
              Host an Event
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </Link>
          </div>

        </div>
      </section>

      {/* Featured Upcoming Fests Section */}
      <section className="fests-section scroll-reveal" id="fests-section">
        <div className="section-container">
          <div className="section-header">
            <div className="section-header-text">
              <h2 className="section-title" id="fests-heading">Featured Upcoming Fests</h2>
              <p className="section-subtitle" id="fests-desc">Don't miss out on these headline experiences across technology, art, and music.</p>
            </div>
            <Link href="/browse-fests" className="browse-all-link" id="link-browse-all">
              Browse All 
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Fests Grid */}
          <div className="fests-grid">
            {fests.slice(0, 6).map((fest) => {
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
              } else if (cc.includes("art") || cc.includes("motion")) {
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
                  onMouseEnter={handleCardMouseEnter}
                  style={{
                    boxShadow: "",
                    borderColor: ""
                  }}
                >
                  <div className="fest-image-wrapper">
                    <img src={fest.image} alt={fest.title} className="fest-img" />
                    <span className={`fest-tag tag-${categoryClass}`}>{tagText}</span>
                    <span className="fest-countdown">{fest.id.toString().startsWith("custom-") ? "NEW EVENT" : "4 DAYS LEFT"}</span>
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
                    <a href="#" className={`view-details-btn ${btnClass}`} onClick={(e) => openDetails(e, fest)}>
                      View Details
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Your Path to Certification Section */}
      <section className="path-section scroll-reveal" id="path-section">
        <div className="section-container">
          <h2 className="section-center-title" id="path-heading">Your Path to Certification</h2>
          
          <div className="path-grid">
            {/* Step 1 */}
            <div className="path-step animate-on-scroll" id="path-step-1">
              <div className="path-icon-container bg-glow-cyan">
                <svg className="path-icon text-cyan" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">1. Discover</h3>
              <p className="step-description">Find fests that match your passion and interests.</p>
            </div>

            {/* Step 2 */}
            <div className="path-step animate-on-scroll" id="path-step-2">
              <div className="path-icon-container bg-glow-purple">
                <svg className="path-icon text-purple" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5V7M9 5V7M3 12H21M4 18H20C21.1046 18 22 17.1046 22 16V8C22 6.89543 21.1046 6 20 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">2. Register</h3>
              <p className="step-description">Secure your spot with our seamless registration process.</p>
            </div>

            {/* Step 3 */}
            <div className="path-step animate-on-scroll" id="path-step-3">
              <div className="path-icon-container bg-glow-gold">
                <svg className="path-icon text-gold" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9986 18.1099 22.6826 17.2512 22.1072 16.5744C21.5319 15.8975 20.7359 15.4485 19.86 15.31M16 3.13C16.8604 3.2683 17.6405 3.7087 18.2038 4.3732C18.7672 5.0377 19.0768 5.8812 19.0768 6.75C19.0768 7.6188 18.7672 8.4623 18.2038 9.1268C17.6405 9.7913 16.8604 10.2317 16 10.37M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">3. Participate</h3>
              <p className="step-description">Join workshops, contests, and live performances.</p>
            </div>

            {/* Step 4 */}
            <div className="path-step animate-on-scroll" id="path-step-4">
              <div className="path-icon-container bg-glow-teal">
                <svg className="path-icon text-teal" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 11L11 13L15 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">4. Get Certified</h3>
              <p className="step-description">Receive verified digital certificates for your achievements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stay in the Loop Section */}
      <section className="newsletter-section scroll-reveal" id="newsletter-section">
        <div className="section-container">
          <div className="newsletter-card animate-on-scroll" id="card-newsletter">
            <div className="newsletter-glow"></div>
            <h2 className="newsletter-title" id="newsletter-heading">Stay in the Loop</h2>
            <p className="newsletter-subtitle" id="newsletter-desc">
              Join 15k+ innovators getting early access to festival discovery and certification updates.
            </p>
            <form className="newsletter-form" id="form-subscribe" onSubmit={handleSubscribeSubmit}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                required 
                className="newsletter-input" 
                id="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="newsletter-submit-btn ripple" id="btn-subscribe" disabled={subscribing}>
                {subscribing ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            {subscribeStatus && <div className={subscribeClass} id="subscribe-status">{subscribeStatus}</div>}
          </div>
        </div>
      </section>

      <Footer />

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        event={selectedEvent} 
      />
    </>
  );
}
