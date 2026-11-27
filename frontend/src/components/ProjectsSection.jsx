import { useState } from 'react';
import { ArrowRight, ArrowUpRight, ExternalLink, Github, Layers } from 'lucide-react';
import ProjectModal from './ProjectModal';

const MEDIA_VARIANTS = [
  'project-card-media--light',
  'project-card-media--slate',
  'project-card-media--charcoal',
];

export default function ProjectsSection({ projects, sectionNumber = '03' }) {
  const [selected, setSelected] = useState(null);

  if (!projects || projects.length === 0) return null;

  return (
    <section id="projects" className="section">
      <div className="container">
        <div className="projects-hero-header">
          <div>
            <p className="section-eyebrow">{sectionNumber} / Featured Projects</p>
            <h2 className="projects-hero-title">
              Shaping Products
              <br />
              That Scale &amp;
              <br />
              Perform
            </h2>
          </div>

          <div className="projects-hero-right">
            <p className="projects-hero-lead">
              Production-oriented MERN &amp; full-stack systems built with resilient APIs, clean database design, and automated deployment.
            </p>
            <div className="projects-hero-cta-row">
              <span className="projects-hero-subnote">
                Click any project card to inspect full architecture &amp; impact
              </span>
              <a href="#contact" className="cta-pill-accent">
                <span>Get in touch</span>
                <span className="cta-pill-accent-circle" aria-hidden="true">
                  <ArrowRight size={14} />
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="projects-grid">
          {projects.map((project, idx) => {
            const variant = MEDIA_VARIANTS[idx % MEDIA_VARIANTS.length];
            const shortTitle = (project.title || '').split('—')[0].trim();

            return (
              <article
                key={project.id || idx}
                className="project-card project-card-clickable"
                role="button"
                tabIndex={0}
                onClick={() => setSelected({ project, index: idx })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected({ project, index: idx });
                  }
                }}
              >
                <div className={`project-card-media ${variant}`}>
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="project-card-img"
                    />
                  ) : (
                    <div className="project-media-grid-bg" aria-hidden="true" />
                  )}

                  <div className="project-media-overlay">
                    <span className="project-media-num">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="project-media-open-hint">
                      Inspect <ArrowUpRight size={13} />
                    </span>
                  </div>

                  {!project.imageUrl && (
                    <div className="project-media-content">
                      <span className="project-media-kicker">
                        <Layers size={12} aria-hidden="true" />
                        {project.categoryTag || 'FULL-STACK · MERN'}
                      </span>
                      <div className="project-media-title">{shortTitle}</div>
                      {project.techStack?.length > 0 && (
                        <div className="project-media-sub">
                          {project.techStack.slice(0, 3).join(' · ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="project-card-body">
                  <div>
                    <h3 className="project-title">{project.title}</h3>
                    {project.subtitle && (
                      <p className="project-subtitle">{project.subtitle}</p>
                    )}
                  </div>

                  {project.techStack && project.techStack.length > 0 && (
                    <div className="tech-pills">
                      {project.techStack.map((tech, tIdx) => (
                        <span key={`${tech}-${tIdx}`} className="tech-pill">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {project.highlights && project.highlights.length > 0 && (
                    <ul className="impact-list">
                      {project.highlights.slice(0, 3).map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  <div
                    className="project-links"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        <ExternalLink size={13} />
                        Live Demo
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm"
                      >
                        <Github size={13} />
                        GitHub
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm project-details-btn"
                      onClick={() => setSelected({ project, index: idx })}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <ProjectModal
        project={selected?.project}
        index={selected?.index}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
