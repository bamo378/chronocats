export function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? 'logo-small' : ''}`}>
      <span className="logo-chrono">Chrono</span>
      <span className="logo-clock" aria-hidden>
        <svg viewBox="0 0 40 40">
          <path d="M 7 12 L 9 2 L 16 8 Z M 33 12 L 31 2 L 24 8 Z" fill="#ff9f5a" />
          <circle cx="20" cy="22" r="15" fill="#ffb36b" />
          <circle cx="20" cy="22" r="11" fill="#fffaf0" />
          <line x1="20" y1="22" x2="20" y2="14" stroke="#7a5cff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="22" x2="25" y2="24" stroke="#ff6fa8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="20" cy="22" r="2" fill="#5b4a7a" />
        </svg>
      </span>
      <span className="logo-cats">Cats</span>
    </div>
  )
}
