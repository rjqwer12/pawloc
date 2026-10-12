import { useEffect, useRef, useState } from 'react';
import { listRecords, savePost, deleteRecord, cancelReservation } from '../../lib/userData';
import Icon from '../../components/UserIcon';
import EditPostModal from '../../components/EditPostModal';
import DeletePostModal from '../../components/DeletePostModal';
import { Link, useSearchParams } from 'react-router-dom';
import { updatePreviewPost } from '../../lib/previewPosts';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../lib/AuthContext';
import './UserLibrary.css';

const categories = [['all', 'All Posts'], ['lost', 'Lost Pets'], ['found', 'Found Pets'], ['reunited', 'Reunited Stories'], ['reservation', 'Reservation']];
const labels = { lost: 'Lost Pet', found: 'Found Pet', reunited: 'Reunited Story', reservation: 'Reservation' };
const authorLabels = { lost: 'My Alert', found: 'My Report', reunited: 'My Story', reservation: 'My Reservation' };


export function ReservationDetails({ entry, onClose, onCancelReservation }) {
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const approved = entry.status === 'approved';
  const rejected = entry.status === 'rejected';
  const petName = entry.title.split(' (')[0];
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  return <dialog ref={dialog} className={`reservation-details-modal${rejected ? ' reservation-details-rejected' : ''}`} aria-labelledby="reservation-details-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <button className="reservation-close" onClick={onClose} aria-label="Close reservation details"><Icon name="close" /></button>
    {rejected ? <div className="reservation-rejection">
      <Icon name="paw" /><h2 id="reservation-details-title">Reservation Update</h2>
      <h3>{entry.database ? 'Reservation not approved' : 'Apologies, this pet has already been adopted'}</h3>
      <p>{entry.rejectionReason || 'Please contact the shelter for the reason and further details.'}</p>
    </div> : <>
      <header className="reservation-modal-header"><div><h2 id="reservation-details-title">{approved ? 'Approved' : 'Pending'} Reservation Details</h2><p>{approved ? 'Verified adoption and scheduled sanctuary visit' : 'Adoption visit request is currently awaiting shelter verification'}</p></div></header>
      <div className="reservation-modal-body">
        <section className="reservation-receipt"><header><strong>RESERVATION</strong><span><Icon name={approved ? 'check' : 'clock'} />{approved ? 'Verified & Reserved' : 'Pending Review'}</span></header>
          <dl><div><dt>Pet Name</dt><dd>{petName}<small>{entry.title.match(/\((.*)\)/)?.[1]}</small></dd></div><div><dt>Shelter</dt><dd>{entry.shelter || 'Shelter not provided'}</dd></div><div><dt>Applicant Name</dt><dd>{entry.fullName || 'Not provided'}</dd></div><div><dt>Contact Number</dt><dd>{entry.phone || 'Not provided'}</dd></div></dl>
        </section>
        {approved && <section className="reservation-schedule"><Icon name="calendar" /><div><strong>VISIT SCHEDULE</strong><p>{entry.visitSchedule || 'Awaiting schedule from shelter'}</p></div><span>Confirmed</span></section>}
        <section className="reservation-map"><Icon name="pin" /><div><strong>Shelter Location</strong><p>{entry.shelterLocation || 'See shelter listing for location'}</p></div><Link to={`/user/map?shelter=${entry.shelterId || 1}`}>View Map</Link></section>
        {!approved && <button className="reservation-cancel" disabled={busy} onClick={async () => { setBusy(true); try { await onCancelReservation(entry); } catch(error) { setActionError(error.message); } finally { setBusy(false); } }}>Cancel Reservation</button>}
      </div>
    </>}
    {actionError && <p role="alert">{actionError}</p>}{!entry.database && <p className="reservation-preview">Sample reservation details for preview only.</p>}
  </dialog>;
}

export default function UserLibrary() {
  const { user } = useAuth();
  const name = user?.user_metadata?.first_name || 'RJ';
  const [params] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [deleted, setDeleted] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState('');
  const [reservation, setReservation] = useState(null);


  useEffect(() => { let active = true; if (user) Promise.all([listRecords('post', true), listRecords('reservation', true)]).then(([posts, reservations]) => { if (active) setEntries([...posts, ...reservations]); }).catch(error => { if (active) setNotice(error.message); }); return () => { active = false; }; }, [user]);

  const visibleEntries = entries.filter(entry => filter === 'all' || entry.category === filter);

  function editEntry(entry) { setEditing(entry); }

  async function saveEntry(updated) {
    if (updated.database) updated = await savePost(updated, updated.id);
    setEntries(current => current.map(entry => entry.id === updated.id ? updated : entry));
    updatePreviewPost(user?.id, updated);
    setEditing(null);
    setNotice(updated.database ? 'Changes saved.' : 'Changes saved for this preview.');
  }
  async function deleteEntry(entry) {
    if (entry.database) { await deleteRecord(entry.id); setEntries(current => current.filter(item => item.id !== entry.id)); setNotice('Post deleted.'); return; }
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
            <div className="user-library-copy"><h2>{entry.title}</h2><p>{entry.description}</p>{!entry.image && entry.dateFound && <p>Date found: {entry.dateFound}</p>}</div>
            {entry.image && <div className="user-library-photo-wrap"><img className="user-library-photo" src={entry.image} alt={entry.alt || `Photo for ${entry.title}`} loading="lazy" /></div>}{!entry.image && entry.location && <p className="user-library-post-location">Location: {entry.location}</p>}{entry.attachment && <a className="user-library-post-location" href={entry.attachment.url} download={entry.attachment.name}>Download {entry.attachment.name}</a>}
            <footer>{entry.category === 'reservation' ? entry.status === 'cancelled' ? <span className="user-library-reservation-cancelled" role="status">Reservation Cancelled</span> : entry.status === 'pending' ? <button className="user-library-pending" onClick={() => setReservation(entry)}>Pending Reservation</button> : <button className={`user-library-reservation-${entry.status}`} onClick={() => setReservation(entry)}>{entry.status === 'approved' ? 'View Approved Reservation' : 'View Why Rejected'}</button> : <><button onClick={() => editEntry(entry)} aria-label={`Edit ${entry.title}`}>Edit</button><button className="user-library-delete" onClick={() => setDeleting(entry)} aria-label={`Delete ${entry.title}`}>Delete</button></>}</footer>
          </article>)}
        </section>
        {visibleEntries.length === 0 && <p className="user-library-empty">No posts in this category yet.</p>}
        {!user && <p className="user-library-preview">Preview only. Sign in with a real account for database features.</p>}
      </main>
      {editing && <EditPostModal key={editing.id} post={editing} onClose={() => setEditing(null)} onSave={saveEntry} />}
      {deleting && <DeletePostModal post={deleting} onDelete={deleteEntry} onClose={() => setDeleting(null)} />}
      {reservation && <ReservationDetails entry={reservation} onClose={() => setReservation(null)} onCancelReservation={async entry => { if (entry.database) await cancelReservation(entry.id); setEntries(current => current.map(item => item.id === entry.id ? { ...item, status: 'cancelled' } : item)); setNotice(entry.database ? 'Reservation cancelled.' : 'Reservation cancelled in this preview.'); setReservation(null); }} />}
    </UserLayout>
  );
}
