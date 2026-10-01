import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { listRecords } from '../lib/userData';
import Icon from './UserIcon';

export default function NotificationBell({ to = '/user/notifications' }) {
  const { user } = useAuth();
  const shelterView = to.startsWith('/shelter/');
  const [snapshot, setSnapshot] = useState({ userId: null, items: [] });
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const [contacts, reservations] = await Promise.all([shelterView ? Promise.resolve([]) : listRecords('contact'), listRecords('reservation', !shelterView)]);
        if (active) setSnapshot({ userId: user.id, shelterView, items: shelterView ? reservations.filter(item => item.recipientId === user.id) : [...contacts.filter(item => item.recipientId === user.id), ...reservations] });
      } catch { /* Keep the last known state during temporary connection failures. */ }
      finally { pending = false; }
    }
    void refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [user?.id, shelterView]);
  const read = user?.user_metadata?.notification_reads || {};
  const unread = snapshot.userId === user?.id && snapshot.shelterView === shelterView && snapshot.items.some(item => !read[`${item.id}:${item.status || (shelterView ? 'pending' : 'inquiry')}`]);
  return <Link className="user-notification-bell" to={to} title={unread ? 'Unread notifications' : 'Notifications'} aria-label={unread ? 'Notifications, unread updates' : 'Notifications'}>
    <Icon name="bell" />
    {unread && <span className="user-notification-dot" aria-hidden="true" />}
  </Link>;
}
