import { useEffect, useRef, useState } from 'react';
import { saveRecord } from '../lib/userData';
import Icon from './UserIcon';
import './ReportPostModal.css';

const reasons = [
  ['category', 'Wrong Category', 'Posted under the wrong pet status or type.', 'paw'],
  ['privacy', 'Privacy Concern', 'Contains personal sensitive info, phone numbers, or private address without consent.', 'shelter'],
  ['spam', 'Spam or Duplicate Post', 'Repeated identical listings or promotional spam.', 'comment'],
  ['content', 'Inappropriate Content', 'Graphic, offensive, or unrelated imagery or language.', 'warning'],
  ['fake', 'Fake Lost/Found Pet Report', 'Fabricated animal sighting, false lost claims, or stolen images.', 'flag'],
  ['scam', 'Scam or Suspicious Activity', 'Ransom demands, fake reward extortion, or suspicious financial links.', 'warning'],
];

export default function ReportPostModal({ post, onClose }) {
  const dialog = useRef(null);
  const heading = useRef(null);
  const [reason, setReason] = useState('category');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  useEffect(() => { if (sent) heading.current?.focus(); }, [sent]);

  return (
    <dialog ref={dialog} className={`report-post-modal${sent ? ' report-post-modal-success' : ''}`} aria-labelledby="report-post-title" onCancel={event => { event.preventDefault(); onClose(); }}>
      <button className="report-post-close" onClick={onClose} aria-label="Close report"><Icon name="close" /></button>
      {sent ? <section className="report-post-success">
        <span className="report-post-check" aria-hidden="true">✓</span>
        <h2 ref={heading} tabIndex={-1} id="report-post-title">Report Submitted Successfully</h2>
        <p>Report for <strong>{post.title}</strong>: <strong>{reasons.find(item => item[0] === reason)[1]}</strong>.</p>
        <p>{post.database ? 'Your report has been saved for administrator review.' : 'Preview only. This report has not been submitted.'}</p>
        <button className="report-post-primary" onClick={onClose}>Done</button>
      </section> : <>
        <header className="report-post-header"><span className="report-post-icon"><Icon name="flag" /></span><div><h2 id="report-post-title">Report Post</h2><p>Help us keep PawLoc safe, accurate, and trustworthy for urgent animal rescues. Let us know what is wrong with this post.</p></div></header>
        <form onSubmit={async event => { event.preventDefault(); setBusy(true); try { if (post.database) await saveRecord('report', { postId: post.id, reason }, null, null, post.id); setSent(true); } catch(error) { setError(error.message); } finally { setBusy(false); } }}>
          <fieldset><legend>Reason for Reporting <span>*</span></legend><p className="report-post-hint">Select one option</p>
            <div className="report-post-options">{reasons.map(([value, label, description, icon], index) => <label className={`report-post-option${reason === value ? ' report-post-option-selected' : ''}`} key={value}><input type="radio" name="reportReason" value={value} checked={reason === value} onChange={() => setReason(value)} required /><span><strong>{label}</strong><small>{description}</small></span><Icon name={icon} className={index > 2 ? 'report-post-danger-icon' : ''} /></label>)}</div>
          </fieldset>
          {error && <p role="alert">{error}</p>}<div className="report-post-actions"><button type="button" onClick={onClose}>Cancel</button><button className="report-post-primary" type="submit" disabled={busy}>Report</button></div>
        </form>
      </>}
    </dialog>
  );
}
