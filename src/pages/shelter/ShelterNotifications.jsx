import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import ShelterReservationModal from '../../components/ShelterReservationModal';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { listRecords } from '../../lib/userData';
import './ShelterNotifications.css';

const keyFor = item => `${item.id}:${item.status || 'pending'}`;
const timestamp = item => item.cancelledAt || item.reviewedAt || item.createdAt;
function groupFor(item) {
  const date = new Date(timestamp(item)).toDateString();
  if (date === new Date().toDateString()) return 'Today';
  if (date === new Date(Date.now() - 86400000).toDateString()) return 'Yesterday';
  return new Date(timestamp(item)).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}
function sampleItems() {
  return [12,42,60,1440].map((minutes,index)=>({id:`notification-preview-${index}`,fullName:index===2?'Elena Morales':'Sarah Jenkins',title:index===2?'Barnaby':'Cooper',status:index===2?'cancelled':'pending',createdAt:new Date(Date.now()-minutes*60000).toISOString()}));
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
    if(!user){setItems(sampleItems());setLoading(false);return;}
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
  return <UserLayout><main className="shelter-notifications"><header className="shelter-notifications-heading"><h1>Notifications</h1><button disabled={loading||saving||!items.some(item=>!read[keyFor(item)])} onClick={()=>markRead(items)}>&#10003; Mark All as Read</button></header>
    {error&&<p role="alert">{error}</p>}{loading&&<p role="status">Loading notifications...</p>}
    {!loading&&!error&&!items.length&&<p>No notifications yet.</p>}
    {!loading&&groups.map(group=><section className="shelter-notification-group" key={group} aria-label={group}><h2>{group}</h2>{sorted.filter(item=>groupFor(item)===group).map(item=>{
      const cancelled=item.status==='cancelled';const name=item.fullName||'Applicant';
      return <article key={item.id} className={`shelter-notification-row${cancelled?' is-cancelled':''}`}><span className="shelter-notification-avatar" aria-hidden="true">{name.split(' ').map(word=>word[0]).slice(0,2).join('')}</span><div className="shelter-notification-copy"><p><strong>{name}</strong> {cancelled?'cancelled reservation for': 'applied to adopt'} <strong>{item.title?.split(' (')[0]||'a pet'}</strong>.</p><small><time dateTime={timestamp(item)}>{new Date(timestamp(item)).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</time> &bull; {cancelled?'Reservations':'Adoptions'}</small></div><button disabled={saving} aria-label={`Review request from ${name}`} onClick={()=>{setSelected(item);void markRead([item]);}}>Review</button><span className={`shelter-notification-dot${read[keyFor(item)]?' is-read':''}`} aria-label={read[keyFor(item)]?'Read':'Unread'}/></article>;
    })}</section>)}
    {!user&&!authLoading&&<p className="shelter-notifications-preview">Sample notifications. Sign in with an approved shelter account to view your updates.</p>}
  </main>{selected&&<ShelterReservationModal request={selected} requests={items} onSaved={next=>setItems(current=>current.map(item=>item.id===next.id?next:item))} onClose={()=>setSelected(null)}/>}</UserLayout>;
}
