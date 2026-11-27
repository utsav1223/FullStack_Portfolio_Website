import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  FileText,
  Lock,
  Github,
  Linkedin,
  Globe,
  Code2,
  Terminal,
} from 'lucide-react';

const LINK_ICONS = {
  github: Github,
  linkedin: Linkedin,
  portfolio: Globe,
  leetcode: Code2,
  codeforces: Terminal,
};

export default function Footer({
  header,
  hasExperience,
  hasCertifications,
  onOpenAdmin,
}) {
  const activeLinks = Object.entries(header.links || {}).filter(
    ([, item]) => item && item.active && item.url && item.url.trim().length > 0
  );

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-cta-band">
          <div>
            <p className="section-eyebrow">Open for Opportunities</p>
            <h2 className="footer-cta-title">
              Let&apos;s build something impactful together.
            </h2>
          </div>

          {header.email && (
            <a href={`mailto:${header.email}`} className="cta-pill">
              <span>{header.email}</span>
              <span className="cta-pill-circle" aria-hidden="true">
                <ArrowRight size={14} />
              </span>
            </a>
          )}
        </div>

        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">{header.fullName}</div>
            <p className="footer-desc">
              {header.headline || 'Full-Stack Software Engineer · B.Tech CSE'}
            </p>
            {header.location && (
              <div className="footer-location">
                <MapPin size={14} />
                <span>{header.location}</span>
              </div>
            )}
          </div>

          <div className="footer-col">
            <div className="footer-heading">Navigation</div>
            <div className="footer-nav">
              <a href="#top">Home</a>
              <a href="#skills">Technical Skills</a>
              {hasExperience && <a href="#experience">Experience</a>}
              <a href="#projects">Featured Projects</a>
              <a href="#education">Education</a>
              {hasCertifications && <a href="#certifications">Certifications</a>}
              <a href="#achievements">Achievements</a>
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Connect &amp; Profiles</div>
            <div className="footer-connect-links">
              {header.phone && (
                <a
                  href={`tel:${header.phone.replace(/\s+/g, '')}`}
                  className="footer-connect-item"
                >
                  <Phone size={14} />
                  <span>{header.phone}</span>
                </a>
              )}
              {header.email && (
                <a
                  href={`mailto:${header.email}`}
                  className="footer-connect-item"
                >
                  <Mail size={14} />
                  <span>{header.email}</span>
                </a>
              )}
              {activeLinks.map(([key, item]) => {
                const Icon = LINK_ICONS[key] || Globe;
                return (
                  <a
                    key={key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-connect-item"
                  >
                    <Icon size={14} />
                    <span>{item.label || key}</span>
                  </a>
                );
              })}
              {header.resumeFileName && (
                <a
                  href="/api/resume"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-connect-item"
                >
                  <FileText size={14} />
                  <span>Resume PDF</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-meta">
            © {new Date().getFullYear()} {header.fullName}. Engineered with React &amp; Node.js.
          </span>

          <button
            type="button"
            className="btn btn-sm"
            onClick={onOpenAdmin}
          >
            <Lock size={13} />
            Manage Portfolio
          </button>
        </div>
      </div>
    </footer>
  );
}
