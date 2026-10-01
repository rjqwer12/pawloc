import ShelterReservationModal from '../../components/ShelterReservationModal';
import { useEffect, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { useAuth } from '../../lib/AuthContext';
import { listRecords } from '../../lib/userData';
import { userPets } from '../../data/userPets';
import './ShelterDashboard.css';

const samples = [
  ['Emily Watson', 'emily.w@example.com', 'Bella', 'Golden Retriever', 'pending', '2024-10-23'],
  ['Marcus Vance', 'm.vance@example.com', 'Milo', 'Domestic Shorthair', 'approved', '2024-10-22'],
  ['David Kowalski', 'dkowalski@firmdesigns.com', 'Cleo', 'Calico Cat', 'cancelled', '2024-10-20'],
  ['Sophia Martinez', 's.martinez@university.edu', 'Barnaby', 'Shepherd Mix', 'rejected', '2024-10-19'],
].map(([fullName, email, name, breed, status, createdAt], index) => ({ id: `sample-${index}`, fullName, email, title: `${name} (${breed})`, status, createdAt, image: userPets[index]?.image }));
const statusLabels = { pending: 'Pending Review', approved: 'Accepted', accepted: 'Accepted', cancelled: 'Cancelled', rejected: 'Rejected' };
function Status({ value }) { return <span className={`dashboard-status status-${value}`}><Icon name={value === 'pending' ? 'clock' : ['approved', 'accepted'].includes(value) ? 'check' : 'close'} />{statusLabels[value] || value || 'Unknown'}</span>; }

export default function ShelterDashboard({ requestsPage = false }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState({ pets: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [newestFirst, setNewestFirst] = useState(true);
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    if (!user) { setData({ pets: [], requests: samples }); setLoading(false); return; }
    setLoading(true); setError('');
    Promise.all([listRecords('pet', true), listRecords('reservation')]).then(([pets, requests]) => {
      if (active) setData({ pets, requests: requests.filter(item => item.recipientId === user.id) });
    }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, authLoading]);
  const filters = [['all','All'],['pending','Pending'],['approved','Accepted'],['rejected','Declined'],['cancelled','Cancelled']];
  const matches = (item, value) => value === 'all' || item.status === value || (value === 'approved' && item.status === 'accepted');
  const visible = data.requests.filter(item => !requestsPage || matches(item, filter)).sort((a,b) => (newestFirst ? 1 : -1) * (new Date(b.createdAt) - new Date(a.createdAt)));
  const stats = [
    ['Total Pets', data.pets.length, 'library'],
    ['Adoptable Pets', data.pets.filter(pet => ['available', 'senior gentle'].includes(pet.status?.toLowerCase())).length, 'heart'],
    ['Adopted Pets', data.pets.filter(pet => pet.status?.toLowerCase() === 'adopted').length, 'paw'],
    ['Pending Request', data.requests.filter(request => request.status === 'pending').length, 'clock'],
  ];
  return <UserLayout><main className={`shelter-dashboard${requestsPage ? ' shelter-adoption-requests' : ''}`}>
    <h1>{requestsPage ? 'Adoption Reservation' : 'Shelter Dashboard'}</h1>
    {!requestsPage && <div className="dashboard-stats">{stats.map(([label, count, icon], index) => <section key={label} className={`dashboard-stat stat-${index}`}><div><h2>{label}</h2><Icon name={icon} /></div><strong>{loading || error ? '\u2014' : count}</strong></section>)}</div>}
    {requestsPage && <div className="reservation-filters" aria-label="Filter applications by stage">{filters.map(([value,label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{data.requests.filter(item => matches(item,value)).length}</span></button>)}</div>}
    <section className="dashboard-requests" aria-labelledby="dashboard-requests-title"><div className="reservation-list-heading"><h2 id="dashboard-requests-title">{requestsPage ? 'Reservation List' : 'Pending Adoption Requests'}</h2>{requestsPage && <button onClick={() => setNewestFirst(value => !value)}>Sort: {newestFirst ? 'Newest First' : 'Oldest First'} {newestFirst ? '\u2193' : '\u2191'}</button>}</div>
      {error && <p role="alert">{error}</p>}
      {loading ? <p role="status">Loading shelter records...</p> : <div className="dashboard-table-scroll"><table><thead><tr>{['Applicant', requestsPage ? 'Target Pet' : 'Pet Requested', 'Submitted', 'Stage', 'Actions'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>
        {visible.map(request => <tr key={request.id}><td><div className="reservation-applicant">{requestsPage && <span className="reservation-initials" aria-hidden="true">{(request.fullName || 'A').split(' ').map(word => word[0]).slice(0,2).join('')}</span>}<div><strong>{request.fullName || 'Applicant'}</strong><small>{request.email || 'Email not provided'}</small>{requestsPage && request.phone && <small>{request.phone}</small>}</div></div></td><td><div className="dashboard-pet">{request.image ? <img src={request.image} alt="" /> : <Icon name="paw" />}<div><strong>{request.title?.split(' (')[0] || 'Pet'}</strong><small>{request.title?.match(/\((.*)\)/)?.[1] || ''}</small></div></div></td><td>{new Date(request.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><Status value={request.status} /></td><td><button className="dashboard-review-button" onClick={() => setSelected(request)} aria-label={`Review request from ${request.fullName || 'applicant'}`}><Icon name="search" />Review</button></td></tr>)}
        {!visible.length && !error && <tr><td colSpan={5}>No adoption requests in this category.</td></tr>}
      </tbody></table></div>}
    </section>
    {!user && !authLoading && <p className="dashboard-preview">Preview with sample requests. Sign in with an approved shelter account to view your records.</p>}
  </main>{selected && <ShelterReservationModal request={selected} requests={data.requests} onSaved={next => setData(current => ({ ...current, requests: current.requests.map(item => item.id === next.id ? next : item) }))} onClose={() => setSelected(null)} />}</UserLayout>;
}
