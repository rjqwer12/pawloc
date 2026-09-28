import { useEffect, useRef, useState } from 'react';
import { saveRecord } from '../lib/userData';
import Icon from './UserIcon';
import './ContactPetModal.css';

export default function ContactPetModal({ post, onClose }) {
  const dialog = useRef(null);
  const successHeading = useRef(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const isFound = post.category === 'found';
  const petName = post.petName || post.title.split(' (')[0];

  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  useEffect(() => { if (sent) successHeading.current?.focus(); }, [sent]);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = isFound ? ['fullName', 'phone', 'facebook', 'petName', 'location', 'description'] : ['fullName', 'phone', 'facebook', 'description'];
    if (fields.some(field => !data.get(field)?.trim())) {
      setError('Please complete every required field.');
      return;
    }
    const phone = data.get('phone').trim();
    if (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) {
      setError('Please enter a valid contact number.');
      return;
    }
    try {
      const value = data.get('facebook').trim();
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      if (!['http:', 'https:'].includes(url.protocol) || !(url.hostname === 'facebook.com' || url.hostname.endsWith('.facebook.com')) || url.pathname === '/') throw new Error();
    } catch {
      setError('Please enter a Facebook profile link, such as facebook.com/yourname.');
      return;
    }
    setBusy(true);
    try { if (post.database) await saveRecord('contact', { ...Object.fromEntries(data), postId: post.id, postTitle: post.title }, null, post.ownerId, post.id); setSent(true); } catch(error) { setError(error.message); } finally { setBusy(false); }
  }

  return (
    <dialog ref={dialog} className={`contact-pet-modal${sent ? ' contact-pet-modal-sent' : ''}`} aria-labelledby="contact-pet-title" onCancel={event => { event.preventDefault(); onClose(); }}>
      {sent ? <div className="contact-pet-success">
        <button className="contact-pet-close" type="button" onClick={onClose} aria-label="Close contact confirmation"><Icon name="close" /></button>
        <span className="contact-pet-check" aria-hidden="true">✓</span>
        <h2 id="contact-pet-title" ref={successHeading} tabIndex={-1}>Information Sent</h2>
        <p>{post.database ? 'Your details have been saved to the post owner’s inbox.' : 'Preview only. Your details have not been sent.'}</p>
        <button className="contact-pet-send" type="button" onClick={onClose}>Done</button>
      </div> : <>
        <header className="contact-pet-header"><h2 id="contact-pet-title">Contact Pet {isFound ? 'Finder' : 'Owner'}</h2><span className={`contact-pet-tag${isFound ? ' contact-pet-tag-found' : ''}`}><Icon name="warning" />{isFound ? 'Found Pet' : 'Lost Pet'}</span><button type="button" className="contact-pet-close" onClick={onClose} aria-label="Close contact form"><Icon name="close" /></button></header>
        <form onSubmit={submit}>
          <div className="contact-pet-fields">
            <div className="contact-pet-row">
              <label>Full Name <span>*</span><input name="fullName" autoComplete="name" placeholder="e.g., Kez Nabajo" required maxLength={100} /></label>
              <label>Contact Number <span>*</span><input name="phone" type="tel" autoComplete="tel" placeholder="e.g., +63 9XX XXX XXXX" required maxLength={24} /></label>
            </div>
            <div className={isFound ? 'contact-pet-row' : ''}>
              <label>{isFound ? 'Facebook Profile / Link' : 'Facebook'} <span>*</span><input name="facebook" placeholder="e.g., facebook.com/KezNabajo" required maxLength={300} /></label>
              {isFound && <label>Name of the Pet <span>*</span><input name="petName" placeholder="e.g., Barbilat" required maxLength={100} /></label>}
            </div>
            {isFound && <label>Last Seen Location <span>*</span><input name="location" placeholder="e.g., Rob Pavia, Iloilo" required maxLength={250} /></label>}
            <label>{isFound ? 'Description of the Pet' : `Have you spotted ${petName}? (Location & Details)`} <span>*</span><textarea name="description" rows={3} required maxLength={2000} placeholder={isFound ? 'Distinct collar tags, markings, coat color, size, temperament, or answers to finder questions...' : 'Where and when did you spot the pet? Include nearby landmarks, appearance, and direction of travel.'} /></label>
            {error && <p className="contact-pet-error" role="alert">{error}</p>}
          </div>
          <footer className="contact-pet-actions"><button type="button" onClick={onClose}>Cancel</button><button className="contact-pet-send" type="submit" disabled={busy}>Send</button></footer>
        </form>
      </>}
    </dialog>
  );
}
