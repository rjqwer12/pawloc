import AppIcon from '../components/UserIcon';
import { Link } from 'react-router-dom';
import usePublicRecords from '../lib/usePublicRecords';
import './Shelters.css';

function PinIcon() { return <AppIcon name="pin" />; }

function PhoneIcon() { return <AppIcon name="phone" />; }

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
                <span>{shelter.distance}</span>
                <span className="shelter-dot">•</span>
                <span>{shelter.landmark}</span>
              </p>

              <div className="shelter-meta">
                <div className="shelter-contact">
                  <PhoneIcon />
                  <span>{shelter.phone}</span>
                </div>
                <span className="shelter-species">{shelter.species}</span>
              </div>

              <p className="shelter-hours">{shelter.hours}</p>

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
