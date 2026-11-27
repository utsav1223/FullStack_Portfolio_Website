export default function SkillsSection({ skills, sectionNumber }) {
  const categories = Object.entries(skills || {}).filter(
    ([, items]) => Array.isArray(items) && items.length > 0
  );

  if (categories.length === 0) return null;

  return (
    <section id="skills" className="section section-transparent">
      <div className="container">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{sectionNumber} / Stack Overview</p>
            <h2 className="section-title">Technical Skills</h2>
          </div>
          <p className="section-desc">
            Structured across languages, frontend, backend, databases, and cloud tooling for quick scanning.
          </p>
        </div>

        <div className="skills-transparent-grid">
          {categories.map(([category, items]) => (
            <div key={category} className="skill-transparent-col">
              <div className="skill-category-head">
                <span className="skill-category-title">{category}</span>
                <span className="skill-count">{String(items.length).padStart(2, '0')}</span>
              </div>
              <div className="skill-chips">
                {items.map((skill, idx) => (
                  <span key={`${skill}-${idx}`} className="skill-chip">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
