import { useState } from 'react';
import { Link } from 'react-router-dom';
import { shelters } from '../data/shelters';
import './Shelters.css';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function Shelters() {
  const [query, setQuery] = useState('');

  const visibleShelters = shelters.filter((shelter) => {
    const haystack = `${shelter.name} ${shelter.landmark} ${shelter.species}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <main className="shelters-page">
      <section className="shelters-hero">
        <h1 className="shelters-title">Nearby Shelters</h1>
        <p className="shelters-subtitle">
          Locate, visit, and contact verified local rescue shelters and compassionate
          animal adoption sanctuaries near you.
        </p>
      </section>

      <section className="shelters-toolbar">
        <div className="shelters-search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search by shelter name, neighborhood, or zip..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      <section className="shelters-grid">
        {visibleShelters.map((shelter) => {
          return (
            <article key={shelter.id} className="shelter-card">
              <div className="shelter-card-top">
                <span className={`shelter-status shelter-status--${shelter.statusType}`}>
                  <span className="shelter-status-dot" />
                  {shelter.status}
                </span>
              </div>

              <h2 className="shelter-name">{shelter.name}</h2>
              <p className="shelter-location">
                <PinIcon />
                <span>{shelter.distance}</span>
                <span className="shelter-dot">•</span>
                <span className="shelter-landmark">{shelter.landmark}</span>
              </p>

              <div className="shelter-meta">
                <div className="shelter-contact">
                  <PhoneIcon />
                  <div>
                    <p>{shelter.phone}</p>
                    <p className="shelter-hours">{shelter.hours}</p>
                  </div>
                </div>
                <span className="shelter-species">{shelter.species}</span>
              </div>

              <div className="shelter-actions">
                <Link to="/" className="shelter-btn shelter-btn--ghost">
                  Contact
                </Link>
                <Link to="/" className="shelter-btn shelter-btn--dark">
                  View Adoptable ›
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
