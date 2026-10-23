import AppIcon from '../components/UserIcon';
import { Link } from 'react-router-dom';
import usePublicRecords from '../lib/usePublicRecords';
import './Shelters.css';

function PinIcon() { return <AppIcon name="pin" />; }

function PhoneIcon() { return <AppIcon name="phone" />; }

function VisitingHours({ hours }) {
  const entries = hours?.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const separator = part.indexOf(':');
    return separator < 0 ? { day: '', time: part } : { day: part.slice(0, separator).trim(), time: part.slice(separator + 1).trim() };
  }) || [];

  return <section className="public-shelter-hours" aria-label="Visiting hours">
    <h3>Visiting hours</h3>
    {entries.length ? <div className="public-shelter-hours-grid">
      {entries.map(({ day, time }, index) => <div className="public-shelter-hours-entry" key={`${day}-${index}`}>
        {day && <span className="public-shelter-hours-day">{day}</span>}
        <strong className={/^closed\b/i.test(time) ? 'is-closed' : 'is-open'}>{time}</strong>
      </div>)}
    </div> : <p>Visiting hours not listed.</p>}
  </section>;
}

export default function Shelters() {
  const { records: shelters, loading, error } = usePublicRecords('shelter');
  return (
    <main className="shelters-page">
      <section className="shelters-hero">
        <h1 className="shelters-title">Nearby Shelters</h1>
        <p className="shelters-subtitle">
          Locate, visit, and contact verified local rescue shelters and compassionate animal adoption sanctuaries near you.
        </p>
      </section>

      <section className="shelters-grid">
        {loading && <p role="status">Loading shelters...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && !shelters.length && <p>No shelters have been listed yet.</p>}
        {shelters.map((shelter) => {
          return (
            <article key={shelter.id} className="shelter-card">
              <span className="shelter-status">
                <span className="shelter-status-dot" aria-hidden="true" />
                  {shelter.status}
              </span>

              <h2 className="shelter-name">{shelter.name}</h2>
              <p className="shelter-location">
                <PinIcon />
                {shelter.distance && <><span>{shelter.distance}</span><span className="shelter-dot" aria-hidden="true">·</span></>}
                <span>{shelter.landmark || 'Location not listed'}</span>
              </p>

              {(shelter.phone || shelter.species) && <div className="shelter-meta">
                {shelter.phone && <div className="shelter-contact"><PhoneIcon /><span>{shelter.phone}</span></div>}
                {shelter.species && <span className="shelter-species">{shelter.species}</span>}
              </div>}

              <VisitingHours hours={shelter.hours} />

              <div className="shelter-actions">
                <Link to="/" className="shelter-btn shelter-btn--contact">
                  Contact
                </Link>
                <Link to="/" className="shelter-btn shelter-btn--adoptable">
                  View Adoptable
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
