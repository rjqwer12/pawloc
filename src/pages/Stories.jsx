import usePublicRecords from '../lib/usePublicRecords';
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
  const { records, loading, error } = usePublicRecords('post');
  const stories = records.filter(post => post.category === 'reunited');

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
              Stories shared by community members
            </p>
          </div>

        </div>

        <div className="stories-grid">
          {loading && <p role="status">Loading stories...</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && !error && !stories.length && <p>No reunited stories yet.</p>}
          {stories.map((story) => (
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
                  {story.dateFound ? `Date found: ${story.dateFound}` : story.author}
                </p>
                <p className="story-card-quote">&ldquo;{story.description}&rdquo;</p>
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
