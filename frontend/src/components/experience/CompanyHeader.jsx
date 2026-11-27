import { Briefcase, Calendar, Globe, FileCheck2 } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

export default function CompanyHeader({
  company,
  role,
  employmentType,
  workMode,
  year,
  totalEarnings,
  projectCount,
}) {
  return (
    <div className="exp-company-header">
      <div className="exp-company-identity">
        <div className="exp-company-monogram" aria-hidden="true">
          <span>HA</span>
        </div>

        <div>
          <div className="exp-company-name-row">
            <h3 className="exp-company-name">{company}</h3>
            <span className="exp-company-chip">
              <FileCheck2 size={12} aria-hidden="true" />
              {employmentType}
            </span>
            <span className="exp-company-chip">
              <Globe size={12} aria-hidden="true" />
              {workMode}
            </span>
            {year && (
              <span className="exp-company-chip">
                <Calendar size={12} aria-hidden="true" />
                {year}
              </span>
            )}
          </div>
          <p className="exp-company-role">
            <Briefcase size={14} aria-hidden="true" />
            <span>{role}</span>
          </p>
        </div>
      </div>

      <div className="exp-company-summary">
        <div className="exp-company-summary-item">
          <span className="exp-company-summary-val">
            <AnimatedCounter value={totalEarnings} prefix="$" suffix="+" /> USD
          </span>
          <span className="exp-company-summary-label">Paid Contributions</span>
        </div>
        <div className="exp-company-summary-divider" aria-hidden="true" />
        <div className="exp-company-summary-item">
          <span className="exp-company-summary-val">
            <AnimatedCounter value={projectCount} padZero />
          </span>
          <span className="exp-company-summary-label">Projects</span>
        </div>
      </div>
    </div>
  );
}
