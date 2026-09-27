import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CreatePostModal from '../../components/CreatePostModal';
import ContactPetModal from '../../components/ContactPetModal';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { useAuth } from '../../lib/AuthContext';
import { addPreviewPost, getPreviewPosts } from '../../lib/previewPosts';

import './UserHome.css';

const categories = [
  ['all', 'All Posts'], ['lost', 'Lost Pets'], ['found', 'Found Pets'],
  ['reunited', 'Reunited Stories'], ['adoptable', 'Adoptable Pets'],
];
const initialPosts = [
  {
    id: 1, category: 'reunited', author: 'RJ Molene Socias', time: 'Just now · Mandurriao District',
    title: 'Barnaby is finally home safe!',
    description: 'Barnaby was found safe in Mandurriao thanks to our community responders and flyers. Thank you to everyone who shared sightings and assisted with veterinary checkups during his recovery!',
    image: 'https://images.unsplash.com/photo-1601758124510-164b0a0a1d1f?w=1200&h=500&fit=crop',
    alt: 'People spending time outdoors with a dog',
  },
  {
    id: 2, category: 'lost', author: 'RJ Molene Socias', time: '35 mins ago · Pavia Plaza, Iloilo',
    title: 'Barbilat (Golden Retriever mix)',
    description: 'Red nylon collar with silver bell. Very food-motivated, timid around loud delivery trucks. Call name softly…',
    image: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=1200&h=500&fit=crop',
    alt: 'Golden retriever with a red collar', location: 'Rob Pavia, Iloilo',
  },
  {
    id: 3, category: 'found', author: 'RJ Molene Socias', time: '2 hours ago · Pavia, Iloilo',
    title: 'Dog (Golden Retriever / Labrador mix)',
    description: 'Found wandering near the plaza with no collar. Healthy, calm, and friendly golden retriever mix. Kept safe with water and temporary shelter at community outpost. Awaiting verification from owner.',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&h=500&fit=crop',
    alt: 'Golden retriever resting outside', location: 'Pavia, Iloilo',
  },
];

function PostCard({ post, highlighted }) {
  const [showContact, setShowContact] = useState(false);
  const [liked, setLiked] = useState(false);
  const labels = { reunited: 'Reunited Story', lost: 'Lost Pet', found: 'Found Pet', adoptable: 'Adoptable Pet' };
  return (
    <article id={`feed-post-${post.id}`} className={`user-post${highlighted ? ' user-post-highlighted' : ''}`}>
      <header className="user-post-author">
        <span className="user-avatar" aria-hidden="true">{post.author.split(' ').map(word => word[0]).slice(0, 2).join('')}</span>
        <div><strong>{post.author}</strong><p>{post.time}</p></div>
        <span className={`user-badge user-tone-${post.category}`}><Icon name={post.category === 'reunited' ? 'paw' : 'pin'} />{labels[post.category]}</span>
      </header>
      <h2>{post.category === 'lost' && <span className="user-lost-title">Missing: </span>}{post.category === 'found' && <span className="user-found-title">Found: </span>}{post.title}</h2>
      <p className="user-post-description">{post.description}</p>{!post.image && post.dateFound && <p className="user-post-description">Date found: {post.dateFound}</p>}
      {post.attachment && <p className="user-post-description"><a href={post.attachment.url} download={post.attachment.name}>Download attachment: {post.attachment.name}</a></p>}
      {!post.image && post.location && <p className="user-post-description">{post.category === 'found' ? 'Found at' : 'Last seen'}: {post.location}</p>}
      {post.image && <div className="user-post-photo"><img src={post.image} alt={post.alt} loading="lazy" />{post.category === 'reunited' && post.dateFound ? <span className="user-post-location"><Icon name="calendar" />Date found: {post.dateFound}</span> : post.location && <span className="user-post-location"><Icon name="pin" />Location: {post.location}</span>}</div>}
      <footer className="user-post-actions">
        {post.category === 'reunited' ? <>
          <button className="user-reaction" aria-pressed={liked} onClick={() => setLiked(!liked)}><Icon name="heart" />{liked ? 1 : 0} Heart</button>
          <button className="user-reaction" disabled title="Comments are not available yet"><Icon name="comment" />0 Comments</button>
        </> : <button className="user-contact" onClick={() => setShowContact(true)}><Icon name="phone" />{post.category === 'lost' ? 'Contact Owner' : 'Contact'}</button>}
        <button className="user-report" disabled title="Reporting is not available yet"><Icon name="flag" />Report</button>
      </footer>
      {showContact && <ContactPetModal post={post} onClose={() => setShowContact(false)} />}
    </article>
  );
}

export default function UserHome() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const selectedPost = params.get('post');
  useEffect(() => { if (selectedPost) document.getElementById('feed-post-' + selectedPost)?.scrollIntoView({ block: 'start' }); }, [selectedPost]);

  const [filter, setFilter] = useState('all');
  const [posts, setPosts] = useState(() => [...getPreviewPosts(user?.id), ...initialPosts]);

  const [showComposer, setShowComposer] = useState(false);
  const name = user?.user_metadata?.first_name || 'RJ';

  function createPost(post) {
    const created = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...post, author: name, time: 'Just now' };
    addPreviewPost(user?.id, created);
    setPosts(current => [created, ...current]);
    setFilter('all');
    return created;
  }
  return (
    <UserLayout>
      <main className="user-feed-main">
        <div className="user-feed-toolbar"><div className="user-feed-heading"><h1>Community News Feed</h1><button className="user-create" onClick={() => setShowComposer(true)}><Icon name="plus" />Create Post</button></div>
          <div className="user-filters" aria-label="Filter posts">{categories.filter(([value]) => value !== 'adoptable').map(([value, label]) => <button key={value} aria-pressed={filter === value} className={`${filter === value ? 'user-filter-active' : ''} user-tone-${value}`} onClick={() => setFilter(value)}>{label}<span>{value === 'all' ? posts.length : posts.filter(post => post.category === value).length}</span></button>)}</div>
        </div>
        <div className="user-posts">{posts.filter(post => filter === 'all' || post.category === filter).map(post => <PostCard key={post.id} post={post} highlighted={selectedPost === String(post.id)} />)}{!posts.some(post => filter === 'all' || post.category === filter) && <p className="user-empty">No posts in this category yet.</p>}</div>
      </main>
      {showComposer && <CreatePostModal onClose={() => setShowComposer(false)} onCreate={createPost} />}
    </UserLayout>
  );
}
