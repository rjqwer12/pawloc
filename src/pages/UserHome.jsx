import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import pawlocLogo from '../assets/pawloc.svg';
import './UserHome.css';

const navItems = [
  ['⌂', 'Home'],
  ['⌖', 'Map'],
  ['♧', 'Shelter'],
  ['♙', 'Library'],
];

const feedItems = [
  { type: 'Reunited Story', title: 'Rocky is finally back home after 8 days in Greenlake Ridge!', copy: 'Thanks to everyone who printed and posted the neighborhood flyer! A microchip scan at PawLoc triage depot confirmed Rocky\'s owner details immediately. He was discovered safe hiding beneath a porch near Timberline Trail.', tone: 'green', image: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=1200&h=430&fit=crop' },
  { type: 'Lost Pet', title: 'Missing: Oliver (Tabby Cat with white bib & notched left ear)', copy: 'Last seen near Elm Street & 4th Ave wearing a reflective red bell collar. He is friendly but easily startled by loud sirens. Please call dispatcher or flag sighting immediately!', tone: 'red', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=360&fit=crop' },
  { type: 'Found Pet', title: 'Found: Oliver (Tabby Cat with white bib & notched left ear)', copy: 'Last seen near Elm Street & 4th Ave wearing a reflective red bell collar. He is friendly but easily startled by loud sirens. Please call dispatcher or flag sighting immediately!', tone: 'blue', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=360&fit=crop' },
];

const filters = ['All Pets', 'Reunited Stories', 'Lost Pets', 'Found Pets'];

export default function UserHome() {
  const { user, signOut } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All Pets');
  const [query, setQuery] = useState('');

  const visibleItems = feedItems.filter((item) => {
    const matchesFilter = activeFilter === 'All Pets' || item.type === activeFilter.replace(' Stories', ' Story');
    return matchesFilter && `${item.title} ${item.copy}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <main className="user-dashboard">
      <aside className="user-sidebar">
        <a className="user-brand" href="/" aria-label="Pawloc home"><img src={pawlocLogo} alt="PAWLOC" /></a>
        <nav className="user-sidebar-nav" aria-label="User dashboard navigation">
          {navItems.map(([icon, label]) => <button key={label} type="button" className={`user-nav-item${label === 'Home' ? ' user-nav-item--active' : ''}`}><span aria-hidden="true">{icon}</span>{label}</button>)}
        </nav>
        <div className="user-sidebar-bottom">
          <button type="button" className="user-nav-item"><span>⚙</span>Settings</button>
          <button type="button" className="user-nav-item" onClick={signOut}><span>↪</span>Log out</button>
        </div>
      </aside>

      <section className="user-dashboard-main">
        <header className="user-dashboard-topbar">
          <label className="user-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pets, location, or ID..." aria-label="Search dashboard" /></label>
          <button type="button" className="user-notification" aria-label="View notifications">♧<i /></button>
          <div className="user-account"><span>{user?.email?.[0]?.toUpperCase() || 'A'}</span><strong>{user?.user_metadata?.first_name || 'Admin'}</strong></div>
        </header>

        <div className="user-dashboard-content">
          <section className="user-dashboard-heading"><div><h1>Community News Feed</h1><p>Live public reports, active lost &amp; found sightings, and rescue reunion celebrations.</p></div><div className="user-filter-pills">{filters.map((filter) => <button key={filter} type="button" className={activeFilter === filter ? 'is-active' : ''} onClick={() => setActiveFilter(filter)}>{filter}<small>{filter === 'All Pets' ? 3 : 1}</small></button>)}</div></section>
          <button type="button" className="user-publisher"><span>♣</span><em>Spotted an animal or celebrating a reunion? Share with dispatch...</em><b>Share report</b></button>
          <section className="user-feed" aria-label="Community news feed">
            {visibleItems.map((item) => <article className="user-feed-card" key={item.title}><header><span className={`user-feed-avatar user-feed-avatar--${item.tone}`}>{item.title[0]}</span><div><strong>PAWLOC Community</strong><small>Through a shelter-integrated update</small></div><mark className={`user-feed-badge user-feed-badge--${item.tone}`}>{item.type}</mark></header><div className="user-feed-body"><h2>{item.title}</h2><p>{item.copy}</p><img src={item.image} alt={item.title} /></div><footer><span>♡ 24</span><span>▱ 28 Comments</span><span>↗ Report</span></footer></article>)}
          </section>
        </div>
      </section>
    </main>
  );
}
