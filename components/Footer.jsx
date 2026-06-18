import Link from "next/link";

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="section-container footer-grid">
        {/* Footer Brand Column */}
        <div className="footer-brand-col">
          <Link href="/" className="logo footer-logo" id="footer-logo">
            Cert<span>FIRE</span>
          </Link>
          <p className="footer-desc">The future of digital credentials for tech-centric fests and hackathons.</p>
        </div>

        {/* Footer Columns */}
        <div className="footer-links-col">
          <h4 className="footer-title">Navigation</h4>
          <ul>
            <li><Link href="/" id="footer-nav-home">Home</Link></li>
            <li><Link href="/browse-fests" id="footer-nav-fests">Browse Fests</Link></li>
            <li><Link href="/#about-section" id="footer-nav-about">About Us</Link></li>
            <li><Link href="/#newsletter-section" id="footer-nav-contact">Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Legal</h4>
          <ul>
            <li><Link href="#" id="footer-legal-privacy">Privacy Policy</Link></li>
            <li><Link href="#" id="footer-legal-terms">Terms & Conditions</Link></li>
            <li><Link href="#" id="footer-legal-cookie">Cookie Policy</Link></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Social</h4>
          <ul>
            <li><a href="#" id="footer-social-twitter">Twitter</a></li>
            <li><a href="#" id="footer-social-insta">Instagram</a></li>
            <li><a href="#" id="footer-social-linkedin">LinkedIn</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom section-container">
        <p className="copyright">&copy; 2026 CertFIRE. All rights reserved.</p>
      </div>
    </footer>
  );
}
