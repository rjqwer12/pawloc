import { useEffect, useRef, useState } from 'react';
import Icon from './UserIcon';
import './ShelterHoursModal.css';

export default function ShelterHoursModal({ hours, onSave, onClose }) {
  const dialog = useRef(null);
  const [rows, setRows] = useState(() => hours.map(row => ({ ...row })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  const update = (index, patch) => setRows(current => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (rows.some(row => row.status !== 'Closed' && (!row.open || !row.close || row.open >= row.close))) {
      setError('Closing time must be later than opening time.');
      return;
    }
    setBusy(true); setError('');
    try {
      const message = await onSave(rows);
      if (message) setError(message);
      else onClose();
    } catch (err) { setError(err.message || 'Unable to save schedule. Please try again.'); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="shelter-hours-modal" aria-labelledby="shelter-hours-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><h2 id="shelter-hours-title">Edit Operating Hours</h2><button type="button" aria-label="Close operating hours" disabled={busy} onClick={onClose}><Icon name="close" /></button></header>
    <form onSubmit={submit}>
      <div className="shelter-hours-modal-body">
        {rows.map((row, index) => <section className="shelter-hours-day" key={row.label} aria-label={row.label}>
          <div className="shelter-hours-day-heading">
            <label><input type="checkbox" checked={row.status !== 'Closed'} disabled={busy} onChange={event => update(index, { status: event.target.checked ? row.previousStatus || 'Open' : 'Closed', previousStatus: row.status === 'Closed' ? row.previousStatus : row.status })} /><span className="shelter-hours-checkbox" aria-hidden="true">{row.status !== 'Closed' && <Icon name="check" />}</span>{row.label}</label>
            {row.status === 'Closed' ? <span className="shelter-hours-closed">Closed</span> : <select className={row.status === 'Limited' ? 'is-limited' : ''} aria-label={`${row.label} availability`} value={row.status} disabled={busy} onChange={event => update(index, { status: event.target.value })}><option>Open</option><option>Limited</option></select>}
          </div>
          <div className="shelter-hours-times"><input aria-label={`${row.label} opening time`} type="time" required value={row.open} disabled={busy || row.status === 'Closed'} onChange={event => update(index, { open: event.target.value })} /><input aria-label={`${row.label} closing time`} type="time" required value={row.close} disabled={busy || row.status === 'Closed'} onChange={event => update(index, { close: event.target.value })} /></div>
        </section>)}
        {error && <p role="alert">{error}</p>}
      </div>
      <footer><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save Schedule'}</button></footer>
    </form>
  </dialog>;
}
