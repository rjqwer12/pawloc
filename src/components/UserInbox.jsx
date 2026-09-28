import { useEffect, useRef, useState } from 'react';
import { listRecords } from '../lib/userData';
import { useAuth } from '../lib/AuthContext';

export default function UserInbox({ onClose }) {
  const { user } = useAuth();
  const dialog = useRef(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    let active = true;
    element.showModal();
    Promise.all([listRecords('contact'), listRecords('reservation')]).then(([contacts, reservations]) => {
      if (active) setItems([...contacts.filter(item => item.recipientId === user?.id).map(item => ({ ...item, type: 'message' })), ...reservations.map(item => ({ ...item, type: 'reservation' }))]);
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; element.close(); focus?.focus(); };
  }, [user?.id]);
  return <dialog ref={dialog} className="user-inbox" aria-labelledby="inbox-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <h2 id="inbox-title">Messages &amp; Reservations</h2>
    {loading && <p>Loading...</p>}{error && <p role="alert">{error}</p>}
    {!loading && !error && !items.length && <p>No messages or reservations yet.</p>}
    {items.map(item => <article key={item.id}><h3>{item.postTitle || item.title}</h3>{item.type === 'message' ? <><p>From: {item.fullName}</p><p>{item.description}</p><p>{item.location}</p><p>Contact: {item.phone}</p><p>Facebook: {item.facebook}</p></> : <p>Status: {item.status}</p>}<small>{item.time}</small></article>)}
    <button onClick={onClose}>Close</button>
  </dialog>;
}
