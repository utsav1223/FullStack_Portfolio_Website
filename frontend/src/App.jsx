import { useEffect, useState } from 'react';
import ScrollCanvas from './components/ScrollCanvas';
import Navbar from './components/Navbar';
import HeroHeader from './components/HeroHeader';
import SkillsSection from './components/SkillsSection';
import ExperienceSection from './components/ExperienceSection';
import ProjectsSection from './components/ProjectsSection';
import EducationSection from './components/EducationSection';
import CertificationsSection from './components/CertificationsSection';
import AchievementsSection from './components/AchievementsSection';
import Footer from './components/Footer';
import AdminDrawer from './components/AdminDrawer';

export default function App() {
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/portfolio')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load portfolio data');
        return res.json();
      })
      .then((data) => {
        if (active) setPortfolio(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (portfolio?.header?.fullName) {
      document.title = `${portfolio.header.fullName} — Full-Stack Developer`;
    }
  }, [portfolio?.header?.fullName]);

  const hasExperience = Boolean(
    portfolio?.experiences && portfolio.experiences.length > 0
  );
  const hasCertifications = Boolean(
    portfolio?.certifications && portfolio.certifications.length > 0
  );

  let sectionCounter = 0;
  const skillsNum = String(++sectionCounter).padStart(2, '0');
  const experienceNum = hasExperience ? String(++sectionCounter).padStart(2, '0') : '';
  const projectsNum = String(++sectionCounter).padStart(2, '0');
  const educationNum = String(++sectionCounter).padStart(2, '0');
  const certificationsNum = hasCertifications ? String(++sectionCounter).padStart(2, '0') : '';
  const achievementsNum = String(++sectionCounter).padStart(2, '0');

  return (
    <>
      <div className="scroll-progress-track" aria-hidden="true">
        <div
          className="scroll-progress-fill"
          style={{ width: `${Math.round(scrollProgress * 100)}%` }}
        />
      </div>

      <ScrollCanvas onProgress={setScrollProgress} />

      <div className="page-shell">
        <Navbar
          fullName={portfolio?.header?.fullName}
          hasExperience={hasExperience}
          hasCertifications={hasCertifications}
          onOpenAdmin={() => setAdminOpen(true)}
        />

        {error && (
          <div className="container" style={{ paddingTop: '6rem' }}>
            <div className="project-card" style={{ padding: '1.5rem', color: '#fda4af' }}>
              {error}
            </div>
          </div>
        )}

        {portfolio && (
          <main>
            <HeroHeader
              header={portfolio.header}
              experiences={portfolio.experiences}
            />

            <div className="content-sections">
              <SkillsSection skills={portfolio.skills} sectionNumber={skillsNum} />
              <ExperienceSection
                experiences={portfolio.experiences}
                sectionNumber={experienceNum}
              />
              <ProjectsSection
                projects={portfolio.projects}
                sectionNumber={projectsNum}
              />
              <EducationSection
                education={portfolio.education}
                sectionNumber={educationNum}
              />
              <CertificationsSection
                certifications={portfolio.certifications}
                sectionNumber={certificationsNum}
              />
              <AchievementsSection
                achievements={portfolio.achievements}
                sectionNumber={achievementsNum}
              />
            </div>
          </main>
        )}

        {portfolio && (
          <Footer
            header={portfolio.header}
            hasExperience={hasExperience}
            hasCertifications={hasCertifications}
            onOpenAdmin={() => setAdminOpen(true)}
          />
        )}
      </div>

      <AdminDrawer
        open={adminOpen}
        portfolio={portfolio}
        onClose={() => setAdminOpen(false)}
        onSaved={(updated) => setPortfolio(updated)}
      />
    </>
  );
}
