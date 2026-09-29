import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteAccount } from '../lib/userData';
import Icon from './UserIcon';
import './DeleteAccountModal.css';

export default function DeleteAccountModal({ onClose }) {
  const dialog = useRef(null);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => { element.close(); previousFocus?.focus(); };
  }, []);
  function close() {
    if (busy) return;
    if (success) navigate('/');
    onClose();
  }
  async function confirm() {
    if (busy) return;
    setBusy(true); setError('');
    try { await deleteAccount(); setSuccess(true); }
    catch (err) { setError(err.message || 'Unable to delete your account. Please try again.'); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="delete-account-modal" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" onCancel={event => { event.preventDefault(); close(); }}>
    <div className={`delete-account-badge${success ? ' is-success' : ''}`} aria-hidden="true">{success ? '\u2713' : <Icon name="delete" />}</div>
    <h2 id="delete-account-title">{success ? 'Account Deleted Successfully' : 'Delete Account'}</h2>
    {!success && <h3>Are you sure you want to delete this account?</h3>}
    <p id="delete-account-description">{success ? "Your account and all associated personal data have been permanently removed. We're sorry to see you go." : 'This action cannot be undone. Once deleted, this account will be permanently removed.'}</p>
    {error && <p className="delete-account-error" role="alert">{error}</p>}
    {success ? <button className="delete-account-return" onClick={close}>Return to Sign In</button> : <div className="delete-account-actions">
      <button onClick={close} disabled={busy} autoFocus>Cancel</button>
      <button className="delete-account-confirm" onClick={confirm} disabled={busy}>{busy ? 'Deleting...' : 'Delete Account'}</button>
    </div>}
  </dialog>;
}
