import {
  Phone,
  Mail,
  MapPin,
  Github,
  Linkedin,
  Globe,
  Code2,
  Terminal,
  FileText,
  BadgeDollarSign,
} from 'lucide-react';

const LINK_ICONS = {
  github: Github,
  linkedin: Linkedin,
  portfolio: Globe,
  leetcode: Code2,
  codeforces: Terminal,
};

export default function HeroHeader({ header, experiences = [] }) {
  const hasExperience = experiences.length > 0;
  const totalEarnings = experiences.reduce(
    (sum, item) => sum + (Number(item.earningsNumeric) || 0),
    0
  );

  const links = Object.entries(header.links || {}).filter(
    ([, item]) => item && item.active && item.url && item.url.trim().length > 0
  );

  const indexItems = [
    { num: '#01', label: 'Technical Skills', href: '#skills' },
    hasExperience
      ? { num: '#02', label: 'Experience', href: '#experience' }
      : { num: '#02', label: 'Featured Projects', href: '#projects' },
    hasExperience
      ? { num: '#03', label: 'Featured Projects', href: '#projects' }
      : { num: '#03', label: 'Education & Core CS', href: '#education' },
    { num: '#04', label: 'Achievements & Profiles', href: '#achievements' },
  ];

  return (
    <section id="top" className="hero-section">
      <div className="container">
        <div className="hero-split">
          <div className="hero-left">
            <p className="hero-eyebrow">Hey, I&apos;m {header.fullName}</p>
            <h1 className="hero-title">
              Full-Stack
              <br />
              Developer
            </h1>

            {hasExperience && totalEarnings > 0 && (
              <a href="#experience" className="hero-exp-highlight">
                <BadgeDollarSign size={14} aria-hidden="true" />
                <span>
                  <strong>${totalEarnings}+</strong> earned through technical contributions ·{' '}
                  <strong>{experiences.length}</strong> contract projects
                </span>
              </a>
            )}

            <div className="hero-contact-row">
              {header.phone && (
                <a href={`tel:${header.phone.replace(/\s+/g, '')}`} className="hero-contact-item">
                  <Phone size={14} />
                  <span>{header.phone}</span>
                </a>
              )}
              {header.email && (
                <a href={`mailto:${header.email}`} className="hero-contact-item">
                  <Mail size={14} />
                  <span>{header.email}</span>
                </a>
              )}
              {header.location && (
                <span className="hero-contact-item">
                  <MapPin size={14} />
                  <span>{header.location}</span>
                </span>
              )}
            </div>

            <div className="proof-links">
              {links.map(([key, item]) => {
                const Icon = LINK_ICONS[key] || Globe;
                return (
                  <a
                    key={key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="proof-pill"
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
                  className="proof-pill"
                >
                  <FileText size={14} />
                  <span>Resume PDF</span>
                </a>
              )}
            </div>
          </div>

          <div className="hero-center-spacer" aria-hidden="true" />

          <div className="hero-right">
            <h2 className="hero-statement">
              {header.headline || 'Full-Stack Software Developer (MERN) · B.Tech CSE'}
            </h2>
            {header.summary && <p className="hero-summary">{header.summary}</p>}
          </div>
        </div>

        <nav className="hero-index-bar" aria-label="Section index">
          {indexItems.map((item) => (
            <a key={item.num} href={item.href} className="hero-index-item">
              <span className="hero-index-num">{item.num}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
