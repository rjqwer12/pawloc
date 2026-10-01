import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './UserIcon';
import ReservationCalendar from './ReservationCalendar';
import AcceptedReservation from './AcceptedReservation';
import ReservationOutcomeReview from './ReservationOutcomeReview';
import { reviewReservation } from '../lib/userData';
import './ShelterReservationModal.css';

const reasons = ['Pet has already been adopted / Finalized with another applicant', 'Pet is on medical hold or quarantine'];
const reasonDescriptions = ['A confirmed adoption paperwork process has finalized for this animal ahead in the queue.', 'Temporary veterinary health observation holds apply before any public contact can occur.'];
const times = ['08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const dateInManila = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const scheduleLabel = value => new Date(value).toLocaleString('en-US', { timeZone: 'Asia/Manila', dateStyle: 'full', timeStyle: 'short' }) + ' (Philippine time)';

export default function ShelterReservationModal({ request, requests, onClose, onSaved }) {
  const dialog = useRef(null);
  const [entry, setEntry] = useState(request);
  const [step, setStep] = useState(['approved','accepted'].includes(request.status) ? 'approved' : request.status === 'rejected' ? 'rejected-review' : request.status === 'cancelled' ? 'cancelled-review' : 'review');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState(reasons[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; const focus = document.activeElement; element.showModal(); return () => { element.close(); focus?.focus(); }; }, []);
  const visitAt = date && time ? new Date(`${date}T${time}:00+08:00`).toISOString() : null;
  const unavailable = slot => {
    if (!date) return false;
    const stamp = new Date(`${date}T${slot}:00+08:00`).getTime();
    return stamp <= Date.now() || requests.some(item => item.id !== entry.id && item.status === 'approved' && item.visitAt && Math.abs(new Date(item.visitAt).getTime() - stamp) < 30 * 60000);
  };
  async function decide(decision) {
    if (busy) return;
    if (decision === 'approved' && (!visitAt || unavailable(time))) { setError('Choose an available future visit date and time.'); return; }
    setBusy(true); setError('');
    try {
      const next = entry.database ? await reviewReservation(entry.id, decision, visitAt, reason) : { ...entry, status: decision, reviewedAt: new Date().toISOString(), visitAt, visitSchedule: visitAt ? scheduleLabel(visitAt) : null, rejectionReason: decision === 'rejected' ? reason : null };
      setEntry(next); onSaved(next); setStep(decision);
    } catch(err) { setError(err.message); } finally { setBusy(false); }
  }
  function close() { if (!busy) onClose(); }
  const details = <section className="srm-details"><h3><Icon name="profile" />Applicant Details</h3><dl>
    <div><dt>Full Name</dt><dd>{entry.fullName || 'Not provided'}</dd></div>
    <div><dt>Shelter Name</dt><dd>{entry.shelter || 'Not provided'}</dd></div>
    <div><dt>Contact Details</dt><dd>{entry.phone || 'Phone not provided'}<br />{entry.email || 'Email not provided'}</dd></div>
    {entry.address && <div><dt>Address</dt><dd>{entry.address}</dd></div>}
    {entry.experience && <div><dt>Experience with Pets</dt><dd>{entry.experience}</dd></div>}
  </dl></section>;
  return <dialog ref={dialog} className={`srm-modal srm-${step}`} aria-labelledby="srm-title" onCancel={event => { event.preventDefault(); close(); }}>
    <button className="srm-close" disabled={busy} onClick={close} aria-label="Close reservation"><Icon name="close" /></button>
    {step === 'rejected-review' || step === 'cancelled-review' ? <ReservationOutcomeReview entry={entry} cancelled={step === 'cancelled-review'} /> : step === 'approved' ? <AcceptedReservation entry={entry} onClose={close} /> : step === 'rejected' ? <><div className="srm-rejected-icon"><Icon name="close" /></div><h2 id="srm-title">Reservation Rejected</h2><p>The reservation request has been rejected.</p><section className="srm-reason-summary"><h3>Reason for Rejection</h3><p>{entry.rejectionReason || 'No reason provided.'}</p></section><footer><button className="srm-danger" onClick={close}>Done</button></footer></> : <>
      <header><h2 id="srm-title">{step === 'approved' ? 'Reservation Confirmed!' : step === 'reject' ? 'Reject Reservation Request' : 'Reservation'}</h2><p>{step === 'approved' ? 'The adoption visit has been confirmed by the shelter.' : step === 'reject' ? 'Select a reason to include in the applicant’s reservation update.' : `Requested on ${new Date(entry.createdAt).toLocaleDateString()}`}</p></header>
      <section className="srm-pet">{step !== 'review' && step !== 'reject' && entry.image && <img src={entry.image} alt="" />}<div><h3>{entry.title?.split(' (')[0] || 'Pet reservation'}{entry.title?.match(/\((.*)\)/)?.[1] && <span className="srm-breed">{entry.title.match(/\((.*)\)/)[1]}</span>}</h3><p>{step === 'reject' ? <>Applicant: <strong>{entry.fullName || 'Not provided'}</strong>{[entry.phone, entry.address].filter(Boolean).length > 0 && <span> ({[entry.phone, entry.address].filter(Boolean).join(' / ')})</span>}</> : entry.status === 'cancelled' ? 'Reservation Cancelled' : step === 'approved' ? 'Confirmed Visit' : [entry.age, entry.gender].filter(Boolean).join(' / ')}</p></div>{step === 'reject' && <span className="srm-application-date"><Icon name="calendar" />Application Date: {new Date(entry.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}</section>
      {step === 'reject' ? <section className="srm-reasons"><h3>Reason for Rejection</h3><p className="srm-reason-help">Select a reason to include in the applicant's reservation update.</p>{reasons.map((value, index) => <label key={value}><input type="radio" name="rejection" checked={reason === value} onChange={() => setReason(value)} disabled={busy} /><span><strong>{value}</strong><small>{reasonDescriptions[index]}</small></span></label>)}</section> : <>
        {step === 'approved' && <section className="srm-schedule"><Icon name="calendar" /><strong>{entry.visitAt ? scheduleLabel(entry.visitAt) : entry.visitSchedule || 'Visit schedule not provided'}</strong><small>30-minute appointment</small></section>}
        {details}
        {step === 'review' && entry.status === 'pending' && <section className="srm-booking">
          <h3><Icon name="calendar" />Visit Schedule &amp; Appointment Slot</h3>
          <div className="srm-booking-columns">
            <ReservationCalendar value={date} min={dateInManila()} disabled={busy} onChange={value => { setDate(value); setTime(''); }} />
            <div className="srm-time-panel"><header><span>Available Time</span><strong>30 min each</strong></header><div className="srm-times">
              {times.map(slot => { const blocked = unavailable(slot); const hour = Number(slot.split(':')[0]); const label = String(hour % 12 || 12).padStart(2,'0') + ':' + slot.split(':')[1] + (hour < 12 ? ' AM' : ' PM'); return <button type="button" key={slot} disabled={!date || blocked || busy} aria-pressed={time === slot} onClick={() => setTime(slot)}><span>{time === slot && <Icon name="check" />}{label}</span>{time !== slot && <small>{!date ? 'Select date' : blocked ? 'Unavailable' : 'Available'}</small>}</button>; })}
            </div></div>
          </div>
        </section>}
        {step === 'approved' && <><section className="srm-location"><div><h3>Shelter Location</h3><p>{entry.shelterLocation || 'See the shelter listing for its location.'}</p></div>{entry.shelterId && <Link to={`/user/map?shelter=${entry.shelterId}`} onClick={onClose}>View Map</Link>}</section><section className="srm-advisory"><h3>Pre-Visit Reminders</h3><ul><li>Please bring a valid ID and your reservation confirmation.</li><li>You may bring a leash or collar if you plan to proceed with adoption.</li></ul></section></>}
      </>}
      {error && <p className="srm-error" role="alert">{error}</p>}
      <footer>{step === 'reject' ? <><button disabled={busy} onClick={() => { setStep('review'); setError(''); }}>Cancel</button><button className="srm-danger" disabled={busy} onClick={() => decide('rejected')}>{busy ? 'Saving...' : 'Reject'}</button></> : step === 'review' && entry.status === 'pending' ? <><button className="srm-reject" disabled={busy} onClick={() => { setStep('reject'); setError(''); }}>Reject Request</button><button className="srm-primary" disabled={busy || !visitAt} onClick={() => decide('approved')}>{busy ? 'Saving...' : 'Accept Request'}</button></> : <button className="srm-primary" onClick={close}>Done</button>}</footer>
    </>}
    {!entry.database && <p className="srm-preview">Preview only. Changes are not saved to the database.</p>}
  </dialog>;
}
