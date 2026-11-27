import { useEffect, useState } from 'react';
import { ArrowRight, Lock, Menu, X } from 'lucide-react';

export default function Navbar({
  fullName,
  hasExperience,
  hasCertifications,
  onOpenAdmin,
}) {
  const [activeId, setActiveId] = useState('top');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'top', label: 'Home' },
    { id: 'skills', label: 'Skills' },
    ...(hasExperience ? [{ id: 'experience', label: 'Experience' }] : []),
    { id: 'projects', label: 'Projects' },
    { id: 'education', label: 'Education' },
    ...(hasCertifications ? [{ id: 'certifications', label: 'Certifications' }] : []),
    { id: 'achievements', label: 'Achievements' },
  ];

  useEffect(() => {
    const ids = [...navItems.map((n) => n.id), 'contact'];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [hasExperience, hasCertifications]);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a href="#top" className="nav-brand">
          {fullName || 'Portfolio'}
        </a>

        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-link ${activeId === item.id ? 'is-active' : ''}`}
              aria-current={activeId === item.id ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-edit-btn"
            onClick={onOpenAdmin}
          >
            <Lock size={12} aria-hidden="true" />
            Manage
          </button>

          <a href="#contact" className="cta-pill nav-desktop-cta">
            <span>Get in touch</span>
            <span className="cta-pill-circle" aria-hidden="true">
              <ArrowRight size={14} />
            </span>
          </a>

          <button
            type="button"
            className="nav-mobile-toggle"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="nav-mobile-menu" aria-label="Mobile navigation">
          <div className="container nav-mobile-list">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-mobile-link ${activeId === item.id ? 'is-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              className="nav-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
