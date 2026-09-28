import { useEffect, useRef, useState } from 'react';
import Icon from './UserIcon';
import './InquiryDetails.css';

function facebookUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ['https:', 'http:'].includes(url.protocol) && (url.hostname === 'facebook.com' || url.hostname.endsWith('.facebook.com')) ? url.href : null;
  } catch { return null; }
}
export default function InquiryDetails({ item, onClose }) {
  const dialog = useRef(null);
  const phoneInput = useRef(null);
  const [copyStatus, setCopyStatus] = useState('');
  const found = item.category === 'found';
  const cancelled = item.category === 'reservation';
  const facebook = facebookUrl(item.facebook);
  useEffect(() => { const element = dialog.current; const focus = document.activeElement; element.showModal(); return () => { element.close(); focus?.focus(); }; }, []);
  async function copyPhone() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(item.phone);
      else {
        phoneInput.current.focus(); phoneInput.current.select();
        if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
      }
      setCopyStatus('Phone number copied.');
    } catch { phoneInput.current.focus(); phoneInput.current.select(); setCopyStatus('Select and copy the phone number below.'); }
  }
  return <dialog ref={dialog} className={`inquiry-details${found ? ' inquiry-details-found' : ''}`} aria-labelledby="inquiry-heading" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="inquiry-header"><h2 id="inquiry-heading">{cancelled ? 'Reservation Cancelled' : found ? 'Found Pet Inquiry' : 'Lost Pet Inquiry'}</h2><button onClick={onClose} aria-label="Close inquiry"><Icon name="close" /></button></header>
    {cancelled ? <p>{item.postTitle || item.title}</p> : <>
      {found && <div className="inquiry-highlights"><div><span className="inquiry-highlight-icon"><Icon name="paw" /></span><div><small>Reported name of pet</small><strong>{item.petName || 'Not provided'}</strong></div></div><div><span className="inquiry-highlight-icon"><Icon name="pin" /></span><div><small>Last seen location</small><strong>{item.location || 'Not provided'}</strong></div></div></div>}
      <section className="inquiry-description"><h3><Icon name="comment" />{found ? 'Description' : 'Sighting Details'}</h3><blockquote>{item.description || 'No description provided.'}</blockquote>
        {!found && (item.location || item.postLocation) && <p className="inquiry-location"><Icon name="pin" />{!item.location && 'Post location: '}{item.location || item.postLocation}</p>}
      </section>
      <section className="inquiry-contacts"><h3><Icon name="profile" />{found ? 'Finder Contact Information' : 'Inquiry Information'}</h3><div className="inquiry-contact-grid">
        <div><small><Icon name="profile" />Full Name</small><strong>{item.fullName || 'Not provided'}</strong></div>
        <div><div className="inquiry-phone-heading"><small><Icon name="phone" />{found ? 'Contact Number' : 'Phone Number'}</small>{item.phone && <button onClick={copyPhone}>Copy</button>}</div>{item.phone ? <a href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}>{item.phone}</a> : <strong>Not provided</strong>}</div>
        <div><small><Icon name="comment" />{found ? 'Facebook Profile' : 'Facebook Contact'}</small>{facebook ? <a className="inquiry-facebook" href={facebook} target="_blank" rel="noopener noreferrer" title={item.facebook}>{item.facebook.replace(/^https?:\/\//i, '')}</a> : <strong>{item.facebook || 'Not provided'}</strong>}</div>
      </div></section>
      {item.phone && <input ref={phoneInput} className={copyStatus.startsWith('Select') ? 'inquiry-copy-fallback' : 'inquiry-copy-hidden'} aria-label="Phone number to copy" value={item.phone} readOnly tabIndex={-1} />}
      {copyStatus && <p className="inquiry-copy-status" role="status">{copyStatus}</p>}
      {!found && <footer className="inquiry-pet-recall"><strong>Lost Pet: {item.petName || item.postTitle?.split(' (')[0] || 'Pet'}</strong><p>{item.breed || item.postTitle?.match(/\((.*)\)/)?.[1]}</p></footer>}
    </>}
    {!item.database && <p className="inquiry-preview">Sample details for preview.</p>}
  </dialog>;
}
