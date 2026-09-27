import { useState } from 'react';
import { stories, storyFilters } from '../data/stories';
import './Stories.css';

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function Stories() {
  const [activeFilter, setActiveFilter] = useState('All Pets');

  const filterMap = {
    'All Pets': () => true,
    Dogs: (story) => story.type === 'dog',
    Cats: (story) => story.type === 'cat',
    Birds: (story) => story.type === 'bird',
    Hamsters: (story) => story.type === 'hamster',
  };

  const visibleStories = stories.filter(filterMap[activeFilter]);

  return (
    <main className="stories-page">
      <section className="stories-hero">
        <h1 className="stories-title">Reunited Stories</h1>
        <p className="stories-subtitle">
          Heartwarming tales of beloved companions safely brought back home through
          our rapid community network, local shelters, and watchful neighbors.
        </p>
      </section>

      <section className="stories-list-section">
        <div className="stories-list-header">
          <div>
            <h2 className="stories-list-title">Recent Reunions</h2>
            <p className="stories-list-subtitle">
              Verified submissions from owners and local shelter partners
            </p>
          </div>
          <div className="stories-filters" role="group" aria-label="Filter reunions">
            {storyFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`stories-filter${activeFilter === filter ? ' stories-filter--active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="stories-grid">
          {visibleStories.map((story) => (
            <article key={story.id} className="story-card">
              <img
                src={story.image}
                alt={story.title}
                className="story-card-image"
                loading="lazy"
              />
              <div className="story-card-body">
                <h3 className="story-card-title">{story.title}</h3>
                <p className="story-card-meta">
                  {story.breed} &bull; {story.area}
                </p>
                <p className="story-card-quote">&ldquo;{story.quote}&rdquo;</p>
                <div className="story-card-footer">
                  <ClockIcon />
                  <span className="story-card-time">{story.time}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
