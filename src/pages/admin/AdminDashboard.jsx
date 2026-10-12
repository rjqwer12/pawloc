import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/UserIcon';
import LogoutButton from '../../components/LogoutButton';
import '../user/UserHome.css';
import logo from '../../assets/pawloc.svg';
import './AdminDashboard.css';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';
import AdminSystemOverview from './AdminSystemOverview';

function Queue({ items, onClose }) {
  const ref=useRef(null);
  useEffect(()=>{const dialog=ref.current;dialog.showModal();return()=>dialog.close();},[]);
  return <dialog ref={ref} className="admin-queue" onCancel={onClose}><header><h2>Pending Shelter Verifications</h2><button onClick={onClose} aria-label="Close verification queue"><Icon name="close"/></button></header><p>Review pending applications and confirm their map locations before accepting.</p>{items.length?items.map(item=><article key={item.id}><Link to="/admin/users?filter=pending" onClick={onClose}>{item.name||'Shelter application'}</Link><small>{new Date(item.createdAt).toLocaleDateString()}</small></article>):<p>No pending applications.</p>}</dialog>;
}
export default function AdminDashboard({usersPage=false,reportsPage=false,overviewPage=false}){
  const {user,loading}=useAuth();const [data,setData]=useState(null),[error,setError]=useState(''),[queue,setQueue]=useState(false);
  const admin=user?.app_metadata?.role==='admin';
  useEffect(()=>{
    if(!admin)return;let active=true,busy=false;
    async function refresh(){if(busy)return;busy=true;try{const {data,error}=await supabase.rpc('admin_dashboard');if(error)throw error;if(active){setData(data);setError('');}}catch(err){if(active)setError(err.message);}finally{busy=false;}}
    void refresh();const timer=setInterval(()=>{if(!document.hidden)void refresh();},15000);return()=>{active=false;clearInterval(timer);};
  },[admin,user?.id]);
  if(loading)return <p role="status">Loading account...</p>;
  if(!user)return <Navigate to="/" replace/>;
  if(!admin)return <main className="admin-denied"><h1>Administrator access required</h1><Link to="/">Return to sign in</Link></main>;
  const value=key=>data?data[key]:'\u2014';
  const metrics=[['Total Registered Users','users','profile'],['Pending Shelter Verifications','pending','library'],['Active Reports','reports','warning'],['Reunions & Adoptions','outcomes','paw']];
  const summaries=[['Registered Clients','Public users looking to adopt or report strays','clients','profile'],['Verified Shelter Owners',`Active shelter organizations (${data?.pending??0} pending approval)`,'verified','library'],['Total Community Posts','Discussions, lost & found logs, and updates','posts','paw'],['Resolved Cases Rate','Moderation reports marked resolved vs total filed',null,'check']];
  return <div className="admin-shell"><header className="user-topbar"><Link to="/admin/dashboard" aria-label="Pawloc home"><img src={logo} alt="PAWLOC" className="user-logo"/></Link><div className="user-topbar-account"><button className="user-notification-bell" aria-label="Pending shelter verifications" onClick={()=>setQueue(true)} disabled={!data}><Icon name="bell"/>{data?.pending>0&&<span className="user-notification-dot"/>}</button><span className="user-avatar">{user.user_metadata?.avatar_url?<img src={user.user_metadata.avatar_url} alt="Admin profile photo"/>:'AD'}</span><span>Admin</span></div></header>
    <aside className="user-sidebar admin-navigation"><nav aria-label="Admin navigation"><Link className={!usersPage&&!reportsPage&&!overviewPage?'user-nav-active':''} to="/admin/dashboard" title="Dashboard"><Icon name="home"/>Dashboard</Link><Link className={usersPage?'user-nav-active':''} to="/admin/users" title="Users"><Icon name="profile"/>Users</Link><Link className={reportsPage?'user-nav-active':''} to="/admin/reports" title="Reports"><Icon name="shelter"/>Reports</Link><Link className={overviewPage?'user-nav-active':''} to="/admin/system-overview" title="System Overview"><Icon name="activity"/>System Overview</Link></nav><div className="user-sidebar-bottom"><button disabled title="Page design coming next"><Icon name="settings"/>Settings</button><LogoutButton title="Log out"><Icon name="logout"/>Log out</LogoutButton></div></aside>
    <main className={`admin-main${usersPage || reportsPage || overviewPage ? '' : ' admin-dashboard-main'}`}>{usersPage?<AdminUsers/>:reportsPage?<AdminReports/>:overviewPage?<AdminSystemOverview/>:<><h1>Admin Dashboard</h1>{error&&<p role="alert" className="admin-error">Unable to load dashboard: {error}</p>}{!data&&!error&&<p role="status">Loading system statistics...</p>}
    <div className="admin-metrics">{metrics.map(([label,key])=><section key={key}><header><h2>{label}</h2></header><strong>{value(key)}</strong></section>)}</div>
    <div className="admin-columns"><div><section id="admin-summary" className="admin-summary"><h2>System Overview Summary</h2><p>High-level distribution of accounts, community participation, and outcomes</p><div>{summaries.map(([label,description,key])=><article key={label}><div><h3>{label}</h3><p>{description}</p></div><strong>{key?value(key):data?`${data.reportTotal?(100*data.resolved/data.reportTotal).toFixed(1):'0.0'}%`:'\u2014'}</strong></article>)}</div></section><section className="admin-queue-card"><div><h3>Pending Verification Queue</h3><p>{data?.pending??'\u2014'} shelter registrations require identity check and license approval</p></div><Link className="admin-review-shelters" to="/admin/users?filter=pending">Review Shelters ({data?.pending??0})</Link></section></div>
    <section className="admin-activity"><header><div><h2>Recent Activity Log</h2></div><small>UPDATES EVERY 15s</small></header><div className="admin-activity-scroll" tabIndex={0} role="region" aria-label="Recent activity entries">{data?.activity.map(item=><article key={item.id}><div><header><h3>{item.title}</h3><small className={`admin-activity-label label-${String(item.label).toLowerCase()}`}>{item.label}</small></header><p>{item.description}</p><time dateTime={item.at}>{new Date(item.at).toLocaleString()}</time></div></article>)}{data&&!data.activity.length&&<p>No activity yet.</p>}</div></section></div></>}</main>{queue&&<Queue items={data?.queue||[]} onClose={()=>setQueue(false)}/>}</div>;
}
