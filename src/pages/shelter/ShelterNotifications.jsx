import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import ShelterReservationModal from '../../components/ShelterReservationModal';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { listRecords } from '../../lib/userData';
import './ShelterNotifications.css';

const keyFor = item => `${item.id}:${item.status || 'pending'}`;
const timestamp = item => item.cancelledAt || item.reviewedAt || item.createdAt;
const dayKey = date => new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
const dateLabel = date => new Date(date).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' });
function groupFor(item) {
  const date = dayKey(timestamp(item));
  if (date === dayKey(Date.now())) return 'Today';
  if (date === dayKey(Date.now() - 86400000)) return 'Yesterday';
  return dateLabel(timestamp(item));
}
function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + 'm ago';
  if (minutes < 1440) return Math.floor(minutes / 60) + 'h ago';
  return Math.floor(minutes / 1440) + 'd ago';
}
export default function ShelterNotifications() {
  const { user, loading: authLoading } = useAuth();
  const [items,setItems]=useState([]), [read,setRead]=useState({}), [selected,setSelected]=useState(null);
  const [loading,setLoading]=useState(true), [saving,setSaving]=useState(false), [error,setError]=useState('');
  useEffect(()=>{setRead(user?.user_metadata?.notification_reads || {});},[user]);
  useEffect(()=>{
    if(authLoading)return;
    let active=true, pending=false;
    setError('');setLoading(true);setSelected(null);
    if(!user){setItems([]);setLoading(false);return;}
    async function refresh(){
      if(pending)return;pending=true;
      try { const rows=await listRecords('reservation'); if(active){setItems(rows.filter(item=>item.recipientId===user.id));setError('');} }
      catch(err){if(active)setError(err.message);}
      finally{pending=false;if(active)setLoading(false);}
    }
    void refresh();const timer=setInterval(()=>{if(!document.hidden)void refresh();},15000);
    window.addEventListener('focus',refresh);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[user?.id,authLoading]);
  async function markRead(targets){
    const next={...user?.user_metadata?.notification_reads,...read};targets.forEach(item=>{next[keyFor(item)]=true;});
    setSaving(true);setError('');
    try {if(user){const {error}=await supabase.auth.updateUser({data:{notification_reads:next}});if(error)throw error;}setRead(next);}
    catch(err){setError(err.message);}finally{setSaving(false);}
  }
  const sorted=[...items].sort((a,b)=>new Date(timestamp(b))-new Date(timestamp(a)));
  const groups=[...new Set(sorted.map(groupFor))];
  return <UserLayout><main className="shelter-notifications"><header className="shelter-notifications-heading"><h1>Notifications</h1><button disabled={loading||saving||!items.some(item=>!read[keyFor(item)])} onClick={()=>markRead(items)}>Mark All as Read</button></header>
    {error&&<p role="alert">{error}</p>}{loading&&<p role="status">Loading notifications...</p>}
    {!loading&&!error&&!items.length&&<p>No notifications yet.</p>}
    {!loading&&groups.map(group=><section className="shelter-notification-group" key={group} aria-label={group}><header className="shelter-notification-group-heading"><h2>{group}</h2><span>{group === 'Today' ? 'Priority sorted' : group === 'Yesterday' ? dateLabel(Date.now() - 86400000) : ''}</span></header>{sorted.filter(item=>groupFor(item)===group).sort((a,b)=>group === 'Today' ? Number(!read[keyFor(b)] && b.status === 'pending') - Number(!read[keyFor(a)] && a.status === 'pending') : 0).map(item=>{
      const cancelled=item.status==='cancelled';const name=item.fullName||'Applicant';
      return <article key={item.id} aria-label={read[keyFor(item)] ? 'Read notification' : 'Unread notification'} className={`shelter-notification-row${cancelled?' is-cancelled':''}`}><span className="shelter-notification-avatar" aria-hidden="true">{name.split(' ').map(word=>word[0]).slice(0,2).join('')}</span><div className="shelter-notification-copy"><p><strong>{name}</strong> {cancelled?'cancelled reservation for': 'applied to adopt'} <strong>{item.title?.split(' (')[0]||'a pet'}</strong>.</p><small><time dateTime={timestamp(item)}>{relativeTime(timestamp(item))}</time> &bull; {cancelled?'Reservations':'Adoptions'}</small></div><button disabled={saving} aria-label={`Review request from ${name}`} onClick={()=>{setSelected(item);void markRead([item]);}}>Review</button></article>;
    })}</section>)}
    {!user&&!authLoading&&<p className="shelter-notifications-preview">Sign in to view your notifications.</p>}
  </main>{selected&&<ShelterReservationModal notificationReview request={selected} requests={items} onSaved={next=>setItems(current=>current.map(item=>item.id===next.id?next:item))} onClose={()=>setSelected(null)}/>}</UserLayout>;
}
