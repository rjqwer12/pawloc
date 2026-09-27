import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPreviewPosts } from '../../lib/previewPosts';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../lib/AuthContext';
import './UserLibrary.css';

const categories = [['all', 'All Posts'], ['lost', 'Lost Pets'], ['found', 'Found Pets'], ['reunited', 'Reunited Stories'], ['reservation', 'Reservation']];
const labels = { lost: 'Lost Pet', found: 'Found Pet', reunited: 'Reunited Story', reservation: 'Reservation' };
const authorLabels = { lost: 'My Alert', found: 'My Report', reunited: 'My Story', reservation: 'My Reservation' };
const initialEntries = [
  { id: 1, category: 'reunited', time: 'Just now', title: 'Barnaby is finally home safe!', description: 'Barnaby was found safe in Mandurriao thanks to our community responders and flyers. Thank you to everyone who helped bring him home!', image: 'https://images.unsplash.com/photo-1601758124510-164b0a0a1d1f?w=700&h=450&fit=crop' },
  { id: 2, category: 'found', time: '35 mins ago', title: 'Dog (Golden Retriever / Labrador mix)', description: 'Found wandering near the plaza with no collar. Healthy, calm, and friendly golden retriever mix. Awaiting verification from the owner.', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=700&h=450&fit=crop' },
  { id: 3, category: 'lost', time: '2h ago', title: 'Milo (Golden Retriever mix)', description: 'Red nylon collar with silver bell. Very food-motivated, timid around loud delivery trucks. Call his name softly.', image: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=700&h=450&fit=crop' },
  { id: 4, category: 'reservation', time: '4h ago', title: 'Milo (Golden Retriever & Lab mix)', description: 'Adoption inquiry submitted. Review and home verification are in progress.', image: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=700&h=450&fit=crop' },
];

export default function UserLibrary() {
  const { user } = useAuth();
  const name = user?.user_metadata?.first_name || 'RJ';
  const [params] = useSearchParams();
  const [entries, setEntries] = useState(() => [...getPreviewPosts(user?.id), ...initialEntries]);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [deleted, setDeleted] = useState(null);
  const [notice, setNotice] = useState('');
  const editor = useRef(null);
  const editVersion = useRef(0);
  const visibleEntries = entries.filter(entry => filter === 'all' || entry.category === filter);

  function editEntry(entry) {
    setEditing({ ...entry, editVersion: ++editVersion.current });
    editor.current.showModal();
  }

  function saveEntry(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get('title').trim();
    const description = form.get('description').trim();
    if (!title || !description) {
      setNotice('Please enter a title and description.');
      return;
    }
    setEntries(current => current.map(entry => entry.id === editing.id ? { ...entry, title, description } : entry));
    editor.current.close();
    setNotice('Changes saved for this preview.');
  }

  function deleteEntry(entry) {
    setDeleted({ entry, index: entries.findIndex(item => item.id === entry.id) });
    setEntries(current => current.filter(item => item.id !== entry.id));
    setNotice('Post deleted from this preview.');
  }

  function undoDelete() {
    setEntries(current => [...current.slice(0, deleted.index), deleted.entry, ...current.slice(deleted.index)]);
    setDeleted(null);
    setNotice('Post restored.');
  }

  return (
    <UserLayout>
      <main className="user-library-main">
        <h1>Pet Library</h1>
        <div className="user-library-filters" aria-label="Filter library">
          {categories.map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`user-library-filter-${value}`}>{label}<span>{entries.filter(entry => value === 'all' || entry.category === value).length}</span></button>)}
        </div>
        {(notice || deleted) && <div className="user-library-notice"><span role="status">{notice}</span>{deleted && <button onClick={undoDelete}>Undo delete</button>}</div>}
        <section className="user-library-grid" aria-label="Your library posts">
          {visibleEntries.map(entry => <article className={`user-library-card${params.get('post') === String(entry.id) ? ' user-library-card-selected' : ''}`} key={entry.id}>
            <header><div className="user-library-author"><span className="user-avatar" aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span><div><strong>{name} · {authorLabels[entry.category]}</strong><p>{entry.time}</p></div></div><span className={`user-library-tag user-library-tag-${entry.category}`}>{labels[entry.category]}</span></header>
            <div className="user-library-copy"><h2>{entry.title}</h2><p>{entry.description}</p></div>
            {entry.image && <img className="user-library-photo" src={entry.image} alt={entry.alt || `Sample photo for ${entry.title}`} loading="lazy" />}{entry.location && <p className="user-library-post-location">{entry.category === 'found' ? 'Found at' : 'Last seen'}: {entry.location}</p>}{entry.attachment && <a className="user-library-post-location" href={entry.attachment.url} download={entry.attachment.name}>Download {entry.attachment.name}</a>}
            <footer>{entry.category === 'reservation' ? <span className="user-library-pending">◷ Pending Review</span> : <><button onClick={() => editEntry(entry)} aria-label={`Edit ${entry.title}`}>Edit</button><button className="user-library-delete" onClick={() => deleteEntry(entry)} aria-label={`Delete ${entry.title}`}>Delete</button></>}</footer>
          </article>)}
        </section>
        {visibleEntries.length === 0 && <p className="user-library-empty">No posts in this category yet.</p>}
        <p className="user-library-preview">Sample library. Edits and deletions last until you leave or reload this page.</p>
      </main>
      <dialog ref={editor} className="user-library-editor" aria-labelledby="library-edit-title">
        {editing && <form key={editing.editVersion} onSubmit={saveEntry}><h2 id="library-edit-title">Edit post</h2><label>Title<input name="title" defaultValue={editing.title} required maxLength={120} /></label><label>Description<textarea name="description" defaultValue={editing.description} rows={5} required maxLength={2000} /></label><p role="status">{notice === 'Please enter a title and description.' ? notice : ''}</p><div><button type="button" onClick={() => editor.current.close()}>Cancel</button><button type="submit">Save changes</button></div></form>}
      </dialog>
    </UserLayout>
  );
}
