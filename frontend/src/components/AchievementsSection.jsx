import { ExternalLink } from 'lucide-react';

export default function AchievementsSection({ achievements, sectionNumber }) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <section id="achievements" className="section section-transparent">
      <div className="container">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{sectionNumber} / High-Signal Proof</p>
            <h2 className="section-title">Achievements &amp; Coding Profiles</h2>
          </div>
        </div>

        <div className="achievements-transparent-grid">
          {achievements.map((item, idx) => (
            <article key={item.id || idx} className="achievement-row">
              <div>
                <div className="achievement-meta">
                  <span className="achievement-category">{item.category}</span>
                  {item.metric && (
                    <span className="achievement-metric">{item.metric}</span>
                  )}
                </div>
                <h3 className="achievement-title">{item.title}</h3>
                {item.description && (
                  <p className="achievement-desc">{item.description}</p>
                )}
              </div>

              {item.url && (
                <div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm"
                  >
                    <ExternalLink size={13} />
                    Verify Profile
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
