import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import { Link } from 'react-router-dom';
import Icon from '../../components/UserIcon';
import { useAuth } from '../../lib/AuthContext';
import { listRecords } from '../../lib/userData';
import './UserShelters.css';

export default function UserShelters() {
  const { user } = useAuth();
  const [shelters, setListings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true, fetching = false;
    setLoading(Boolean(user));
    setError('');
    setListings([]);
    async function refresh() {
      if (!user || fetching) return;
      fetching = true;
      try {
        const rows = await listRecords('shelter');
        if (active) { setListings(rows); setError(''); }
      } catch (error) { if (active) setError(error.message); }
      finally { fetching = false; if (active) setLoading(false); }
    }
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [user]);
  return (
    <UserLayout>
      <main className="user-shelters-main">
        <h1>Animal Shelters</h1>
        <div className="user-shelter-grid">
          {shelters.map(shelter => (
            <article className="user-shelter-card" key={shelter.id}>
              <p className="user-shelter-open">{shelter.status || 'See visiting hours'}</p>
              <div className="user-shelter-identity">
                <ShelterPhoto key={shelter.image || shelter.id} image={shelter.image} name={shelter.name} />
                <div>
                  <h2>{shelter.name}</h2>
                  <p className="user-shelter-address"><Icon name="pin" /><span>{[shelter.distance, shelter.landmark].filter(Boolean).join(' \u00b7 ') || 'Address not provided'}</span></p>
                </div>
              </div>
              <div className="user-shelter-details">
                {String(shelter.phone ?? '').replace(/\D/g, '') ? <a href={`tel:+${String(shelter.phone).replace(/\D/g, '')}`}><Icon name="phone" />{shelter.phone}</a> : <span><Icon name="phone" />Contact number not provided</span>}
                <span>{shelter.hours || 'Visiting hours not provided'}</span>
              </div>
              <Link className="user-shelter-directions" to={`/user/map?shelter=${shelter.id}`} aria-label={`Directions to ${shelter.name}`}>Directions</Link>
            </article>
          ))}
        </div>
        {loading && <p role="status">Loading shelters...</p>}
        {user && !loading && !shelters.length && !error && <p role="status">No shelters are available yet.</p>}
        {error && <p role="alert">{error}</p>}{!user && <p>Sign in to view shelter records.</p>}
      </main>
    </UserLayout>
  );
}

function ShelterPhoto({ image, name }) {
  const [failed, setFailed] = useState(false);
  return <div className="user-shelter-thumbnail">{image && !failed
    ? <img src={image} alt={name + ' shelter'} loading="lazy" onError={() => setFailed(true)} />
    : <span role="img" aria-label="Shelter photo unavailable"><Icon name="building" /></span>}
  </div>;
}
