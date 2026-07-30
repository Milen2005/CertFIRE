"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { PREDEFINED_EVENTS } from "../../constants/events";

export default function OrganizerDashboard() {
  const router = useRouter();
  const profilePicInputRef = useRef(null);

  // Authentication & session variables
  const [userName, setUserName] = useState("Alex");
  const [fullName, setFullName] = useState("Alex Rivera");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFestFilter, setSelectedFestFilter] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  
  // Upload excel states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileObject, setFileObject] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importedParticipants, setImportedParticipants] = useState([]);
  const [showUploadZone, setShowUploadZone] = useState(false);

  // Modal & CRUD states
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [modalForm, setModalForm] = useState({ name: "", email: "", phone: "", fest: "", status: "verified" });
  const [overwriteOnUpload, setOverwriteOnUpload] = useState(true);
  const [selectedQrCode, setSelectedQrCode] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Template states
  const [selectedTemplate, setSelectedTemplate] = useState("achievement"); // Options: achievement, appreciation, completion, recognition
  const [previewTemplateOpen, setPreviewTemplateOpen] = useState(false);
  const [previewTemplateType, setPreviewTemplateType] = useState("achievement");
  const [templatesSubTab, setTemplatesSubTab] = useState("select"); // "select" or "upload"
  const [designerFont, setDesignerFont] = useState("Space Grotesk");
  const [designerSize, setDesignerSize] = useState(32);
  const [designerColor, setDesignerColor] = useState("#00d2ff");
  const [designerAlign, setDesignerAlign] = useState("left");
  const [designerSig1, setDesignerSig1] = useState("");
  const [designerSig2, setDesignerSig2] = useState("");
  const [activeCanvasTokens, setActiveCanvasTokens] = useState(["{{Participant Name}}"]);

  // WYSIWYG Certificate Designer States
  const [designerElements, setDesignerElements] = useState([
    {
      id: "text-1",
      type: "static",
      text: "This hereby confirms that",
      x: 180,
      y: 110,
      fontFamily: "Sora",
      fontSize: 16,
      weight: "Regular",
      color: "#A5E7FF",
      align: "center",
      glow: false,
      glowIntensity: 10
    },
    {
      id: "token-participant_name",
      type: "token",
      token: "participant_name",
      text: "Alex Morgan",
      x: 180,
      y: 140,
      fontFamily: "Sora",
      fontSize: 32,
      weight: "Bold",
      color: "#00d2ff",
      align: "center",
      glow: true,
      glowIntensity: 15
    },
    {
      id: "text-2",
      type: "static",
      text: "has successfully completed the",
      x: 180,
      y: 220,
      fontFamily: "Sora",
      fontSize: 16,
      weight: "Regular",
      color: "#A5E7FF",
      align: "center",
      glow: false,
      glowIntensity: 10
    },
    {
      id: "token-competition_name",
      type: "token",
      token: "competition_name",
      text: "Global Hackfest 2024",
      x: 180,
      y: 250,
      fontFamily: "Sora",
      fontSize: 24,
      weight: "Bold",
      color: "#ffffff",
      align: "center",
      glow: true,
      glowIntensity: 10
    }
  ]);
  const [selectedElementId, setSelectedElementId] = useState("token-participant_name");
  const [designerBackground, setDesignerBackground] = useState("");
  const [canvasBgColor, setCanvasBgColor] = useState("#0c0d12");
  const [showDesignerPreview, setShowDesignerPreview] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [autosaveText, setAutosaveText] = useState("Autosaved 2m ago");

  const handleUpdateSelectedElement = (updates) => {
    if (!selectedElementId) return;
    setDesignerElements(prev => prev.map(el => 
      el.id === selectedElementId ? { ...el, ...updates } : el
    ));
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggedElementId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let newX = Math.round(mouseX - dragOffset.x);
    let newY = Math.round(mouseY - dragOffset.y);
    
    if (e.shiftKey) {
      newX = Math.round(newX / 10) * 10;
      newY = Math.round(newY / 10) * 10;
    }
    
    newX = Math.max(0, Math.min(600, newX));
    newY = Math.max(0, Math.min(400, newY));
    
    setDesignerElements(prev => prev.map(el => 
      el.id === draggedElementId ? { ...el, x: newX, y: newY } : el
    ));
  };

  const handleCanvasMouseUp = () => {
    setDraggedElementId(null);
  };

  // Certificate Studio states
  const [showCertStudio, setShowCertStudio] = useState(false);
  const [activeCertParticipant, setActiveCertParticipant] = useState(null);
  
  // Custom certificate writings for current editor session
  const [certWritings, setCertWritings] = useState({
    title: "CERTIFICATE OF ACHIEVEMENT",
    subtitle: "OF ACHIEVEMENT",
    presentationText: "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
    recipientName: "Sarah Chen",
    description: "for successfully demonstrating outstanding skills, active collaboration, and technical proficiency during the event assemblies.",
    date: new Date().toLocaleDateString(),
    sig1Name: "Alex Rivera",
    sig1Title: "Festival Chair",
    sig2Name: "CertFIRE Secure",
    sig2Title: "Verified Protocol"
  });
  
  // Participant specific image
  const [participantImage, setParticipantImage] = useState(null);
  const [participantImageScale, setParticipantImageScale] = useState(1);
  const [participantImageX, setParticipantImageX] = useState(50);
  const [participantImageY, setParticipantImageY] = useState(50);
  const [participantImageShape, setParticipantImageShape] = useState("circle"); // circle or square
  const [showParticipantImage, setShowParticipantImage] = useState(true);

  // Sharing states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCertTitle, setShareCertTitle] = useState("");

  // Fest menu, edit, and delete states
  const [activeFestMenuId, setActiveFestMenuId] = useState(null);
  const [editFestModalOpen, setEditFestModalOpen] = useState(false);
  const [editingFest, setEditingFest] = useState(null);
  const [editFestForm, setEditFestForm] = useState({
    title: "",
    seats: "",
    fee: "",
    location: "",
    image: ""
  });

  const [selectedDashboardFest, setSelectedDashboardFest] = useState(null);
  const [showDashboardModal, setShowDashboardModal] = useState(false);

  const [userEmail, setUserEmail] = useState("");

  // Settings input states
  const [profileFullName, setProfileFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileOrg, setProfileOrg] = useState("");
  const [profileDept, setProfileDept] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileWebsite, setProfileWebsite] = useState("");
  const [profilePic, setProfilePic] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotification, setEmailNotification] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(true);
  const [autoIssueCert, setAutoIssueCert] = useState(false);
  
  const [systemLanguage, setSystemLanguage] = useState("English (US)");
  const [defaultCurrency, setDefaultCurrency] = useState("INR (₹)");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  
  const [preferredTheme, setPreferredTheme] = useState("cyan");
  const [isPicHovered, setIsPicHovered] = useState(false);

  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sentOtp, setSentOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");

  const getStorageKeys = (email = userEmail) => {
    const activeEmail = email || (typeof window !== "undefined" ? sessionStorage.getItem("userEmail") : "") || "alex.rivera@certfire.io";
    return {
      customFests: `customFests_${activeEmail}`,
      deletedDefaultFests: `deletedDefaultFests_${activeEmail}`,
      editedDefaultFests: `editedDefaultFests_${activeEmail}`,
      importedParticipants: `importedParticipants_${activeEmail}`,
      recentActivities: `recentActivities_${activeEmail}`,
      systemNotifications: `systemNotifications_${activeEmail}`
    };
  };


  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
        setUploadedFile({ name: file.name, size: file.size });
        setFileObject(file);
        showToast(`Selected file: ${file.name}`, "info");
      } else {
        showToast("Invalid file type. Please upload an Excel (.xlsx/.xls) or CSV (.csv) file.", "error");
      }
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({ name: file.name, size: file.size });
      setFileObject(file);
      showToast(`Selected file: ${file.name}`, "info");
    }
  };

  const onButtonClick = (e) => {
    if (uploadedFile) return;
    document.getElementById("input-file-upload").click();
  };

  const handleDownloadTemplate = () => {
    try {
      // Define columns
      const data = [
        ["Full Name", "Email Address", "Phone Number", "Festival Name"],
        ["Sarah Chen", "sarah.chen@university.edu", "+91 99881 22334", "PulseFest 2024"],
        ["Marcus Vance", "marcus.v@techinstitute.in", "+91 88776 55443", "Code Sprint 24h"],
        ["Arjun Mehta", "arjun.mehta@mit.edu.in", "+91 77665 44332", "PulseFest 2024"]
      ];
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Participants Template");
      
      // Trigger download
      XLSX.writeFile(workbook, "CertFIRE_Participants_Template.xlsx");
      showToast("Template downloaded successfully!", "success");
    } catch (err) {
      showToast("Failed to generate spreadsheet template.", "error");
    }
  };

  const handleSaveParticipant = () => {
    const { name, email, phone, fest, status } = modalForm;
    if (!name.trim() || !email.trim() || !phone.trim() || !fest.trim()) {
      showToast("Please fill in all participant details.", "error");
      return;
    }

    const keys = getStorageKeys();
    if (editIndex !== null) {
      // Editing existing participant
      const updated = importedParticipants.map((item, idx) => 
        idx === editIndex ? { ...item, name, email, phone, fest, status: status || item.status || "verified", certIssued: status === "issued" ? true : item.certIssued } : item
      );
      setImportedParticipants(updated);
      localStorage.setItem(keys.importedParticipants, JSON.stringify(updated));
      showToast("Participant details updated successfully.", "success");
      triggerNotificationAndActivity(
        "user",
        `✏️ Profile Updated: ${name}'s credentials saved`,
        `Updated registration details for <strong>${name}</strong>`
      );
    } else {
      // Adding new participant
      const uniqueId = `CF-${Array.from({length: 6}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))).join("")}-${new Date().getFullYear()}`;
      const newParticipant = {
        name,
        email,
        phone,
        fest,
        status: status || "verified",
        date: new Date().toLocaleDateString(),
        certIssued: status === "issued",
        certificate_id: uniqueId
      };
      const updatedNew = [...importedParticipants, newParticipant];
      setImportedParticipants(updatedNew);
      localStorage.setItem(keys.importedParticipants, JSON.stringify(updatedNew));
      showToast("New participant added successfully.", "success");
      triggerNotificationAndActivity(
        "user",
        `📢 New Registration: ${name} signed up for ${fest}`,
        `<strong>${name}</strong> joined ${fest}`
      );
    }
    setModalOpen(false);
  };

  const handleProcessUpload = () => {
    if (!uploadedFile || !fileObject) return;
    setProcessing(true);
    setUploadProgress(0);
    showToast("Reading spreadsheet data...", "info");

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays (header: 1 means we get rows as arrays)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          showToast("The sheet is empty or contains no participant rows.", "error");
          setProcessing(false);
          return;
        }

        // Parse headers to match columns dynamically
        const firstRow = rows[0].map(h => String(h || "").trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, ""));
        
        // 1. Keyword search indexes
        const nameKeywords = ["name", "fullname", "student", "participant", "user", "candidate", "first", "person", "attendee", "member"];
        const emailKeywords = ["email", "mail", "address", "contactmail", "inbox", "gmail", "emailaddress"];
        const phoneKeywords = ["phone", "mobile", "contact", "number", "tel", "whatsapp", "cell"];
        const festKeywords = ["fest", "event", "festival", "course", "topic", "subject", "class"];

        let nameIdx = firstRow.findIndex(h => nameKeywords.some(kw => h.includes(kw)));
        let emailIdx = firstRow.findIndex(h => emailKeywords.some(kw => h.includes(kw)));
        let phoneIdx = firstRow.findIndex(h => phoneKeywords.some(kw => h.includes(kw)));
        let festIdx = firstRow.findIndex(h => festKeywords.some(kw => h.includes(kw)));

        // 2. Scan content fallback auto-detection
        // If emailIdx is not found, search first 5 rows for standard email validation pattern (@ symbol)
        if (emailIdx === -1) {
          for (let r = 1; r < Math.min(rows.length, 6); r++) {
            const rowData = rows[r];
            if (!rowData) continue;
            const idx = rowData.findIndex(cell => cell && String(cell).includes("@"));
            if (idx !== -1) {
              emailIdx = idx;
              break;
            }
          }
        }

        // If phoneIdx is not found, search first 5 rows for columns containing digits and lengths >= 8
        if (phoneIdx === -1) {
          const phoneRegex = /^[+\d\s()-]{8,20}$/;
          for (let r = 1; r < Math.min(rows.length, 6); r++) {
            const rowData = rows[r];
            if (!rowData) continue;
            const idx = rowData.findIndex(cell => cell && phoneRegex.test(String(cell).trim()));
            if (idx !== -1 && idx !== emailIdx) {
              phoneIdx = idx;
              break;
            }
          }
        }

        // If nameIdx is still not found, default to first column (index 0) that isn't email or phone
        if (nameIdx === -1) {
          nameIdx = 0;
          if (nameIdx === emailIdx || nameIdx === phoneIdx) {
            // Find another column
            for (let c = 0; c < firstRow.length; c++) {
              if (c !== emailIdx && c !== phoneIdx) {
                nameIdx = c;
                break;
              }
            }
          }
        }

        const parsedRows = [];
        
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          // Skip empty rows
          if (!rowData || rowData.length === 0 || !rowData.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== "")) {
            continue;
          }
          
          const name = nameIdx !== -1 && rowData[nameIdx] ? String(rowData[nameIdx]).trim() : "Participant " + i;
          const email = emailIdx !== -1 && rowData[emailIdx] ? String(rowData[emailIdx]).trim() : "user" + i + "@certfire.io";
          const phone = phoneIdx !== -1 && rowData[phoneIdx] ? String(rowData[phoneIdx]).trim() : "+91 98765 43210";
          const fest = festIdx !== -1 && rowData[festIdx] ? String(rowData[festIdx]).trim() : "PulseFest 2024";

          const uniqueId = `CF-${Array.from({length: 6}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))).join("")}-${new Date().getFullYear()}`;

          parsedRows.push({
            name,
            email,
            phone,
            fest,
            status: "verified",
            date: new Date().toLocaleDateString(),
            certIssued: false,
            certificate_id: uniqueId
          });
        }

        if (parsedRows.length === 0) {
          showToast("No valid participant data found in the file.", "error");
          setProcessing(false);
          return;
        }

        // Run simulated import progress
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress += 10;
          setUploadProgress(currentProgress);
          if (currentProgress >= 100) {
            clearInterval(progressInterval);
            
            const keys = getStorageKeys();
            const existing = overwriteOnUpload ? [] : JSON.parse(localStorage.getItem(keys.importedParticipants) || "[]");
            const updated = [...existing, ...parsedRows];
            localStorage.setItem(keys.importedParticipants, JSON.stringify(updated));
            setImportedParticipants(updated);

            setProcessing(false);
            setUploadedFile(null);
            setFileObject(null);
            setShowUploadZone(false);
            
            showToast(`Successfully processed upload! ${parsedRows.length} participants registered in backend.`, "success");
            triggerNotificationAndActivity(
              "user",
              `📥 Import Successful: Added ${parsedRows.length} new registrations`,
              `Imported <strong>${parsedRows.length}</strong> participants from spreadsheet`
            );
          }
        }, 150);

      } catch (err) {
        showToast("Error processing sheet. Please ensure it's a valid Excel or CSV file.", "error");
        setProcessing(false);
      }
    };

    reader.readAsArrayBuffer(fileObject);
  };

  // Mock Active Fests
  const defaultFests = [];

  const [activeFests, setActiveFests] = useState([]);

  const reloadFests = (email = userEmail) => {
    const keys = getStorageKeys(email);
    const deletedDefaults = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(keys.deletedDefaultFests) || "[]") : [];
    const editedDefaults = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(keys.editedDefaultFests) || "[]") : [];
    const participantsList = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(keys.importedParticipants) || "[]") : [];
    
    const activeDefaults = defaultFests
      .filter(f => !deletedDefaults.includes(f.id))
      .map(f => {
        const edited = editedDefaults.find(e => e.id === f.id);
        const title = edited ? edited.title : f.title;
        const regCount = participantsList.filter(p => p.fest && p.fest.toLowerCase().trim() === title.toLowerCase().trim()).length;
        if (edited) {
          return {
            ...f,
            title: edited.title,
            image: edited.image || f.image,
            location: edited.location || f.location,
            metrics: [
              { label: "Registrations", value: regCount },
              { label: "Seats Available", value: edited.seats }
            ]
          };
        }
        return {
          ...f,
          metrics: [
            { label: "Registrations", value: regCount },
            ...f.metrics.slice(1)
          ]
        };
      });

    const custom = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(keys.customFests) || "[]") : [];
    const formattedCustom = custom.map(fest => {
      const regCount = participantsList.filter(p => p.fest && p.fest.toLowerCase().trim() === fest.title.toLowerCase().trim()).length;
      return {
        ...fest,
        badge: fest.isDraft ? "DRAFT" : "UPCOMING",
        badgeClass: fest.isDraft ? "badge-draft" : "badge-upcoming",
        metrics: [
          { label: "Registrations", value: regCount },
          { label: "Seats Available", value: fest.seats }
        ],
        btnText: fest.isDraft ? "Edit & Publish" : "Manage Dashboard",
        isDraft: fest.isDraft
      };
    });

    setActiveFests([...activeDefaults, ...formattedCustom]);

    // Fetch from database API
    const organiserId = sessionStorage.getItem("userId");
    if (organiserId) {
      fetch(`/api/organiser/fests?organiserId=${organiserId}`)
        .then(async (r) => {
          if (!r.ok) return;
          const data = await r.json();
          if (Array.isArray(data)) {
            const dbFests = data.map(f => ({
              id: f.id,
              title: f.title,
              category: f.category,
              location: f.venue || "Campus Venue",
              image: f.image || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=512",
              description: f.description,
              badge: f.is_draft ? "DRAFT" : "UPCOMING",
              badgeClass: f.is_draft ? "badge-draft" : "badge-upcoming",
              metrics: [
                { label: "Registrations", value: f.registrationCount || 0 },
                { label: "Seats Available", value: f.capacity }
              ],
              btnText: f.is_draft ? "Edit & Publish" : "Manage Dashboard",
              isDraft: f.is_draft
            }));

            setActiveFests(prev => {
              const seen = new Set();
              const result = [];
              // Add local custom fests
              formattedCustom.forEach(item => {
                seen.add(item.id);
                result.push(item);
              });
              // Add db fests
              dbFests.forEach(item => {
                if (!seen.has(item.id)) {
                  seen.add(item.id);
                  result.push(item);
                }
              });
              // Add default fests
              activeDefaults.forEach(item => {
                if (!seen.has(item.id)) {
                  seen.add(item.id);
                  result.push(item);
                }
              });
              return result;
            });
          }
        })
        .catch(err => console.warn("Failed to fetch fests from database:", err));
    }
  };

  // Dynamic Recent Activity Feed
  const [recentActivities, setRecentActivities] = useState([]);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Recently";
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const reloadRecentActivities = (currentParticipants = importedParticipants, currentStored = []) => {
    const keys = getStorageKeys();
    const rawStored = currentStored.length > 0 ? currentStored : JSON.parse(localStorage.getItem(keys.recentActivities) || "[]");
    
    // Filter out fake activities
    const realStored = rawStored.filter(act => act.id !== 1 && act.id !== 2 && act.id !== 3 && act.id !== 4);
    
    if (realStored.length !== rawStored.length) {
      localStorage.setItem(keys.recentActivities, JSON.stringify(realStored));
    }
    
    const derivedActivities = [];
    currentParticipants.forEach((p) => {
      const timestamp = p.timestamp || (p.date ? new Date(p.date).getTime() : Date.now()) || Date.now();
      
      // 1. Join activity
      derivedActivities.push({
        id: `reg-${p.email}-${p.fest}`,
        type: "user",
        text: `<strong>${p.name}</strong> joined ${p.fest}`,
        time: getRelativeTime(timestamp),
        timestamp: timestamp
      });
      
      // 2. Certificate issued activity
      if (p.certIssued || p.status === "issued") {
        derivedActivities.push({
          id: `cert-${p.email}-${p.fest}`,
          type: "cert",
          text: `Certificate issued for <strong>${p.fest}</strong> to <strong>${p.name}</strong>`,
          time: getRelativeTime(timestamp + 1000),
          timestamp: timestamp + 1000
        });
      }
    });

    const combined = [...derivedActivities, ...realStored];
    
    // Sort by timestamp or ID descending
    combined.sort((a, b) => {
      const valA = typeof a.id === 'number' ? a.id : a.timestamp || 0;
      const valB = typeof b.id === 'number' ? b.id : b.timestamp || 0;
      return valB - valA;
    });

    setRecentActivities(combined.slice(0, 10));
  };

  useEffect(() => {
    if (typeof window !== "undefined" && userEmail) {
      const keys = getStorageKeys();
      const storedActivities = JSON.parse(localStorage.getItem(keys.recentActivities) || "[]");
      reloadRecentActivities(importedParticipants, storedActivities);
    }
  }, [importedParticipants, userEmail]);

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

  const initializeDefaultWritings = (participant, template) => {
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

    setCertWritings({
      title,
      subtitle,
      presentationText: template === "completion" ? "THIS CERTIFIES THAT" : "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
      recipientName: participant.name,
      description: desc,
      date: new Date().toLocaleDateString(),
      sig1Name: "Alex Rivera",
      sig1Title: "Festival Organizer",
      sig2Name: "CertFIRE Secure",
      sig2Title: "Verified Protocol"
    });
    
    setParticipantImage(null);
    setParticipantImageScale(1);
    setParticipantImageX(100);
    setParticipantImageY(80);
    setParticipantImageShape("circle");
    setShowParticipantImage(false);
  };

  const handleStatusChange = (participant, newStatus) => {
    const keys = getStorageKeys();
    const updated = importedParticipants.map((item) => 
      (participant.email === item.email && participant.fest === item.fest) 
        ? { ...item, status: newStatus, certIssued: newStatus === "issued" ? true : item.certIssued } 
        : item
    );
    setImportedParticipants(updated);
    localStorage.setItem(keys.importedParticipants, JSON.stringify(updated));

    // Database Sync
    const registrationId = participant.dbRegistrationId || participant.id;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(registrationId);
    
    if (isUuid) {
      fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, status: newStatus.toUpperCase() })
      })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to update registration status");
        showToast("Registration status updated in database!", "success");
      })
      .catch((err) => {
        console.warn("DB registration status update failed:", err.message);
      });
    }

    showToast(`Status updated to ${newStatus.toUpperCase()} for ${participant.name}!`, "success");
    triggerNotificationAndActivity(
      newStatus === "issued" ? "cert" : "user",
      `🔄 Status Changed: ${participant.name} is now ${newStatus.toUpperCase()}`,
      `Registration status for <strong>${participant.name}</strong> set to <span style="text-transform: uppercase;">${newStatus}</span>`
    );
  };

  const handleDirectPublish = (fest) => {
    const keys = getStorageKeys();
    const custom = JSON.parse(localStorage.getItem(keys.customFests) || "[]");
    
    const updated = custom.map(f => {
      if (f.id === fest.id) {
        return { 
          ...f, 
          isDraft: false 
        };
      }
      return f;
    });
    
    localStorage.setItem(keys.customFests, JSON.stringify(updated));
    
    // Create system notification for all students (global key)
    const globalNotifications = JSON.parse(localStorage.getItem("systemNotifications") || "[]");
    globalNotifications.unshift({
      id: Date.now(),
      message: `📢 New Event: "${fest.title}" has been published by ${fest.rawOrganizerName || fest.organizer || "Organizer"}!`,
      date: new Date().toLocaleDateString(),
      unread: true
    });
    localStorage.setItem("systemNotifications", JSON.stringify(globalNotifications));

    // Also notify the organizer dashboard logs (organizer specific key)
    const orgNotifications = JSON.parse(localStorage.getItem(keys.systemNotifications) || "[]");
    orgNotifications.unshift({
      id: Date.now(),
      message: `📢 Event Published: "${fest.title}" has been successfully published!`,
      date: new Date().toLocaleDateString(),
      unread: true
    });
    localStorage.setItem(keys.systemNotifications, JSON.stringify(orgNotifications));

    showToast(`Successfully published ${fest.title}!`, "success");
    reloadFests();
  };

  const handleOpenCertStudio = (participant) => {
    setActiveCertParticipant(participant);
    
    // Load custom configuration if it exists
    const savedConfig = localStorage.getItem(`customCert_${participant.email}_${participant.fest}`);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setCertWritings(config.writings);
        setParticipantImage(config.participantImage || null);
        setParticipantImageScale(config.participantImageScale || 1);
        setParticipantImageX(config.participantImageX || 100);
        setParticipantImageY(config.participantImageY || 80);
        setParticipantImageShape(config.participantImageShape || "circle");
        setShowParticipantImage(config.showParticipantImage !== false);
        if (config.template) {
          setSelectedTemplate(config.template);
        }
      } catch (e) {
        initializeDefaultWritings(participant, selectedTemplate);
      }
    } else {
      initializeDefaultWritings(participant, selectedTemplate);
    }
    
    setShowCertStudio(true);
  };

  const handleSaveCertStudio = () => {
    if (!activeCertParticipant) return;
    
    const keys = getStorageKeys();
    const config = {
      writings: certWritings,
      participantImage,
      participantImageScale,
      participantImageX,
      participantImageY,
      participantImageShape,
      showParticipantImage,
      template: selectedTemplate
    };
    
    localStorage.setItem(
      `customCert_${activeCertParticipant.email}_${activeCertParticipant.fest}`,
      JSON.stringify(config)
    );
    
    // Also mark certificate as issued!
    const updated = importedParticipants.map((item) => 
      (activeCertParticipant.email === item.email && activeCertParticipant.fest === item.fest) ? { ...item, certIssued: true, status: "issued" } : item
    );
    setImportedParticipants(updated);
    localStorage.setItem(keys.importedParticipants, JSON.stringify(updated));

    // Database Sync
    const registrationId = activeCertParticipant.dbRegistrationId || activeCertParticipant.id;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(registrationId);
    if (isUuid) {
      fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, status: "ISSUED" })
      })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to update cert status in database");
      })
      .catch((err) => console.warn(err));
    }
    
    showToast(`Certificate configuration saved and certificate issued for ${activeCertParticipant.name}!`, "success");
    triggerNotificationAndActivity(
      "cert",
      `🎓 Certificate issued: Verification credential generated for ${activeCertParticipant.name}`,
      `Certificate issued to <strong>${activeCertParticipant.name}</strong> for ${activeCertParticipant.fest}`
    );
    setShowCertStudio(false);
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

  const handleShareCertStudio = () => {
    setShareCertTitle(`Certificate of ${certWritings.recipientName}`);
    setShowShareModal(true);
  };

  useEffect(() => {
    // 0. Load globally selected template preference
    const savedGlobalTpl = localStorage.getItem("globalSelectedTemplate");
    if (savedGlobalTpl) {
      setSelectedTemplate(savedGlobalTpl);
    }

    const savedElements = localStorage.getItem("customDesignerElements");
    if (savedElements) {
      try {
        setDesignerElements(JSON.parse(savedElements));
      } catch (e) {}
    }
    const savedBg = localStorage.getItem("customDesignerBackground");
    if (savedBg) {
      setDesignerBackground(savedBg);
    }
    const savedBgCol = localStorage.getItem("customDesignerBgColor");
    if (savedBgCol) {
      setCanvasBgColor(savedBgCol);
    }

    // 1. Authentication Check
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    const userRole = sessionStorage.getItem("userRole");

    if (!isLoggedIn || userRole !== "organizer") {
      router.push("/login?redirect=/organizer-dashboard");
      return;
    }

    // 2. Fetch User Info
    const storedName = sessionStorage.getItem("userName") || "Alex Rivera";
    const storedEmail = sessionStorage.getItem("userEmail") || "alex.rivera@certfire.io";
    setFullName(storedName);
    setUserName(storedName.split(" ")[0]);
    setUserEmail(storedEmail);

    setProfileFullName(storedName);
    setProfileEmail(storedEmail);
    
    const emailLower = storedEmail.toLowerCase();
    const storedPhone = localStorage.getItem(`profilePhone_${emailLower}`) || "+91 99881 22334";
    const storedOrg = localStorage.getItem(`profileOrg_${emailLower}`) || "CertFIRE Official";
    const storedDept = localStorage.getItem(`profileDept_${emailLower}`) || "";
    const storedRole = localStorage.getItem(`profileRole_${emailLower}`) || "";
    const storedUsername = localStorage.getItem(`profileUsername_${emailLower}`) || storedName.split(" ")[0].toLowerCase();
    const storedBio = localStorage.getItem(`profileBio_${emailLower}`) || "CertFIRE is dedicated to revolutionizing technical festivals through advanced registration and analytics tooling.";
    const storedWebsite = localStorage.getItem(`profileWebsite_${emailLower}`) || "https://certfire.io";
    const storedPic = localStorage.getItem(`profilePic_${emailLower}`) || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&auto=format&fit=crop";

    const storedSigName = localStorage.getItem(`signatoryName_${emailLower}`) || "Alex Rivera";
    const storedSigTitle = localStorage.getItem(`signatoryTitle_${emailLower}`) || "Managing Director";
    const storedLang = localStorage.getItem(`systemLanguage_${emailLower}`) || "English (US)";
    const storedCurr = localStorage.getItem(`defaultCurrency_${emailLower}`) || "INR (₹)";

    setProfilePhone(storedPhone);
    setProfileOrg(storedOrg);
    setProfileDept(storedDept);
    setProfileRole(storedRole);
    setProfileUsername(storedUsername);
    setProfileBio(storedBio);
    setProfileWebsite(storedWebsite);
    setProfilePic(storedPic);
    
    setSignatoryName(storedSigName);
    setSignatoryTitle(storedSigTitle);
    setSystemLanguage(storedLang);
    setDefaultCurrency(storedCurr);

    const savedEmailNotif = localStorage.getItem(`emailNotif_${emailLower}`);
    if (savedEmailNotif !== null) setEmailNotification(savedEmailNotif === "true");

    const savedPush = localStorage.getItem(`pushAlerts_${emailLower}`);
    if (savedPush !== null) setPushAlerts(savedPush === "true");

    const savedSms = localStorage.getItem(`smsMarketing_${emailLower}`);
    if (savedSms !== null) setSmsMarketing(savedSms === "true");

    const savedAutoIssue = localStorage.getItem(`autoIssue_${emailLower}`);
    if (savedAutoIssue !== null) setAutoIssueCert(savedAutoIssue === "true");

    const savedTheme = localStorage.getItem(`preferredTheme_${emailLower}`) || "cyan";
    setPreferredTheme(savedTheme);

    const keys = getStorageKeys(storedEmail);

    // 3. Load notifications
    const storedNotifs = JSON.parse(localStorage.getItem(keys.systemNotifications) || "[]");
    // Fallback if none exist
    if (storedNotifs.length === 0) {
      const initialNotifs = [
        {
          id: 101,
          message: "📢 New Event: PulseFest 2024 registrations are live!",
          date: new Date().toLocaleDateString(),
          unread: true
        },
        {
          id: 102,
          message: "💳 Payout processed successfully for your account.",
          date: new Date().toLocaleDateString(),
          unread: false
        }
      ];
      localStorage.setItem(keys.systemNotifications, JSON.stringify(initialNotifs));
      setNotificationsList(initialNotifs);
    } else {
      setNotificationsList(storedNotifs);
    }

    // 4. Load Custom & Default Fests
    reloadFests(storedEmail);

    // 5. Load imported participants
    const storedParticipants = JSON.parse(localStorage.getItem(keys.importedParticipants) || "[]");
    let needsSave = false;
    const healedParticipants = storedParticipants.map(p => {
      if (!p.certificate_id) {
        const uniqueId = `CF-${Array.from({length: 6}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))).join("")}-${new Date().getFullYear()}`;
        p.certificate_id = uniqueId;
        needsSave = true;
      }
      return p;
    });
    if (needsSave) {
      localStorage.setItem(keys.importedParticipants, JSON.stringify(healedParticipants));
    }
    setImportedParticipants(healedParticipants);

    // Fetch registrations from database API
    const organiserId = sessionStorage.getItem("userId");
    if (organiserId) {
      fetch("/api/admin/registrations")
        .then(async (r) => {
          if (!r.ok) return;
          const data = await r.json();
          if (Array.isArray(data)) {
            // Filter to registrations belonging to fests organized by this organizer
            const myRegistrations = data.filter(reg => reg.fests?.organiser_id === organiserId);
            const dbParticipants = myRegistrations.map(reg => ({
              id: reg.id,
              name: reg.profiles?.name || "Participant",
              email: reg.profiles?.email || "",
              phone: reg.phone || "+91 99881 22334",
              fest: reg.fests?.title || "Fest",
              status: reg.status ? reg.status.toLowerCase() : "verified",
              date: reg.created_at ? new Date(reg.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
              certIssued: reg.cert_issued,
              certificate_id: reg.certificate_id,
              dbRegistrationId: reg.id,
              dbFestId: reg.fest_id
            }));

            setImportedParticipants(prev => {
              const seen = new Set(prev.map(p => `${p.email.toLowerCase()}_${p.fest.toLowerCase()}`));
              const result = [...prev];
              dbParticipants.forEach(p => {
                const pKey = `${p.email.toLowerCase()}_${p.fest.toLowerCase()}`;
                if (!seen.has(pKey)) {
                  seen.add(pKey);
                  result.push(p);
                }
              });
              return result;
            });
          }
        })
        .catch(err => console.warn("Failed to load registrations from database:", err));
    }

    // 6. Load recent activities (handled dynamically by useEffect hook)
  }, [router]);

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveFestMenuId(null);
    };
    window.addEventListener("click", handleDocumentClick);
    return () => window.removeEventListener("click", handleDocumentClick);
  }, []);

  const toggleFestMenu = (festId, e) => {
    e.stopPropagation();
    if (activeFestMenuId === festId) {
      setActiveFestMenuId(null);
    } else {
      setActiveFestMenuId(festId);
    }
  };

  const handleEditFest = (fest) => {
    const keys = getStorageKeys();
    let festToEdit = fest;
    if (String(fest.id).startsWith("custom-")) {
      const customFests = JSON.parse(localStorage.getItem(keys.customFests) || "[]");
      festToEdit = customFests.find(f => f.id === fest.id) || fest;
    } else {
      const editedDefaults = JSON.parse(localStorage.getItem(keys.editedDefaultFests) || "[]");
      festToEdit = editedDefaults.find(f => f.id === fest.id) || fest;
    }
    
    setEditingFest(festToEdit);
    setEditFestForm({
      title: festToEdit.title,
      seats: festToEdit.seats ? String(festToEdit.seats).split(" ")[0] : "500",
      fee: festToEdit.fee ? String(festToEdit.fee).replace(/[^0-9]/g, "") : "0",
      location: festToEdit.location || "Virtual Link",
      image: festToEdit.image || ""
    });
    setActiveFestMenuId(null);
    setEditFestModalOpen(true);
  };

  const handleSaveFestEdit = () => {
    if (!editingFest) return;
    
    const { title, seats, fee, location, image } = editFestForm;
    if (!title.trim() || !location.trim()) {
      showToast("Title and Location/Venue are required.", "error");
      return;
    }
    
    const parsedFee = !fee || fee === "0" ? "Free Entry" : "₹" + fee + " INR";
    const parsedSeats = (seats || "500") + " Seats";
    
    const keys = getStorageKeys();
    if (String(editingFest.id).startsWith("custom-")) {
      const customFests = JSON.parse(localStorage.getItem(keys.customFests) || "[]");
      const updatedCustom = customFests.map(f => 
        f.id === editingFest.id 
          ? { ...f, title, location, image, fee: parsedFee, seats: parsedSeats } 
          : f
      );
      localStorage.setItem(keys.customFests, JSON.stringify(updatedCustom));
    } else {
      const editedDefaults = JSON.parse(localStorage.getItem(keys.editedDefaultFests) || "[]");
      const existingIdx = editedDefaults.findIndex(f => f.id === editingFest.id);
      
      const newEdit = {
        id: editingFest.id,
        title,
        location,
        image: image || editingFest.image,
        fee: parsedFee,
        seats: parsedSeats
      };
      
      if (existingIdx !== -1) {
        editedDefaults[existingIdx] = newEdit;
      } else {
        editedDefaults.push(newEdit);
      }
      localStorage.setItem(keys.editedDefaultFests, JSON.stringify(editedDefaults));
    }
    
    reloadFests();
    
    showToast(`Fest "${title}" updated successfully!`, "success");
    triggerNotificationAndActivity(
      "user",
      `✏️ Fest Updated: Details saved for "${title}"`,
      `Updated event settings for <strong>${title}</strong>`
    );
    setEditFestModalOpen(false);
  };

  const handleDeleteFest = (fest) => {
    if (!confirm(`Are you sure you want to delete the festival "${fest.title}"? This will remove all registrations associated with it.`)) {
      setActiveFestMenuId(null);
      return;
    }
    
    const keys = getStorageKeys();
    if (String(fest.id).startsWith("custom-")) {
      const customFests = JSON.parse(localStorage.getItem(keys.customFests) || "[]");
      const updatedCustom = customFests.filter(f => f.id !== fest.id);
      localStorage.setItem(keys.customFests, JSON.stringify(updatedCustom));
    } else {
      const deletedDefaults = JSON.parse(localStorage.getItem(keys.deletedDefaultFests) || "[]");
      if (!deletedDefaults.includes(fest.id)) {
        deletedDefaults.push(fest.id);
      }
      localStorage.setItem(keys.deletedDefaultFests, JSON.stringify(deletedDefaults));
    }
    
    reloadFests();
    
    const storedParticipants = JSON.parse(localStorage.getItem(keys.importedParticipants) || "[]");
    const remainingParticipants = storedParticipants.filter(p => p.fest !== fest.title);
    setImportedParticipants(remainingParticipants);
    localStorage.setItem(keys.importedParticipants, JSON.stringify(remainingParticipants));
    
    showToast(`Fest "${fest.title}" has been deleted.`, "info");
    triggerNotificationAndActivity(
      "user",
      `🗑️ Fest Deleted: "${fest.title}" removed from dashboard`,
      `Deleted festival event <strong>${fest.title}</strong>`
    );
    setActiveFestMenuId(null);
  };
  const handleDeleteAllFests = () => {
    if (!confirm("Are you sure you want to delete ALL festivals? This will remove all default and custom festivals, and clear all registrations associated with them.")) {
      return;
    }
    
    const keys = getStorageKeys();
    localStorage.setItem(keys.customFests, "[]");
    
    const allDefaultIds = defaultFests.map(f => f.id);
    localStorage.setItem(keys.deletedDefaultFests, JSON.stringify(allDefaultIds));
    
    reloadFests();
    
    setImportedParticipants([]);
    localStorage.setItem(keys.importedParticipants, "[]");
    
    showToast("All festivals and registrations have been deleted.", "info");
    triggerNotificationAndActivity(
      "user",
      `🗑️ All Fests Deleted: Cleared all event data from console`,
      `Deleted all festivals and registrations`
    );
  };

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const triggerNotificationAndActivity = (type, message, activityText) => {
    const keys = getStorageKeys();
    // 1. Add notification
    const newNotif = {
      id: Date.now(),
      message,
      date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: true
    };
    const updatedNotifs = [newNotif, ...notificationsList];
    setNotificationsList(updatedNotifs);
    localStorage.setItem(keys.systemNotifications, JSON.stringify(updatedNotifs));

    // 2. Add activity
    const newActivity = {
      id: Date.now() + 1,
      type,
      text: activityText,
      time: "Just now"
    };
    const storedActivities = JSON.parse(localStorage.getItem(keys.recentActivities) || "[]");
    const updatedActivities = [newActivity, ...storedActivities].slice(0, 50);
    localStorage.setItem(keys.recentActivities, JSON.stringify(updatedActivities));
    reloadRecentActivities(importedParticipants, updatedActivities);
  };

  const handleSendPasswordOtp = () => {
    setOtpSending(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(code);
      setOtpSent(true);
      setOtpSending(false);
      showToast(`Verification OTP sent to your email: ${code}`, "success");
    }, 1000);
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    handleSaveAllSettings();
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }
    
    const emailLower = userEmail.toLowerCase();
    const storedUserJson = localStorage.getItem(emailLower);
    let actualPassword = "password";
    
    if (storedUserJson) {
      const storedUser = JSON.parse(storedUserJson);
      actualPassword = storedUser.password;
    } else {
      actualPassword = localStorage.getItem(`userPassword_${emailLower}`) || "password";
    }
    
    if (currentPassword !== actualPassword) {
      showToast("Current password is incorrect.", "error");
      return;
    }
    
    // Save new password
    if (storedUserJson) {
      const storedUser = JSON.parse(storedUserJson);
      storedUser.password = newPassword;
      localStorage.setItem(emailLower, JSON.stringify(storedUser));
    } else {
      localStorage.setItem(`userPassword_${emailLower}`, newPassword);
    }
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    
    showToast("Password updated successfully! Logging out...", "success");
    
    triggerNotificationAndActivity(
      "user",
      `🔒 Security Update: Password changed`,
      `Account password updated successfully`
    );
    
    setTimeout(() => {
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("userEmail");
      router.push("/login?message=password_updated");
    }, 2000);
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    handleSaveAllSettings();
  };

  const handleDiscardAllChanges = () => {
    const storedName = sessionStorage.getItem("userName") || "Alex Rivera";
    const storedEmail = sessionStorage.getItem("userEmail") || "alex.rivera@certfire.io";
    
    setProfileFullName(storedName);
    setProfileEmail(storedEmail);
    
    const emailLower = storedEmail.toLowerCase();
    const storedPhone = localStorage.getItem(`profilePhone_${emailLower}`) || "+91 99881 22334";
    const storedOrg = localStorage.getItem(`profileOrg_${emailLower}`) || "CertFIRE Official";
    const storedDept = localStorage.getItem(`profileDept_${emailLower}`) || "";
    const storedRole = localStorage.getItem(`profileRole_${emailLower}`) || "";
    const storedUsername = localStorage.getItem(`profileUsername_${emailLower}`) || storedName.split(" ")[0].toLowerCase();
    const storedBio = localStorage.getItem(`profileBio_${emailLower}`) || "CertFIRE is dedicated to revolutionizing technical festivals through advanced registration and analytics tooling.";
    const storedWebsite = localStorage.getItem(`profileWebsite_${emailLower}`) || "https://certfire.io";
    const storedPic = localStorage.getItem(`profilePic_${emailLower}`) || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&auto=format&fit=crop";

    const storedSigName = localStorage.getItem(`signatoryName_${emailLower}`) || "Alex Rivera";
    const storedSigTitle = localStorage.getItem(`signatoryTitle_${emailLower}`) || "Managing Director";
    const storedLang = localStorage.getItem(`systemLanguage_${emailLower}`) || "English (US)";
    const storedCurr = localStorage.getItem(`defaultCurrency_${emailLower}`) || "INR (₹)";

    setProfilePhone(storedPhone);
    setProfileOrg(storedOrg);
    setProfileDept(storedDept);
    setProfileRole(storedRole);
    setProfileUsername(storedUsername);
    setProfileBio(storedBio);
    setProfileWebsite(storedWebsite);
    setProfilePic(storedPic);

    setSignatoryName(storedSigName);
    setSignatoryTitle(storedSigTitle);
    setSystemLanguage(storedLang);
    setDefaultCurrency(storedCurr);

    const savedEmailNotif = localStorage.getItem(`emailNotif_${emailLower}`);
    if (savedEmailNotif !== null) setEmailNotification(savedEmailNotif === "true");

    const savedPush = localStorage.getItem(`pushAlerts_${emailLower}`);
    if (savedPush !== null) setPushAlerts(savedPush === "true");

    const savedSms = localStorage.getItem(`smsMarketing_${emailLower}`);
    if (savedSms !== null) setSmsMarketing(savedSms === "true");

    const savedAutoIssue = localStorage.getItem(`autoIssue_${emailLower}`);
    if (savedAutoIssue !== null) setAutoIssueCert(savedAutoIssue === "true");

    const savedTheme = localStorage.getItem(`preferredTheme_${emailLower}`) || "cyan";
    setPreferredTheme(savedTheme);

    showToast("Changes discarded. Resetting forms.", "info");
  };

  const handleSaveAllSettings = () => {
    if (!profileFullName.trim() || !profileUsername.trim()) {
      showToast("Please fill in all required profile fields.", "error");
      return;
    }

    setFullName(profileFullName.trim());
    setUserName(profileUsername.trim());
    
    sessionStorage.setItem("userName", profileFullName.trim());
    
    const emailLower = userEmail.toLowerCase();
    localStorage.setItem(`profilePhone_${emailLower}`, profilePhone);
    localStorage.setItem(`profileOrg_${emailLower}`, profileOrg);
    localStorage.setItem(`profileDept_${emailLower}`, profileDept);
    localStorage.setItem(`profileRole_${emailLower}`, profileRole);
    localStorage.setItem(`profileUsername_${emailLower}`, profileUsername.trim());
    localStorage.setItem(`profileBio_${emailLower}`, profileBio);
    localStorage.setItem(`profileWebsite_${emailLower}`, profileWebsite);
    localStorage.setItem(`profilePic_${emailLower}`, profilePic);
    
    localStorage.setItem(`signatoryName_${emailLower}`, signatoryName);
    localStorage.setItem(`signatoryTitle_${emailLower}`, signatoryTitle);
    localStorage.setItem(`systemLanguage_${emailLower}`, systemLanguage);
    localStorage.setItem(`defaultCurrency_${emailLower}`, defaultCurrency);
    
    localStorage.setItem(`emailNotif_${emailLower}`, emailNotification);
    localStorage.setItem(`pushAlerts_${emailLower}`, pushAlerts);
    localStorage.setItem(`smsMarketing_${emailLower}`, smsMarketing);

    showToast("Settings and preferences saved successfully!", "success");
    triggerNotificationAndActivity(
      "settings",
      `⚙️ Settings Saved: Profile, Branding, and Notifications updated`,
      `Updated console settings and branding preferences`
    );
  };

  const handleProfilePicChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image size must be less than 2MB", "error");
        return;
      }
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          setProfilePic(reader.result);
          showToast("Organizer picture updated! (Click Save Preferences below to persist)", "success");
        };
      } else {
        showToast("Please upload a valid image file (PNG/JPG).", "error");
      }
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out from the Organizer Console?")) {
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("userEmail");
      router.push("/");
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkNotifRead = (id) => {
    const keys = getStorageKeys();
    const updated = notificationsList.map(n => 
      n.id === id ? { ...n, unread: false } : n
    );
    setNotificationsList(updated);
    localStorage.setItem(keys.systemNotifications, JSON.stringify(updated));
  };

  const handleClearNotifications = () => {
    const keys = getStorageKeys();
    setNotificationsList([]);
    localStorage.setItem(keys.systemNotifications, "[]");
  };

  const handleExportAnalytics = () => {
    showToast("Compiling analytics data...", "info");
    
    setTimeout(() => {
      try {
        let csvContent = "";
        
        // 1. Festival Overview Section
        csvContent += "=== FESTIVAL OVERVIEW SUMMARY ===\n";
        csvContent += "Festival Title,Event Date,Venue/Location,Capacity,Total Registrations,Status\n";
        
        activeFests.forEach(fest => {
          const regCount = importedParticipants.filter(
            p => p.fest && p.fest.toLowerCase().trim() === fest.title.toLowerCase().trim()
          ).length;
          
          const title = (fest.title || "").replace(/"/g, '""').replace(/,/g, " ");
          const date = (fest.date || "").replace(/"/g, '""').replace(/,/g, " ");
          const venue = (fest.venue || "").replace(/"/g, '""').replace(/,/g, " ");
          const capacity = fest.capacity || "N/A";
          const status = fest.isDraft ? "DRAFT" : (fest.badge || "UPCOMING");
          
          csvContent += `"${title}","${date}","${venue}","${capacity}","${regCount}","${status}"\n`;
        });
        
        csvContent += "\n";
        
        // 2. Participant Roster Section
        csvContent += "=== REGISTERED PARTICIPANTS ROSTER ===\n";
        csvContent += "Participant Name,Email Address,Phone Number,Festival,Certificate ID,Registration Status,Certificate Issued\n";
        
        importedParticipants.forEach(p => {
          const name = (p.name || "").replace(/"/g, '""').replace(/,/g, " ");
          const email = (p.email || "").replace(/"/g, '""').replace(/,/g, " ");
          const phone = (p.phone || "").replace(/"/g, '""').replace(/,/g, " ");
          const fest = (p.fest || "").replace(/"/g, '""').replace(/,/g, " ");
          const certId = p.certificate_id || p.id || "N/A";
          const status = p.status || "verified";
          const issued = p.certIssued ? "YES" : "NO";
          
          csvContent += `"${name}","${email}","${phone}","${fest}","${certId}","${status.toUpperCase()}","${issued}"\n`;
        });
        
        // Create Blob and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `CertFIRE_Analytics_Report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast("Analytics CSV exported successfully!", "success");
      } catch (error) {
        console.error("Export analytics error:", error);
        showToast("Failed to export analytics report.", "error");
      }
    }, 1200);
  };

  // Tab selections feedback
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab !== "overview") {
      showToast(`Navigated to organizer tab: ${tab.charAt(0).toUpperCase() + tab.slice(1)}`, "info");
    }
  };

  // Search filter
  const filteredFests = activeFests.filter(fest => 
    fest.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParticipants = importedParticipants.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fest.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFest = selectedFestFilter === "all" || p.fest === selectedFestFilter;
    return matchesSearch && matchesFest;
  });

  // Dynamic stats calculation
  const totalParticipantsCount = importedParticipants.length;
  const activeFestsCount = activeFests.filter(fest => fest.id.startsWith("custom-")).length;
  const certsIssuedCount = importedParticipants.filter(p => p.certIssued).length;

  const getRevenue = () => {
    let total = 0;
    const keys = getStorageKeys();
    const custom = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(keys.customFests) || localStorage.getItem("customFests") || "[]") : [];
    importedParticipants.forEach(p => {
      // 1. Check custom fests
      const customFest = custom.find(f => f.title === p.fest);
      if (customFest) {
        if (customFest.fee && !customFest.fee.toLowerCase().includes("free")) {
          const amount = parseInt(customFest.fee.replace(/[^0-9]/g, ""), 10);
          if (!isNaN(amount)) total += amount;
        }
      } else {
        // 2. Check predefined events
        const predefinedFest = PREDEFINED_EVENTS.find(f => f.title === p.fest);
        if (predefinedFest) {
          if (predefinedFest.fee && !predefinedFest.fee.toLowerCase().includes("free")) {
            const amount = parseInt(predefinedFest.fee.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(amount)) total += amount;
          }
        } else if (p.fest === "PulseFest 2024") {
          total += 1200;
        } else if (p.fest === "Code Sprint 24h") {
          total += 500;
        } else {
          // Fallback charge for untracked custom typed fests
          total += 100;
        }
      }
    });
    return total;
  };

  const totalRevenue = getRevenue();

  const formatRevenue = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
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
      const bgStyle = designerBackground 
        ? { backgroundImage: `url(${designerBackground})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: canvasBgColor }
        : { backgroundColor: canvasBgColor, border: "4px double var(--color-cyan)" };

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
          {designerElements.map((el) => {
            let displayText = el.text;
            if (el.type === "token") {
              if (el.token === "participant_name") displayText = recipientName || "Alex Morgan";
              else if (el.token === "competition_name") displayText = activeCertParticipant?.fest || "Global Hackfest 2024";
              else if (el.token === "date") displayText = date || new Date().toLocaleDateString();
              else if (el.token === "certificate_id") displayText = activeCertParticipant?.certificate_id || activeCertParticipant?.id || "CF-889-2024";
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
                const possibleVal = activeCertParticipant ? (activeCertParticipant[el.token] || activeCertParticipant[el.token.toUpperCase()] || activeCertParticipant[el.token.toLowerCase()]) : null;
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

  return (
    <div className="console-dashboard-layout">
      {/* 1. Left Sidebar Navigation */}
      <aside className="console-sidebar">
        <div className="console-sidebar-header">
          <div className="console-sidebar-logo">
            Cert<span>FIRE</span>
          </div>
          <div className="console-sidebar-subtitle">FESTIVAL PORTAL</div>
        </div>

        {/* Navigation list */}
        <nav className="console-menu-list">
          <div 
            className={`console-menu-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabClick("overview")}
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
            onClick={() => handleTabClick("my-fests")}
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
            className={`console-menu-item ${activeTab === "participants" ? "active" : ""}`}
            onClick={() => handleTabClick("participants")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Participants</span>
          </div>

          <div 
            className={`console-menu-item ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => handleTabClick("analytics")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Analytics</span>
          </div>

          <div 
            className={`console-menu-item ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => handleTabClick("templates")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="8" r="3" />
              <path d="m9 11 2 2 4-4" />
            </svg>
            <span>Certificate Designer</span>
          </div>

          <div 
            className={`console-menu-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleTabClick("settings")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </div>
        </nav>

        {/* Sidebar bottom Action */}
        <div className="console-sidebar-actions-wrapper">
          <Link href="/create-fest" className="console-sidebar-btn-gradient">
            New Festival
          </Link>
        </div>

        {/* Sidebar bottom Profile */}
        <div className="console-sidebar-profile" style={{ cursor: "pointer" }} onClick={handleLogout}>
          <div className="console-profile-avatar">
            <img 
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&auto=format&fit=crop" 
              alt="Organizer Avatar" 
            />
          </div>
          <div className="console-profile-info">
            <span className="console-profile-name">{fullName}</span>
            <span className="console-profile-role">PRO ORGANIZER</span>
          </div>
        </div>
      </aside>

      {/* 2. Main content workspace area */}
      <main className="console-main">
        {/* Top header search + notifications */}
        <header className="console-header">
          <div className="console-search-wrapper">
            <span className="console-search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder={activeTab === "participants" ? "Search participants..." : "Search festivals, participants"}
              className="console-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="console-header-actions">
            <div style={{ position: "relative" }}>
              <button className="console-notif-btn" onClick={toggleNotifications}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationsList.some(n => n.unread) && (
                  <span className="console-notif-dot"></span>
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
                      <button onClick={handleClearNotifications} style={{ fontSize: "0.75rem", color: "var(--color-pink)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Clear All</button>
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
                          onClick={() => handleMarkNotifRead(notif.id)}
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
          </div>
        </header>

        {/* Overview Tab Content */}
        {activeTab === "overview" ? (
          <>
            {/* Welcome banner section */}
            <section className="console-welcome-section">
              <div className="console-welcome-text">
                <h1>Welcome back, <span>{userName}!</span></h1>
                <div className="console-welcome-sub">
                  <span className="console-surge-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    15% surge
                  </span>
                  <span>in registrations across all active events this week.</span>
                </div>
              </div>

              <div className="console-welcome-actions">
                <button className="console-btn-secondary" onClick={handleExportAnalytics}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export Analytics
                </button>
                <button className="console-btn-welcome-upload" onClick={() => { setActiveTab("participants"); showToast("Bulk Upload portal opened.", "info"); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  Upload Excel
                </button>
                <Link href="/create-fest" className="console-btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L15 9" />
                    <path d="M22 2a27.9 27.9 0 0 0-15 15l-3 3-1-1 3-3A27.9 27.9 0 0 0 21 2z" />
                    <path d="M7 17l-4 4" />
                    <path d="M17 7l-4 4" />
                    <path d="M9 15l-6 1a1 1 0 0 0-.8.8l-.2 1.4L4 20l2 2 .8-.2a1 1 0 0 0 .8-.8z" />
                  </svg>
                  Create New Fest
                </Link>
              </div>
            </section>

            {/* Stats metrics row */}
            <section className="console-stats-grid">
              {/* Card 1: Total Participants */}
              <div className="console-stat-card">
                <div className="console-stat-label">Total Participants</div>
                <div className="console-stat-value">
                  {totalParticipantsCount}
                </div>
                <div className="console-stat-trend console-trend-up">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                  <span>{totalParticipantsCount > 0 ? `+${totalParticipantsCount} registered total` : "No registrations yet"}</span>
                </div>
                <div className="console-stat-watermark">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Active Fests */}
              <div className="console-stat-card">
                <span className="console-stat-dot-badge"></span>
                <div className="console-stat-label">Active Fests</div>
                <div className="console-stat-value">
                  {activeFestsCount} <span>LIVE</span>
                </div>
                <div className="console-avatar-bubbles">
                  <div className="console-avatar-bubble bubble-cyan"></div>
                  <div className="console-avatar-bubble bubble-slate"></div>
                  <div className="console-avatar-bubble bubble-purple"></div>
                  <span className="console-bubble-label">{activeFestsCount > 0 ? `${activeFestsCount} ongoing fests` : "No active events"}</span>
                </div>
              </div>

              {/* Card 3: Total Revenue */}
              <div className="console-stat-card">
                <div className="console-stat-label">Total Revenue</div>
                <div className="console-stat-value">{formatRevenue(totalRevenue)}</div>
                <div className="console-stat-trend console-trend-up" style={{ color: "var(--color-pink)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>{totalRevenue > 0 ? `+ ₹${totalRevenue.toLocaleString("en-IN")} total` : "No earnings yet"}</span>
                </div>
                <div className="console-stat-watermark">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              </div>

              {/* Card 4: Certificates Issued */}
              <div className="console-stat-card">
                <div className="console-stat-label">Certs Issued</div>
                <div className="console-stat-value">{certsIssuedCount}</div>
                <div className="console-stat-trend console-trend-neutral">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>{totalParticipantsCount > 0 ? `${Math.round((certsIssuedCount / totalParticipantsCount) * 100)}% Success rate` : "0% Success rate"}</span>
                </div>
                <div className="console-stat-watermark">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
              </div>
            </section>

            {/* Split Content: Active Fests and Activity Feed */}
            <div className="console-content-grid">
              {/* Left Column: Your Active Fests */}
              <section style={{ minWidth: 0 }}>
                <div className="console-section-header">
                  <h2 className="console-section-title">Your Active Fests</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {filteredFests.length > 0 && (
                      <button 
                        onClick={handleDeleteAllFests}
                        className="console-view-all"
                        style={{
                          background: "rgba(244, 114, 182, 0.1)",
                          border: "1px solid var(--color-pink)",
                          color: "var(--color-pink)",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Delete All</span>
                      </button>
                    )}
                    <Link href="/browse-fests" className="console-view-all">
                      <span>View All</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                </div>

                <div className="console-fests-list">
                  {filteredFests.length > 0 ? (
                    filteredFests.map((fest) => (
                      <div key={fest.id} className="console-fest-card" style={{ position: "relative" }}>
                        <div className="console-fest-card-image">
                          <img src={fest.image} alt={fest.title} />
                          <span className={`console-fest-badge ${fest.badgeClass}`}>
                            {fest.badge}
                          </span>
                          <button 
                            className="console-fest-menu-btn" 
                            onClick={(e) => toggleFestMenu(fest.id, e)} 
                            aria-label="More options"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>

                          {activeFestMenuId === fest.id && (
                            <div 
                              style={{
                                position: "absolute",
                                top: "45px",
                                right: "12px",
                                background: "#14151b",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "8px",
                                padding: "6px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                zIndex: 100,
                                boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ffffff",
                                  padding: "6px 12px",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  borderRadius: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  width: "100%"
                                }}
                                onClick={() => handleEditFest(fest)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" strokeWidth="2.5">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--color-pink)",
                                  padding: "6px 12px",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  borderRadius: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  width: "100%"
                                }}
                                onClick={() => handleDeleteFest(fest)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-pink)" strokeWidth="2.5">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="console-fest-card-body">
                          <h3 className="console-fest-card-title">{fest.title}</h3>
                          <div className="console-fest-metrics-row">
                            {fest.metrics.map((metric, idx) => (
                              <div key={idx} className="console-fest-metric-box">
                                <div className="console-fest-metric-label">{metric.label}</div>
                                <div className={`console-fest-metric-value ${metric.isGreen ? "text-green" : ""}`}>
                                  {metric.value}
                                </div>
                              </div>
                            ))}
                          </div>
                          <button 
                            className="console-fest-btn" 
                            onClick={() => {
                              setSelectedDashboardFest(fest);
                              setShowDashboardModal(true);
                            }}
                          >
                            {fest.btnText}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: "span 2", padding: "40px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "16px", color: "var(--color-text-muted)" }}>
                      No active projects found matching your search.
                    </div>
                  )}
                </div>
              </section>

              {/* Right Column: Recent Activity Feed */}
              <section className="console-activity-card">
                <div className="console-section-header" style={{ marginBottom: "24px" }}>
                  <h2 className="console-section-title" style={{ fontSize: "1.25rem" }}>Recent Activity</h2>
                </div>

                <div className="console-activity-list">
                  {recentActivities.map((act) => {
                    let iconSvg = null;
                    if (act.type === "user") {
                      iconSvg = (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="19" y1="8" x2="19" y2="14" />
                          <line x1="16" y1="11" x2="22" y2="11" />
                        </svg>
                      );
                    } else if (act.type === "cert") {
                      iconSvg = (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 11 11 13 15 9" />
                        </svg>
                      );
                    } else if (act.type === "payout") {
                      iconSvg = (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="12" y1="4" x2="12" y2="20" />
                        </svg>
                      );
                    }

                    return (
                      <div key={act.id} className="console-activity-card-item">
                        <div className={`console-activity-icon-container ${act.type}`}>
                          {iconSvg}
                        </div>
                        <div className="console-activity-info">
                          <div 
                            className="console-activity-text"
                            dangerouslySetInnerHTML={{ __html: act.text }}
                          />
                          <span className="console-activity-time">{act.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  className="console-activity-logs-btn"
                  onClick={() => showToast("Opening system logs feed viewer...", "info")}
                >
                  View All Logs
                </button>
              </section>
            </div>
          </>
        ) : activeTab === "my-fests" ? (
          <div className="console-table-wrapper" style={{ padding: "32px" }}>
            <div className="console-table-header-row" style={{ marginBottom: "24px" }}>
              <div>
                <h1 className="console-table-title" style={{ fontSize: "1.8rem" }}>My Festivals</h1>
                <p className="console-table-subtitle">
                  Manage and monitor your published events in the CertFIRE ecosystem.
                </p>
              </div>
              <Link href="/create-fest" className="console-btn-new-project">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create New Fest</span>
              </Link>
            </div>

            <div className="console-fests-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {filteredFests.length > 0 ? (
                filteredFests.map((fest) => (
                  <div key={fest.id} className="console-fest-card" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)" }}>
                    <div className="console-fest-card-image" style={{ height: "180px" }}>
                      <img src={fest.image} alt={fest.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span className={`console-fest-badge ${fest.badgeClass || "badge-upcoming"}`}>
                        {fest.badge || "UPCOMING"}
                      </span>
                    </div>
                    <div className="console-fest-card-body" style={{ padding: "20px" }}>
                      <h3 className="console-fest-card-title" style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "12px" }}>{fest.title}</h3>
                      
                      <div className="console-fest-metrics-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                        {fest.metrics ? fest.metrics.map((metric, idx) => (
                          <div key={idx} className="console-fest-metric-box">
                            <div className="console-fest-metric-label">{metric.label}</div>
                            <div className={`console-fest-metric-value ${metric.isGreen ? "text-green" : ""}`}>
                              {metric.value}
                            </div>
                          </div>
                        )) : (
                          <>
                            <div className="console-fest-metric-box">
                              <div className="console-fest-metric-label">Registrations</div>
                              <div className="console-fest-metric-value">0</div>
                            </div>
                            <div className="console-fest-metric-box">
                              <div className="console-fest-metric-label">Status</div>
                              <div className="console-fest-metric-value">Active</div>
                            </div>
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        {fest.isDraft ? (
                          <div style={{ display: "flex", gap: "10px", flex: 1 }}>
                            <button 
                              className="console-fest-btn" 
                              style={{ flex: 1 }}
                              onClick={() => {
                                router.push(`/create-fest?draftId=${fest.id}`);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="console-fest-btn" 
                              style={{ 
                                flex: 1.2, 
                                background: "linear-gradient(135deg, var(--color-cyan) 0%, #00bcff 100%)", 
                                color: "#0b0c10",
                                border: "none",
                                fontWeight: "700"
                              }}
                              onClick={() => handleDirectPublish(fest)}
                            >
                              Publish
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="console-fest-btn" 
                            style={{ flex: 1 }}
                            onClick={() => {
                              setSelectedDashboardFest(fest);
                              setShowDashboardModal(true);
                            }}
                          >
                            Manage Fest
                          </button>
                        )}
                        <button
                          className="btn-action-delete"
                          style={{
                            background: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            padding: "10px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s"
                          }}
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${fest.title}?`)) {
                              const keys = getStorageKeys();
                              const custom = JSON.parse(localStorage.getItem(keys.customFests) || "[]");
                              const updated = custom.filter(f => f.id !== fest.id);
                              localStorage.setItem(keys.customFests, JSON.stringify(updated));
                              
                              reloadFests();
                              showToast(`Successfully deleted ${fest.title}.`, "success");
                            }
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: "span 3", padding: "60px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "16px", color: "var(--color-text-muted)" }}>
                  <h3>No festivals found matching your search.</h3>
                  <Link href="/create-fest" className="console-btn-new-project" style={{ display: "inline-flex", marginTop: "16px" }}>
                    Create Your First Fest
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "templates" ? (
          templatesSubTab === "select" ? (
            <div className="console-table-wrapper" style={{ padding: "32px", background: "#0b0c10", border: "none" }}>
              {/* Header Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>Certificate Designer</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  {/* Search Input */}
                  <div style={{ position: "relative" }}>
                    <input 
                      type="text" 
                      placeholder="Search templates..." 
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "20px",
                        padding: "8px 16px 8px 36px",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        width: "180px",
                        outline: "none",
                        transition: "all 0.2s"
                      }}
                    />
                    <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>

                  {/* Bell Icon */}
                  <button style={{ color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }} onClick={() => showToast("No new notifications.", "info")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </button>

                  {/* Help Icon */}
                  <button style={{ color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }} onClick={() => showToast("Opening Designer Documentation portal...", "info")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </button>

                  {/* Avatar */}
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>
              </div>

              {/* Banner Section */}
              <div style={{ marginBottom: "32px", textAlign: "left" }}>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#ffffff", marginBottom: "12px", letterSpacing: "-0.5px" }}>Design Your Legacy</h2>
                <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", maxWidth: "600px", lineHeight: "1.5" }}>
                  Choose a pre-built premium template or upload your unique branding to issue high-impact digital certificates.
                </p>
              </div>

              {/* Sub-Tabs */}
              <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "32px" }}>
                <button style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-cyan)", borderBottom: "2.5px solid var(--color-cyan)", paddingBottom: "12px", marginBottom: "-14px", background: "none", border: "none", cursor: "pointer" }}>
                  Select a Template
                </button>
                <button 
                  style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-secondary)", paddingBottom: "12px", marginBottom: "-14px", background: "none", border: "none", cursor: "pointer" }} 
                  onClick={() => setTemplatesSubTab("upload")}
                >
                  Upload Custom Design
                </button>
              </div>

              {/* Grid of Templates */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "48px" }}>
                
                {/* Card 1: Certificate of Achievement (Maroon waves) */}
                <div 
                  className="console-fest-card" 
                  style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: selectedTemplate === "achievement" ? "2px solid var(--color-cyan)" : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: selectedTemplate === "achievement" ? "0 0 15px rgba(0, 210, 255, 0.15)" : "none"
                  }}
                >
                  <div 
                    className="console-design-preview-box"
                    onClick={() => { setSelectedTemplate("achievement"); localStorage.setItem("globalSelectedTemplate", "achievement"); showToast("Achievement (Maroon Wave) template selected.", "success"); }}
                  >
                    <div className="mini-cert-frame mini-cert-achievement">
                      <div className="mini-bar"></div>
                    </div>
                  </div>
                  <div className="console-fest-card-body" style={{ padding: "20px", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>Achievement</h3>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(0, 210, 255, 0.15)", color: "var(--color-cyan)" }}>MAROON</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: "1.4", height: "40px", marginBottom: "16px" }}>
                      Maroon waves, gold metallic frames, and elegant serif typography.
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={{ flex: 1, padding: "6px 10px", background: selectedTemplate === "achievement" ? "var(--color-cyan)" : "rgba(255,255,255,0.03)", border: selectedTemplate === "achievement" ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: selectedTemplate === "achievement" ? "#07080a" : "#ffffff", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => { setSelectedTemplate("achievement"); localStorage.setItem("globalSelectedTemplate", "achievement"); showToast("Achievement template selected.", "success"); }}>
                        {selectedTemplate === "achievement" ? "Selected" : "Select"}
                      </button>
                      <button style={{ flex: 1, padding: "6px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#ffffff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => { setPreviewTemplateType("achievement"); setPreviewTemplateOpen(true); }}>
                        Preview
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 2: Certificate of Appreciation (Navy/Gold Poly) */}
                <div 
                  className="console-fest-card" 
                  style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: selectedTemplate === "appreciation" ? "2px solid var(--color-purple)" : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: selectedTemplate === "appreciation" ? "0 0 15px rgba(192, 132, 252, 0.15)" : "none"
                  }}
                >
                  <div 
                    className="console-design-preview-box"
                    onClick={() => { setSelectedTemplate("appreciation"); localStorage.setItem("globalSelectedTemplate", "appreciation"); showToast("Appreciation (Navy Geometric) template selected.", "success"); }}
                  >
                    <div className="mini-cert-frame mini-cert-appreciation">
                      <div className="mini-top"></div>
                      <div className="mini-bottom"></div>
                    </div>
                  </div>
                  <div className="console-fest-card-body" style={{ padding: "20px", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>Appreciation</h3>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(192, 132, 252, 0.15)", color: "#c084fc" }}>NAVY</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: "1.4", height: "40px", marginBottom: "16px" }}>
                      Modern geometric polygon corners, navy panels, and gold accents.
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={{ flex: 1, padding: "6px 10px", background: selectedTemplate === "appreciation" ? "var(--color-purple)" : "rgba(255,255,255,0.03)", border: selectedTemplate === "appreciation" ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: selectedTemplate === "appreciation" ? "#07080a" : "#ffffff", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => { setSelectedTemplate("appreciation"); localStorage.setItem("globalSelectedTemplate", "appreciation"); showToast("Appreciation template selected.", "success"); }}>
                        {selectedTemplate === "appreciation" ? "Selected" : "Select"}
                      </button>
                      <button style={{ flex: 1, padding: "6px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#ffffff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => { setPreviewTemplateType("appreciation"); setPreviewTemplateOpen(true); }}>
                        Preview
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3: Certificate of Completion (Vintage Gothic) */}
                <div 
                  className="console-fest-card" 
                  style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: selectedTemplate === "completion" ? "2px solid var(--color-gold)" : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: selectedTemplate === "completion" ? "0 0 15px rgba(251, 191, 36, 0.15)" : "none"
                  }}
                >
                  <div 
                    className="console-design-preview-box"
                    onClick={() => { setSelectedTemplate("completion"); localStorage.setItem("globalSelectedTemplate", "completion"); showToast("Completion (Vintage Gothic) template selected.", "success"); }}
                  >
                    <div className="mini-cert-frame mini-cert-completion">
                      <div className="mini-inner"></div>
                    </div>
                  </div>
                  <div className="console-fest-card-body" style={{ padding: "20px", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>Completion</h3>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" }}>VINTAGE</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: "1.4", height: "40px", marginBottom: "16px" }}>
                      Classic ornamental border layout and historic arched gothic fonts.
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={{ flex: 1, padding: "6px 10px", background: selectedTemplate === "completion" ? "var(--color-gold)" : "rgba(255,255,255,0.03)", border: selectedTemplate === "completion" ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: selectedTemplate === "completion" ? "#07080a" : "#ffffff", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => { setSelectedTemplate("completion"); localStorage.setItem("globalSelectedTemplate", "completion"); showToast("Completion template selected.", "success"); }}>
                        {selectedTemplate === "completion" ? "Selected" : "Select"}
                      </button>
                      <button style={{ flex: 1, padding: "6px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#ffffff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => { setPreviewTemplateType("completion"); setPreviewTemplateOpen(true); }}>
                        Preview
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 4: Certificate of Recognition (Elegant Leaf) */}
                <div 
                  className="console-fest-card" 
                  style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: selectedTemplate === "recognition" ? "2px solid var(--color-pink)" : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: selectedTemplate === "recognition" ? "0 0 15px rgba(244, 114, 182, 0.15)" : "none"
                  }}
                >
                  <div 
                    className="console-design-preview-box"
                    onClick={() => { setSelectedTemplate("recognition"); localStorage.setItem("globalSelectedTemplate", "recognition"); showToast("Recognition (Elegant Leaf) template selected.", "success"); }}
                  >
                    <div className="mini-cert-frame mini-cert-recognition">
                      <div className="mini-corner-blue mc-tl"></div>
                      <div className="mini-corner-blue mc-tr"></div>
                    </div>
                  </div>
                  <div className="console-fest-card-body" style={{ padding: "20px", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>Recognition</h3>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(244, 114, 182, 0.15)", color: "#f472b6" }}>LUXURY</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: "1.4", height: "40px", marginBottom: "16px" }}>
                      Foliage gold-leaf borders, royal blue corners, and refined layout.
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={{ flex: 1, padding: "6px 10px", background: selectedTemplate === "recognition" ? "var(--color-pink)" : "rgba(255,255,255,0.03)", border: selectedTemplate === "recognition" ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: selectedTemplate === "recognition" ? "#07080a" : "#ffffff", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => { setSelectedTemplate("recognition"); localStorage.setItem("globalSelectedTemplate", "recognition"); showToast("Recognition template selected.", "success"); }}>
                        {selectedTemplate === "recognition" ? "Selected" : "Select"}
                      </button>
                      <button style={{ flex: 1, padding: "6px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#ffffff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }} onClick={() => { setPreviewTemplateType("recognition"); setPreviewTemplateOpen(true); }}>
                        Preview
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer row Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px" }}>
                <button style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setActiveTab("overview")}>
                  <span>&larr;</span> Back to Event Dashboard
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <button style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }} onClick={() => showToast("Draft template preferences saved successfully.", "success")}>
                    Save Draft
                  </button>
                  <button 
                    style={{ 
                      background: "linear-gradient(135deg, #f472b6, #c084fc)", 
                      border: "none", 
                      borderRadius: "8px", 
                      padding: "10px 24px", 
                      color: "#07080a", 
                      fontWeight: 700, 
                      fontSize: "0.9rem",
                      cursor: "pointer", 
                      boxShadow: "0 4px 12px rgba(192, 132, 252, 0.2)",
                      transition: "all 0.2s"
                    }}
                    onClick={() => showToast("Draft configuration saved. Opening Field Mapping assembly...", "success")}
                  >
                    Next: Field Mapping
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Custom Design Upload Workspace - WYSIWYG Organizer's Design Suite */
            <div 
              className="console-table-wrapper" 
              style={{ 
                padding: "24px", 
                background: "#0c0d12", 
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}
            >
              {/* Header Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button 
                    style={{ 
                      background: "rgba(255, 255, 255, 0.03)", 
                      border: "1px solid rgba(255,255,255,0.08)", 
                      color: "#ffffff", 
                      fontSize: "0.85rem", 
                      fontWeight: 600, 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      transition: "all 0.2s"
                    }}
                    onClick={() => setTemplatesSubTab("select")}
                    title="Back to Templates"
                  >
                    &larr;
                  </button>
                  <div>
                    <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                      Organizer's Design Suite
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <div style={{ width: "120px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: "75%", height: "100%", background: "linear-gradient(90deg, #00d2ff, #c084fc)" }}></div>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>75% Issuance Mapping Complete</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  {/* Bell Icon */}
                  <button style={{ color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer", position: "relative" }} onClick={() => showToast("All system notification checks clear.", "info")}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%" }}></span>
                  </button>

                  {/* Help Icon */}
                  <button style={{ color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }} onClick={() => showToast("WYSIWYG layout snap tutorial active.", "info")}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "16px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--color-cyan)" }}>
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ffffff" }}>{fullName || "Alex Chen"}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", fontWeight: 600 }}>MAIN ADMIN</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Three-Column Editor Grid */}
              <div style={{ display: "flex", gap: "20px", minHeight: "600px" }}>
                
                {/* Column 1: Data Tokens & Custom Elements (Width: 260px) */}
                <div style={{ width: "260px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px", textAlign: "left" }}>
                  
                  {/* Data Tokens Container */}
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "16px" }}>
                    <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-text-secondary)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
                      DATA TOKENS
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: "1.4", marginBottom: "16px" }}>
                      Drag or click tokens into the workspace to link dynamic content.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {[
                        { token: "participant_name", label: "participant_name", icon: "👤" },
                        { token: "competition_name", label: "competition_name", icon: "🏆" },
                        { token: "date", label: "date", icon: "📅" },
                        { token: "QR_code", label: "QR_code", icon: "🏁" },
                        { token: "certificate_id", label: "certificate_id", icon: "🔑" }
                      ].map((t) => (
                        <div 
                          key={t.token}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "8px",
                            padding: "10px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onClick={() => {
                            // Check duplicate
                            const exists = designerElements.some(el => el.token === t.token);
                            if (exists) {
                              showToast(`"${t.token}" is already placed on canvas.`, "info");
                              setSelectedElementId(designerElements.find(el => el.token === t.token).id);
                              return;
                            }
                            
                            const newEl = {
                              id: `token-${t.token}`,
                              type: "token",
                              token: t.token,
                              text: t.token === "participant_name" ? "Alex Morgan" : 
                                    t.token === "competition_name" ? "Global Hackfest 2024" :
                                    t.token === "date" ? new Date().toLocaleDateString() :
                                    t.token === "QR_code" ? "[QR CODE]" : "CF-889-2024",
                              x: 200,
                              y: 180,
                              fontFamily: "Sora",
                              fontSize: t.token === "participant_name" ? 32 : 20,
                              weight: "Bold",
                              color: t.token === "participant_name" ? "#00d2ff" : "#ffffff",
                              align: "center",
                              glow: false,
                              glowIntensity: 10
                            };
                            setDesignerElements([...designerElements, newEl]);
                            setSelectedElementId(newEl.id);
                            showToast(`Added token ${t.token} to workspace.`, "success");
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "1rem" }}>{t.icon}</span>
                            <span style={{ fontSize: "0.8rem", color: "#ffffff", fontFamily: "var(--font-space-grotesk)" }}>{t.label}</span>
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>⋮⋮</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro Tip Box */}
                  <div style={{ background: "rgba(0, 210, 255, 0.02)", border: "1px solid rgba(0, 210, 255, 0.08)", borderRadius: "12px", padding: "16px" }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-cyan)", display: "flex", alignItems: "center", gap: "6px", margin: "0 0 6px 0" }}>
                      💡 Pro Tip
                    </h4>
                    <p style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", lineHeight: "1.4", margin: 0 }}>
                      Organizer Tip: Ensure all tokens are mapped for automated issuance. Hold <strong style={{ color: "#ffffff" }}>Shift</strong> to snap to grid.
                    </p>
                  </div>

                  {/* Custom Elements Card */}
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "16px" }}>
                    <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-text-secondary)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                      CUSTOM ELEMENTS
                    </h3>
                    <div 
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onClick={() => {
                        const newId = `custom-${Date.now()}`;
                        const newEl = {
                          id: newId,
                          type: "static",
                          text: "Custom Label",
                          x: 220,
                          y: 200,
                          fontFamily: "Sora",
                          fontSize: 16,
                          weight: "Regular",
                          color: "#ffffff",
                          align: "center",
                          glow: false,
                          glowIntensity: 10
                        };
                        setDesignerElements([...designerElements, newEl]);
                        setSelectedElementId(newId);
                        showToast("Added custom label element to canvas.", "success");
                      }}
                    >
                      <span style={{ fontSize: "1.1rem", color: "var(--color-pink)" }}>TT</span>
                      <span style={{ fontSize: "0.8rem", color: "#ffffff" }}>Custom Label</span>
                      <span style={{ marginLeft: "auto", color: "var(--color-text-muted)" }}>⋮⋮</span>
                    </div>
                  </div>

                  {/* Add Custom Token Card */}
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-text-secondary)", letterSpacing: "1px", textTransform: "uppercase", margin: 0 }}>
                      ADD CUSTOM TOKEN
                    </h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="text"
                        placeholder="e.g., Rank, Score, Topic"
                        id="custom-token-input-field"
                        style={{
                          flexGrow: 1,
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          color: "#ffffff",
                          fontSize: "0.8rem",
                          outline: "none"
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = e.target.value.trim();
                            if (val) {
                              const newId = `custom-token-${Date.now()}`;
                              const tokenKey = val.toLowerCase().replace(/\s+/g, "_");
                              const newEl = {
                                id: newId,
                                type: "token",
                                token: tokenKey,
                                text: `{${val.toUpperCase()}}`,
                                x: 300,
                                y: 200,
                                fontFamily: "Sora",
                                fontSize: 16,
                                weight: "Regular",
                                color: "#ffffff",
                                align: "center",
                                glow: false,
                                glowIntensity: 10
                              };
                              setDesignerElements([...designerElements, newEl]);
                              setSelectedElementId(newId);
                              showToast(`Added custom token {${tokenKey}} to canvas.`, "success");
                              e.target.value = "";
                            }
                          }
                        }}
                      />
                      <button
                        style={{
                          background: "var(--color-cyan)",
                          color: "#07080a",
                          border: "none",
                          borderRadius: "6px",
                          width: "32px",
                          height: "32px",
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onClick={() => {
                          const input = document.getElementById("custom-token-input-field");
                          const val = input ? input.value.trim() : "";
                          if (val) {
                            const newId = `custom-token-${Date.now()}`;
                            const tokenKey = val.toLowerCase().replace(/\s+/g, "_");
                            const newEl = {
                              id: newId,
                              type: "token",
                              token: tokenKey,
                              text: `{${val.toUpperCase()}}`,
                              x: 300,
                              y: 200,
                              fontFamily: "Sora",
                              fontSize: 16,
                              weight: "Regular",
                              color: "#ffffff",
                              align: "center",
                              glow: false,
                              glowIntensity: 10
                            };
                            setDesignerElements([...designerElements, newEl]);
                            setSelectedElementId(newId);
                            showToast(`Added custom token {${tokenKey}} to canvas.`, "success");
                            if (input) input.value = "";
                          } else {
                            showToast("Please enter a token name first.", "warning");
                          }
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2: Center Editor Workspace Canvas (Flex-Grow) */}
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                  
                  {/* Top Canvas Toolbar */}
                  <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "30px", padding: "6px 16px", alignItems: "center", width: "100%", justifyContent: "space-between", boxSizing: "border-box" }}>
                    
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      
                      {/* Image Template Background Uploader */}
                      <div className="premium-tooltip-wrapper">
                        <label 
                          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: "none" }} 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setDesignerBackground(ev.target.result);
                                  localStorage.setItem("customDesignerBackground", ev.target.result);
                                  showToast("Uploaded custom design template image successfully!", "success");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <span className="premium-tooltip-text">Upload Background</span>
                      </div>

                      {/* Text element adder */}
                      <div className="premium-tooltip-wrapper">
                        <button 
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", cursor: "pointer" }}
                          onClick={() => {
                            const newId = `custom-${Date.now()}`;
                            const newEl = {
                              id: newId,
                              type: "static",
                              text: "Custom Label",
                              x: 200,
                              y: 200,
                              fontFamily: "Sora",
                              fontSize: 18,
                              weight: "Regular",
                              color: "#ffffff",
                              align: "center",
                              glow: false,
                              glowIntensity: 10
                            };
                            setDesignerElements([...designerElements, newEl]);
                            setSelectedElementId(newId);
                          }}
                        >
                          <strong style={{ fontSize: "0.95rem" }}>T</strong>
                        </button>
                        <span className="premium-tooltip-text">Add Text Block</span>
                      </div>

                      {/* Visual elements uploader */}
                      <div className="premium-tooltip-wrapper">
                        <label 
                          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                          </svg>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: "none" }} 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const newId = `custom-img-${Date.now()}`;
                                  const newEl = {
                                    id: newId,
                                    type: "image",
                                    text: ev.target.result,
                                    x: 180,
                                    y: 180,
                                    fontSize: 80, // Acts as width/height scaler
                                    glow: false,
                                    glowIntensity: 10
                                  };
                                  setDesignerElements([...designerElements, newEl]);
                                  setSelectedElementId(newId);
                                  showToast("Overlay image placed on canvas.", "success");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <span className="premium-tooltip-text">Add Logo / Badge</span>
                      </div>

                      {/* Outline square placeholder */}
                      <div className="premium-tooltip-wrapper">
                        <button 
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", cursor: "pointer" }}
                          onClick={() => {
                            const newId = `shape-${Date.now()}`;
                            const newEl = {
                              id: newId,
                              type: "shape",
                              text: "Shape",
                              x: 300,
                              y: 200,
                              fontSize: 100, // Scaler for width
                              fontFamily: "Sora",
                              color: "rgba(0, 210, 255, 0.2)",
                              glow: false,
                              glowIntensity: 10
                            };
                            setDesignerElements([...designerElements, newEl]);
                            setSelectedElementId(newId);
                            showToast("Placed custom decoration shape on canvas.", "success");
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          </svg>
                        </button>
                        <span className="premium-tooltip-text">Add Shape Border</span>
                      </div>

                      {/* Clear all elements button */}
                      <div className="premium-tooltip-wrapper">
                        <button 
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            width: "32px", 
                            height: "32px", 
                            borderRadius: "6px", 
                            background: "rgba(239, 68, 68, 0.08)", 
                            border: "1px solid rgba(239, 68, 68, 0.2)", 
                            color: "#ef4444", 
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onClick={() => {
                            if (confirm("Are you sure you want to delete all elements and the background image on the canvas?")) {
                              setDesignerElements([]);
                              setSelectedElementId(null);
                              setDesignerBackground("");
                              localStorage.removeItem("customDesignerBackground");
                              showToast("Cleared all canvas elements and background image.", "info");
                            }
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                        <span className="premium-tooltip-text">Clear All Elements</span>
                      </div>
                    </div>

                    <button
                      style={{
                        background: "var(--color-cyan)",
                        border: "none",
                        color: "#07080a",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        padding: "6px 14px",
                        borderRadius: "15px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s"
                      }}
                      onClick={() => {
                        const newId = `custom-element-${Date.now()}`;
                        const newEl = {
                          id: newId,
                          type: "static",
                          text: "New Custom Element",
                          x: 200,
                          y: 150,
                          fontFamily: "Sora",
                          fontSize: 18,
                          weight: "Regular",
                          color: "#ffffff",
                          align: "center",
                          glow: false,
                          glowIntensity: 10
                        };
                        setDesignerElements([...designerElements, newEl]);
                        setSelectedElementId(newId);
                      }}
                    >
                      <span>➕</span> Add custom element
                    </button>
                  </div>

                  {/* WYSIWYG Interactive Workspace Canvas (600x400) */}
                  <div 
                    style={{
                      width: "600px",
                      height: "400px",
                      background: designerBackground 
                        ? `url(${designerBackground}) no-repeat center/cover` 
                        : "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
                      backgroundSize: designerBackground ? "cover" : "20px 20px",
                      backgroundPosition: "center",
                      backgroundColor: canvasBgColor,
                      border: "2px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
                      cursor: draggedElementId ? "grabbing" : "default"
                    }}
                    onMouseDown={() => setSelectedElementId(null)}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  >
                    {/* Visual corners / Grid design outlines */}
                    <div style={{ position: "absolute", left: "15px", top: "15px", width: "20px", height: "20px", borderLeft: "2px solid var(--color-cyan)", borderTop: "2px solid var(--color-cyan)" }}></div>
                    <div style={{ position: "absolute", right: "15px", top: "15px", width: "20px", height: "20px", borderRight: "2px solid var(--color-cyan)", borderTop: "2px solid var(--color-cyan)" }}></div>
                    <div style={{ position: "absolute", left: "15px", bottom: "15px", width: "20px", height: "20px", borderLeft: "2px solid var(--color-cyan)", borderBottom: "2px solid var(--color-cyan)" }}></div>
                    <div style={{ position: "absolute", right: "15px", bottom: "15px", width: "20px", height: "20px", borderRight: "2px solid var(--color-cyan)", borderBottom: "2px solid var(--color-cyan)" }}></div>

                    {/* Canvas elements mapping */}
                    {designerElements.map((el) => {
                      const isSelected = selectedElementId === el.id;
                      
                      // Render base styles
                      const glowVal = el.glow ? `0 0 ${el.glowIntensity}px ${el.color}` : "none";
                      
                      // Element inner rendering
                      let innerContent = null;
                      if (el.type === "image") {
                        innerContent = (
                          <img 
                            src={el.text} 
                            style={{ 
                              width: `${el.fontSize}px`, 
                              height: "auto", 
                              borderRadius: "4px",
                              boxShadow: el.glow ? `0 0 ${el.glowIntensity}px ${el.color}` : "none"
                            }} 
                            alt="Logo Overlay"
                          />
                        );
                      } else if (el.type === "shape") {
                        innerContent = (
                          <div 
                            style={{ 
                              width: `${el.fontSize}px`, 
                              height: `${el.fontSize * 0.6}px`, 
                              border: `2px solid ${el.color}`, 
                              background: "transparent",
                              boxShadow: el.glow ? `0 0 ${el.glowIntensity}px ${el.color}` : "none"
                            }}
                          />
                        );
                      } else {
                        innerContent = (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            {el.type === "token" && (
                              <span 
                                style={{ 
                                  fontSize: "9px", 
                                  background: "var(--color-cyan)", 
                                  color: "#07080a", 
                                  padding: "1px 5px", 
                                  borderRadius: "3px", 
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  marginBottom: "3px",
                                  letterSpacing: "0.5px"
                                }}
                              >
                                {el.token}
                              </span>
                            )}
                            <span
                              style={{
                                fontFamily: el.fontFamily === "Sora (Default)" || el.fontFamily === "Sora" ? "var(--font-sora), sans-serif" : el.fontFamily,
                                fontSize: `${el.fontSize}px`,
                                fontWeight: el.weight === "Bold" ? 700 : el.weight === "Medium" ? 500 : 400,
                                color: el.color,
                                textShadow: glowVal,
                                whiteSpace: "nowrap",
                                pointerEvents: "none"
                              }}
                            >
                              {el.text}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={el.id}
                          style={{
                            position: "absolute",
                            left: `${el.x}px`,
                            top: `${el.y}px`,
                            transform: el.align === "left" ? "translate(0, -50%)" : el.align === "right" ? "translate(-100%, -50%)" : "translate(-50%, -50%)",
                            cursor: draggedElementId === el.id ? "grabbing" : "grab",
                            border: isSelected ? "1.5px dashed var(--color-cyan)" : "1px dashed transparent",
                            padding: "6px",
                            borderRadius: "4px",
                            zIndex: isSelected ? 100 : 50,
                            userSelect: "none"
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedElementId(el.id);
                            setDraggedElementId(el.id);
                            
                            // Get offset relative to canvas bounds
                            const rect = e.currentTarget.parentElement.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const mouseY = e.clientY - rect.top;
                            setDragOffset({
                              x: mouseX - el.x,
                              y: mouseY - el.y
                            });
                          }}
                        >
                          {innerContent}
                        </div>
                      );
                    })}
                  </div>

                  {/* Zoom bar & canvas guidelines info */}
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Zoom: 100% (Real Size A4 Ratio) | Snap-to-grid active with Shift.
                  </div>
                </div>

                {/* Column 3: Properties Console Panel (Width: 320px) */}
                <div style={{ width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                  
                  {/* Selected Element Header info */}
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    
                    <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-text-secondary)", letterSpacing: "1px", textTransform: "uppercase", margin: 0 }}>
                      ORGANIZER BRANDING
                    </h3>

                    {/* Selected Badge */}
                    {selectedElementId ? (
                      (() => {
                        const el = designerElements.find(item => item.id === selectedElementId);
                        if (!el) return <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>No element selected.</div>;
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                            <div style={{ fontSize: "1.1rem" }}>
                              {el.type === "token" ? "🔤" : el.type === "image" ? "🖼️" : el.type === "shape" ? "🟥" : "✏️"}
                            </div>
                            <div>
                              <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                                SELECTED ELEMENT
                              </div>
                              <div style={{ fontSize: "0.85rem", color: "var(--color-cyan)", fontWeight: 700 }}>
                                {el.token || el.type}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                          Canvas settings
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-cyan)", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                          🎨 Canvas Background
                        </div>
                        
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                            BACKGROUND COLOR
                          </label>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {[
                              { hex: "#0c0d12", label: "Dark" },
                              { hex: "#0b0c10", label: "Midnight" },
                              { hex: "#0f172a", label: "Navy" },
                              { hex: "#800020", label: "Maroon" },
                              { hex: "#faf9f6", label: "Cream" }
                            ].map((col) => (
                              <button
                                key={col.hex}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  background: col.hex,
                                  border: canvasBgColor === col.hex ? "1.5px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                                  cursor: "pointer",
                                  transition: "transform 0.15s"
                                }}
                                title={col.label}
                                onClick={() => setCanvasBgColor(col.hex)}
                              />
                            ))}
                            
                            {/* Spectrum Color Picker Circle */}
                            <div 
                              style={{ 
                                width: "20px", 
                                height: "20px", 
                                borderRadius: "50%", 
                                overflow: "hidden", 
                                border: "1px solid rgba(255,255,255,0.3)",
                                position: "relative",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "linear-gradient(135deg, red, orange, yellow, green, blue, purple)"
                              }}
                              title="Pick Custom Canvas Background"
                            >
                              <input 
                                type="color" 
                                value={canvasBgColor} 
                                onChange={(e) => setCanvasBgColor(e.target.value)}
                                style={{
                                  position: "absolute",
                                  opacity: 0,
                                  width: "100%",
                                  height: "100%",
                                  cursor: "pointer"
                                }}
                              />
                              <span style={{ fontSize: "0.55rem", color: "#ffffff", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>🎨</span>
                            </div>

                            <input
                              type="text"
                              style={{
                                width: "70px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                color: "#ffffff",
                                fontSize: "0.75rem",
                                textAlign: "center",
                                outline: "none",
                                marginLeft: "auto"
                              }}
                              value={canvasBgColor}
                              onChange={(e) => setCanvasBgColor(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", fontSize: "0.7rem", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
                          💡 Tip: Select any element on the canvas to edit its layout styling parameters (Font size, hex colors, alignments, neon glow intensity). Click off the elements to configure the canvas background color settings.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Properties configurations card */}
                  {selectedElementId && (() => {
                    const el = designerElements.find(item => item.id === selectedElementId);
                    if (!el) return null;

                    return (
                      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        
                        {/* Text Content Input */}
                        {el.type !== "image" && el.type !== "shape" && (
                          <div>
                            <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                              EDIT TEXT CONTENT
                            </label>
                            <textarea
                              style={{
                                width: "100%",
                                height: "60px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "6px",
                                padding: "8px 12px",
                                color: "#ffffff",
                                fontSize: "0.85rem",
                                resize: "none",
                                outline: "none"
                              }}
                              disabled={el.type === "token"}
                              value={el.text}
                              onChange={(e) => handleUpdateSelectedElement({ text: e.target.value })}
                            />
                            {el.type === "token" && (
                              <span style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>* Token values map dynamic spreadsheet rows automatically.</span>
                            )}
                          </div>
                        )}

                        {/* Font Family selector */}
                        {el.type !== "image" && el.type !== "shape" && (
                          <div>
                            <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                              FONT FAMILY
                            </label>
                            <select
                              value={el.fontFamily || "Sora"}
                              onChange={(e) => handleUpdateSelectedElement({ fontFamily: e.target.value })}
                              style={{
                                width: "100%",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "6px",
                                padding: "8px 12px",
                                color: "#ffffff",
                                fontSize: "0.85rem",
                                outline: "none"
                              }}
                            >
                              <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Sora">Sora (Default)</option>
                              <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Inter">Inter</option>
                              <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Playfair Display">Playfair Display</option>
                              <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Great Vibes">Great Vibes</option>
                              <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Cinzel">Cinzel</option>
                              <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Outfit">Outfit</option>
                              <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Space Grotesk">Space Grotesk</option>
                            </select>
                          </div>
                        )}

                        {/* Size (scaler) & weight */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div>
                            <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                              {el.type === "image" || el.type === "shape" ? "SCALE (PX)" : "FONT SIZE"}
                            </label>
                            <input
                              type="number"
                              style={{
                                width: "100%",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "6px",
                                padding: "8px 10px",
                                color: "#ffffff",
                                fontSize: "0.85rem",
                                outline: "none"
                              }}
                              value={el.fontSize || 18}
                              onChange={(e) => handleUpdateSelectedElement({ fontSize: Number(e.target.value) })}
                            />
                          </div>

                          {el.type !== "image" && el.type !== "shape" && (
                            <div>
                              <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                                WEIGHT
                              </label>
                              <select
                                value={el.weight || "Regular"}
                                onChange={(e) => handleUpdateSelectedElement({ weight: e.target.value })}
                                style={{
                                  width: "100%",
                                  background: "rgba(255,255,255,0.02)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: "6px",
                                  padding: "8px 10px",
                                  color: "#ffffff",
                                  fontSize: "0.85rem",
                                  outline: "none"
                                }}
                              >
                                <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Light">Light</option>
                                <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Regular">Regular</option>
                                <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Medium">Medium</option>
                                <option style={{ background: "#0c0d12", color: "#ffffff" }} value="Bold">Bold</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Text Color / Hex panel */}
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                            TEXT COLOR
                          </label>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                            {[
                              { hex: "#00D2FF", class: "btn-col-cyan" },
                              { hex: "#C084FC", class: "btn-col-pink" },
                              { hex: "#FBBF24", class: "btn-col-gold" },
                              { hex: "#FFFFFF", class: "btn-col-white" },
                              { hex: "#A5E7FF", class: "btn-col-accent" }
                            ].map((col) => (
                              <button
                                key={col.hex}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  background: col.hex,
                                  border: el.color === col.hex ? "1.5px solid #ffffff" : "none",
                                  cursor: "pointer",
                                  transition: "transform 0.15s"
                                }}
                                onClick={() => handleUpdateSelectedElement({ color: col.hex })}
                              />
                            ))}
                            
                            {/* Spectrum Color Picker Circle */}
                            <div 
                              style={{ 
                                width: "20px", 
                                height: "20px", 
                                borderRadius: "50%", 
                                overflow: "hidden", 
                                border: "1px solid rgba(255,255,255,0.3)",
                                position: "relative",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "linear-gradient(135deg, red, orange, yellow, green, blue, purple)"
                              }}
                              title="Pick Custom Color"
                            >
                              <input 
                                type="color" 
                                value={el.color || "#ffffff"} 
                                onChange={(e) => handleUpdateSelectedElement({ color: e.target.value })}
                                style={{
                                  position: "absolute",
                                  opacity: 0,
                                  width: "100%",
                                  height: "100%",
                                  cursor: "pointer"
                                }}
                              />
                              <span style={{ fontSize: "0.55rem", color: "#ffffff", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>🎨</span>
                            </div>

                            <input
                              type="text"
                              style={{
                                width: "70px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                color: "#ffffff",
                                fontSize: "0.75rem",
                                textAlign: "center",
                                outline: "none",
                                marginLeft: "auto"
                              }}
                              value={el.color || "#ffffff"}
                              onChange={(e) => handleUpdateSelectedElement({ color: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Alignment option buttons */}
                        {el.type !== "image" && el.type !== "shape" && (
                          <div>
                            <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                              ALIGNMENT
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
                              {["left", "center", "right"].map((align) => (
                                <button
                                  key={align}
                                  style={{
                                    background: el.align === align ? "rgba(0, 210, 255, 0.08)" : "none",
                                    border: "none",
                                    borderRight: align !== "right" ? "1px solid rgba(255,255,255,0.06)" : "none",
                                    padding: "8px",
                                    color: el.align === align ? "var(--color-cyan)" : "var(--color-text-secondary)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                  onClick={() => handleUpdateSelectedElement({ align })}
                                >
                                  {align === "left" && "◀"}
                                  {align === "center" && "■"}
                                  {align === "right" && "▶"}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Neon Glow Option */}
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                              NEON GLOW
                            </span>
                            
                            {/* Enable Glow toggle */}
                            <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                              <input 
                                type="checkbox" 
                                style={{ display: "none" }}
                                checked={el.glow || false}
                                onChange={(e) => handleUpdateSelectedElement({ glow: e.target.checked })}
                              />
                              <div style={{
                                width: "34px",
                                height: "20px",
                                background: el.glow ? "var(--color-cyan)" : "rgba(255,255,255,0.1)",
                                borderRadius: "10px",
                                position: "relative",
                                transition: "background 0.2s"
                              }}>
                                <div style={{
                                  width: "14px",
                                  height: "14px",
                                  background: "#07080a",
                                  borderRadius: "50%",
                                  position: "absolute",
                                  top: "3px",
                                  left: el.glow ? "17px" : "3px",
                                  transition: "left 0.2s"
                                }} />
                              </div>
                            </label>
                          </div>

                          {el.glow && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--color-text-muted)" }}>
                                <span>Glow Intensity</span>
                                <span>{el.glowIntensity}px</span>
                              </div>
                              <input 
                                type="range" 
                                min="2" 
                                max="30" 
                                style={{
                                  width: "100%",
                                  background: "rgba(255,255,255,0.1)",
                                  height: "4px",
                                  borderRadius: "2px",
                                  outline: "none",
                                  cursor: "pointer"
                                }}
                                value={el.glowIntensity || 10}
                                onChange={(e) => handleUpdateSelectedElement({ glowIntensity: Number(e.target.value) })}
                              />
                            </div>
                          )}
                        </div>

                        {/* Remove Element Button */}
                        <button
                          style={{
                            marginTop: "8px",
                            background: "rgba(239, 68, 68, 0.05)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            borderRadius: "8px",
                            padding: "10px",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this element?")) {
                              const updated = designerElements.filter(item => item.id !== selectedElementId);
                              setDesignerElements(updated);
                              setSelectedElementId(updated.length > 0 ? updated[0].id : null);
                              showToast("Element removed from workspace.", "info");
                            }
                          }}
                        >
                          🗑️ Remove Element
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom Actions Status bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", marginTop: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>☁️</span> {autosaveText}
                </span>

                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <button 
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      padding: "10px 24px",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onClick={() => {
                      localStorage.setItem("customDesignerElements", JSON.stringify(designerElements));
                      localStorage.setItem("customDesignerBackground", designerBackground);
                      localStorage.setItem("customDesignerBgColor", canvasBgColor);
                      setAutosaveText("Draft saved just now");
                      showToast("WYSIWYG layout draft saved successfully.", "success");
                    }}
                  >
                    Save Draft
                  </button>

                  <button 
                    style={{
                      background: "linear-gradient(135deg, #00d2ff, #c084fc)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 24px",
                      color: "#07080a",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(0, 210, 255, 0.2)",
                      transition: "all 0.2s"
                    }}
                    onClick={() => {
                      // Save Layout & Set as active template Globally
                      localStorage.setItem("customDesignerElements", JSON.stringify(designerElements));
                      localStorage.setItem("customDesignerBackground", designerBackground);
                      localStorage.setItem("customDesignerBgColor", canvasBgColor);
                      localStorage.setItem("globalSelectedTemplate", "custom");
                      setSelectedTemplate("custom");
                      
                      setAutosaveText("Active design saved successfully");
                      showToast("Active certificate design template saved successfully! All participant templates are now linked.", "success");
                      
                      triggerNotificationAndActivity(
                        "cert",
                        `🎨 Designer Updated: Custom template layouts saved`,
                        `Modified and activated custom certificate design workspace globally`
                      );
                    }}
                  >
                    Save Layout
                  </button>

                  <button 
                    style={{
                      background: "rgba(192, 132, 252, 0.05)",
                      border: "1px solid rgba(192, 132, 252, 0.2)",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      color: "#c084fc",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onClick={() => setShowDesignerPreview(true)}
                  >
                    Preview with Sample Data
                  </button>
                </div>
              </div>
            </div>
          )
        ) : activeTab === "participants" ? (
          (!showUploadZone && importedParticipants.length > 0) ? (
            <div className="console-table-wrapper">
              <div className="console-table-header-row">
                <div>
                  <h1 className="console-table-title">Imported Participants</h1>
                  <p className="console-table-subtitle">
                    Viewing {filteredParticipants.length} registered participant records persisted in database.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <select
                    value={selectedFestFilter}
                    onChange={(e) => setSelectedFestFilter(e.target.value)}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="all" style={{ background: "#0c0d12", color: "#fff" }}>All Festivals</option>
                    {Array.from(new Set(importedParticipants.map(p => p.fest))).map((f, i) => (
                      <option key={i} value={f} style={{ background: "#0c0d12", color: "#fff" }}>{f}</option>
                    ))}
                  </select>

                  <button 
                    className="btn-clear-all" 
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all imported participants?")) {
                        const keys = getStorageKeys();
                        localStorage.removeItem(keys.importedParticipants);
                        setImportedParticipants([]);
                        showToast("All imported participants removed successfully.", "info");
                      }
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Clear All
                  </button>

                  <button className="btn-import-more" onClick={() => setShowUploadZone(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Import More
                  </button>

                  <button 
                    className="btn-add-participant" 
                    onClick={() => {
                      setModalForm({ name: "", email: "", phone: "", fest: activeFests[0]?.title || "PulseFest 2024" });
                      setEditIndex(null);
                      setModalOpen(true);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    + Add Participant
                  </button>
                </div>
              </div>

              <div className="console-table-scroll">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Fest</th>
                      <th>Certificate ID</th>
                      <th>QR Code</th>
                      <th>Status</th>
                      <th>Invite / Cert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.length > 0 ? (
                      filteredParticipants.map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: "#ffffff" }}>{p.name}</td>
                          <td>{p.email}</td>
                          <td>{p.phone}</td>
                          <td>{p.fest}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--color-cyan)" }}>
                            {p.certificate_id}
                          </td>
                          <td>
                            <div 
                              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              onClick={() => {
                                setSelectedQrCode({
                                  url: `${window.location.origin}/verify?id=${p.certificate_id}`,
                                  name: p.name,
                                  fest: p.fest,
                                  id: p.certificate_id
                                });
                                setShowQrModal(true);
                              }}
                              title="Click to zoom QR Code"
                            >
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=45x45&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin + "/verify?id=" + p.certificate_id : "")}`}
                                alt="QR Code" 
                                style={{ width: "35px", height: "35px", background: "white", padding: "2px", borderRadius: "4px" }}
                              />
                            </div>
                          </td>
                          <td>
                            <select 
                              value={p.status || "verified"}
                              onChange={(e) => handleStatusChange(p, e.target.value)}
                              style={{
                                background: 
                                  (p.status === "approved" || p.status === "approve") ? "rgba(0, 210, 255, 0.12)" :
                                  (p.status === "denied" || p.status === "deny") ? "rgba(244, 114, 182, 0.12)" :
                                  (p.status === "issued") ? "rgba(251, 191, 36, 0.12)" :
                                  "rgba(45, 212, 191, 0.12)",
                                color:
                                  (p.status === "approved" || p.status === "approve") ? "var(--color-cyan)" :
                                  (p.status === "denied" || p.status === "deny") ? "var(--color-pink)" :
                                  (p.status === "issued") ? "var(--color-gold)" :
                                  "var(--color-teal)",
                                border: "1px solid currentColor",
                                borderEdge: "none",
                                borderRadius: "20px",
                                padding: "4px 24px 4px 12px",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                outline: "none",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                appearance: "none",
                                WebkitAppearance: "none",
                                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m2 3 3 3 3-3'/%3E%3C/svg%3E")`,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 10px center",
                                backgroundSize: "8px"
                              }}
                            >
                              <option value="verified" style={{ background: "#14151b", color: "#ffffff" }}>Verify</option>
                              <option value="approved" style={{ background: "#14151b", color: "#ffffff" }}>Approve</option>
                              <option value="denied" style={{ background: "#14151b", color: "#ffffff" }}>Denied</option>
                              <option value="issued" style={{ background: "#14151b", color: "#ffffff" }}>Issued</option>
                            </select>
                          </td>
                          <td style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button 
                              className="btn-action-cert"
                              disabled={p.certIssued}
                              onClick={() => {
                                const keys = getStorageKeys();
                                const updated = importedParticipants.map((item, i) => 
                                  (p.email === item.email && p.name === item.name) ? { ...item, certIssued: true, status: "issued" } : item
                                );
                                setImportedParticipants(updated);
                                localStorage.setItem(keys.importedParticipants, JSON.stringify(updated));
                                showToast(`Certificate successfully issued to ${p.name}!`, "success");
                                triggerNotificationAndActivity(
                                  "cert",
                                  `🎓 Certificate issued: Verification credential generated for ${p.name}`,
                                  `Certificate issued to <strong>${p.name}</strong> for ${p.fest}`
                                );
                              }}
                            >
                              {p.certIssued ? "✓ Issued" : "Issue Cert"}
                            </button>
                            <button 
                              className="btn-action-edit"
                              onClick={() => {
                                const actualIdx = importedParticipants.findIndex(item => item.email === p.email && item.name === p.name);
                                setModalForm({ name: p.name, email: p.email, phone: p.phone, fest: p.fest, status: p.status || "verified" });
                                setEditIndex(actualIdx !== -1 ? actualIdx : idx);
                                setModalOpen(true);
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              className="btn-action-edit-cert"
                              style={{
                                background: "rgba(0, 210, 255, 0.08)",
                                border: "1px solid rgba(0, 210, 255, 0.2)",
                                color: "var(--color-cyan)",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                fontSize: "0.78rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "var(--transition-fast)",
                                cursor: "pointer"
                              }}
                              onClick={() => handleOpenCertStudio(p)}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <circle cx="12" cy="8" r="3" />
                                <path d="m9 11 2 2 4-4" />
                              </svg>
                              Edit Cert
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-participants-found">
                          No matching participants found. Try another search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="console-upload-wrapper">
              {/* 1. Header with Download template */}
              <div className="console-upload-header">
                <div className="console-upload-header-text">
                  <h1>Bulk Participant Upload</h1>
                  <p>
                    Streamline your festival onboarding by importing participants at scale. 
                    Use our standard template for optimal processing.
                  </p>
                </div>
                <button 
                  className="btn-download-template" 
                  onClick={handleDownloadTemplate}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Template
                </button>
              </div>

              {/* 2. Drag & Drop File Zone */}
              <div 
                className={`excel-dropzone ${dragActive ? "drag-active" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
              >
                <input 
                  type="file" 
                  id="input-file-upload" 
                  style={{ display: "none" }}
                  multiple={false}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                />
                
                {!uploadedFile ? (
                  <>
                    <div className="upload-icon-large">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                      </svg>
                    </div>
                    <h2>Drop your Excel file here</h2>
                    <p>or click to browse your local storage</p>
                    
                    <div className="file-badge-row">
                      <span className="file-type-badge">.XLSX</span>
                      <span className="file-type-badge">.CSV</span>
                    </div>
                    
                    <span className="file-size-info">Maximum file size: 25MB (Up to 10,000 participants per upload)</span>
                  </>
                ) : (
                  <div className="dropzone-file-info">
                    <div className="upload-icon-large" style={{ color: "var(--color-cyan)", borderColor: "rgba(0, 210, 255, 0.3)" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14 9 11" />
                      </svg>
                    </div>
                    <div className="dropzone-file-name">{uploadedFile.name}</div>
                    <div className="dropzone-file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                    
                    {processing && (
                      <div className="upload-progress-container">
                        <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}

                    {!processing && (
                      <button 
                        style={{ marginTop: "12px", background: "none", border: "none", color: "var(--color-pink)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                        }}
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Action button */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "16px 0", justifyContent: "center" }}>
                <input 
                  type="checkbox" 
                  id="overwrite-toggle"
                  checked={overwriteOnUpload}
                  onChange={(e) => setOverwriteOnUpload(e.target.checked)}
                  style={{ cursor: "pointer", accentColor: "var(--color-cyan)" }}
                />
                <label htmlFor="overwrite-toggle" style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", cursor: "pointer", userSelect: "none" }}>
                  Overwrite existing participants
                </label>
              </div>

              <button 
                className="btn-process-upload" 
                disabled={!uploadedFile || processing}
                onClick={handleProcessUpload}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>{processing ? `Processing (${uploadProgress}%)` : "Process Upload"}</span>
              </button>

              {/* 4. Bottom Benefit row */}
              <div className="excel-features-grid">
                <div className="excel-feature-card">
                  <div className="excel-feature-icon-container validation">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="excel-feature-title">Data Validation</div>
                  <p className="excel-feature-desc">
                    Our system automatically validates emails, phone numbers, and required fields before importing.
                  </p>
                </div>

                <div className="excel-feature-card">
                  <div className="excel-feature-icon-container duplicate">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 2.1l4 4-4 4" />
                      <path d="M3 22v-6c0-1.1.9-2 2-2h12v4" />
                      <path d="M7 21.9l-4-4 4-4" />
                      <path d="M21 2v6c0 1.1-.9 2-2 2H7V6" />
                    </svg>
                  </div>
                  <div className="excel-feature-title">Duplicate Check</div>
                  <p className="excel-feature-desc">
                    We cross-reference existing records to prevent double-entry of participants within the same fest.
                  </p>
                </div>

                <div className="excel-feature-card">
                  <div className="excel-feature-icon-container invites">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="excel-feature-title">Auto-Invites</div>
                  <p className="excel-feature-desc">
                    Once processed, participants will automatically receive a digital boarding pass via email.
                  </p>
                </div>
              </div>
            </div>
          )
        ) : activeTab === "analytics" ? (
          /* Render beautiful active dashboard analytics panels */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
            
            {/* Header Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 850, color: "#ffffff", margin: 0 }}>Dashboard Analytics Suite</h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                  Real-time conversion, ticket revenue, and verification metrics across registered fests.
                </p>
              </div>
              <button 
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
                onClick={() => showToast("Exporting data report CSV...", "info")}
              >
                📥 Export CSV Report
              </button>
            </div>

            {/* Statistics Summary Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
              
              {/* Card 1: Total Registered */}
              <div style={{ background: "#0c0d12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Registered Participants</span>
                  <span style={{ fontSize: "1.2rem" }}>👥</span>
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff" }}>
                  {importedParticipants.length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>↑ +15.4%</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>from last week</span>
                </div>
              </div>

              {/* Card 2: Total Revenue */}
              <div style={{ background: "#0c0d12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Total Ticket Revenue</span>
                  <span style={{ fontSize: "1.2rem", color: "var(--color-cyan)" }}>₹</span>
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-cyan)" }}>
                  ₹{getRevenue().toLocaleString()}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>↑ +24.8%</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>average order growth</span>
                </div>
              </div>

              {/* Card 3: Verification Rate */}
              <div style={{ background: "#0c0d12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Approval conversion</span>
                  <span style={{ fontSize: "1.2rem" }}>✅</span>
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff" }}>
                  {importedParticipants.length > 0 
                    ? `${Math.round((importedParticipants.filter(p => p.status === "approved" || p.status === "issued" || p.status === "approve").length / importedParticipants.length) * 100)}%`
                    : "0%"
                  }
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {importedParticipants.filter(p => p.status === "approved" || p.status === "issued" || p.status === "approve").length} verified credentials
                </div>
              </div>

              {/* Card 4: Certificates Issued */}
              <div style={{ background: "#0c0d12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Certificates Issued</span>
                  <span style={{ fontSize: "1.2rem" }}>🎓</span>
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-gold)" }}>
                  {importedParticipants.filter(p => p.certIssued).length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Out of {importedParticipants.length} total participants
                </div>
              </div>

            </div>

            {/* Split layout */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
              
              {/* Event Distribution Metrics */}
              <div style={{ background: "#0c0d12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>Festival Registration Share</h3>
                
                {activeFests.length === 0 ? (
                  <div style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed rgba(255,255,255,0.04)", borderRadius: "12px", height: "200px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    No active festivals to display distribution charts. Create a festival to begin monitoring!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {activeFests.map((fest) => {
                      const count = importedParticipants.filter(p => p.fest === fest.title).length;
                      const pct = importedParticipants.length > 0 ? Math.round((count / importedParticipants.length) * 100) : 0;
                      const festRevenue = count * (fest.fee || 100);
                      
                      return (
                        <div key={fest.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                            <span style={{ fontWeight: 700, color: "#ffffff" }}>{fest.title}</span>
                            <span style={{ color: "var(--color-text-secondary)" }}>
                              {count} Signups ({pct}%) | <span style={{ color: "var(--color-cyan)" }}>₹{festRevenue.toLocaleString()}</span>
                            </span>
                          </div>
                          <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "4px", overflow: "hidden" }}>
                            <div 
                              style={{ 
                                height: "100%", 
                                width: `${pct}%`, 
                                background: "linear-gradient(90deg, var(--color-cyan), var(--color-purple))",
                                borderRadius: "4px"
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status breakdown Funnel */}
              <div style={{ background: "#0c0d12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>Onboarding Status</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                  {[
                    { label: "Issued", key: "issued", color: "var(--color-gold)", emoji: "🎓" },
                    { label: "Approved", key: "approved", color: "var(--color-cyan)", emoji: "☑️" },
                    { label: "Pending/Verify", key: "verified", color: "var(--color-teal)", emoji: "⏳" },
                    { label: "Denied", key: "denied", color: "var(--color-pink)", emoji: "❌" }
                  ].map((st) => {
                    const cnt = importedParticipants.filter(p => {
                      if (st.key === "approved") return p.status === "approved" || p.status === "approve";
                      return p.status === st.key;
                    }).length;
                    const pct = importedParticipants.length > 0 ? Math.round((cnt / importedParticipants.length) * 100) : 0;
                    
                    return (
                      <div key={st.key} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px", padding: "10px 14px" }}>
                        <span style={{ fontSize: "1rem" }}>{st.emoji}</span>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#ffffff" }}>
                            <span>{st.label}</span>
                            <span style={{ color: st.color }}>{cnt} ({pct}%)</span>
                          </div>
                          <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", marginTop: "4px" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: st.color, borderRadius: "2px" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Performance Conversion breakdown list */}
            <div style={{ background: "#0c0d12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#ffffff", margin: "0 0 16px 0" }}>Conversion Efficiency & Funnel Performance</h3>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                      <th style={{ padding: "12px 16px" }}>Festival Event Name</th>
                      <th style={{ padding: "12px 16px" }}>Total Registrations</th>
                      <th style={{ padding: "12px 16px" }}>Approved Records</th>
                      <th style={{ padding: "12px 16px" }}>Certificates Issued</th>
                      <th style={{ padding: "12px 16px" }}>Revenue Generated</th>
                      <th style={{ padding: "12px 16px" }}>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFests.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)" }}>
                          No active events tracked in console database.
                        </td>
                      </tr>
                    ) : (
                      activeFests.map((fest) => {
                        const signups = importedParticipants.filter(p => p.fest === fest.title).length;
                        const approved = importedParticipants.filter(p => p.fest === fest.title && (p.status === "approved" || p.status === "issued" || p.status === "approve")).length;
                        const issued = importedParticipants.filter(p => p.fest === fest.title && p.certIssued).length;
                        const conversion = signups > 0 ? Math.round((issued / signups) * 100) : 0;
                        const rev = signups * (fest.fee || 100);
                        
                        return (
                          <tr key={fest.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", color: "var(--color-text-secondary)" }}>
                            <td style={{ padding: "16px", fontWeight: 700, color: "#ffffff" }}>{fest.title}</td>
                            <td style={{ padding: "16px" }}>{signups} participants</td>
                            <td style={{ padding: "16px", color: "var(--color-cyan)" }}>{approved} verified</td>
                            <td style={{ padding: "16px", color: "var(--color-gold)" }}>{issued} issued</td>
                            <td style={{ padding: "16px", fontWeight: 700, color: "#ffffff" }}>₹{rev.toLocaleString()}</td>
                            <td style={{ padding: "16px" }}>
                              <span style={{ background: conversion === 100 ? "rgba(74, 222, 128, 0.1)" : "rgba(0, 210, 255, 0.08)", color: conversion === 100 ? "#4ade80" : "var(--color-cyan)", padding: "3px 8px", borderRadius: "10px", fontWeight: 600 }}>
                                {conversion}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : activeTab === "settings" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", paddingBottom: "100px" }}>
            
            {/* Header Row */}
            <div style={{ marginBottom: "8px" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", margin: 0, fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Portal Settings</h1>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "6px" }}>
                Comprehensive management of your organization's digital ecosystem.
              </p>
            </div>

            {/* Main General Info Card */}
            <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "32px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              
              {/* Section: Personal Information */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(0, 210, 255, 0.08)", border: "1px solid rgba(0, 210, 255, 0.15)", color: "var(--color-cyan)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Personal Information</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>Your identity within the portal</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Full Name</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Designation/Role</label>
                    <div className="select-wrapper">
                      <select 
                        className="form-input"
                        value={profileRole}
                        onChange={(e) => setProfileRole(e.target.value)}
                        style={{ background: "rgba(0,0,0,0.35)", paddingRight: "30px" }}
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
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}></div>

              {/* Section: Organization Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(192, 132, 252, 0.08)", border: "1px solid rgba(192, 132, 252, 0.15)", color: "var(--color-purple)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="9" y1="22" x2="9" y2="16" />
                      <line x1="15" y1="22" x2="15" y2="16" />
                      <line x1="9" y1="16" x2="15" y2="16" />
                      <path d="M8 6h8M8 10h8" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Organization Details</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>Define your public and internal identity</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
                  {/* Avatar upload/preview */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", minWidth: "140px" }}>
                    <div 
                      onClick={() => profilePicInputRef.current?.click()}
                      onMouseEnter={() => setIsPicHovered(true)}
                      onMouseLeave={() => setIsPicHovered(false)}
                      style={{ 
                        width: "120px", 
                        height: "120px", 
                        borderRadius: "16px", 
                        overflow: "hidden", 
                        border: "1px solid var(--color-border-glass)", 
                        position: "relative",
                        cursor: "pointer",
                        boxShadow: isPicHovered ? "0 0 15px rgba(0, 210, 255, 0.25)" : "none",
                        transition: "all 0.3s"
                      }}
                    >
                      <img 
                        src={profilePic || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&auto=format&fit=crop"} 
                        alt="Organizer Pic" 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover", 
                          filter: isPicHovered ? "blur(2px) brightness(0.6)" : "none",
                          transition: "filter 0.3s" 
                        }}
                      />
                      <div 
                        style={{ 
                          position: "absolute", 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          bottom: 0, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          opacity: isPicHovered ? 1 : 0,
                          transition: "opacity 0.3s"
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Hidden file input */}
                    <input 
                      type="file" 
                      ref={profilePicInputRef} 
                      onChange={handleProfilePicChange} 
                      accept="image/*" 
                      style={{ display: "none" }} 
                    />

                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ffffff", display: "block" }}>Organizer Pic</span>
                      <span style={{ fontSize: "0.6rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginTop: "2px", display: "block" }}>CLICK IMAGE TO UPLOAD</span>
                    </div>
                  </div>

                  {/* Details input grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Organization/College Name</label>
                        <input 
                          type="text" 
                          className="form-input"
                          value={profileOrg}
                          onChange={(e) => setProfileOrg(e.target.value)}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Department or Club Name</label>
                        <input 
                          type="text" 
                          className="form-input"
                          value={profileDept}
                          onChange={(e) => setProfileDept(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Organization Bio</label>
                      <textarea 
                        className="form-input"
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        style={{ minHeight: "80px", resize: "none" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}></div>

              {/* Section: Contact & Verification */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.15)", color: "var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Contact & Verification</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>Secure communication channels</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Official Email Address</label>
                    <input 
                      type="email" 
                      className="form-input"
                      value={profileEmail}
                      disabled
                      style={{ opacity: 0.6, cursor: "not-allowed", background: "rgba(255,255,255,0.03)" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Website (Optional)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={profileWebsite}
                      onChange={(e) => setProfileWebsite(e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Security & Authentication Card */}
            <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(244, 114, 182, 0.08)", border: "1px solid rgba(244, 114, 182, 0.15)", color: "var(--color-pink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Security & Authentication</h3>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>Manage credentials and access protection</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "40px" }}>
                {/* Left Side: Change Password */}
                <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "16px", borderRight: "1px solid rgba(255,255,255,0.04)", paddingRight: "40px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Change Password</span>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Current Password</label>
                      <Link href="/forgot-password" style={{ fontSize: "0.7rem", color: "var(--color-cyan)", fontWeight: 600, textDecoration: "underline" }}>FORGOT PASSWORD?</Link>
                    </div>
                    <input 
                      type="password" 
                      className="form-input"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>New Password</label>
                      <input 
                        type="password" 
                        className="form-input"
                        placeholder="Min 8 chars"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Confirm New Password</label>
                      <input 
                        type="password" 
                        className="form-input"
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>



                  <button 
                    type="submit" 
                    className="console-sidebar-btn-gradient" 
                    style={{ alignSelf: "stretch", padding: "14px", borderRadius: "10px", fontSize: "0.85rem", border: "none", cursor: "pointer", fontWeight: 700, transition: "all 0.2s" }}
                  >
                    Update Password
                  </button>
                </form>

                {/* Right Side: Active Sessions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Active Sessions</span>
                  
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ color: "var(--color-cyan)" }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>Chrome on MacOS (This device)</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>San Francisco, USA • Active now</div>
                        </div>
                      </div>
                      <button 
                        onClick={handleLogout}
                        style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                      >
                        LOG OUT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Notification Hub & Platform branding */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              
              {/* Notification Hub Card */}
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.15)", color: "var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Notification Hub</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>How we should reach you</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Email Notifications Toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ color: "var(--color-text-secondary)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>Email Notifications</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>Critical alerts & summaries.</div>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <label style={{ display: "inline-block", width: "44px", height: "24px", position: "relative", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={emailNotification}
                        onChange={(e) => setEmailNotification(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: emailNotification ? "var(--color-cyan)" : "#2a2d3d", borderRadius: "34px", transition: "0.3s", boxShadow: emailNotification ? "0 0 10px var(--color-cyan-glow)" : "none" }}>
                        <span style={{ position: "absolute", content: '""', height: "18px", width: "18px", left: emailNotification ? "22px" : "3px", bottom: "3px", background: "#ffffff", borderRadius: "50%", transition: "0.3s" }}></span>
                      </span>
                    </label>
                  </div>

                  {/* Push Alerts Toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ color: "var(--color-text-secondary)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>Push Alerts</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>Instant browser updates.</div>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <label style={{ display: "inline-block", width: "44px", height: "24px", position: "relative", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={pushAlerts}
                        onChange={(e) => setPushAlerts(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: pushAlerts ? "var(--color-cyan)" : "#2a2d3d", borderRadius: "34px", transition: "0.3s", boxShadow: pushAlerts ? "0 0 10px var(--color-cyan-glow)" : "none" }}>
                        <span style={{ position: "absolute", content: '""', height: "18px", width: "18px", left: pushAlerts ? "22px" : "3px", bottom: "3px", background: "#ffffff", borderRadius: "50%", transition: "0.3s" }}></span>
                      </span>
                    </label>
                  </div>

                  {/* SMS Marketing Toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ color: "var(--color-text-secondary)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>SMS Marketing</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>Optional promotional texts.</div>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <label style={{ display: "inline-block", width: "44px", height: "24px", position: "relative", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={smsMarketing}
                        onChange={(e) => setSmsMarketing(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: smsMarketing ? "var(--color-cyan)" : "#2a2d3d", borderRadius: "34px", transition: "0.3s", boxShadow: smsMarketing ? "0 0 10px var(--color-cyan-glow)" : "none" }}>
                        <span style={{ position: "absolute", content: '""', height: "18px", width: "18px", left: smsMarketing ? "22px" : "3px", bottom: "3px", background: "#ffffff", borderRadius: "50%", transition: "0.3s" }}></span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Platform & Branding Card */}
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-glass)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(45, 212, 191, 0.08)", border: "1px solid rgba(45, 212, 191, 0.15)", color: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Platform & Branding</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>Localization and default styles</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>System Language</label>
                    <div className="select-wrapper">
                      <select 
                        className="form-input"
                        value={systemLanguage}
                        onChange={(e) => setSystemLanguage(e.target.value)}
                        style={{ background: "rgba(0,0,0,0.35)", paddingRight: "30px" }}
                      >
                        <option value="English (US)">English (US)</option>
                        <option value="Spanish (ES)">Spanish (ES)</option>
                        <option value="French (FR)">French (FR)</option>
                        <option value="German (DE)">German (DE)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Default Currency</label>
                    <div className="select-wrapper">
                      <select 
                        className="form-input"
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        style={{ background: "rgba(0,0,0,0.35)", paddingRight: "30px" }}
                      >
                        <option value="INR (₹)">INR (₹)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="GBP (£)">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "16px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Certificate Defaults</span>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Signatory Name</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="Alex Rivera"
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Signatory Title</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="Managing Director"
                        value={signatoryTitle}
                        onChange={(e) => setSignatoryTitle(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom sticky/floating footer action bar */}
            <div style={{ 
              position: "fixed", 
              bottom: 0, 
              left: "260px", // Sidebar width is 260px
              right: 0, 
              background: "#0c0d12", 
              borderTop: "1px solid var(--color-border-glass)", 
              padding: "16px 40px", 
              display: "flex", 
              justifyContent: "flex-end", 
              alignItems: "center", 
              gap: "24px", 
              zIndex: 100 
            }}>
              <button 
                onClick={handleDiscardAllChanges}
                style={{ 
                  background: "transparent", 
                  color: "var(--color-text-secondary)", 
                  fontSize: "0.9rem", 
                  fontWeight: 600, 
                  border: "none", 
                  cursor: "pointer", 
                  transition: "color 0.2s" 
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
                onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSaveAllSettings}
                style={{ 
                  background: "linear-gradient(135deg, var(--color-cyan) 0%, #a855f7 100%)", 
                  color: "#000000", 
                  fontSize: "0.9rem", 
                  fontWeight: 700, 
                  padding: "12px 32px", 
                  borderRadius: "30px", 
                  border: "none", 
                  cursor: "pointer", 
                  boxShadow: "0 4px 15px rgba(0, 210, 255, 0.2)",
                  transition: "transform 0.2s, box-shadow 0.2s" 
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 210, 255, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 210, 255, 0.2)";
                }}
              >
                Save Preferences
              </button>
            </div>

          </div>
        ) : (
          <div style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "16px", padding: "100px 0" }}>
            <div style={{ textAlign: "center", maxWidth: "400px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(0, 210, 255, 0.05)", border: "1px solid rgba(0, 210, 255, 0.15)", color: "var(--color-cyan)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>Module under construction</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                This section of the Organizer Console ({activeTab}) is ready for backend API hooks. Select Overview to return.
              </p>
            </div>
          </div>
        )}


        {/* Footer */}
        <footer className="console-footer">
          <div className="console-footer-left">
            <div className="console-footer-logo">
              Cert<span>FIRE</span>
            </div>
            <span>&copy; 2024 CertFire. Fueling the future of tech fests.</span>
          </div>
          <div className="console-footer-links">
            <a href="#" className="console-footer-link" onClick={(e) => { e.preventDefault(); showToast("Legal documents portal...", "info"); }}>Privacy Policy</a>
            <a href="#" className="console-footer-link" onClick={(e) => { e.preventDefault(); showToast("Terms of service agreement...", "info"); }}>Terms of Service</a>
            <a href="#" className="console-footer-link" onClick={(e) => { e.preventDefault(); showToast("Support contact ticket generated...", "info"); }}>Support</a>
          </div>
        </footer>
      </main>

      {/* Inline Floating Toast Messages */}
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

      {/* Edit Fest Modal */}
      {editFestModalOpen && editingFest && (
        <div className="custom-modal-overlay" onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setEditFestModalOpen(false)}>
          <div className="custom-modal-card">
            <div className="custom-modal-header">
              <h2>Edit Festival Settings</h2>
              <button className="custom-modal-close" onClick={() => setEditFestModalOpen(false)}>&times;</button>
            </div>
            
            <div className="custom-modal-body">
              <div className="modal-input-group">
                <label>Event Title</label>
                <input 
                  type="text" 
                  value={editFestForm.title} 
                  onChange={(e) => setEditFestForm({ ...editFestForm, title: e.target.value })}
                  placeholder="e.g. PulseFest 2024"
                />
              </div>

              <div className="modal-input-group">
                <label>Seats Limit</label>
                <input 
                  type="number" 
                  value={editFestForm.seats} 
                  onChange={(e) => setEditFestForm({ ...editFestForm, seats: e.target.value })}
                  placeholder="e.g. 500"
                />
              </div>

              <div className="modal-input-group">
                <label>Registration Fee (INR)</label>
                <input 
                  type="number" 
                  value={editFestForm.fee} 
                  onChange={(e) => setEditFestForm({ ...editFestForm, fee: e.target.value })}
                  placeholder="e.g. 500 (enter 0 for Free Entry)"
                />
              </div>

              <div className="modal-input-group">
                <label>Venue / Location</label>
                <input 
                  type="text" 
                  value={editFestForm.location} 
                  onChange={(e) => setEditFestForm({ ...editFestForm, location: e.target.value })}
                  placeholder="e.g. Seminar Hall A / Virtual Link"
                />
              </div>
            </div>

            <div className="custom-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setEditFestModalOpen(false)}>Cancel</button>
              <button className="btn-modal-save" onClick={handleSaveFestEdit}>Save Fest Details</button>
            </div>
          </div>
        </div>
      )}

      {/* Participant Modal */}
      {modalOpen && (
        <div className="custom-modal-overlay" onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setModalOpen(false)}>
          <div className="custom-modal-card">
            <div className="custom-modal-header">
              <h2>{editIndex !== null ? "Edit Participant" : "Add Participant"}</h2>
              <button className="custom-modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            
            <div className="custom-modal-body">
              <div className="modal-input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={modalForm.name} 
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="e.g. Sarah Chen"
                />
              </div>

              <div className="modal-input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={modalForm.email} 
                  onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                  placeholder="e.g. sarah.chen@university.edu"
                />
              </div>

              <div className="modal-input-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  value={modalForm.phone} 
                  onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                  placeholder="e.g. +91 99881 22334"
                />
              </div>

              <div className="modal-input-group">
                <label>Festival / Event</label>
                <input 
                  type="text" 
                  value={modalForm.fest} 
                  onChange={(e) => setModalForm({ ...modalForm, fest: e.target.value })}
                  placeholder="e.g. PulseFest 2024"
                />
              </div>

              <div className="modal-input-group">
                <label>Verification Status</label>
                <select 
                  value={modalForm.status || "verified"} 
                  onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                >
                  <option value="verified">Verify</option>
                  <option value="approved">Approve</option>
                  <option value="denied">Denied</option>
                  <option value="issued">Issued</option>
                </select>
              </div>
            </div>

            <div className="custom-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-modal-save" onClick={handleSaveParticipant}>Save Details</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedQrCode && (
        <div className="custom-modal-overlay" onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setShowQrModal(false)}>
          <div className="custom-modal-card" style={{ maxWidth: "400px", textAlign: "center" }}>
            <div className="custom-modal-header">
              <h2>Participant QR Code</h2>
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
                <div style={{ fontSize: "0.85rem", color: "var(--color-cyan)", fontFamily: "monospace" }}>{selectedQrCode.id}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>{selectedQrCode.fest}</div>
              </div>
            </div>
            <div className="custom-modal-footer" style={{ justifyContent: "center" }}>
              <button 
                className="btn-modal-save" 
                onClick={() => {
                  window.open(selectedQrCode.url, "_blank");
                }}
              >
                Open Link
              </button>
              <button className="btn-modal-cancel" onClick={() => setShowQrModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* WYSIWYG Editor Preview Modal */}
      {showDesignerPreview && (
        <div className="custom-modal-overlay" onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setShowDesignerPreview(false)}>
          <div className="custom-modal-card" style={{ maxWidth: "860px", padding: "0", background: "none", border: "none" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <button 
                className="btn-close-studio"
                onClick={() => setShowDesignerPreview(false)}
              >
                &times;
              </button>
            </div>
            <div style={{ width: "100%", background: "#090a0d", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: "600px", height: "400px", position: "relative" }}>
                {renderCertificatePreview("custom", {
                  title: "CERTIFICATE OF ACHIEVEMENT",
                  subtitle: "OF ACHIEVEMENT",
                  presentationText: "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
                  recipientName: "Alex Morgan",
                  description: "Global Hackfest 2024",
                  date: new Date().toLocaleDateString(),
                  sig1Name: "Alex Rivera",
                  sig1Title: "Festival Organizer",
                  sig2Name: "CertFIRE Secure",
                  sig2Title: "Verified Protocol"
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Certificate Preview Modal */}
      {previewTemplateOpen && (
        <div className="custom-modal-overlay" onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setPreviewTemplateOpen(false)}>
          <div className="custom-modal-card" style={{ maxWidth: "860px", padding: "0", background: "none", border: "none" }}>
            
            {/* Modal header/close button on top outside card */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <button 
                className="btn-close-studio"
                onClick={() => setPreviewTemplateOpen(false)}
              >
                &times;
              </button>
            </div>

            {/* Certificate Render Container */}
            <div style={{ width: "100%", background: "#090a0d", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "center" }}>
              {renderCertificatePreview(previewTemplateType, {
                title: previewTemplateType === "achievement" ? "CERTIFICATE OF ACHIEVEMENT" : previewTemplateType === "appreciation" ? "CERTIFICATE OF APPRECIATION" : previewTemplateType === "completion" ? "CERTIFICATE OF COMPLETION" : "CERTIFICATE OF RECOGNITION",
                subtitle: previewTemplateType.toUpperCase(),
                presentationText: previewTemplateType === "completion" ? "THIS CERTIFIES THAT" : "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
                recipientName: "Sarah Chen",
                description: previewTemplateType === "achievement" 
                  ? "for successfully demonstrating outstanding skills, active collaboration, and technical proficiency during the event assemblies."
                  : previewTemplateType === "appreciation"
                    ? "is hereby proudly presented to acknowledge the outstanding efforts and dedicated service rendered during the event."
                    : previewTemplateType === "completion"
                      ? "certifies that they have successfully met all course requirements and challenges of the event and is awarded this credential."
                      : "for demonstrating exceptional competency, dedication, and professional excellence in their respective role.",
                date: new Date().toLocaleDateString(),
                sig1Name: "Alex Rivera",
                sig1Title: "Festival Chair",
                sig2Name: "CertFIRE Secure",
                sig2Title: "Verified Protocol"
              }, { visible: false })}
            </div>

          </div>
        </div>
      )}

      {/* Certificate Studio (Interactive Editor Workspace) */}
      {showCertStudio && activeCertParticipant && (
        <div className="cert-studio-overlay">
          <div className="cert-studio-card">
            
            {/* Header */}
            <div className="cert-studio-header">
              <h2>
                Certificate Studio 
                <span>{activeCertParticipant.name}</span>
                <span style={{ background: "rgba(192, 132, 252, 0.1)", border: "1px solid rgba(192, 132, 252, 0.2)", color: "#c084fc", marginLeft: "8px" }}>
                  {activeCertParticipant.fest}
                </span>
              </h2>
              <button className="btn-close-studio" onClick={() => setShowCertStudio(false)}>&times;</button>
            </div>

            {/* Main Workspace Body */}
            <div className="cert-studio-body">
              
              {/* Left Pane: Interactive Live Preview */}
              <div className="cert-studio-preview-pane">
                <div className="cert-preview-wrapper">
                  {renderCertificatePreview(selectedTemplate, certWritings, {
                    url: participantImage,
                    scale: participantImageScale,
                    x: participantImageX,
                    y: participantImageY,
                    shape: participantImageShape,
                    visible: showParticipantImage
                  })}
                </div>
              </div>

              {/* Right Pane: Controls Sidebar */}
              <div className="cert-studio-sidebar">
                
                {/* 1. Design Template Selection */}
                <div className="studio-input-group">
                  <label>Template Design</label>
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => {
                      const newTpl = e.target.value;
                      setSelectedTemplate(newTpl);
                      initializeDefaultWritings(activeCertParticipant, newTpl);
                    }}
                  >
                    <option value="achievement">Achievement (Maroon Waves)</option>
                    <option value="appreciation">Appreciation (Navy Geometric)</option>
                    <option value="completion">Completion (Vintage Gothic)</option>
                    <option value="recognition">Recognition (Elegant Blue Leaf)</option>
                    <option value="custom">Custom Design Template (Design Suite)</option>
                  </select>
                </div>

                {/* 2. Writings Content */}
                <div className="studio-section-title">Certificate Writings</div>
                
                <div className="studio-input-group">
                  <label>Certificate Title</label>
                  <input 
                    type="text" 
                    value={certWritings.title}
                    onChange={(e) => setCertWritings({ ...certWritings, title: e.target.value })}
                  />
                </div>

                <div className="studio-input-group">
                  <label>Presentation Text</label>
                  <input 
                    type="text" 
                    value={certWritings.presentationText}
                    onChange={(e) => setCertWritings({ ...certWritings, presentationText: e.target.value })}
                  />
                </div>

                <div className="studio-input-group">
                  <label>Recipient Name</label>
                  <input 
                    type="text" 
                    value={certWritings.recipientName}
                    onChange={(e) => setCertWritings({ ...certWritings, recipientName: e.target.value })}
                  />
                </div>

                <div className="studio-input-group">
                  <label>Body Description</label>
                  <textarea 
                    rows="3"
                    value={certWritings.description}
                    onChange={(e) => setCertWritings({ ...certWritings, description: e.target.value })}
                  />
                </div>

                <div className="studio-input-group">
                  <label>Issue Date</label>
                  <input 
                    type="text" 
                    value={certWritings.date}
                    onChange={(e) => setCertWritings({ ...certWritings, date: e.target.value })}
                  />
                </div>

                {/* Signatories */}
                <div className="studio-section-title">Signatories</div>
                
                <div className="studio-input-group">
                  <label>Signatory 1 Name</label>
                  <input 
                    type="text" 
                    value={certWritings.sig1Name}
                    onChange={(e) => setCertWritings({ ...certWritings, sig1Name: e.target.value })}
                  />
                </div>
                <div className="studio-input-group">
                  <label>Signatory 1 Title</label>
                  <input 
                    type="text" 
                    value={certWritings.sig1Title}
                    onChange={(e) => setCertWritings({ ...certWritings, sig1Title: e.target.value })}
                  />
                </div>

                <div className="studio-input-group">
                  <label>Signatory 2 Name</label>
                  <input 
                    type="text" 
                    value={certWritings.sig2Name}
                    onChange={(e) => setCertWritings({ ...certWritings, sig2Name: e.target.value })}
                  />
                </div>
                <div className="studio-input-group">
                  <label>Signatory 2 Title</label>
                  <input 
                    type="text" 
                    value={certWritings.sig2Title}
                    onChange={(e) => setCertWritings({ ...certWritings, sig2Title: e.target.value })}
                  />
                </div>

                {/* 3. Participant Specific Image Uploader */}
                <div className="studio-section-title">Participant Image</div>
                
                <div className="studio-input-group" style={{ flexDirection: "row", gap: "10px", alignItems: "center" }}>
                  <input 
                    type="checkbox" 
                    id="show-img-toggle"
                    checked={showParticipantImage}
                    onChange={(e) => setShowParticipantImage(e.target.checked)}
                    style={{ cursor: "pointer", width: "auto" }}
                  />
                  <label htmlFor="show-img-toggle" style={{ cursor: "pointer", userSelect: "none", marginBottom: 0 }}>
                    Enable Photo Overlay
                  </label>
                </div>

                {showParticipantImage && (
                  <>
                    <div className="studio-input-group">
                      <label>Upload Photo / Badge</label>
                      <label className="studio-file-upload-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span>Choose File...</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (readerEvent) => {
                                setParticipantImage(readerEvent.target.result);
                                showToast("Participant image loaded successfully.", "success");
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="studio-input-group">
                      <label>Photo Crop Style</label>
                      <select 
                        value={participantImageShape}
                        onChange={(e) => setParticipantImageShape(e.target.value)}
                      >
                        <option value="circle">Circular Profile</option>
                        <option value="square">Rectangular Badge</option>
                      </select>
                    </div>

                    <div className="studio-input-group">
                      <label>Scale Overlay</label>
                      <div className="studio-range-row">
                        <input 
                          type="range" 
                          min="0.5" 
                          max="2.5" 
                          step="0.05" 
                          value={participantImageScale}
                          onChange={(e) => setParticipantImageScale(Number(e.target.value))}
                        />
                        <span className="studio-range-val">{Math.round(participantImageScale * 100)}%</span>
                      </div>
                    </div>

                    <div className="studio-input-group">
                      <label>Horizontal Position (X)</label>
                      <div className="studio-range-row">
                        <input 
                          type="range" 
                          min="20" 
                          max="650" 
                          step="2" 
                          value={participantImageX}
                          onChange={(e) => setParticipantImageX(Number(e.target.value))}
                        />
                        <span className="studio-range-val">{participantImageX}px</span>
                      </div>
                    </div>

                    <div className="studio-input-group">
                      <label>Vertical Position (Y)</label>
                      <div className="studio-range-row">
                        <input 
                          type="range" 
                          min="20" 
                          max="400" 
                          step="2" 
                          value={participantImageY}
                          onChange={(e) => setParticipantImageY(Number(e.target.value))}
                        />
                        <span className="studio-range-val">{participantImageY}px</span>
                      </div>
                    </div>
                  </>
                )}

              </div>

            </div>

            {/* Footer action panel */}
            <div className="cert-studio-footer-panel">
              <div className="studio-actions-left">
                <button className="btn-studio-sec" onClick={() => setShowCertStudio(false)}>
                  Cancel
                </button>
              </div>
              
              <div className="studio-actions-right">
                <button className="btn-studio-sec" onClick={handleShareCertStudio}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  <span>Share</span>
                </button>
                
                <button className="btn-studio-sec" onClick={handleDownloadCertPDF}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download PDF</span>
                </button>
                
                <button className="btn-studio-primary" onClick={handleSaveCertStudio}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  <span>Save & Issue</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Sharing Overlay Modal */}
      {showShareModal && (
        <div 
          className="custom-modal-overlay" 
          onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setShowShareModal(false)}
          style={{ zIndex: 3000 }}
        >
          <div className="custom-modal-card" style={{ maxWidth: "480px" }}>
            <div className="custom-modal-header">
              <h2>Share Credential</h2>
              <button className="custom-modal-close" onClick={() => setShowShareModal(false)}>&times;</button>
            </div>
            
            <div className="custom-modal-body" style={{ padding: "12px 0 0 0", textAlign: "left" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "16px", lineHeight: "1.4" }}>
                Generate instant public visibility for {certWritings.recipientName}'s certificate! Choose a platform below:
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* LinkedIn Share button */}
                <button 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "12px",
                    background: "rgba(10, 102, 194, 0.08)",
                    border: "1px solid rgba(10, 102, 194, 0.2)",
                    borderRadius: "8px",
                    color: "#0a66c2",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onClick={() => {
                    const postText = `Proudly sharing the verified digital certificate issued to ${certWritings.recipientName} for participating in ${activeCertParticipant?.fest || "our event"}! Verify online at CertFIRE.`;
                    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`, "_blank");
                    showToast("LinkedIn feed opened with credential details!", "success");
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  Share to LinkedIn
                </button>

                {/* Twitter / X Share button */}
                <button 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onClick={() => {
                    const postText = `Issue complete! Verified credential issued to ${certWritings.recipientName} for ${activeCertParticipant?.fest || "our event"} by @CertFire! 🚀🎓`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`, "_blank");
                    showToast("Twitter intent loaded!", "success");
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Post to X / Twitter
                </button>

                {/* Copy Validation URL */}
                <button 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "12px",
                    background: "rgba(45, 212, 191, 0.08)",
                    border: "1px solid rgba(45, 212, 191, 0.2)",
                    borderRadius: "8px",
                    color: "var(--color-teal)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onClick={() => {
                    const mockUrl = `https://certfire.io/verify/CF-${activeCertParticipant?.email.substring(0,3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
                    navigator.clipboard.writeText(mockUrl);
                    showToast("Credential verification link copied to clipboard!", "success");
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Copy Verification Link
                </button>

              </div>
            </div>
            
            <div className="custom-modal-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "20px", paddingTop: "12px" }}>
              <button className="btn-modal-cancel" style={{ width: "100%" }} onClick={() => setShowShareModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Festival Dashboard & Roster Modal */}
      {showDashboardModal && selectedDashboardFest && (
        <div 
          className="custom-modal-overlay" 
          onClick={(e) => e.target.classList.contains("custom-modal-overlay") && setShowDashboardModal(false)}
          style={{ zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div className="custom-modal-card" style={{ maxWidth: "900px", width: "90%", maxHeight: "90vh", overflowY: "auto", background: "#0c0d12", border: "1px solid var(--color-cyan-glow)" }}>
            <div className="custom-modal-header" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.8rem" }}>📊</span>
                <div style={{ textAlign: "left" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                    {selectedDashboardFest.title}
                  </h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
                    Festival Console Dashboard & Participant Roster
                  </p>
                </div>
              </div>
              <button className="custom-modal-close" onClick={() => setShowDashboardModal(false)} style={{ fontSize: "1.8rem", color: "#ffffff", opacity: 0.8 }} aria-label="Close modal">&times;</button>
            </div>
            
            <div className="custom-modal-body" style={{ padding: "24px 0 0 0", display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Event Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left Panel: Banner and Description */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ width: "100%", height: "200px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
                    <img 
                      src={selectedDashboardFest.image || "/assets/hero_bg.png"} 
                      alt={selectedDashboardFest.title} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                    <span 
                      style={{ 
                        position: "absolute", 
                        top: "12px", 
                        left: "12px", 
                        background: "rgba(0, 210, 255, 0.25)", 
                        color: "var(--color-cyan)", 
                        backdropFilter: "blur(5px)", 
                        fontSize: "0.75rem", 
                        fontWeight: 700, 
                        padding: "4px 10px", 
                        borderRadius: "20px",
                        border: "1px solid rgba(0, 210, 255, 0.4)" 
                      }}
                    >
                      {selectedDashboardFest.category || "TECH"}
                    </span>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-cyan)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Event Description
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.5", margin: 0, maxHeight: "120px", overflowY: "auto", paddingRight: "8px" }}>
                      {selectedDashboardFest.description || "No description available for this event."}
                    </p>
                  </div>
                </div>

                {/* Right Panel: Detailed Metrics List */}
                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-cyan)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Event Information
                  </h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 10px" }}>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Date & Time</span>
                      <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600 }}>
                        {selectedDashboardFest.dateMonth ? `${selectedDashboardFest.dateMonth} ${selectedDashboardFest.dateDay}` : "N/A"}
                        {selectedDashboardFest.timeRange ? ` | ${selectedDashboardFest.timeRange}` : ""}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Venue / Location</span>
                      <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600 }}>{selectedDashboardFest.location || "N/A"}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Total Registrations</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-cyan)", fontWeight: 700 }}>
                        {importedParticipants.filter(p => p.fest && p.fest.toLowerCase().trim() === selectedDashboardFest.title.toLowerCase().trim()).length}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Available Capacity</span>
                      <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600 }}>{selectedDashboardFest.seats || "N/A"}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Entry Fee</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-gold)", fontWeight: 600 }}>{selectedDashboardFest.fee || "Free Entry"}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Registration Deadline</span>
                      <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600 }}>{selectedDashboardFest.deadline || "N/A"}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Eligibility</span>
                    <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600 }}>{selectedDashboardFest.eligibility || "Open to all participants"}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Organizer Contact</span>
                    <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600 }}>{selectedDashboardFest.organizer || "CertFIRE Organizer"}</span>
                  </div>
                </div>
              </div>

              {/* Roster / Registered Participants Table */}
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-cyan)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Registered Participants
                  </h3>
                  <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "12px", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                    {importedParticipants.filter(p => p.fest && p.fest.toLowerCase().trim() === selectedDashboardFest.title.toLowerCase().trim()).length} total
                  </span>
                </div>

                <div className="console-table-scroll" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  <table className="console-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Name</th>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Email</th>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Phone</th>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Certificate ID</th>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const matching = importedParticipants.filter(
                          p => p.fest && p.fest.toLowerCase().trim() === selectedDashboardFest.title.toLowerCase().trim()
                        );
                        if (matching.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                                No students have registered for this festival yet.
                              </td>
                            </tr>
                          );
                        }
                        return matching.map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding: "10px", fontWeight: 600, color: "#ffffff", fontSize: "0.85rem" }}>{p.name}</td>
                            <td style={{ padding: "10px", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>{p.email}</td>
                            <td style={{ padding: "10px", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>{p.phone || "N/A"}</td>
                            <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "0.8rem", color: "var(--color-cyan)" }}>
                              {p.certificate_id || "N/A"}
                            </td>
                            <td style={{ padding: "10px" }}>
                              <span 
                                style={{
                                  background: 
                                    (p.status === "approved" || p.status === "approve") ? "rgba(0, 210, 255, 0.1)" :
                                    (p.status === "denied" || p.status === "deny") ? "rgba(244, 114, 182, 0.1)" :
                                    (p.status === "issued") ? "rgba(251, 191, 36, 0.1)" :
                                    "rgba(45, 212, 191, 0.1)",
                                  color:
                                    (p.status === "approved" || p.status === "approve") ? "var(--color-cyan)" :
                                    (p.status === "denied" || p.status === "deny") ? "var(--color-pink)" :
                                    (p.status === "issued") ? "var(--color-gold)" :
                                    "var(--color-teal)",
                                  border: "1px solid currentColor",
                                  borderRadius: "12px",
                                  padding: "2px 8px",
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px"
                                }}
                              >
                                {p.status || "verified"}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="custom-modal-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "24px", paddingTop: "16px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              {selectedDashboardFest.isDraft && (
                <button 
                  className="btn-modal-publish" 
                  style={{ 
                    background: "linear-gradient(135deg, var(--color-cyan) 0%, #00bcff 100%)", 
                    border: "none", 
                    color: "#0b0c10", 
                    padding: "10px 24px", 
                    borderRadius: "8px", 
                    fontWeight: 700, 
                    cursor: "pointer", 
                    transition: "all 0.2s" 
                  }}
                  onClick={() => {
                    handleDirectPublish(selectedDashboardFest);
                    setShowDashboardModal(false);
                  }}
                >
                  Publish Fest
                </button>
              )}
              <button 
                className="btn-modal-cancel" 
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", padding: "10px 24px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => setShowDashboardModal(false)}
              >
                Close Dashboard
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
