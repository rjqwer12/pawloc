import { useEffect, useRef } from 'react';
import './ShelterPendingModal.css';

export default function ShelterPendingModal({ account, onClose }) {
  const dialog = useRef(null);
  const rejected = account.status === 'rejected';
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    element.showModal();
    return () => { element.close(); focus?.focus(); };
  }, []);
  return <dialog ref={dialog} className="shelter-pending-modal" aria-labelledby="shelter-pending-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <button className="shelter-pending-close" onClick={onClose} aria-label="Close pending confirmation">&times;</button>
    <div className="shelter-pending-clock" aria-hidden="true">&#9719;</div>
    <h2 id="shelter-pending-title">{rejected ? 'Registration Not Approved' : 'Registration Pending Confirmation'}</h2>
    <p>{rejected ? 'Your shelter application has not been approved. Please contact support for more information.' : 'Your registration has already been submitted and is currently being reviewed by our verification team.'}</p>
    <section className="shelter-pending-summary">
      <header><strong>{rejected ? 'APPLICATION UPDATE' : 'APPLICATION IN REVIEW'}</strong><span>{rejected ? 'Not Approved' : 'Pending Approval'}</span></header>
      <dl><div><dt>Registered Entity</dt><dd>{account.name}{account.owner ? ` (${account.owner})` : ''}</dd></div><div><dt>Registered Email</dt><dd>{account.email}</dd></div></dl>
    </section>
    <button className="shelter-pending-login" onClick={onClose}>Go back to Login</button>
  </dialog>;
}
