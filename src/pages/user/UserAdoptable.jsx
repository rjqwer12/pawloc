import { useEffect, useState } from 'react';
import PetDetailsModal from '../../components/PetDetailsModal';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { userPets as sampleListings } from '../../data/userPets';
import { useAuth } from '../../lib/AuthContext';
import { listRecords } from '../../lib/userData';
import './UserAdoptable.css';

const filters = [['all', 'All Pets'], ['dog', 'Dogs'], ['cat', 'Cats']];

function PetPhoto({ pet }) {
  const [failed, setFailed] = useState(false);
  return failed
    ? <div className="user-pet-photo-fallback" role="img" aria-label={`${pet.name}: photo unavailable`}><Icon name="paw" /><span>Photo unavailable</span></div>
    : <img src={pet.image} alt={`Sample ${pet.type} photo for ${pet.name}`} loading="lazy" onError={() => setFailed(true)} />;
}

export default function UserAdoptable() {
  const { user } = useAuth();
  const [userPets, setListings] = useState(() => user ? [] : sampleListings);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; if (user) listRecords('pet').then(rows => { if (active) setListings(rows); }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, [user]);
  const [filter, setFilter] = useState('all');
  const [selectedPet, setSelectedPet] = useState(null);

  const visiblePets = userPets.filter(pet => filter === 'all' || pet.type === filter);

  function showDetails(pet) {
    setSelectedPet(pet);

  }

  return (
    <UserLayout>
      <main className="user-adoptable-main">
        <header className="user-adoptable-heading">
          <div><h1>Adoptable Pets</h1><span className="user-pet-count">{userPets.length} Available</span></div>
          <p><Icon name="pin" />Finding loving forever homes through our community shelters.</p>
        </header>
        <div className="user-pet-filters" aria-label="Filter adoptable pets">
          {filters.map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{value === 'all' ? userPets.length : userPets.filter(pet => pet.type === value).length}</span></button>)}
        </div>
        <section className="user-pet-grid" aria-label="Adoptable pets">
          {visiblePets.map(pet => (
            <article className="user-pet-card" key={pet.id}>
              <div className="user-pet-photo"><PetPhoto pet={pet} /><span className="user-pet-status"><span aria-hidden="true" />{pet.status}</span></div>
              <div className="user-pet-body">
                <div className="user-pet-name"><h2>{pet.name}</h2><span>{pet.age} · {pet.gender}</span></div>
                <p className="user-pet-breed">{pet.type === 'dog' ? 'Dog' : 'Cat'} · {pet.breed}</p>
                <p className="user-pet-shelter"><Icon name="shelter" />{pet.shelter}</p>
                <button className="user-pet-details-button" onClick={() => showDetails(pet)} aria-label={`View details for ${pet.name}`}>View Details</button>
              </div>
            </article>
          ))}
        </section>
        {error && <p role="alert">{error}</p>}{!user && <p>Preview listings. Sign in with a real account for database features.</p>}
      </main>
      {selectedPet && <PetDetailsModal key={selectedPet.id} pet={selectedPet} onClose={() => setSelectedPet(null)} />}
    </UserLayout>
  );
}
