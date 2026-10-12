import InquiryDetails from '../../components/InquiryDetails';
import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { listRecords, cancelReservation } from '../../lib/userData';
import { ReservationDetails } from './UserLibrary';
import './UserNotifications.css';

const labels = { lost: 'Lost Pet Inquiry', found: 'Found Pet Inquiry', reservation: 'Adoption Application' };
const keyFor = item => `${item.id}:${item.status || 'inquiry'}`;
function groupLabel(date) {
  const value = new Date(date);
  if (value.toDateString() === new Date().toDateString()) return 'Today';
  if (value.toDateString() === new Date(Date.now() - 86400000).toDateString()) return 'Yesterday';
  return value.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
export default function UserNotifications() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [read, setRead] = useState({});
  const [filter, setFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setRead(user?.user_metadata?.notification_reads || {});
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const refresh = () => Promise.all([listRecords('contact'), listRecords('reservation', true), listRecords('post', true)]).then(([contacts, reservations, posts]) => {
      if (!active) return;
      const inquiries = contacts.filter(item => item.recipientId === user.id).map(item => ({ ...item, category: posts.find(post => post.id === item.postId)?.category || 'found', postLocation: posts.find(post => post.id === item.postId)?.location, breed: posts.find(post => post.id === item.postId)?.breed }));
      setItems([...inquiries, ...reservations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [user, authLoading]);
  async function markRead(targets) {
    const next = { ...read };
    targets.forEach(item => { next[keyFor(item)] = true; });
    setSaving(true); setError('');
    try {
      if (user) { const { error } = await supabase.auth.updateUser({ data: { notification_reads: next } }); if (error) throw error; }
      setRead(next);
    } catch(error) { setError(error.message); } finally { setSaving(false); }
  }
  const visible = items.filter(item => !filter || item.category === filter);
  const groups = [...new Set(visible.map(item => groupLabel(item.createdAt)))];
  const unread = items.filter(item => !read[keyFor(item)]).length;
  const todayUnread = visible.filter(item => groupLabel(item.createdAt) === 'Today' && !read[keyFor(item)]).length;
  return <UserLayout><main className="notifications-main">
    <header className="notifications-heading"><h1>Notifications</h1><button disabled={saving || !unread} onClick={() => markRead(items)}>Mark All as Read</button></header>
    <div className="notifications-filters" aria-label="Filter notifications">{[['lost', 'Lost'], ['found', 'Found'], ['reservation', 'Reservation']].map(([value, label]) => <button key={value} className={`notification-filter-${value}`} aria-pressed={filter === value} onClick={() => setFilter(filter === value ? null : value)}>{items.filter(item => item.category === value).length} {label}</button>)}</div>
    {error && <p role="alert">{error}</p>}{loading && <p role="status">Loading notifications...</p>}
    {!loading && !error && !visible.length && <p className="notifications-empty">No notifications yet.</p>}
    {!loading && groups.map(group => <section className="notification-group" key={group} aria-label={group}>
      <header><h2>{group}</h2>{group === 'Today' && todayUnread > 0 && <span>{todayUnread} new notification{todayUnread === 1 ? '' : 's'}</span>}</header>
      {visible.filter(item => groupLabel(item.createdAt) === group).map(item => <article className="notification-row" key={item.id} aria-label={!read[keyFor(item)] ? 'Unread notification' : 'Read notification'}>
        <div><p><strong>{item.category === 'reservation' ? `Reservation ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}` : labels[item.category]}:</strong> {item.postTitle || item.title}</p><small>{new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} &bull; {labels[item.category]}</small></div>
        <button disabled={saving} onClick={() => { setSelected(item); void markRead([item]); }}>{item.category !== 'reservation' ? 'View Inquiry' : item.status === 'approved' ? 'View Schedule' : item.status === 'pending' ? 'Check Status' : 'View Details'}</button>
      </article>)}
    </section>)}
    {!user && !authLoading && <p className="notifications-preview">Sign in to view your notifications.</p>}
  </main>{selected && (selected.category === 'reservation' ? selected.status === 'cancelled' ? <InquiryDetails item={{ ...selected, postTitle: selected.title, description: 'Reservation Cancelled', fullName: selected.fullName || 'You' }} onClose={() => setSelected(null)} /> : <ReservationDetails entry={selected} onClose={() => setSelected(null)} onCancelReservation={async item => { if (item.database) await cancelReservation(item.id); setItems(current => current.map(row => row.id === item.id ? { ...row, status: 'cancelled' } : row)); setSelected(null); }} /> : <InquiryDetails item={selected} onClose={() => setSelected(null)} />)}</UserLayout>;
}
