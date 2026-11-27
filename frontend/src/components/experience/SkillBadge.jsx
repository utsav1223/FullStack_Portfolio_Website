export default function SkillBadge({ label, index = 0, visible = true }) {
  return (
    <span
      className={`exp-skill-badge ${visible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${Math.min(index * 24, 320)}ms` }}
    >
      {label}
    </span>
  );
}
