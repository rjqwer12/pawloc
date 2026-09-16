import { useState } from 'react';
import PetCard from '../components/PetCard';
import { pets } from '../data/pets';
import './Adoptable.css';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function Adoptable() {
  const [activeFilter, setActiveFilter] = useState('All Pets');
  const [searchQuery, setSearchQuery] = useState('');

  const filterMap = {
    'All Pets': () => true,
    Dogs: (pet) => pet.type === 'dog',
    Cats: (pet) => pet.type === 'cat',
    Birds: (pet) => pet.type === 'bird',
    Hamsters: (pet) => pet.type === 'hamster',
  };

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      !searchQuery ||
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch && filterMap[activeFilter](pet);
  });

  return (
    <main className="adoptable-page">
      <section className="adoptable-hero">
        <div className="adoptable-hero-text">
          <h1 className="adoptable-title">Adoptable Companions</h1>
          <p className="adoptable-subtitle">
            Meet loving pets vetted by community shelters and foster homes, ready to
            step into their forever families.
          </p>
        </div>

        <div className="adoptable-stats">
          <div className="stat-card stat-card--green">
            <span className="stat-value">0</span>
            <span className="stat-label">Adoptions this week</span>
          </div>
          <div className="stat-card stat-card--coral">
            <span className="stat-value">0</span>
            <span className="stat-label">Total Adoptions</span>
          </div>
        </div>
      </section>

      <section className="adoptable-toolbar">
        <div className="search-wrap">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search by breed, name, or characteristics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {['All Pets', 'Dogs', 'Cats', 'Birds', 'Hamsters'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`filter-pill${activeFilter === filter ? ' filter-pill--active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="adoptable-grid-section">
        <div className="grid-header">
          <div>
            <h2 className="grid-title">Featured Companions</h2>
            <p className="grid-subtitle">
              Showing {filteredPets.length} of 8 verified shelter profiles
            </p>
          </div>
        </div>

        <div className="pet-grid">
          {filteredPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </section>
    </main>
  );
}
