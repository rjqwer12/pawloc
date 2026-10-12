import { useEffect, useState } from 'react';
import PetDetailsModal from '../../components/PetDetailsModal';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { useAuth } from '../../lib/AuthContext';
import { listRecords } from '../../lib/userData';
import './UserAdoptable.css';

function PetPhoto({ pet }) {
  const [failed, setFailed] = useState(false);
  return failed || !pet.image
    ? <div className="user-pet-photo-fallback" role="img" aria-label={`${pet.name}: photo unavailable`}><Icon name="paw" /><span>Photo unavailable</span></div>
    : <img src={pet.image} alt={`Photo of ${pet.name}`} loading="lazy" onError={() => setFailed(true)} />;
}

export default function UserAdoptable() {
  const { user } = useAuth();
  const [userPets, setListings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; setLoading(Boolean(user)); setError(''); setListings([]); if (user) listRecords('pet').then(rows => { if (active) setListings(rows); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [user]);
  const [search, setSearch] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);

  const searchWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visiblePets = userPets.filter(pet => {
    const speciesAndBreed = `${pet.species || pet.type || ''} ${pet.breed || ''}`.toLowerCase();
    return searchWords.every(word => speciesAndBreed.includes(word));
  });

  function showDetails(pet) {
    setSelectedPet(pet);

  }

  return (
    <UserLayout>
      <main className="user-adoptable-main">
        <header className="user-adoptable-heading">
          <h1>Adoptable Pets</h1>
        </header>
        <label className="user-pet-search">
          <Icon name="search" />
          <input type="search" aria-label="Search pets by species or breed" placeholder="Search species or breed (e.g. dog, cat, hamster)" value={search} onChange={event => setSearch(event.target.value)} />
        </label>
        <section className="user-pet-grid" aria-label="Adoptable pets">
          {visiblePets.map(pet => (
            <article className="user-pet-card" key={pet.id}>
              <div className="user-pet-photo"><PetPhoto key={pet.image || pet.id} pet={pet} /><span className="user-pet-status">{pet.status}</span></div>
              <div className="user-pet-body">
                <div className="user-pet-name"><h2>{pet.name}</h2><span>{pet.age} · {pet.gender}</span></div>
                <p className="user-pet-breed">{pet.species || pet.type || 'Species not specified'} · {pet.breed}</p>
                <p className="user-pet-shelter"><Icon name="shelter" />{pet.shelter}</p>
                <button className="user-pet-details-button" onClick={() => showDetails(pet)} aria-label={`View details for ${pet.name}`}>View Details</button>
              </div>
            </article>
          ))}
        </section>
        {loading && <p role="status">Loading pets...</p>}
        {user && !loading && !userPets.length && !error && <p role="status">No pets have been posted yet.</p>}
        {!loading && userPets.length > 0 && search.trim() && !visiblePets.length && !error && <p role="status">No pets match that species or breed.</p>}
        {error && <p role="alert">{error}</p>}{!user && <p>Sign in to view shelter records.</p>}
      </main>
      {selectedPet && <PetDetailsModal key={selectedPet.id} pet={selectedPet} onClose={() => setSelectedPet(null)} />}
    </UserLayout>
  );
}
