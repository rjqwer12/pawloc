import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Icon from './UserIcon';
import './LogoutButton.css';

function LogoutModal({ onClose }) {
  const dialog = useRef(null);
  const cancel = useRef(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    cancel.current.focus();
    return () => { element.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);

  async function confirmLogout() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await signOut();
      if (result?.error) throw result.error;
      onClose();
      navigate('/', { replace: true });
    } catch {
      setError('Unable to log out. Please try again.');
      submitting.current = false;
      setBusy(false);
    }
  }

  return createPortal(
    <dialog className="logout-modal" ref={dialog} aria-labelledby="logout-title" aria-describedby="logout-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="logout-modal-content">
        <span className="logout-modal-badge"><Icon name="logout" /></span>
        <div className="logout-modal-heading"><h2 id="logout-title">Log Out of PAWLOC</h2><p id="logout-description">Are you sure you want to sign out? You’ll return to the login page and can sign back in whenever you’re ready.</p></div>
        {error && <p className="logout-modal-error" role="alert">{error}</p>}
        <div className="logout-modal-actions"><button ref={cancel} type="button" onClick={onClose} disabled={busy}>Cancel</button><button type="button" className="logout-modal-confirm" onClick={confirmLogout} disabled={busy}>{busy ? 'Logging out…' : 'Log Out'}</button></div>
      </div>
    </dialog>, document.body,
  );
}

export default function LogoutButton({ children = 'Log out', ...props }) {
  const [open, setOpen] = useState(false);
  return <><button {...props} type="button" onClick={() => setOpen(true)}>{children}</button>{open && <LogoutModal onClose={() => setOpen(false)} />}</>;
}
