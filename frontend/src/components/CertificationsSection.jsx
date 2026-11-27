import { Award, ExternalLink } from 'lucide-react';

export default function CertificationsSection({ certifications, sectionNumber }) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <section id="certifications" className="section section-transparent">
      <div className="container">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{sectionNumber} / Verified Credentials</p>
            <h2 className="section-title">Certifications</h2>
          </div>
          <p className="section-desc">
            Industry-recognized technical credentials validating cloud, API, and backend engineering fundamentals.
          </p>
        </div>

        <div className="certifications-transparent-grid">
          {certifications.map((cert, idx) => (
            <article key={cert.id || idx} className="certification-row">
              <div className="certification-top">
                <div className="certification-issuer-row">
                  <span className="certification-icon" aria-hidden="true">
                    <Award size={15} />
                  </span>
                  <span className="certification-issuer">{cert.issuer}</span>
                </div>
                {cert.date && (
                  <span className="certification-date">{cert.date}</span>
                )}
              </div>

              <h3 className="certification-title">{cert.title}</h3>

              <div className="certification-bottom">
                {cert.credentialId ? (
                  <span className="certification-id">ID: {cert.credentialId}</span>
                ) : (
                  <span />
                )}

                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm"
                  >
                    <ExternalLink size={13} />
                    Verify
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
