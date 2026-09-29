import { useEffect, useRef, useState } from 'react';
import { reservePet } from '../lib/userData';
import Icon from './UserIcon';
import './PetDetailsModal.css';

export default function PetDetailsModal({ pet, onClose }) {
  const dialog = useRef(null);
  const heading = useRef(null);
  const [step, setStep] = useState('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photoFailed, setPhotoFailed] = useState(false);
  const [draft, setDraft] = useState({ fullName: '', phone: '', address: '', experience: '' });
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const update = field => event => setDraft(current => ({ ...current, [field]: event.target.value }));

  async function reserve(event) {
    event.preventDefault();
    if (!draft.fullName.trim() || !draft.address.trim()) { setError('Please enter your full name and address.'); return; }
    const digits = draft.phone.replace(/\D/g, '');
    if (!/^[+\d\s().-]+$/.test(draft.phone) || digits.length < 7 || digits.length > 15) { setError('Please enter a valid phone number.'); return; }
    setError('');
    setBusy(true); try { if (pet.database) await reservePet(pet, draft); setStep('waiting'); } catch(error) { setError(error.message); } finally { setBusy(false); }
  }

  return (
    <dialog ref={dialog} className={`pet-details-modal pet-details-modal-${step}`} aria-labelledby="pet-details-heading" onCancel={event => { event.preventDefault(); onClose(); }}>
      <button className="pet-details-close" type="button" onClick={onClose} aria-label="Close pet details"><Icon name="close" /></button>
      {step === 'waiting' ? <section className="pet-reservation-waiting">
        <span className="pet-reservation-bell"><Icon name="bell" /></span>
        <h2 id="pet-details-heading" ref={heading} tabIndex={-1}>Waiting for Notification</h2>
        <p>{pet.database ? <>Your reservation for <strong>{pet.name}</strong> has been submitted. Track its status in your Library.</> : <>Preview only. No reservation has been sent for {pet.name}.</>}</p>
        <button className="pet-details-primary" onClick={onClose}>Back to Adoptable Pets</button>
      </section> : <>
        <header className="pet-details-header"><Icon name="paw" /><div><h2 id="pet-details-heading" ref={heading} tabIndex={-1}>{step === 'details' ? 'Pet Details' : 'Adoption Reservation'}</h2><p>{step === 'details' ? 'Detailed profile and adoption information' : <>Reserve a meet-and-greet to adopt <strong>{pet.name}</strong></>}</p></div></header>
        {step === 'details' ? <>
          <div className="pet-details-photo">{photoFailed ? <div className="pet-details-photo-fallback"><Icon name="paw" />Photo unavailable</div> : <img src={pet.image} alt={`Sample photo of ${pet.name}`} onError={() => setPhotoFailed(true)} />}<span className="pet-details-status">● {pet.status === 'Senior Gentle' ? 'Available' : pet.status}</span></div>
          <h3 className="pet-details-name">{pet.name}</h3>
          <dl className="pet-details-facts"><div><Icon name="paw" /><dt>Species</dt><dd>{pet.species || pet.type || 'Not specified'}</dd></div><div><Icon name="shelter" /><dt>Breed</dt><dd>{pet.breed}</dd></div><div><Icon name="calendar" /><dt>Age &amp; Gender</dt><dd>{pet.age} · {pet.gender}</dd></div></dl>
          <section className="pet-details-about"><h3>About {pet.name}</h3><p>{pet.description}</p></section>
          <footer className="pet-details-footer"><button className="pet-details-primary" onClick={() => setStep('reservation')}>Adopt {pet.name}</button></footer>
        </> : <form className="pet-reservation-form" onSubmit={reserve}>
          <div className="pet-reservation-row"><label>Full Name <span>*</span><input value={draft.fullName} onChange={update('fullName')} autoComplete="name" required maxLength={100} placeholder="Your full name" /></label><label>Phone Number <span>*</span><input value={draft.phone} onChange={update('phone')} type="tel" autoComplete="tel" required maxLength={24} placeholder="e.g., 09300016564" /></label></div>
          <label>Address <span>*</span><input value={draft.address} onChange={update('address')} autoComplete="street-address" required maxLength={300} placeholder="Street, barangay, city" /></label>
          <label>Experience with Pets <span className="pet-reservation-optional">(Optional)</span><textarea value={draft.experience} onChange={update('experience')} rows={4} maxLength={2000} placeholder="Tell us about your home and experience caring for pets." /></label>
          {error && <p className="pet-reservation-error" role="alert">{error}</p>}
          <div className="pet-reservation-actions"><button type="button" onClick={() => { setError(''); setStep('details'); }}>Cancel</button><button className="pet-details-primary" type="submit" disabled={busy}>Confirm Reservation</button></div>
          <p className="pet-reservation-note">{pet.database ? 'Your request will be saved for shelter review.' : 'Preview only. Sign in with a real account to reserve.'}</p>
        </form>}
      </>}
    </dialog>
  );
}
