"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PREDEFINED_EVENTS } from "../../constants/events";
import EventModal from "../../components/EventModal";

// Skill mapping for each event to verify skills dynamically
const SKILLS_MAP = {
  "cyber-summit": ["Cybersecurity", "Network Defenses", "Cloud Security"],
  "neon-rhythms": ["Sound Production", "Creative Direction", "Event Management"],
  "digital-motion": ["Creative Coding", "UI/UX Design", "Motion Graphics"],
  "code-blast": ["Fullstack Web", "Git Collaboration", "Public Speaking"]
};

export default function StudentDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const getStudentParticipantRecord = (festTitle) => {
    const email = typeof window !== "undefined" ? sessionStorage.getItem("userEmail") : "";
    if (!email) return null;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("importedParticipants_") || key === "importedParticipants")) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          const found = list.find(p => p.email?.toLowerCase() === email.toLowerCase() && p.fest?.toLowerCase() === festTitle?.toLowerCase());
          if (found) return found;
        } catch (e) {}
      }
    }
    return null;
  };

  const getRegisteredFestsKey = () => {
    const email = typeof window !== "undefined" ? sessionStorage.getItem("userEmail") : "";
    return email ? `registeredFests_${email.toLowerCase().trim()}` : "registeredFests";
  };

  const [userName, setUserName] = useState("Alex");
  const [registeredIds, setRegisteredIds] = useState([]);
  const [registeredFests, setRegisteredFests] = useState([]);
  const [allEventsList, setAllEventsList] = useState([]);
  const [selectedPassFest, setSelectedPassFest] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDetailsEvent, setSelectedDetailsEvent] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [regModalData, setRegModalData] = useState(null);
  const [selectedQrCode, setSelectedQrCode] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Certificate viewing states
  const [selectedCert, setSelectedCert] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certWritings, setCertWritings] = useState(null);
  const [certImageState, setCertImageState] = useState(null);
  const [certTemplate, setCertTemplate] = useState("achievement");

  // Settings tab states
  const [studentFullName, setStudentFullName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentCollege, setStudentCollege] = useState("");
  const [studentDept, setStudentDept] = useState("");
  const [studentYear, setStudentYear] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentProfilePic, setStudentProfilePic] = useState("");
  const [studentUsername, setStudentUsername] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  // Time remaining states for countdowns
  const [neonCountdown, setNeonCountdown] = useState({ days: "02", hours: "14", mins: "38" });
  const [codeBlastCountdown, setCodeBlastCountdown] = useState({ days: "39", hours: "08", mins: "12" });

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    const userRole = sessionStorage.getItem("userRole");
    const userEmail = sessionStorage.getItem("userEmail");

    if (!isLoggedIn || userRole !== "student" || !userEmail) {
      sessionStorage.clear();
      router.push("/student-login");
      return;
    }

    const emailLower = userEmail.toLowerCase().trim();
    const storedPassword = localStorage.getItem(`studentPassword_${emailLower}`);
    if (!storedPassword) {
      sessionStorage.clear();
      router.push("/student-login?source=register");
      return;
    }

    setAuthorized(true);

    // Hash change handler to update tab
    const handleHash = () => {
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash === "#certificates") {
          setActiveTab("certificates");
        } else if (hash === "#my-fests" || hash === "#fests") {
          setActiveTab("my-fests");
        } else if (hash === "#settings" || hash === "#profile") {
          setActiveTab("settings");
        } else {
          setActiveTab("overview");
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);

    // 1. Fetch user name from session
    const name = sessionStorage.getItem("userName");
    if (name) {
      setUserName(name.split(" ")[0]);
    }

    // Prefill settings states
    setStudentEmail(emailLower);
    setStudentFullName(localStorage.getItem(`studentName_${emailLower}`) || name || "");
    setStudentUsername(localStorage.getItem(`studentUsername_${emailLower}`) || "");
    setStudentPhone(localStorage.getItem(`studentPhone_${emailLower}`) || "");
    setStudentCollege(localStorage.getItem(`studentCollege_${emailLower}`) || "");
    setStudentDept(localStorage.getItem(`studentDept_${emailLower}`) || "");
    setStudentYear(localStorage.getItem(`studentYear_${emailLower}`) || "");
    setStudentId(localStorage.getItem(`studentId_${emailLower}`) || "");
    setStudentProfilePic(localStorage.getItem(`studentProfilePic_${emailLower}`) || "");

    // 2. Manage registered fests
    // We now start with empty array by default (0 events, 0% progress) as requested by the user.
    const registered = JSON.parse(localStorage.getItem(getRegisteredFestsKey()) || "[]");
    setRegisteredIds(registered);

    // Combine predefined and custom fests
    const getCustomFests = () => {
      const list = [];
      const seenIds = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("customFests_")) {
          try {
            const listItems = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(listItems)) {
              listItems.forEach(item => {
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
    const combined = [...custom, ...PREDEFINED_EVENTS];
    setAllEventsList(combined);
    
    // Filter to only registered fests
    const filtered = combined.filter((fest) => registered.includes(fest.id));
    setRegisteredFests(filtered);

    // Fetch from database API
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch(`/api/registrations?userId=${userId}`)
        .then(async (r) => {
          if (!r.ok) return;
          const data = await r.json();
          if (Array.isArray(data)) {
            const dbRegisteredIds = data.map(reg => reg.fest_id);
            const dbRegisteredFests = data.map(reg => {
              const f = reg.fests;
              if (!f) return null;
              return {
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
              };
            }).filter(Boolean);

            setRegisteredIds(prev => {
              const combinedSet = new Set([...prev, ...dbRegisteredIds]);
              return Array.from(combinedSet);
            });

            setRegisteredFests(prev => {
              const seen = new Set(prev.map(f => f.id));
              const result = [...prev];
              dbRegisteredFests.forEach(f => {
                if (!seen.has(f.id)) {
                  seen.add(f.id);
                  result.push(f);
                }
              });
              return result;
            });
          }
        })
        .catch(err => console.warn("Failed to load registrations from Supabase:", err));
    }

    // 3. Dynamic Live Countdown Timer
    const now = new Date().getTime();
    const neonTarget = now + (2 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000) + (38 * 60 * 1000);
    const codeBlastTarget = now + (39 * 24 * 60 * 60 * 1000) + (8 * 60 * 60 * 1000) + (12 * 60 * 1000);

    const interval = setInterval(() => {
      const current = new Date().getTime();
      
      // Neon Rhythms Countdown
      const neonDiff = neonTarget - current;
      if (neonDiff > 0) {
        const d = Math.floor(neonDiff / (1000 * 60 * 60 * 24));
        const h = Math.floor((neonDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((neonDiff % (1000 * 60 * 60)) / (1000 * 60));
        setNeonCountdown({
          days: d.toString().padStart(2, "0"),
          hours: h.toString().padStart(2, "0"),
          mins: m.toString().padStart(2, "0")
        });
      }

      // CodeBlast Countdown
      const cbDiff = codeBlastTarget - current;
      if (cbDiff > 0) {
        const d = Math.floor(cbDiff / (1000 * 60 * 60 * 24));
        const h = Math.floor((cbDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((cbDiff % (1000 * 60 * 60)) / (1000 * 60));
        setCodeBlastCountdown({
          days: d.toString().padStart(2, "0"),
          hours: h.toString().padStart(2, "0"),
          mins: m.toString().padStart(2, "0")
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("hashchange", handleHash);
    };
  }, [router]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const emailLower = studentEmail.toLowerCase().trim();
    if (!emailLower) return;
    
    // Update local storage
    localStorage.setItem(`studentName_${emailLower}`, studentFullName.trim());
    localStorage.setItem(`studentUsername_${emailLower}`, studentUsername.trim());
    localStorage.setItem(`studentPhone_${emailLower}`, studentPhone.trim());
    localStorage.setItem(`studentCollege_${emailLower}`, studentCollege.trim());
    localStorage.setItem(`studentDept_${emailLower}`, studentDept.trim());
    localStorage.setItem(`studentYear_${emailLower}`, studentYear.trim());
    localStorage.setItem(`studentId_${emailLower}`, studentId.trim());
    if (studentProfilePic) {
      localStorage.setItem(`studentProfilePic_${emailLower}`, studentProfilePic);
    }
    
    sessionStorage.setItem("userName", studentFullName.trim());
    setUserName(studentFullName.trim().split(" ")[0]);

    // DB sync
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name: studentFullName.trim(), email: emailLower })
      })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to update profile in database");
        showToast("Profile successfully synchronized with database!", "success");
      })
      .catch((err) => {
        console.warn("DB Profile update failed, updated locally:", err.message);
      });
    }
    
    showToast("Settings successfully updated!", "success");
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    const emailLower = studentEmail.toLowerCase().trim();
    if (!emailLower) return;

    const storedPassword = localStorage.getItem(`studentPassword_${emailLower}`);
    if (currentPassword !== storedPassword) {
      showToast("Current password does not match.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      showToast("New password must meet the security requirements.", "error");
      return;
    }
    
    localStorage.setItem(`studentPassword_${emailLower}`, newPassword);
    showToast("Password successfully changed!", "success");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleShareCertificate = (certName) => {
    showToast(`Shared "${certName}" certificate successfully to LinkedIn!`, "success");
  };

  const handleViewPass = (fest) => {
    setSelectedPassFest(fest);
    setShowPassModal(true);
  };

  const handlePrintPass = () => {
    showToast("Generating ticket download pass...", "info");
    setTimeout(() => {
      window.print();
    }, 1000);
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
    const key = getRegisteredFestsKey();
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    if (!current.includes(eventId)) {
      const updated = [...current, eventId];
      localStorage.setItem(key, JSON.stringify(updated));
      setRegisteredIds(updated);
      
      const festObj = allEventsList.find(f => f.id === eventId);
      let partObj = null;
      if (festObj) {
        setRegisteredFests(prev => [...prev, festObj]);
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

  // Dynamic calculations based on user participation
  const registeredCount = registeredIds.length;
  const totalEventsCount = allEventsList.length || 1;
  const progressPercent = Math.min(Math.round((registeredCount / totalEventsCount) * 100), 100);

  // Dynamic verified skills
  const getVerifiedSkills = () => {
    const skills = [];
    registeredIds.forEach((id) => {
      const eventSkills = SKILLS_MAP[id] || ["Problem Solving", "Teamwork"];
      eventSkills.forEach((skill) => {
        if (!skills.includes(skill)) {
          skills.push(skill);
        }
      });
    });
    return skills;
  };
  const verifiedSkills = getVerifiedSkills();

  // Dynamic earned certificates
  const getEarnedCertificates = () => {
    const email = typeof window !== "undefined" ? sessionStorage.getItem("userEmail") : "";
    if (!email) return [];

    const certs = [];
    if (typeof window === "undefined") return certs;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("importedParticipants_") || key === "importedParticipants")) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(list)) {
            list.forEach(p => {
              if (p && p.email?.toLowerCase() === email.toLowerCase() && (p.certIssued === true || p.status === "issued")) {
                const template = getTemplateForEvent(p.fest);
                let certTemplate = template;
                
                const savedConfig = localStorage.getItem(`customCert_${p.email?.toLowerCase()}_${p.fest}`) || localStorage.getItem(`customCert_${p.email}_${p.fest}`);
                if (savedConfig) {
                  try {
                    const config = JSON.parse(savedConfig);
                    if (config.template) {
                      certTemplate = config.template;
                    }
                  } catch (e) {}
                }

                let badgeColorClass = "bg-cyan-glow";
                let strokeColor = "var(--color-cyan)";
                let title = "Certificate of Achievement";

                if (certTemplate === "appreciation") {
                  badgeColorClass = "bg-purple-glow";
                  strokeColor = "var(--color-purple)";
                  title = "Certificate of Appreciation";
                } else if (certTemplate === "completion") {
                  badgeColorClass = "bg-glow-teal";
                  strokeColor = "var(--color-teal)";
                  title = "Certificate of Completion";
                } else if (certTemplate === "recognition") {
                  badgeColorClass = "bg-glow-pink";
                  strokeColor = "var(--color-pink)";
                  title = "Certificate of Recognition";
                }

                const event = allEventsList.find(e => e.title?.toLowerCase() === p.fest?.toLowerCase());
                const image = event?.image || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=256";

                certs.push({
                  id: p.certificate_id || p.id || `CF-${Math.floor(Math.random() * 1000000)}`,
                  title,
                  festTitle: p.fest,
                  festName: p.fest,
                  image,
                  badgeColorClass,
                  strokeColor,
                  template: certTemplate
                });
              }
            });
          }
        } catch (e) {}
      }
    }

    const seen = new Set();
    return certs.filter(c => {
      const duplicate = seen.has(c.id);
      seen.add(c.id);
      return !duplicate;
    });
  };
  const earnedCerts = getEarnedCertificates();

  const getDisplayCertificates = () => {
    const list = [...earnedCerts];
    
    // For each registered festival, check if it's already in earnedCerts
    registeredFests.forEach((fest) => {
      const alreadyEarned = earnedCerts.some(c => c.festTitle?.toLowerCase() === fest.title?.toLowerCase());
      if (!alreadyEarned) {
        list.push({
          id: `pending-${fest.id}`,
          title: "Certificate of Participation",
          festTitle: fest.title,
          festName: fest.title,
          image: fest.image || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=256",
          status: "pending",
          badgeColorClass: "bg-glow-muted",
          strokeColor: "var(--color-text-muted)"
        });
      }
    });
    
    return list;
  };
  const displayCerts = getDisplayCertificates();

  // Dynamic locked slots (ensure we show at least 1, up to 3 total slots)
  const lockedSlotsCount = Math.max(1, 3 - displayCerts.length);
  const lockedSlots = Array.from({ length: lockedSlotsCount });

  // Dynamic chart bars
  const chartBars = [20, 35, 60, 95, 45, 30, 50].map((baseHeight, index) => {
    const isActive = registeredCount > 0 && index < (registeredCount * 2);
    const height = registeredCount === 0 ? Math.round(baseHeight * 0.2) : baseHeight;
    return { height: `${height}%`, isActive };
  });

  // Dynamic recommended events (filter out registered events)
  const recommendedEvents = allEventsList.filter((fest) => !registeredIds.includes(fest.id));

  // Certificate Studio viewer helper functions
  const getTemplateForEvent = (festName) => {
    const name = (festName || "").toLowerCase();
    if (name.includes("pulsefest") || name.includes("music") || name.includes("rhythm") || name.includes("neon")) {
      return "appreciation";
    } else if (name.includes("digital") || name.includes("art") || name.includes("motion")) {
      return "recognition";
    } else if (name.includes("sprint") || name.includes("completion") || name.includes("blast")) {
      return "completion";
    }
    return "achievement"; // default
  };

  const useDefaultCertWritings = (cert, template) => {
    let title = "CERTIFICATE OF ACHIEVEMENT";
    let subtitle = "OF ACHIEVEMENT";
    let desc = `for successfully demonstrating outstanding skills, active collaboration, and technical proficiency during the event assemblies.`;
    
    if (template === "appreciation") {
      title = "CERTIFICATE OF APPRECIATION";
      subtitle = "OF APPRECIATION";
      desc = `is hereby proudly presented to acknowledge the outstanding efforts and dedicated service rendered during the event.`;
    } else if (template === "completion") {
      title = "CERTIFICATE OF COMPLETION";
      subtitle = "OF COMPLETION";
      desc = `certifies that they have successfully met all course requirements and challenges of the event and is awarded this credential.`;
    } else if (template === "recognition") {
      title = "CERTIFICATE OF RECOGNITION";
      subtitle = "OF RECOGNITION";
      desc = `for demonstrating exceptional competency, dedication, and professional excellence in their respective role.`;
    }

    const displayName = sessionStorage.getItem("userName") || "Alex Chen";

    setCertWritings({
      title,
      subtitle,
      presentationText: template === "completion" ? "THIS CERTIFIES THAT" : "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
      recipientName: displayName,
      description: desc,
      date: new Date().toLocaleDateString(),
      sig1Name: "Alex Rivera",
      sig1Title: "Festival Organizer",
      sig2Name: "CertFIRE Secure",
      sig2Title: "Verified Protocol"
    });
    setCertImageState({ visible: false });
  };

  const handleViewCert = (cert) => {
    const globalTpl = localStorage.getItem("globalSelectedTemplate");
    const template = globalTpl || getTemplateForEvent(cert.festTitle || cert.title);
    setCertTemplate(template);
    
    const loggedInEmail = sessionStorage.getItem("userEmail") || "";
    const loggedInName = sessionStorage.getItem("userName") || "";
    const cleanFest = cert.festTitle || cert.title;

    let savedConfig = null;
    if (loggedInEmail) {
      savedConfig = localStorage.getItem(`customCert_${loggedInEmail}_${cleanFest}`);
    }
    if (!savedConfig && loggedInName) {
      // fallback to name matching
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("customCert_") && key.endsWith(`_${cleanFest}`)) {
          savedConfig = localStorage.getItem(key);
          break;
        }
      }
    }

    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setCertWritings(config.writings);
        setCertTemplate(config.template || template);
        setCertImageState({
          url: config.participantImage,
          scale: config.participantImageScale,
          x: config.participantImageX,
          y: config.participantImageY,
          shape: config.participantImageShape,
          visible: config.showParticipantImage
        });
      } catch (e) {
        useDefaultCertWritings(cert, template);
      }
    } else {
      useDefaultCertWritings(cert, template);
    }
    
    setSelectedCert(cert);
    setShowCertModal(true);
  };

  const handleDownloadCertPDF = async () => {
    const element = document.getElementById("cert-studio-preview-container");
    if (!element) {
      showToast("Error locating certificate preview container.", "error");
      return;
    }
    
    showToast("Generating PDF certificate...", "info");
    
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      
      // Clone element and place it offscreen at a 1:1 scale without transforms
      const clone = element.cloneNode(true);
      clone.style.transform = "none";
      clone.style.position = "fixed";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.width = "800px";  // Natural landscape certificate design width
      clone.style.height = "560px"; // Natural landscape certificate design height
      clone.style.boxShadow = "none";
      clone.style.margin = "0";
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        scale: 2, // Double resolution for crisp rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 800,
        height: 560
      });
      
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate_${certWritings.recipientName.replace(/\s+/g, "_")}.pdf`);
      showToast("Certificate downloaded successfully!", "success");
    } catch (error) {
      console.error("PDF download error:", error);
      showToast("Failed to generate PDF. Falling back to print view...", "error");
      window.print();
    }
  };

  const renderCertificatePreview = (type, writings, imageState = {}) => {
    const { title, subtitle, presentationText, recipientName, description, date, sig1Name, sig1Title, sig2Name, sig2Title } = writings;
    const imgUrl = imageState.url;
    const imgScale = imageState.scale || 1;
    const imgX = imageState.x || 100;
    const imgY = imageState.y || 80;
    const imgShape = imageState.shape || "circle";
    const imgVisible = imageState.visible;

    if (type === "custom") {
      const savedElementsStr = typeof window !== "undefined" ? localStorage.getItem("customDesignerElements") : null;
      const savedBg = typeof window !== "undefined" ? localStorage.getItem("customDesignerBackground") : "";
      const savedBgCol = typeof window !== "undefined" ? localStorage.getItem("customDesignerBgColor") : "#0c0d12";
      const elements = savedElementsStr ? JSON.parse(savedElementsStr) : [];
      
      const bgStyle = savedBg 
        ? { backgroundImage: `url(${savedBg})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: savedBgCol }
        : { backgroundColor: savedBgCol, border: "4px double var(--color-cyan)" };

      return (
        <div 
          className="cert-container" 
          id="cert-studio-preview-container"
          style={{
            ...bgStyle,
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            boxSizing: "border-box",
            borderRadius: "12px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
          }}
        >
          {elements.map((el) => {
            let displayText = el.text;
            if (el.type === "token") {
              if (el.token === "participant_name") displayText = recipientName || "Sarah Chen";
              else if (el.token === "competition_name") displayText = writings.competition_name || "Global Hackfest 2024";
              else if (el.token === "date") displayText = date || new Date().toLocaleDateString();
              else if (el.token === "certificate_id") {
                const pRecord = getStudentParticipantRecord(writings.competition_name || writings.description || selectedCert?.festTitle);
                displayText = pRecord?.certificate_id || pRecord?.id || selectedCert?.id || writings.certificate_id || "CF-889-2024";
              }
              else if (el.token === "QR_code") {
                return (
                  <div
                    key={el.id}
                    style={{
                      position: "absolute",
                      left: `${(el.x / 600) * 100}%`,
                      top: `${(el.y / 400) * 100}%`,
                      transform: el.align === "left" ? "translate(0, -50%)" : el.align === "right" ? "translate(-100%, -50%)" : "translate(-50%, -50%)",
                      width: `${(el.fontSize / 32) * 60}px`,
                      height: `${(el.fontSize / 32) * 60}px`,
                      background: "#ffffff",
                      padding: "4px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: el.glow ? `0 0 ${el.glowIntensity}px ${el.color}` : "none"
                    }}
                  >
                    <svg viewBox="0 0 24 24" style={{ width: "100%", height: "100%", color: "#000000" }}>
                      <path fill="currentColor" d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 3h3v2h-3v-2zm3 3h3v2h-3v-2zm-3-3h-2v-2h2v2zm2-2h1v1h-1v-1zm-1 3h-1v-1h1v1zm2 2h-1v-1h1v1z" />
                    </svg>
                  </div>
                );
              } else {
                const possibleVal = writings[el.token] || writings[el.token.toUpperCase()] || writings[el.token.toLowerCase()];
                displayText = possibleVal || el.text;
              }
            }

            const textShadow = el.glow ? `0 0 ${el.glowIntensity}px ${el.color}` : "none";

            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: `${(el.x / 600) * 100}%`,
                  top: `${(el.y / 400) * 100}%`,
                  transform: el.align === "left" ? "translate(0, -50%)" : el.align === "right" ? "translate(-100%, -50%)" : "translate(-50%, -50%)",
                  fontFamily: el.fontFamily === "Sora (Default)" || el.fontFamily === "Sora" ? "var(--font-sora), sans-serif" : el.fontFamily,
                  fontSize: `${el.fontSize}px`,
                  fontWeight: el.weight === "Bold" ? 700 : el.weight === "Medium" ? 500 : 400,
                  color: el.color,
                  textAlign: el.align || "center",
                  textShadow,
                  whiteSpace: "nowrap",
                  lineHeight: 1
                }}
              >
                {displayText}
              </div>
            );
          })}
        </div>
      );
    }

    if (type === "achievement") {
      return (
        <div className="cert-container cert-tpl-achievement font-serif-lux" id="cert-studio-preview-container">
          <div className="accent-left-wave">
            <div className="wave-particles">
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
            </div>
          </div>
          
          <div className="cert-header">
            <span className="cert-subtitle-top font-serif-lux">{subtitle || "OF ACHIEVEMENT"}</span>
            <h1 className="cert-title-main font-serif-lux">{title || "CERTIFICATE"}</h1>
          </div>
          
          <div className="cert-body">
            <span className="cert-recipient-pre">{presentationText || "THIS CERTIFICATE IS PROUDLY PRESENTED TO"}</span>
            <h2 className="cert-recipient-name font-cursive">{recipientName || "Sarah Chen"}</h2>
            <p className="cert-desc-text font-serif-lux">{description}</p>
          </div>
          
          {imgVisible && imgUrl && (
            <div 
              className={`cert-participant-img-wrapper shape-${imgShape}`}
              style={{
                width: `${64 * imgScale}px`,
                height: `${64 * imgScale}px`,
                left: `${imgX}px`,
                top: `${imgY}px`
              }}
            >
              <img src={imgUrl} alt="Participant" />
            </div>
          )}

          <div className="cert-footer">
            <div className="cert-sig-block">
              <div className="cert-sig-line font-cursive">{sig1Name}</div>
              <span className="cert-sig-title">{sig1Title}</span>
            </div>
            
            <div className="cert-seal-badge seal-gold">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            
            <div className="cert-sig-block">
              <div className="cert-sig-line font-cursive">{sig2Name}</div>
              <span className="cert-sig-title">{sig2Title}</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (type === "appreciation") {
      return (
        <div className="cert-container cert-tpl-appreciation" id="cert-studio-preview-container">
          <div className="geom-corner-top-left"></div>
          <div className="geom-corner-bottom-right"></div>
          <div className="geom-side-left"></div>
          <div className="geom-side-right"></div>
          
          <div className="cert-header" style={{ marginTop: "20px" }}>
            <span className="cert-subtitle-top" style={{ letterSpacing: "5px", color: "var(--color-gold)" }}>{subtitle || "OF APPRECIATION"}</span>
            <h1 className="cert-title-main" style={{ color: "#0f172a", fontWeight: "900" }}>{title || "CERTIFICATE"}</h1>
          </div>
          
          <div className="cert-body">
            <span className="cert-recipient-pre" style={{ fontWeight: 600, color: "#475569" }}>{presentationText || "PROUDLY PRESENTED TO"}</span>
            <h2 className="cert-recipient-name font-cursive" style={{ color: "#1e3a8a", borderBottomColor: "#fbbf24" }}>{recipientName || "Sarah Chen"}</h2>
            <p className="cert-desc-text" style={{ color: "#334155" }}>{description}</p>
          </div>
          
          {imgVisible && imgUrl && (
            <div 
              className={`cert-participant-img-wrapper shape-${imgShape}`}
              style={{
                width: `${64 * imgScale}px`,
                height: `${64 * imgScale}px`,
                left: `${imgX}px`,
                top: `${imgY}px`
              }}
            >
              <img src={imgUrl} alt="Participant" />
            </div>
          )}

          <div className="cert-footer">
            <div className="cert-sig-block">
              <div className="cert-sig-line font-cursive" style={{ borderBottomColor: "#cbd5e1" }}>{sig1Name}</div>
              <span className="cert-sig-title">{sig1Title}</span>
            </div>
            
            <div className="cert-seal-badge seal-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            
            <div className="cert-sig-block">
              <div className="cert-sig-line font-cursive" style={{ borderBottomColor: "#cbd5e1" }}>{sig2Name}</div>
              <span className="cert-sig-title">{sig2Title}</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (type === "completion") {
      return (
        <div className="cert-container cert-tpl-completion" id="cert-studio-preview-container">
          <div className="gothic-corner gc-tl"></div>
          <div className="gothic-corner gc-tr"></div>
          <div className="gothic-corner gc-bl"></div>
          <div className="gothic-corner gc-br"></div>
          
          <div className="cert-header" style={{ marginTop: "10px" }}>
            <h1 className="cert-title-main font-cinzel" style={{ fontSize: "2.1rem", color: "#1e293b", borderBottom: "2px solid #1e293b", paddingBottom: "6px" }}>
              {title || "Certificate of Completion"}
            </h1>
            <span className="cert-subtitle-top font-cinzel" style={{ fontSize: "0.65rem", marginTop: "8px" }}>{subtitle || "OF COMPLETION"}</span>
          </div>
          
          <div className="cert-body">
            <span className="cert-recipient-pre font-serif-lux" style={{ fontStyle: "italic", textTransform: "none" }}>{presentationText || "This certifies that"}</span>
            <h2 className="cert-recipient-name font-serif-lux" style={{ fontStyle: "italic", borderBottom: "1px dashed #475569" }}>{recipientName || "Sarah Chen"}</h2>
            <p className="cert-desc-text font-serif-lux" style={{ fontSize: "0.8rem" }}>{description}</p>
          </div>
          
          {imgVisible && imgUrl && (
            <div 
              className={`cert-participant-img-wrapper shape-${imgShape}`}
              style={{
                width: `${64 * imgScale}px`,
                height: `${64 * imgScale}px`,
                left: `${imgX}px`,
                top: `${imgY}px`
              }}
            >
              <img src={imgUrl} alt="Participant" />
            </div>
          )}

          <div className="cert-footer">
            <div className="cert-sig-block">
              <div className="cert-sig-line font-cursive" style={{ borderBottom: "1px dotted #475569" }}>{sig1Name}</div>
              <span className="cert-sig-title font-cinzel" style={{ fontSize: "0.55rem" }}>{sig1Title}</span>
            </div>
            
            <div className="cert-seal-badge seal-vintage">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            
            <div className="cert-sig-block">
              <div className="cert-sig-line font-cursive" style={{ borderBottom: "1px dotted #475569" }}>{sig2Name}</div>
              <span className="cert-sig-title font-cinzel" style={{ fontSize: "0.55rem" }}>{sig2Title}</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (type === "recognition") {
      return (
        <div className="cert-container cert-tpl-recognition" id="cert-studio-preview-container">
          <div className="inner-gold-border"></div>
          <div className="leaf-corner lc-tl"></div>
          <div className="leaf-corner lc-tr"></div>
          <div className="leaf-corner lc-bl"></div>
          <div className="leaf-corner lc-br"></div>
          
          <div className="leaf-deco ld-tl">✿</div>
          <div className="leaf-deco ld-tr">✿</div>
          <div className="leaf-deco ld-bl">✿</div>
          <div className="leaf-deco ld-br">✿</div>
          
          <div className="cert-header">
            <span className="cert-subtitle-top" style={{ color: "#1e3a8a", fontWeight: "700" }}>{subtitle || "OF RECOGNITION"}</span>
            <h1 className="cert-title-main font-serif-lux" style={{ color: "#1e3a8a" }}>{title || "CERTIFICATE"}</h1>
          </div>
          
          <div className="cert-body">
            <span className="cert-recipient-pre font-serif-lux" style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "1px" }}>{presentationText || "THE FOLLOWING AWARD IS GIVEN TO"}</span>
            <h2 className="cert-recipient-name font-cursive" style={{ color: "#1e3a8a", borderBottomColor: "#fbbf24" }}>{recipientName || "Sarah Chen"}</h2>
            <p className="cert-desc-text font-serif-lux" style={{ color: "#475569" }}>{description}</p>
          </div>
          
          {imgVisible && imgUrl && (
            <div 
              className={`cert-participant-img-wrapper shape-${imgShape}`}
              style={{
                width: `${64 * imgScale}px`,
                height: `${64 * imgScale}px`,
                left: `${imgX}px`,
                top: `${imgY}px`
              }}
            >
              <img src={imgUrl} alt="Participant" />
            </div>
          )}

          <div className="cert-footer">
            <div className="cert-sig-block">
              <div className="cert-sig-line font-cursive" style={{ borderBottomColor: "#fbbf24" }}>{sig1Name}</div>
              <span className="cert-sig-title">{sig1Title}</span>
            </div>
            
            <div className="cert-seal-badge seal-blue" style={{ background: "radial-gradient(circle, #1e3a8a 0%, #172554 100%)", borderColor: "#fbbf24" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            
            <div className="cert-sig-block">
              <div className="cert-sig-line font-cursive" style={{ borderBottomColor: "#fbbf24" }}>{sig2Name}</div>
              <span className="cert-sig-title">{sig2Title}</span>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (!authorized) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0c0d12", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid rgba(255,255,255,0.1)", borderTop: "4px solid var(--color-cyan, #00d2ff)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
          <p style={{ letterSpacing: "1px", fontSize: "0.9rem", color: "#94a3b8" }}>VERIFYING CONSOLE ACCESS...</p>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="console-dashboard-layout">
      {/* 1. Left Sidebar Navigation */}
      <aside className="console-sidebar">
        <div className="console-sidebar-header">
          <div className="console-sidebar-logo" style={{ cursor: "pointer" }} onClick={() => window.location.href = "/"}>
            Cert<span>FIRE</span>
          </div>
          <div className="console-sidebar-subtitle">PARTICIPANT CONSOLE</div>
        </div>

        {/* Navigation list */}
        <nav className="console-menu-list">
          <div 
            className={`console-menu-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span>Overview</span>
          </div>

          <div 
            className={`console-menu-item ${activeTab === "my-fests" ? "active" : ""}`}
            onClick={() => setActiveTab("my-fests")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>My Fests</span>
          </div>

          <div 
            className={`console-menu-item ${activeTab === "certificates" ? "active" : ""}`}
            onClick={() => setActiveTab("certificates")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="8" r="3" />
              <path d="m9 11 2 2 4-4" />
            </svg>
            <span>Certificates</span>
          </div>

          <div 
            className={`console-menu-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </div>
        </nav>

        {/* Sidebar bottom Profile */}
        <div 
          className="console-sidebar-profile" 
          style={{ cursor: "pointer", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px", display: "flex", alignItems: "center", gap: "10px" }} 
          onClick={() => {
            if (confirm("Do you want to log out?")) {
              sessionStorage.removeItem("isLoggedIn");
              sessionStorage.removeItem("userRole");
              sessionStorage.removeItem("userName");
              window.location.href = "/";
            }
          }}
        >
          <div className="avatar-wrapper" style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden" }}>
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Student Avatar" />
          </div>
          <div className="profile-info" style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <span className="profile-name" style={{ fontSize: "0.85rem", fontWeight: "700" }}>{userName}</span>
            <span className="profile-role" style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>Student</span>
          </div>
        </div>
      </aside>

      {/* 2. Main Console Content panel */}
      <main className="console-main">
        {/* Console top bar */}
        <div className="console-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid var(--color-border-glass)" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", textTransform: "capitalize", margin: 0 }}>
            {activeTab === "overview" ? "Student Dashboard Overview" : activeTab === "my-fests" ? "My Registered Festivals" : "My Earned Credentials"}
          </h1>
          <div className="console-top-actions">
            <Link href="/browse-fests" className="console-sidebar-btn-gradient" style={{ padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Explore Fests
            </Link>
          </div>
        </div>

        <div className="console-content-container" style={{ padding: "40px", overflowY: "auto", height: "calc(100vh - 81px)" }}>
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {/* 1. Welcome Banner */}
              <section className="welcome-banner" style={{ margin: 0 }}>
                <div className="welcome-banner-glow"></div>
                <div className="welcome-text-section">
                  <h2>Ignite Your Journey, <span className="text-cyan">{userName}!</span></h2>
                  {progressPercent === 0 ? (
                    <p>Start discovering and registering for campus festivals to earn your first certified skill!</p>
                  ) : progressPercent === 100 ? (
                    <p>Incredible! You have completed all active goals and achieved <strong>Gold Vanguard</strong> status!</p>
                  ) : (
                    <p>You're {progressPercent}% of the way to becoming a <strong>Gold Vanguard</strong>. Keep going!</p>
                  )}
                  
                  {/* Progress bar container */}
                  <div className="progress-bar-container">
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span className="progress-percent">{progressPercent}%</span>
                  </div>

                  <div className="banner-actions">
                    <Link href="/browse-fests" className="btn-banner-primary ripple">
                      {progressPercent === 100 ? "Browse More Events" : "Complete Next Goal"}
                    </Link>
                    <button className="btn-banner-secondary">
                      View Roadmap
                    </button>
                  </div>
                </div>
              </section>

              {/* Stats Widgets, Skills and Activity row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Stats Widgets */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="stat-widget" style={{ margin: 0, padding: "16px 20px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                    <div className="stat-icon-wrapper bg-glow-teal">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                        <line x1="4" y1="22" x2="4" y2="15"/>
                      </svg>
                    </div>
                    <div className="stat-numbers">
                      <span className="stat-value">{registeredCount.toString().padStart(2, "0")}</span>
                      <span className="stat-label">EVENTS PARTICIPATED</span>
                    </div>
                  </div>

                  <div className="stat-widget" style={{ margin: 0, padding: "16px 20px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                    <div className="stat-icon-wrapper bg-glow-cyan">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    </div>
                    <div className="stat-numbers">
                      <span className="stat-value">{verifiedSkills.length.toString().padStart(2, "0")}</span>
                      <span className="stat-label">SKILLS VERIFIED</span>
                    </div>
                  </div>

                  <div className="stat-widget" style={{ margin: 0, padding: "16px 20px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                    <div className="stat-icon-wrapper bg-glow-pink">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-pink)" strokeWidth="2">
                        <circle cx="12" cy="8" r="6"/>
                        <path d="M15.47 14H8.53L4 22l8-3 8 3-4.53-8z"/>
                      </svg>
                    </div>
                    <div className="stat-numbers">
                      <span className="stat-value">{earnedCerts.length.toString().padStart(2, "0")}</span>
                      <span className="stat-label">CERTIFICATES EARNED</span>
                    </div>
                  </div>
                </div>

                {/* Verified Skills & Activity card */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Skills Box */}
                  <div className="sidebar-card" style={{ flexGrow: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "12px", height: "50%", overflowY: "auto" }}>
                    <h4 className="sidebar-sub-title" style={{ margin: 0 }}>VERIFIED SKILLS</h4>
                    <div className="skills-badge-container" style={{ flexWrap: "wrap", gap: "8px" }}>
                      {verifiedSkills.length > 0 ? (
                        verifiedSkills.map((skill, index) => (
                          <span key={index} className="skill-badge">{skill}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          No skills verified yet. Register and participate in fests to earn skills!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Activity index chart */}
                  <div className="sidebar-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h4 className="sidebar-sub-title" style={{ margin: 0 }}>ACTIVITY INDEX</h4>
                    <div className="chart-bar-container" style={{ alignSelf: "center", display: "flex", alignItems: "flex-end", gap: "6px", height: "60px" }}>
                      {chartBars.map((bar, index) => (
                        <div 
                          key={index} 
                          className={`chart-bar ${bar.isActive ? "active-bar" : ""}`} 
                          style={{ height: bar.height, width: "12px", borderRadius: "3px" }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Events */}
              <section className="dashboard-section" style={{ margin: 0 }}>
                <h3 className="dashboard-section-title">Recommended for You</h3>
                <div className="recommended-grid">
                  {recommendedEvents.length > 0 ? (
                    recommendedEvents.slice(0, 3).map((fest) => {
                      let categoryClass = "tech";
                      let tagText = "TECH";

                      const cc = (fest.categoryClass || "").toLowerCase();
                      if (cc.includes("music") || cc.includes("rhythm")) {
                        categoryClass = "music";
                        tagText = "MUSIC";
                      } else if (cc.includes("art") || cc.includes("motion") || cc.includes("expo")) {
                        categoryClass = "art";
                        tagText = "ART";
                      }

                      let matchText = "Matches your student profile";
                      if (fest.eligibility) {
                        const firstWord = fest.eligibility.split(" ")[0];
                        matchText = `Matches: ${firstWord || "Student"}, ${fest.category}`;
                      }

                      return (
                        <div key={fest.id} className="recommended-card" style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                          <div className="rec-img-wrapper">
                            <img src={fest.image} alt={fest.title} />
                            <span className={`rec-tag tag-${categoryClass}`}>{tagText}</span>
                          </div>
                          <div className="rec-content" style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: "10px", padding: "16px" }}>
                            <h4 style={{ margin: 0 }}>{fest.title}</h4>
                            <p className="rec-match-text" style={{ margin: 0 }}>{matchText}</p>
                            
                            <div className="card-actions" style={{ display: "flex", gap: "10px", marginTop: "auto", width: "100%" }}>
                              <button 
                                className={`view-details-btn btn-${categoryClass}`} 
                                style={{ flex: 1, marginTop: 0, padding: "8px", fontSize: "0.8rem", height: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedDetailsEvent(fest);
                                  setIsDetailsModalOpen(true);
                                }}
                              >
                                View Details
                              </button>
                              {registeredIds.includes(fest.id) ? (
                                <button 
                                  disabled 
                                  className="registered-btn"
                                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", fontSize: "0.8rem", height: "auto" }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: "4px" }}>
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                  Registered
                                </button>
                              ) : (
                                <button 
                                  className={`register-fest-btn btn-register-${categoryClass}`}
                                  style={{ flex: 1, padding: "8px", fontSize: "0.8rem", height: "auto" }}
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
                    })
                  ) : (
                    <div className="no-fests-fallback" style={{ gridColumn: "span 3" }}>
                      <p>You have registered for all available festivals! There are no new recommendations.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "my-fests" && (
            <section className="dashboard-section" style={{ margin: 0 }}>
              <div className="registered-fests-grid">
                {registeredFests.length > 0 ? (
                  registeredFests.map((fest) => {
                    const isNeon = fest.id === "neon-rhythms";
                    const isCodeBlast = fest.id === "code-blast";
                    
                    let badgeText = "CONFIRMED";
                    let badgeClass = "badge-confirmed";
                    let countdown = { days: "00", hours: "00", mins: "00" };

                    if (isNeon) {
                      badgeText = "LIVE IN 2 DAYS";
                      badgeClass = "badge-live";
                      countdown = neonCountdown;
                    } else if (isCodeBlast) {
                      badgeText = "CONFIRMED";
                      badgeClass = "badge-confirmed";
                      countdown = codeBlastCountdown;
                    } else {
                      badgeText = "UPCOMING";
                      badgeClass = "badge-upcoming";
                      countdown = { days: "10", hours: "12", mins: "45" };
                    }

                    let categoryClass = "tech";
                    if (fest.categoryClass && fest.categoryClass.includes("music")) {
                      categoryClass = "music";
                    } else if (fest.categoryClass && fest.categoryClass.includes("art")) {
                      categoryClass = "art";
                    }

                    const pRecord = getStudentParticipantRecord(fest.title);

                    return (
                      <div key={fest.id} className={`registered-fest-card border-${categoryClass}`}>
                        <div className="registered-img-wrapper">
                          <img src={fest.image} alt={fest.title} />
                          <span className={`registered-badge ${badgeClass}`}>{badgeText}</span>
                        </div>
                        <div className="registered-card-content">
                          <h4>{fest.title}</h4>
                          <p className="registered-card-details">
                            {fest.dateMonth} {fest.dateDay}, 2024 • {fest.location.split(" - ")[0]}
                          </p>
                          
                          <div className="countdown-timer-row">
                            <div className="countdown-box">
                              <span className="countdown-number">{countdown.days}</span>
                              <span className="countdown-label">DAYS</span>
                            </div>
                            <div className="countdown-divider">:</div>
                            <div className="countdown-box">
                              <span className="countdown-number">{countdown.hours}</span>
                              <span className="countdown-label">HRS</span>
                            </div>
                            <div className="countdown-divider">:</div>
                            <div className="countdown-box">
                              <span className="countdown-number">{countdown.mins}</span>
                              <span className="countdown-label">MIN</span>
                            </div>
                          </div>

                          {pRecord && (
                            <div style={{ marginTop: "12px", padding: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>CERT ID:</span>
                                <code style={{ fontSize: "0.78rem", color: "var(--color-cyan)", fontFamily: "monospace", fontWeight: 700 }}>{pRecord.certificate_id}</code>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>QR CODE:</span>
                                <div 
                                  style={{ cursor: "pointer", background: "white", padding: "2px", borderRadius: "4px", display: "inline-flex" }}
                                  onClick={() => {
                                    setSelectedQrCode({
                                      url: `${window.location.origin}/verify?id=${pRecord.certificate_id}`,
                                      name: pRecord.name,
                                      fest: pRecord.fest,
                                      id: pRecord.certificate_id
                                    });
                                    setShowQrModal(true);
                                  }}
                                  title="Click to zoom QR Code"
                                >
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(window.location.origin + "/verify?id=" + pRecord.certificate_id)}`} 
                                    alt="QR Code" 
                                    style={{ width: "22px", height: "22px", display: "block" }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <button 
                            className={`btn-view-pass btn-pass-${categoryClass}`}
                            onClick={() => handleViewPass(fest)}
                            style={{ marginTop: "12px" }}
                          >
                            View Pass
                          </button>

                          {pRecord && (pRecord.certIssued || pRecord.status === "issued") && (
                            <button 
                              className={`btn-view-pass btn-pass-${categoryClass}`}
                              onClick={() => {
                                const cert = getEarnedCertificates().find(c => c.festName?.toLowerCase() === fest.title?.toLowerCase());
                                if (cert) {
                                  handleViewCert(cert);
                                } else {
                                  handleViewCert({
                                    id: pRecord.certificate_id,
                                    title: "Certificate of Achievement",
                                    festTitle: fest.title,
                                    festName: fest.title,
                                    image: fest.image,
                                    badgeColorClass: "bg-cyan-glow",
                                    strokeColor: "var(--color-cyan)"
                                  });
                                }
                              }}
                              style={{ marginTop: "8px", background: "var(--color-cyan)", color: "#000", borderColor: "var(--color-cyan)" }}
                            >
                              🎓 View Certificate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-fests-fallback" style={{ gridColumn: "span 3" }}>
                    <p>You haven't registered for any festivals yet.</p>
                    <Link href="/browse-fests" className="btn-banner-primary" style={{ marginTop: "12px", display: "inline-block" }}>
                      Explore Fests
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "certificates" && (
            <section className="dashboard-section" style={{ margin: 0 }}>
              {displayCerts.length > 0 ? (
                <div className="achievements-grid">
                  {displayCerts.map((cert) => {
                    if (cert.status === "pending") {
                      return (
                        <div 
                          key={cert.id} 
                          className="achievement-card pending" 
                          style={{ 
                            cursor: "pointer", 
                            opacity: 0.7,
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px dashed rgba(255, 255, 255, 0.15)"
                          }}
                          onClick={() => showToast(`"${cert.festTitle}" certificate is pending organizer issuance.`, "info")}
                        >
                          <div className="achievement-header">
                            <div className="achievement-badge-icon bg-glow-muted" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            </div>
                            <span className="achievement-id" style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>LOCKED</span>
                          </div>
                          <div className="achievement-details">
                            <h4 style={{ color: "var(--color-text-secondary)" }}>{cert.title}</h4>
                            <p style={{ color: "var(--color-text-muted)" }}>{cert.festName.toUpperCase()}</p>
                          </div>
                          <div className="achievement-footer">
                            <div className="achievement-mini-thumb" style={{ opacity: 0.3 }}>
                              <img src={cert.image} alt="Thumb" />
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Pending Issuance</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={cert.id} 
                        className="achievement-card" 
                        style={{ cursor: "pointer" }}
                        onClick={() => handleViewCert(cert)}
                      >
                        <div className="achievement-header">
                          <div className={`achievement-badge-icon ${cert.badgeColorClass}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={cert.strokeColor} strokeWidth="2.5">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              <path d="m9 11 2 2 4-4"/>
                            </svg>
                          </div>
                          <span className="achievement-id">ID: {cert.id}</span>
                        </div>
                        <div className="achievement-details">
                          <h4>{cert.title}</h4>
                          <p>{cert.festName.toUpperCase()}</p>
                        </div>
                        <div className="achievement-footer">
                          <div className="achievement-mini-thumb">
                            <img src={cert.image} alt="Thumb" />
                          </div>
                          <button 
                            className="btn-share-icon" 
                            onClick={(e) => { e.stopPropagation(); handleShareCertificate(cert.title); }} 
                            aria-label="Share"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="18" cy="5" r="3"/>
                              <circle cx="6" cy="12" r="3"/>
                              <circle cx="18" cy="19" r="3"/>
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                          </button>
                        </div>
                        <button 
                          className="btn-linkedin-share" 
                          onClick={(e) => { e.stopPropagation(); handleShareCertificate(cert.title); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "6px" }}>
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          Share to LinkedIn
                        </button>
                      </div>
                    );
                  })}

                  {lockedSlots.map((_, idx) => (
                    <div key={`locked-${idx}`} className="achievement-card locked">
                      <div className="locked-wrapper">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <p>Next Achievement Locked</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-fests-fallback">
                  <p>You haven't earned any certificates yet.</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "6px" }}>
                    Once the festival organizer issues your digital certificate, it will appear here.
                  </p>
                </div>
              )}
            </section>
          )}

          {activeTab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", paddingBottom: "100px" }}>
              
              {/* Header Row */}
              <div style={{ marginBottom: "8px" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", margin: 0, fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Portal Settings</h1>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "6px" }}>
                  Manage your participant profile, academic details, and notification preferences.
                </p>
              </div>

              {/* Main Settings Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
                
                {/* Left Column: Form Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Card: Personal & Academic Details */}
                  <form onSubmit={handleSaveSettings} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                    
                    {/* Section title */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "16px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(0, 210, 255, 0.08)", border: "1px solid rgba(0, 210, 255, 0.15)", color: "var(--color-cyan)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Participant Profile Details</h3>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>Update your personal identity and college details</p>
                      </div>
                    </div>

                    {/* Input rows */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentFullName} 
                          onChange={(e) => setStudentFullName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Username</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentUsername} 
                          onChange={(e) => setStudentUsername(e.target.value)} 
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Email Address</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          value={studentEmail} 
                          disabled 
                          style={{ opacity: 0.6, cursor: "not-allowed" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Contact Number</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentPhone} 
                          onChange={(e) => setStudentPhone(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>College / University Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentCollege} 
                          onChange={(e) => setStudentCollege(e.target.value)} 
                          required
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Student ID / Roll Number</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentId} 
                          onChange={(e) => setStudentId(e.target.value)} 
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Department / Branch</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentDept} 
                          onChange={(e) => setStudentDept(e.target.value)} 
                          required
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Academic Year</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentYear} 
                          onChange={(e) => setStudentYear(e.target.value)} 
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="console-btn-primary" style={{ alignSelf: "flex-end", padding: "10px 24px" }}>
                      Save Changes
                    </button>
                  </form>

                  {/* Card: Account Security */}
                  <form onSubmit={handleUpdatePassword} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "16px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(171, 71, 188, 0.08)", border: "1px solid rgba(171, 71, 188, 0.15)", color: "var(--color-purple)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Account Credentials</h3>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>Update your dashboard security credentials</p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Current Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)} 
                          required 
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>New Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          required 
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Confirm New Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <button type="submit" className="console-btn-secondary" style={{ alignSelf: "flex-end", padding: "10px 24px" }}>
                      Change Password
                    </button>
                  </form>

                </div>

                {/* Right Column: Profile Picture & System Toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Profile Picture Card */}
                  <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", margin: 0, alignSelf: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", width: "100%", textAlign: "left" }}>Profile Photo</h4>
                    
                    <div style={{ position: "relative", width: "110px", height: "110px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-cyan) 0%, var(--color-purple) 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "3px", boxShadow: "0 8px 24px rgba(0,210,255,0.15)" }}>
                      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#0b0c10", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {studentProfilePic ? (
                          <img src={studentProfilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--color-cyan)" }}>
                            {studentFullName.charAt(0).toUpperCase() || "S"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                      <label className="console-btn-primary" style={{ cursor: "pointer", display: "block", textAlign: "center", padding: "10px" }}>
                        Upload New Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: "none" }} 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setStudentProfilePic(reader.result);
                                const emailLower = studentEmail.toLowerCase().trim();
                                localStorage.setItem(`studentProfilePic_${emailLower}`, reader.result);
                                showToast("Profile photo uploaded successfully!", "success");
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      
                      {studentProfilePic && (
                        <button 
                          className="console-btn-secondary" 
                          style={{ borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", background: "rgba(239, 68, 68, 0.05)" }}
                          onClick={() => {
                            setStudentProfilePic("");
                            const emailLower = studentEmail.toLowerCase().trim();
                            localStorage.removeItem(`studentProfilePic_${emailLower}`);
                            showToast("Profile photo removed.", "info");
                          }}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* System Settings Toggles */}
                  <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", margin: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", width: "100%" }}>Preferences & Privacy</h4>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>Email Alerts</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Receive email updates for new fests</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={emailNotifs} 
                          onChange={(e) => setEmailNotifs(e.target.checked)} 
                          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--color-cyan)" }}
                        />
                      </label>

                      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>Push Notifications</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Receive desktop notifications</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pushNotifs} 
                          onChange={(e) => setPushNotifs(e.target.checked)} 
                          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--color-cyan)" }}
                        />
                      </label>

                      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>Public Directory Link</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Allow public search of credentials</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={publicProfile} 
                          onChange={(e) => setPublicProfile(e.target.checked)} 
                          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--color-cyan)" }}
                        />
                      </label>

                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      </main>
    </div>

      {/* Ticket Pass Modal */}
      {showPassModal && selectedPassFest && (
        <div className="ticket-modal-overlay">
          <div className="ticket-modal-card">
            <button className="btn-close-ticket" onClick={() => setShowPassModal(false)} aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            
            <div className="ticket-badge-brand">CertFIRE OFFICIAL TICKET PASS</div>
            
            <div className="ticket-pass-body">
              {/* Ticket header details */}
              <div className="ticket-pass-header-info">
                <h3>{selectedPassFest.title}</h3>
                <p className="ticket-pass-category">{selectedPassFest.category} EVENT PASS</p>
              </div>

              {/* Dotted cutting separator line */}
              <div className="ticket-cutting-line">
                <span className="notch-left"></span>
                <span className="notch-right"></span>
              </div>

              {/* Ticket details fields */}
              <div className="ticket-pass-details-grid">
                <div className="ticket-field">
                  <span className="field-label">PARTICIPANT NAME</span>
                  <span className="field-value">{sessionStorage.getItem("userName") || "Alex Chen"}</span>
                </div>
                <div className="ticket-field">
                  <span className="field-label">REGISTRATION ID</span>
                  <span className="field-value">CF-{selectedPassFest.id.substring(0, 4).toUpperCase()}-{Math.floor(1000 + Math.random() * 9000)}</span>
                </div>
                <div className="ticket-field">
                  <span className="field-label">DATE & TIME</span>
                  <span className="field-value">{selectedPassFest.dateMonth} {selectedPassFest.dateDay}, 2024 • {selectedPassFest.timeRange || "06:00 PM"}</span>
                </div>
                <div className="ticket-field">
                  <span className="field-label">VENUE LOCATION</span>
                  <span className="field-value">{selectedPassFest.location}</span>
                </div>
              </div>

              {/* Mock Barcode */}
              <div className="ticket-barcode-wrapper">
                <div className="barcode-lines">
                  <div className="line thin"></div><div className="line thick"></div>
                  <div className="line thin"></div><div className="line thin"></div>
                  <div className="line medium"></div><div className="line thick"></div>
                  <div className="line thin"></div><div className="line medium"></div>
                  <div className="line thick"></div><div className="line thin"></div>
                  <div className="line medium"></div><div className="line thin"></div>
                  <div className="line thick"></div><div className="line thin"></div>
                </div>
                <span className="barcode-number">*CF-{selectedPassFest.id.toUpperCase()}-PASS*</span>
              </div>

            </div>

            <div className="ticket-modal-actions">
              <button className="btn-ticket-print" onClick={handlePrintPass}>
                Print Ticket Pass
              </button>
              <button className="btn-ticket-close" onClick={() => setShowPassModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {showCertModal && selectedCert && certWritings && (
        <div className="custom-modal-overlay" onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setShowCertModal(false)} style={{ zIndex: 2500 }}>
          <div className="custom-modal-card" style={{ maxWidth: "860px", padding: "24px", background: "rgba(10, 11, 14, 0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            
            <div className="custom-modal-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ffffff" }}>Your Earned Credential</h2>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Verify and download your official certification</span>
              </div>
              <button className="custom-modal-close" onClick={() => setShowCertModal(false)}>&times;</button>
            </div>

            <div className="custom-modal-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "0" }}>
              
              {/* Dynamic Certificate Preview Render */}
              <div style={{ width: "100%", background: "#090a0d", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ transform: "scale(0.85)", transformOrigin: "center top", marginBottom: "-60px" }}>
                  {renderCertificatePreview(certTemplate, certWritings, certImageState)}
                </div>
              </div>

              {/* Actions row */}
              <div style={{ display: "flex", width: "100%", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button 
                  className="btn-modal-cancel" 
                  style={{ width: "auto", padding: "10px 20px" }} 
                  onClick={() => setShowCertModal(false)}
                >
                  Close
                </button>
                <button 
                  className="btn-modal-save" 
                  style={{ 
                    width: "auto", 
                    padding: "10px 24px", 
                    background: "var(--color-cyan)", 
                    color: "#07080a", 
                    fontWeight: 700, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    border: "none", 
                    borderRadius: "6px", 
                    cursor: "pointer" 
                  }} 
                  onClick={handleDownloadCertPDF}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download PDF
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
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
                    alert("Certificate ID copied to clipboard!");
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

      {showQrModal && selectedQrCode && (
        <div className="custom-modal-overlay" onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setShowQrModal(false)} style={{ zIndex: 10000 }}>
          <div className="custom-modal-card" style={{ maxWidth: "400px", textAlign: "center", background: "rgba(10, 11, 14, 0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            <div className="custom-modal-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
              <h2 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700 }}>Participant QR Code</h2>
              <button className="custom-modal-close" onClick={() => setShowQrModal(false)}>&times;</button>
            </div>
            <div className="custom-modal-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 16px" }}>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                Scan this QR code to view and download the official certificate for <strong>{selectedQrCode.name}</strong>.
              </p>
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedQrCode.url)}`}
                  alt="QR Code Scan" 
                  style={{ width: "200px", height: "200px" }}
                />
              </div>
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--color-cyan)", fontFamily: "monospace", fontWeight: 700 }}>{selectedQrCode.id}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>{selectedQrCode.fest}</div>
              </div>
            </div>
            <div className="custom-modal-footer" style={{ justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
              <button 
                className="btn-modal-save" 
                style={{ width: "auto", padding: "8px 20px" }}
                onClick={() => {
                  window.open(selectedQrCode.url, "_blank");
                }}
              >
                Open Link
              </button>
              <button className="btn-modal-cancel" style={{ width: "auto", padding: "8px 20px" }} onClick={() => setShowQrModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <EventModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        event={selectedDetailsEvent} 
        isRegistered={selectedDetailsEvent ? registeredIds.includes(selectedDetailsEvent.id) : false}
        onRegister={() => handleRegister(selectedDetailsEvent.id)}
      />

      {/* Floating Alert Messages */}
      <div className="alert-toast-container" id="alert-container">
        {toasts.map((t) => {
          let iconSvg = "";
          if (t.type === "success") {
            iconSvg = (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            );
          } else if (t.type === "error") {
            iconSvg = (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            );
          } else {
            iconSvg = (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" strokeWidth="2">
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
