import ShelterReservationModal from '../../components/ShelterReservationModal';
import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { useAuth } from '../../lib/AuthContext';
import { listRecords } from '../../lib/userData';
import './ShelterDashboard.css';

const statusLabels = { pending: 'Pending Review', approved: 'Accepted', accepted: 'Accepted', cancelled: 'Cancelled', rejected: 'Rejected' };
function Status({ value, plain = false }) { return <span className={`dashboard-status status-${value}`}>{!plain && <Icon name={value === 'pending' ? 'clock' : ['approved', 'accepted'].includes(value) ? 'check' : 'close'} />}{statusLabels[value] || value || 'Unknown'}</span>; }

export default function ShelterDashboard({ requestsPage = false }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState({ pets: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    if (!user) { setData({ pets: [], requests: [] }); setLoading(false); return; }
    setLoading(true); setError('');
    Promise.all([listRecords('pet', true), listRecords('reservation')]).then(([pets, requests]) => {
      if (active) setData({ pets, requests: requests.filter(item => item.recipientId === user.id) });
    }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, authLoading]);
  const filters = [['all','All'],['pending','Pending'],['approved','Accepted'],['rejected','Declined'],['cancelled','Cancelled']];
  const matches = (item, value) => value === 'all' || item.status === value || (value === 'approved' && item.status === 'accepted');
  const visible = data.requests.filter(item => !requestsPage || matches(item, filter)).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const stats = [
    ['Total Pets', data.pets.length, 'library'],
    ['Adoptable Pets', data.pets.filter(pet => ['available', 'senior gentle'].includes(pet.status?.toLowerCase())).length, 'heart'],
    ['Adopted Pets', data.pets.filter(pet => pet.status?.toLowerCase() === 'adopted').length, 'paw'],
    ['Pending Request', data.requests.filter(request => request.status === 'pending').length, 'clock'],
  ];
  return <UserLayout><main className={`shelter-dashboard${requestsPage ? ' shelter-adoption-requests' : ''}`}>
    <h1>{requestsPage ? 'Adoption Reservation' : 'Shelter Dashboard'}</h1>
    {!requestsPage && <div className="dashboard-stats">{stats.map(([label, count], index) => <section key={label} className={`dashboard-stat stat-${index}`}><div><h2>{label}</h2></div><strong>{loading || error ? '\u2014' : count}</strong></section>)}</div>}
    {requestsPage && <div className="reservation-filters" aria-label="Filter applications by stage">{filters.map(([value,label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{data.requests.filter(item => matches(item,value)).length}</span></button>)}</div>}
    <section className="dashboard-requests" aria-label={requestsPage ? 'Adoption reservations' : 'Pending adoption requests'}>{!requestsPage && <div className="reservation-list-heading"><h2>Pending Adoption Requests</h2></div>}
      {error && <p role="alert">{error}</p>}
      {loading ? <p role="status">Loading shelter records...</p> : <div className="dashboard-table-scroll"><table><thead><tr>{['Applicant', requestsPage ? 'Target Pet' : 'Pet Requested', 'Submitted', requestsPage ? 'Stage' : 'Stage Status', 'Actions'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>
        {visible.map(request => { const pet = data.pets.find(item => item.id === request.petId || item.id === request.parentId); return <tr key={request.id}><td><div className="reservation-applicant">{requestsPage && <span className="reservation-initials" aria-hidden="true">{(request.fullName || 'A').split(' ').map(word => word[0]).slice(0,2).join('')}</span>}<div><strong>{request.fullName || 'Applicant'}</strong><small>{request.email || 'Email not provided'}</small>{requestsPage && request.phone && <small>{request.phone}</small>}</div></div></td><td><div className="dashboard-pet">{request.image ? <img src={request.image} alt="" /> : <Icon name="paw" />}<div><strong>{request.title?.split(' (')[0] || 'Pet'}</strong><small>{requestsPage ? [pet?.breed || request.title?.match(/\((.*)\)/)?.[1], pet?.age].filter(Boolean).join(' • ') : request.title?.match(/\((.*)\)/)?.[1] || ''}</small></div></div></td><td><span className={requestsPage ? 'reservation-submitted-date' : undefined}>{new Date(request.createdAt).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })}</span>{requestsPage && <small>{new Date(request.createdAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })}</small>}</td><td><Status value={request.status} plain /></td><td><button className="dashboard-review-button" onClick={() => setSelected(request)} aria-label={`Review request from ${request.fullName || 'applicant'}`}>Review</button></td></tr>; })}
        {!visible.length && !error && <tr><td colSpan={5}>No adoption requests in this category.</td></tr>}
      </tbody></table></div>}
    </section>
    {!user && !authLoading && <p className="dashboard-preview">Sign in with an approved shelter account to view your records.</p>}
  </main>{selected && <ShelterReservationModal request={selected} requests={data.requests} onSaved={next => setData(current => ({ ...current, requests: current.requests.map(item => item.id === next.id ? next : item) }))} onClose={() => setSelected(null)} />}</UserLayout>;
}
