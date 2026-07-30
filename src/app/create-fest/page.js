"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function CreateFest() {
  const router = useRouter();

  // Basic Form States
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("hackathon");
  const [description, setDescription] = useState("");
  const [bannerSrc, setBannerSrc] = useState("");
  
  // Event Details States
  const [date, setDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");

  // Participation Details States
  const [maxParticipants, setMaxParticipants] = useState("");
  const [fee, setFee] = useState("");
  const [eligibility, setEligibility] = useState("");

  // Contact States
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");

  // UI state
  const [toasts, setToasts] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Authentication Check
    if (sessionStorage.getItem("isLoggedIn") !== "true") {
      showToast("Authentication required. Redirecting to login...", "error");
      setTimeout(() => {
        router.push("/login?redirect=/create-fest");
      }, 1500);
      return;
    }

    // Load draft if editing
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const draftId = params.get("id") || params.get("draftId");
      if (draftId) {
        const userEmail = sessionStorage.getItem("userEmail") || "alex.rivera@certfire.io";
        const customFests = JSON.parse(localStorage.getItem(`customFests_${userEmail}`) || "[]");
        const draft = customFests.find(f => f.id === draftId);
        if (draft) {
          setTitle(draft.title || "");
          setCategory(draft.categoryClass || "hackathon");
          setDescription(draft.description || "");
          setBannerSrc(draft.image || "");
          
          if (draft.rawDate) setDate(draft.rawDate);
          if (draft.rawDeadline) setDeadline(draft.rawDeadline);
          if (draft.rawStartTime) setStartTime(draft.rawStartTime);
          if (draft.rawEndTime) setEndTime(draft.rawEndTime);
          
          setVenue(draft.location || "");
          setMaxParticipants(draft.seats ? String(draft.seats).split(" ")[0] : "");
          setFee(draft.fee ? String(draft.fee).replace(/[^0-9]/g, "") : "");
          setEligibility(draft.eligibility || "");
          
          if (draft.rawOrganizerName) setOrganizerName(draft.rawOrganizerName);
          if (draft.rawOrganizerEmail) setOrganizerEmail(draft.rawOrganizerEmail);
          if (draft.rawOrganizerPhone) setOrganizerPhone(draft.rawOrganizerPhone);
          
          showToast("Loaded draft details.", "info");
        }
      }
    }
  }, [router]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDropzoneClick = (e) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setBannerSrc(reader.result);
        showToast("Banner image uploaded successfully.", "info");
      };
    } else {
      showToast("Please upload an image file.", "error");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemovePreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerSrc("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast("Banner image removed.", "info");
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    
    if (sessionStorage.getItem("isLoggedIn") !== "true") {
      showToast("Authentication required to save draft. Redirecting...", "error");
      setTimeout(() => {
        router.push("/login?redirect=/create-fest");
      }, 1500);
      return;
    }

    if (!title.trim()) {
      showToast("Please enter an Event Title to save as draft.", "error");
      return;
    }

    // Form formats
    const dateParts = date ? date.split("-") : ["2024", "10", "15"];
    const monthIndex = parseInt(dateParts[1], 10) - 1;
    const dayVal = dateParts[2] || "15";
    const monthsFull = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthStr = monthsFull[monthIndex] || "OCT";
    const dayStr = String(parseInt(dayVal, 10)).padStart(2, "0");

    const formatTime = (timeString) => {
      if (!timeString) return "--:--";
      const parts = timeString.split(":");
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    };
    const timeRangeStr = startTime && endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : "TBD";

    const formatDateString = (dateString) => {
      if (!dateString) return "N/A";
      const parts = dateString.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
    };

    const categoryMap = {
      hackathon: "TECH",
      "music-fest": "MUSIC",
      "art-expo": "ART",
      conference: "TECH",
      webinar: "TECH"
    };
    const mappedCategory = categoryMap[category] || "TECH";

    let draftId = "custom-" + Date.now();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      draftId = params.get("id") || params.get("draftId") || draftId;
    }

    const draftFest = {
      id: draftId,
      title,
      category: mappedCategory,
      categoryClass: category, 
      dateMonth: monthStr,
      dateDay: dayStr,
      location: venue || "TBD",
      image: bannerSrc || "/assets/hero_bg.png",
      description: description.trim(),
      timeRange: timeRangeStr,
      deadline: deadline ? formatDateString(deadline) : "N/A",
      seats: (maxParticipants || "500") + " Seats",
      fee: !fee || fee === "0" ? "Free Entry" : "₹" + fee + " INR",
      eligibility: eligibility.trim() || "Open to all participants",
      organizer: organizerName.trim() + " (" + organizerEmail.trim() + ")",
      isDraft: true,
      
      rawDate: date,
      rawDeadline: deadline,
      rawStartTime: startTime,
      rawEndTime: endTime,
      rawOrganizerName: organizerName,
      rawOrganizerEmail: organizerEmail,
      rawOrganizerPhone: organizerPhone
    };

    const userEmail = sessionStorage.getItem("userEmail") || "alex.rivera@certfire.io";
    const customFests = JSON.parse(localStorage.getItem(`customFests_${userEmail}`) || "[]");
    
    const existingIdx = customFests.findIndex(f => f.id === draftId);
    if (existingIdx !== -1) {
      customFests[existingIdx] = draftFest;
    } else {
      customFests.unshift(draftFest);
    }
    
    localStorage.setItem(`customFests_${userEmail}`, JSON.stringify(customFests));

    // Database Sync
    const organiserId = sessionStorage.getItem("userId");
    fetch("/api/fests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description.trim(),
        date: date || new Date().toISOString().split("T")[0],
        category: mappedCategory,
        venue: venue || "TBD",
        capacity: maxParticipants ? parseInt(maxParticipants, 10) : 500,
        image: bannerSrc || "",
        isDraft: true,
        organiserId
      })
    })
    .then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to save draft to database");
      showToast("Draft successfully saved to database!", "success");
    })
    .catch((err) => {
      console.warn("DB draft save failed, saved locally:", err.message);
      showToast("Draft saved locally (offline mode).", "info");
    });

    setTimeout(() => {
      router.push("/organizer-dashboard");
    }, 1500);
  };

  const handlePublishSubmit = (e) => {
    e.preventDefault();

    if (sessionStorage.getItem("isLoggedIn") !== "true") {
      showToast("Authentication required to publish event. Redirecting...", "error");
      setTimeout(() => {
        router.push("/login?redirect=/create-fest");
      }, 1500);
      return;
    }

    if (!title || !date || !venue) {
      showToast("Please fill out all required fields.", "error");
      return;
    }

    // Parse date to Month & Day (timezone-safe parse)
    const dateParts = date.split("-");
    const monthIndex = parseInt(dateParts[1], 10) - 1;
    const dayVal = dateParts[2];
    const monthsFull = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthStr = monthsFull[monthIndex] || "OCT";
    const dayStr = String(parseInt(dayVal, 10)).padStart(2, "0");

    // Time formatter helper
    const formatTime = (timeString) => {
      if (!timeString) return "--:--";
      const parts = timeString.split(":");
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    };
    const startFormatted = formatTime(startTime);
    const endFormatted = formatTime(endTime);
    const timeRangeStr = `${startFormatted} - ${endFormatted}`;

    // Date string formatter helper
    const formatDateString = (dateString) => {
      if (!dateString) return "N/A";
      const parts = dateString.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
    };
    const deadlineFormatted = formatDateString(deadline);

    // Category mapping
    const categoryMap = {
      hackathon: "TECH",
      "music-fest": "MUSIC",
      "art-expo": "ART",
      conference: "TECH",
      webinar: "TECH"
    };
    const mappedCategory = categoryMap[category] || "TECH";

    let festId = "custom-" + Date.now();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      festId = params.get("id") || params.get("draftId") || festId;
    }

    // Create new fest card object
    const newFest = {
      id: festId,
      title,
      category: mappedCategory,
      categoryClass: category, 
      dateMonth: monthStr,
      dateDay: dayStr,
      location: venue,
      image: bannerSrc || "/assets/hero_bg.png",
      description: description.trim(),
      timeRange: timeRangeStr,
      deadline: deadlineFormatted,
      seats: (maxParticipants || "500") + " Seats",
      fee: !fee || fee === "0" ? "Free Entry" : "₹" + fee + " INR",
      eligibility: eligibility.trim() || "Open to all participants",
      organizer: organizerName.trim() + " (" + organizerEmail.trim() + ")",
      isDraft: false,
      
      // Raw form values
      rawDate: date,
      rawDeadline: deadline,
      rawStartTime: startTime,
      rawEndTime: endTime,
      rawOrganizerName: organizerName,
      rawOrganizerEmail: organizerEmail,
      rawOrganizerPhone: organizerPhone
    };

    // Retrieve and append to custom fests list
    const userEmail = sessionStorage.getItem("userEmail") || "alex.rivera@certfire.io";
    const customFests = JSON.parse(localStorage.getItem(`customFests_${userEmail}`) || "[]");
    
    const existingIdx = customFests.findIndex(f => f.id === festId);
    if (existingIdx !== -1) {
      customFests[existingIdx] = newFest;
    } else {
      customFests.unshift(newFest);
    }
    localStorage.setItem(`customFests_${userEmail}`, JSON.stringify(customFests));

    // Database Sync
    const organiserId = sessionStorage.getItem("userId");
    fetch("/api/fests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description.trim(),
        date: date,
        category: mappedCategory,
        venue: venue,
        capacity: maxParticipants ? parseInt(maxParticipants, 10) : 500,
        image: bannerSrc || "",
        isDraft: false,
        organiserId
      })
    })
    .then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to publish event in database");
      showToast("Festival successfully published to database!", "success");
    })
    .catch((err) => {
      console.warn("DB event publish failed, saved locally:", err.message);
      showToast("Event published locally (offline mode).", "info");
    });

    // Create system notification for all students (global key)
    const globalNotifications = JSON.parse(localStorage.getItem("systemNotifications") || "[]");
    globalNotifications.unshift({
      id: Date.now(),
      message: `📢 New Event: "${title}" has been published by ${organizerName || "Organizer"}!`,
      date: new Date().toLocaleDateString(),
      unread: true
    });
    localStorage.setItem("systemNotifications", JSON.stringify(globalNotifications));

    // Also notify the organizer dashboard logs (organizer specific key)
    const orgNotifications = JSON.parse(localStorage.getItem(`systemNotifications_${userEmail}`) || "[]");
    orgNotifications.unshift({
      id: Date.now(),
      message: `📢 Event Published: "${title}" has been successfully published!`,
      date: new Date().toLocaleDateString(),
      unread: true
    });
    localStorage.setItem(`systemNotifications_${userEmail}`, JSON.stringify(orgNotifications));

    showToast("Festival successfully published into the ecosystem!", "success");

    // Redirect to organizer dashboard
    setTimeout(() => {
      router.push("/organizer-dashboard");
    }, 2000);
  };

  return (
    <>
      <Header />

      <main className="create-fest-container">
        
        {/* Title & Subtitle Banner */}
        <section className="create-title-section">
          <h1 className="page-title" id="create-heading">Create Fest</h1>
          <p className="page-subtitle" id="create-desc">
            Design your next high-octane tech festival. Fill in the details to launch your event into the CertFIRE ecosystem.
          </p>
        </section>

        {/* Create Fest Form */}
        <form id="form-create-fest" className="fest-form-grid" onSubmit={handlePublishSubmit}>
          
          {/* SECTION 1: Basic Information */}
          <fieldset className="form-card card-border-cyan" id="section-basic-info">
            <legend className="form-card-header">
              <span className="form-card-icon text-cyan">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <h2>Basic Information</h2>
            </legend>

            <div className="form-group">
              <label htmlFor="event-title">Event Title</label>
              <input 
                type="text" 
                id="event-title" 
                placeholder="e.g. CyberNight Hackathon 2024" 
                required 
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-category">Category</label>
              <div className="select-wrapper">
                <select 
                  id="event-category" 
                  required 
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="hackathon">Hackathon</option>
                  <option value="music-fest">Music Fest</option>
                  <option value="art-expo">Art Expo</option>
                  <option value="conference">Conference</option>
                  <option value="webinar">Webinar</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-description">Description</label>
              <textarea 
                id="event-description" 
                placeholder="Describe the energy, the challenges, and the rewards..." 
                rows="5" 
                required 
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Banner Image Upload */}
            <div className="form-group">
              <div className="upload-header-row">
                <label>Banner Image</label>
              </div>
              
              <div 
                className={`upload-dropzone ${bannerSrc ? "has-preview" : ""}`}
                id="banner-dropzone"
                onClick={handleDropzoneClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  borderColor: isDragOver ? "var(--color-cyan)" : "",
                  boxShadow: isDragOver ? "0 0 20px var(--color-cyan-glow)" : ""
                }}
              >
                <div className="upload-mockup-bg"></div>
                <div className="upload-content">
                  <span className="upload-icon text-cyan">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <p className="upload-text">Click to upload banner</p>
                  <p className="upload-subtext">Recommended: 1920x1080px (Max 5MB)</p>
                  <input 
                    type="file" 
                    id="banner-file-input" 
                    accept="image/*" 
                    className="file-input-hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
                
                {/* Preview wrapper */}
                {bannerSrc && (
                  <div className="upload-preview-container active" id="upload-preview-container">
                    <img src={bannerSrc} alt="Banner Preview" id="upload-preview-img" />
                    <button type="button" className="remove-preview-btn" id="btn-remove-preview" aria-label="Remove Image" onClick={handleRemovePreview}>
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </fieldset>

          {/* SECTION 2: Event Details */}
          <fieldset className="form-card card-border-purple" id="section-event-details">
            <legend className="form-card-header">
              <span className="form-card-icon text-purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <h2>Event Details</h2>
            </legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-date">Date</label>
                <input 
                  type="date" 
                  id="event-date" 
                  required 
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="event-deadline">Registration Deadline</label>
                <input 
                  type="date" 
                  id="event-deadline" 
                  required 
                  className="form-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-start-time">Start Time</label>
                <input 
                  type="time" 
                  id="event-start-time" 
                  required 
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="event-end-time">End Time</label>
                <input 
                  type="time" 
                  id="event-end-time" 
                  required 
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-venue">Venue / Link</label>
              <input 
                type="text" 
                id="event-venue" 
                placeholder="Physical location or Virtual Meeting link" 
                required 
                className="form-input"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
          </fieldset>

          {/* SECTION 3: Participation Details */}
          <fieldset className="form-card card-border-gold" id="section-participation-details">
            <legend className="form-card-header">
              <span className="form-card-icon text-gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <h2>Participation Details</h2>
            </legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-max-participants">Max Participants</label>
                <input 
                  type="number" 
                  id="event-max-participants" 
                  placeholder="500" 
                  className="form-input"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="event-fee">Registration Fee (INR)</label>
                <input 
                  type="text" 
                  id="event-fee" 
                  placeholder="0" 
                  className="form-input"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-eligibility">Eligibility Criteria</label>
              <textarea 
                id="event-eligibility" 
                placeholder="e.g. Open to all undergrad students globally..." 
                rows="3" 
                className="form-input"
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
              ></textarea>
            </div>
          </fieldset>

          {/* SECTION 4: Contact Information */}
          <fieldset className="form-card card-border-teal" id="section-contact-info">
            <legend className="form-card-header">
              <span className="form-card-icon text-teal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <h2>Contact Information</h2>
            </legend>

            <div className="form-group">
              <label htmlFor="organizer-name">Organizer Name</label>
              <input 
                type="text" 
                id="organizer-name" 
                placeholder="John Doe or Organization Name" 
                required 
                className="form-input"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="organizer-email">Email Address</label>
                <input 
                  type="email" 
                  id="organizer-email" 
                  placeholder="contact@certfire.io" 
                  required 
                  className="form-input"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="organizer-phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="organizer-phone" 
                  placeholder="+91 99881 22334" 
                  className="form-input"
                  value={organizerPhone}
                  onChange={(e) => setOrganizerPhone(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Action buttons at the end of the form */}
          <div className="form-actions" style={{ justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" className="btn-action-secondary" id="btn-save-draft" onClick={handleSaveDraft}>
              Save Draft
            </button>
            <button type="submit" className="btn-action-primary ripple" id="btn-publish-event">
              Publish Event
            </button>
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

      <Footer />
    </>
  );
}
