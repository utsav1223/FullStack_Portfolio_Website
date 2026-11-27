import { useEffect, useId, useRef, useState } from 'react';
import {
  BrainCircuit,
  Terminal,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Code2,
} from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import SkillBadge from './SkillBadge';

const ICON_MAP = {
  brain: BrainCircuit,
  terminal: Terminal,
  code: Code2,
  clipboard: ClipboardCheck,
};

const INITIAL_RESPONSIBILITIES = 4;

export default function ExperienceCard({ item, index }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  useEffect(() => {
    const el = cardRef.current;
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
      { threshold: 0.14 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Icon = ICON_MAP[item.icon] || Briefcase;
  const responsibilities = item.responsibilities || item.highlights || [];
  const hasMore = responsibilities.length > INITIAL_RESPONSIBILITIES;
  const displayedResponsibilities = expanded
    ? responsibilities
    : responsibilities.slice(0, INITIAL_RESPONSIBILITIES);

  const earningsValue = Number(item.earningsNumeric);
  const hasNumericEarnings = !Number.isNaN(earningsValue) && earningsValue > 0;

  return (
    <div
      ref={cardRef}
      className={`exp-timeline-item ${visible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div className="exp-timeline-marker" aria-hidden="true">
        <span className="exp-timeline-dot" />
      </div>

      <article className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title-group">
            <span className="exp-card-icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <div>
              <div className="exp-card-category-row">
                {item.category && (
                  <span className="exp-card-category">{item.category}</span>
                )}
                {item.employmentType && (
                  <span className="exp-card-meta-pill">{item.employmentType}</span>
                )}
                {item.workMode && (
                  <span className="exp-card-meta-pill">{item.workMode}</span>
                )}
              </div>
              <h4 className="exp-card-title">{item.projectName || item.role}</h4>
              <p className="exp-card-role">{item.role}</p>
            </div>
          </div>

          <div className="exp-card-aside">
            {item.duration && (
              <div className="exp-card-duration">
                <Calendar size={13} aria-hidden="true" />
                <span>{item.duration}</span>
              </div>
            )}
            {(hasNumericEarnings || item.earningsAmount) && (
              <div
                className="exp-card-earnings"
                aria-label={`Compensation ${item.earningsAmount || `$${earningsValue}+`}`}
              >
                {hasNumericEarnings ? (
                  <>
                    <AnimatedCounter value={earningsValue} prefix="$" suffix="+" /> USD
                  </>
                ) : (
                  item.earningsAmount
                )}
              </div>
            )}
          </div>
        </div>

        {item.shortDescription && (
          <p className="exp-card-short-desc">{item.shortDescription}</p>
        )}

        {item.description && item.description !== item.shortDescription && (
          <p className="exp-card-desc">{item.description}</p>
        )}

        {responsibilities.length > 0 && (
          <div className="exp-responsibilities-block" id={detailsId}>
            <div className="exp-block-label">Key Responsibilities</div>
            <ul className="impact-list">
              {displayedResponsibilities.map((bullet, bIdx) => (
                <li key={bIdx}>{bullet}</li>
              ))}
            </ul>

            {hasMore && (
              <button
                type="button"
                className="exp-expand-btn"
                aria-expanded={expanded}
                aria-controls={detailsId}
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? (
                  <>
                    <ChevronUp size={14} aria-hidden="true" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} aria-hidden="true" />
                    View Details ({responsibilities.length - INITIAL_RESPONSIBILITIES} more responsibilities)
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {item.achievement && (
          <div className="exp-achievement-note">
            <ClipboardCheck size={15} aria-hidden="true" />
            <span>{item.achievement}</span>
          </div>
        )}

        {item.skills && item.skills.length > 0 && (
          <div className="exp-skills-block">
            <div className="exp-block-label">Technologies &amp; Skills</div>
            <div className="exp-skills-list">
              {item.skills.map((skill, sIdx) => (
                <SkillBadge
                  key={`${skill}-${sIdx}`}
                  label={skill}
                  index={sIdx}
                  visible={visible}
                />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
