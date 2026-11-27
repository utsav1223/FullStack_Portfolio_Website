import { useEffect, useRef, useState } from 'react';
import CompanyHeader from './CompanyHeader';
import ExperienceStats from './ExperienceStats';
import ExperienceTimeline from './ExperienceTimeline';

export default function ExperienceSection({ experiences, sectionNumber = '02' }) {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!experiences || experiences.length === 0) {
    return null;
  }

  // Group experiences by company while preserving reverse-chronological order
  const groups = [];
  const groupMap = new Map();
  for (const exp of experiences) {
    const key = exp.company || 'Professional Experience';
    if (!groupMap.has(key)) {
      const bucket = { company: key, items: [] };
      groupMap.set(key, bucket);
      groups.push(bucket);
    }
    groupMap.get(key).items.push(exp);
  }

  const totalEarnings = experiences.reduce(
    (sum, item) => sum + (Number(item.earningsNumeric) || 0),
    0
  );
  const projectCount = experiences.length;

  return (
    <section
      id="experience"
      ref={sectionRef}
      className={`section section-transparent exp-section ${visible ? 'is-visible' : ''}`}
      aria-labelledby="experience-heading"
    >
      <div className="container">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{sectionNumber} / Work &amp; Contributions</p>
            <h2 id="experience-heading" className="section-title">
              Professional Experience
            </h2>
          </div>
          <p className="section-desc">
            Real-world experience in software engineering, coding agent benchmarking and AI evaluation.
          </p>
        </div>

        <ExperienceStats
          totalEarnings={totalEarnings}
          projectCount={projectCount}
        />

        <div className="exp-companies-stack">
          {groups.map((group) => {
            const lead = group.items[0] || {};
            const groupEarnings = group.items.reduce(
              (sum, item) => sum + (Number(item.earningsNumeric) || 0),
              0
            );

            return (
              <div key={group.company} className="exp-company-group">
                <CompanyHeader
                  company={group.company}
                  role={lead.companyRole || lead.role}
                  employmentType={lead.employmentType || 'Project-based Contract'}
                  workMode={lead.workMode || 'Remote'}
                  year={lead.year || '2026'}
                  totalEarnings={groupEarnings}
                  projectCount={group.items.length}
                />
                <ExperienceTimeline items={group.items} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
