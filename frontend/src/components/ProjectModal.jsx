import { useEffect } from 'react';
import { X, ExternalLink, Github } from 'lucide-react';

export default function ProjectModal({ project, index, onClose }) {
  useEffect(() => {
    if (!project) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  const shortTitle = (project.title || '').split('—')[0].trim();

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onClick={onClose}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-media">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={project.title} className="modal-media-img" />
          ) : (
            <div className="modal-media-fallback">
              <span className="project-media-num">
                PROJECT #{String((index ?? 0) + 1).padStart(2, '0')}
              </span>
              <div className="modal-media-fallback-title">{shortTitle}</div>
            </div>
          )}
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close project details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div>
            <p className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>
              Featured Project #{String((index ?? 0) + 1).padStart(2, '0')}
            </p>
            <h2 className="modal-title">{project.title}</h2>
            {project.subtitle && (
              <p className="modal-subtitle">{project.subtitle}</p>
            )}
          </div>

          {project.techStack && project.techStack.length > 0 && (
            <div className="tech-pills">
              {project.techStack.map((tech, idx) => (
                <span key={`${tech}-${idx}`} className="tech-pill">
                  {tech}
                </span>
              ))}
            </div>
          )}

          {project.overview && (
            <div className="modal-section">
              <h3 className="modal-section-heading">Architecture &amp; Overview</h3>
              <p className="modal-overview">{project.overview}</p>
            </div>
          )}

          {project.highlights && project.highlights.length > 0 && (
            <div className="modal-section">
              <h3 className="modal-section-heading">Engineering Highlights &amp; Impact</h3>
              <ul className="impact-list">
                {project.highlights.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-actions">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <ExternalLink size={15} />
                Open Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                <Github size={15} />
                View Source on GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
