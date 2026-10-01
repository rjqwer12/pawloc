import { useEffect, useRef, useState } from 'react';
import { listRecords } from '../lib/userData';
import Icon from './UserIcon';

export default function MarkAdoptedModal({ pet, preview, onConfirm, onClose }) {
  const dialog = useRef(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState(false);
  const [requests,setRequests] = useState([]);
  const [selected,setSelected] = useState('');
  const [loading,setLoading] = useState(!preview);
  const [loadFailed,setLoadFailed] = useState(false);
  useEffect(() => {
    const element = dialog.current; const focus = document.activeElement; let active = true; element.showModal();
    if (!preview) listRecords('reservation').then(rows => {
      if (!active) return;
      const approved = rows.filter(row => (row.petId === pet.id || row.parentId === pet.id) && row.recipientId === pet.ownerId && row.status === 'approved');
      setRequests(approved); setSelected(approved[0]?.id || '');
    }).catch(err => { if (active) { setError(err.message); setLoadFailed(true); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; element.close(); focus?.focus(); };
  }, [pet.id,pet.ownerId,preview]);
  const applicant = requests.find(row => row.id === selected);
  return <dialog ref={dialog} className={`shelter-pet-editor mark-adopted-modal${success ? ' adoption-post-success' : ''}`} aria-labelledby="adopt-confirm-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    {success ? <section className="adoption-success-content"><span className="adoption-success-icon"><Icon name="check" /></span><h2 id="adopt-confirm-title">Pet Marked as Adopted!</h2><p>{preview ? 'Preview updated. This change has not been saved to the database.' : 'This pet has been successfully marked as adopted. The post has been updated to show that the pet is no longer available.'}</p><button className="shelter-pet-primary" onClick={onClose}>Done</button></section> : <>
      <header><div><h2 id="adopt-confirm-title">Mark as Adopted</h2><p>Finalize {pet.name}'s adoption record and update shelter inventory.</p></div><button disabled={busy} onClick={onClose} aria-label="Close adoption confirmation"><Icon name="close" /></button></header>
      <section className="mark-adopted-pet"><img src={pet.image} alt={pet.name} /><div><h3>{pet.name}<span>{pet.species || pet.type}</span></h3><p>{pet.breed} &bull; {pet.age}</p></div></section>
      {loading && <p role="status">Loading approved applicant details...</p>}
      {requests.length > 1 && <label>Confirm adopter<select value={selected} disabled={busy} onChange={event => setSelected(event.target.value)}>{requests.map(request => <option key={request.id} value={request.id}>{request.fullName || 'Applicant'}</option>)}</select></label>}
      <dl className="mark-adopted-details"><div><dt>Confirm Adopter</dt><dd>{applicant?.fullName || 'No approved applicant recorded'}{applicant && <small>Approved Applicant</small>}</dd></div><div><dt>Contact Number</dt><dd>{applicant?.phone || 'Not provided'}</dd></div><div><dt>Shelter Name</dt><dd>{pet.shelter || 'Not provided'}</dd></div><div><dt>Visit Schedule</dt><dd>{applicant?.visitSchedule || (applicant?.visitAt ? new Date(applicant.visitAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : 'Not scheduled')}</dd></div></dl>
      {error && <p role="alert">{error}</p>}{preview && <p className="mark-adopted-preview">Preview only. No real adoption record will be changed.</p>}
      <footer><button disabled={busy} onClick={onClose}>Cancel</button><button className="shelter-pet-primary" disabled={busy || loading || loadFailed} onClick={async () => { setBusy(true); setError(''); try { await onConfirm(applicant); setSuccess(true); } catch(err) { setError(err.message); } finally { setBusy(false); } }}>{busy ? 'Saving...' : 'Mark As Adopted'}</button></footer>
    </>}
  </dialog>;
}
