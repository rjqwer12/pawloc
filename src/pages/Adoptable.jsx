import { useState } from 'react';
import PetCard from '../components/PetCard';
import { pets, filters } from '../data/pets';
import './Adoptable.css';

export default function Adoptable() {
  const [activeFilter, setActiveFilter] = useState('All Pets');

  const filterMap = {
    'All Pets': () => true,
    Dogs: (pet) => pet.type === 'dog',
    Cats: (pet) => pet.type === 'cat',
    Birds: (pet) => pet.type === 'bird',
    Hamsters: (pet) => pet.type === 'hamster',
  };

  const filteredPets = pets.filter(filterMap[activeFilter]);

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
            <span className="stat-label">Total Adaptions</span>
          </div>
        </div>
      </section>

      <section className="adoptable-toolbar">
        <div className="filter-pills">
          {filters.map((filter) => (
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
              Showing 0 of 0 verified shelter profiles
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
