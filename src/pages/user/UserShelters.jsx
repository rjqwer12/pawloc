import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import { Link } from 'react-router-dom';
import Icon from '../../components/UserIcon';
import { shelters as sampleListings } from '../../data/shelters';
import { useAuth } from '../../lib/AuthContext';
import { listRecords } from '../../lib/userData';
import './UserShelters.css';

export default function UserShelters() {
  const { user } = useAuth();
  const [shelters, setListings] = useState(() => user ? [] : sampleListings);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const visibleShelters = shelters.filter(shelter => [shelter.name, shelter.landmark].some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));
  useEffect(() => { let active = true; if (user) listRecords('shelter').then(rows => { if (active) setListings(rows); }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, [user]);
  return (
    <UserLayout>
      <main className="user-shelters-main">
        <h1>Animal Shelters</h1>
        <label className="user-shelter-search">
          <Icon name="search" />
          <input type="search" aria-label="Search shelters" placeholder="Search shelters by name or location" value={search} onChange={event => setSearch(event.target.value)} />
        </label>
        <div className="user-shelter-grid">
          {visibleShelters.map(shelter => (
            <article className="user-shelter-card" key={shelter.id}>
              <p className="user-shelter-open"><span aria-hidden="true" />{shelter.status}</p>
              <div className="user-shelter-identity">
                <div className="user-shelter-thumbnail" aria-hidden="true"><Icon name="shelter" /></div>
                <div>
                  <h2>{shelter.name}</h2>
                  <p className="user-shelter-address"><Icon name="pin" /><span>{shelter.distance} · {shelter.landmark}</span></p>
                </div>
              </div>
              <ul className="user-shelter-services" aria-label="Animals sheltered"><li>{shelter.species}</li></ul>
              <div className="user-shelter-details">
                <a href={`tel:+${shelter.phone.replace(/\D/g, '')}`}><Icon name="phone" />{shelter.phone}</a>
                <span>{shelter.hours}</span>
              </div>
              <Link className="user-shelter-directions" to={`/user/map?shelter=${shelter.id}`} aria-label={`Directions to ${shelter.name}`}>Directions</Link>
            </article>
          ))}
        </div>
        {search.trim() && !visibleShelters.length && !error && <p role="status">No shelters match your search.</p>}
        {error && <p role="alert">{error}</p>}{!user && <p>Preview listings. Sign in with a real account for database features.</p>}
      </main>
    </UserLayout>
  );
}
