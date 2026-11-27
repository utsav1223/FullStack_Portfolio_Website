import { GraduationCap } from 'lucide-react';

export default function EducationSection({ education, sectionNumber }) {
  if (!education) return null;

  const numericCgpa = Number.parseFloat(education.cgpa);
  const shouldShowCgpa =
    education.showCgpa &&
    education.cgpa &&
    (!Number.isNaN(numericCgpa) ? numericCgpa >= 7.5 || education.showCgpa : true);

  return (
    <section id="education" className="section section-transparent">
      <div className="container">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{sectionNumber} / Academic Foundation</p>
            <h2 className="section-title">Education</h2>
          </div>
        </div>

        <div className="education-transparent">
          <div className="education-top">
            <div>
              <h3 className="education-degree">{education.degree}</h3>
              <p className="education-college">{education.college}</p>
            </div>

            <div className="education-metrics">
              {education.graduationYear && (
                <span className="metric-badge metric-badge-neutral">
                  <GraduationCap size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                  Expected {education.graduationYear}
                </span>
              )}
              {shouldShowCgpa && (
                <span className="metric-badge">CGPA: {education.cgpa}</span>
              )}
            </div>
          </div>

          {education.coreSubjects && education.coreSubjects.length > 0 && (
            <>
              <div className="core-subjects-label">Core CS Coursework</div>
              <div className="core-subjects-grid">
                {education.coreSubjects.map((subject, idx) => (
                  <div key={`${subject}-${idx}`} className="core-subject-item">
                    <span className="core-subject-num">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{subject}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
