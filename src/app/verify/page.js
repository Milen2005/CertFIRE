"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const certId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState(null);
  const [certTemplate, setCertTemplate] = useState("achievement");
  const [certWritings, setCertWritings] = useState(null);
  const [certImageState, setCertImageState] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!certId) {
      setLoading(false);
      return;
    }

    // 1. Scan localStorage to locate matching participant
    let foundParticipant = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("importedParticipants_") || key === "importedParticipants")) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          const found = list.find((p) => p.certificate_id === certId || p.id === certId);
          if (found) {
            foundParticipant = found;
            break;
          }
        } catch (e) { }
      }
    }

    if (!foundParticipant) {
      setLoading(false);
      return;
    }

    setParticipant(foundParticipant);

    // 2. Resolve certificate template and config
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

    const globalTpl = localStorage.getItem("globalSelectedTemplate");
    const defaultTemplate = globalTpl || getTemplateForEvent(foundParticipant.fest);
    setCertTemplate(defaultTemplate);

    // Check if custom designer layout exists for this participant
    const savedConfig = localStorage.getItem(`customCert_${foundParticipant.email}_${foundParticipant.fest}`);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setCertWritings(config.writings);
        setCertTemplate(config.template || defaultTemplate);
        setCertImageState({
          url: config.participantImage,
          scale: config.participantImageScale,
          x: config.participantImageX,
          y: config.participantImageY,
          shape: config.participantImageShape,
          visible: config.showParticipantImage
        });
      } catch (e) {
        useDefaultCertWritings(foundParticipant, defaultTemplate);
      }
    } else {
      useDefaultCertWritings(foundParticipant, defaultTemplate);
    }

    setLoading(false);
  }, [certId]);

  const useDefaultCertWritings = (p, template) => {
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
      recipientName: p.name,
      description: desc,
      date: p.date || new Date().toLocaleDateString(),
      sig1Name: "Alex Rivera",
      sig1Title: "Festival Organizer",
      sig2Name: "CertFIRE Secure",
      sig2Title: "Verified Protocol"
    });
    setCertImageState({ visible: false });
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
        scale: 2,
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
    if (!writings) return null;
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
              else if (el.token === "certificate_id") displayText = certId || "CF-889-2024";
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
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#090a0d", color: "#ffffff" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid rgba(0, 210, 255, 0.1)", borderLeftColor: "var(--color-cyan)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
        <p style={{ marginTop: "16px", color: "var(--color-text-secondary)" }}>Verifying certificate credential...</p>
      </div>
    );
  }

  if (!participant) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#090a0d", color: "#ffffff", padding: "20px", textAlign: "center" }}>
        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "24px", borderRadius: "16px", maxWidth: "500px", width: "100%", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ color: "#ef4444", marginBottom: "16px" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "8px" }}>Verification Failed</h1>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.5", fontSize: "0.95rem" }}>
            The certificate ID <strong>{certId || "N/A"}</strong> could not be validated in our secure register.
            This credential may be invalid or revoked.
          </p>
          <div style={{ marginTop: "24px" }}>
            <Link href="/" style={{ display: "inline-block", background: "linear-gradient(135deg, var(--color-cyan) 0%, var(--color-purple) 100%)", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, textDecoration: "none" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isIssued = participant.certIssued || participant.status === "issued";

  return (
    <div style={{ background: "#090a0d", color: "#ffffff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--color-border-glass)", padding: "16px 24px", backgroundColor: "rgba(12, 13, 18, 0.8)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "1.5rem", fontWeight: 700, textDecoration: "none", color: "#ffffff" }}>
            Cert<span style={{ color: "var(--color-cyan)" }}>FIRE</span>
          </Link>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", background: "rgba(255,255,255,0.03)", padding: "6px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            VERIFICATION SYSTEM
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "40px 24px", display: "flex", flexDirection: "column", gap: "32px", alignItems: "center" }}>

        {/* Verification Status Card */}
        <section style={{ width: "100%", maxWidth: "800px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--color-border-glass)", padding: "24px", borderRadius: "16px", display: "flex", gap: "20px", alignItems: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {isIssued ? (
            <>
              <div style={{ color: "var(--color-cyan)", background: "rgba(0, 210, 255, 0.08)", padding: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 11 2 2 4-4" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-cyan)", letterSpacing: "1px" }}>CREDENTIAL VERIFIED</div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Official Digital Certificate</h2>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0 }}>
                  This certifies that <strong>{participant.name}</strong> has been awarded an official credential for participating in <strong>{participant.fest}</strong>.
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "var(--color-gold)", background: "rgba(251, 191, 36, 0.08)", padding: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-gold)", letterSpacing: "1px" }}>ISSUANCE PENDING</div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Certificate Not Yet Issued</h2>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0 }}>
                  The participant <strong>{participant.name}</strong> is registered, but the organizer has not yet completed and issued this certificate.
                </p>
              </div>
            </>
          )}
        </section>

        {/* Certificate Rendering Area */}
        {isIssued && certWritings && (
          <section style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center", width: "100%", maxWidth: "800px" }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "3 / 2",
                maxHeight: "530px",
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden"
              }}
            >
              {renderCertificatePreview(certTemplate, certWritings, certImageState)}
            </div>

            {/* Actions Bar */}
            <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
              <button
                onClick={handleDownloadCertPDF}
                style={{
                  background: "linear-gradient(135deg, var(--color-cyan) 0%, var(--color-purple) 100%)",
                  color: "#ffffff",
                  padding: "14px 28px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 4px 15px rgba(0, 210, 255, 0.3)",
                  fontSize: "0.95rem"
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF Certificate
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--color-border-glass)",
                  color: "#ffffff",
                  padding: "14px 28px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.95rem"
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print / Save
              </button>
            </div>
          </section>
        )}

        {/* Verification Info Footer details */}
        <section style={{ maxWidth: "600px", width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            <span>Certificate ID:</span>
            <span style={{ fontFamily: "monospace", color: "var(--color-cyan)" }}>{certId}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            <span>Recipient Name:</span>
            <span style={{ color: "#ffffff", fontWeight: 500 }}>{participant.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            <span>Event / Fest:</span>
            <span style={{ color: "#ffffff", fontWeight: 500 }}>{participant.fest}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            <span>Issued On:</span>
            <span style={{ color: "#ffffff", fontWeight: 500 }}>{participant.date || "N/A"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            <span>Verification Authority:</span>
            <span style={{ color: "var(--color-teal)", fontWeight: 600 }}>CertFIRE Verification Node</span>
          </div>
        </section>
      </main>

      {/* Inline Floating Toast Messages */}
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
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#090a0d", color: "#ffffff" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading verification page...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
