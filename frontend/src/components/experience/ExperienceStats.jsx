import { BadgeDollarSign, Layers } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

export default function ExperienceStats({ totalEarnings, projectCount }) {
  return (
    <div className="exp-stats-grid" aria-label="Professional contribution summary">
      <div className="exp-stat-card">
        <div className="exp-stat-top">
          <span className="exp-stat-icon" aria-hidden="true">
            <BadgeDollarSign size={18} />
          </span>
          <span className="exp-stat-tag">Compensation</span>
        </div>
        <div className="exp-stat-value">
          <AnimatedCounter value={totalEarnings} prefix="$" suffix="+" />
        </div>
        <div className="exp-stat-label">Professional Earnings</div>
        <p className="exp-stat-desc">
          Earned through paid technical contributions.
        </p>
      </div>

      <div className="exp-stat-card">
        <div className="exp-stat-top">
          <span className="exp-stat-icon" aria-hidden="true">
            <Layers size={18} />
          </span>
          <span className="exp-stat-tag">Delivery</span>
        </div>
        <div className="exp-stat-value">
          <AnimatedCounter value={projectCount} padZero />
        </div>
        <div className="exp-stat-label">Professional Projects</div>
        <p className="exp-stat-desc">
          Software engineering benchmarking and AI evaluation.
        </p>
      </div>
    </div>
  );
}
