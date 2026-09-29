import { useEffect, useRef, useState } from 'react';
import { saveProfile } from '../../lib/userData';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import PasswordResetModal from '../../components/PasswordResetModal';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { useAuth } from '../../lib/AuthContext';
import './UserSettings.css';

function SettingsForm({ user, onDelete }) {
  const [saved, setSaved] = useState(() => ({ firstName: user?.user_metadata?.first_name || 'RJ Molene', middleName: user?.user_metadata?.middle_name || '', lastName: user?.user_metadata?.last_name || '', photo: user?.user_metadata?.avatar_url || '' }));
  const [draft, setDraft] = useState(saved);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [modal, setModal] = useState(null);
  const fileInput = useRef(null);
  const reader = useRef(null);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const verified = Boolean(user?.email_confirmed_at);

  useEffect(() => () => reader.current?.abort(), []);


  function change(field) { return event => setDraft(current => ({ ...current, [field]: event.target.value })); }
  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    reader.current?.abort();
    setReading(false);
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 3 * 1024 * 1024 || !file.size) {
      setNotice('Choose a JPG or PNG image up to 3 MB.');
      event.target.value = '';
      return;
    }
    setNotice('');
    setReading(true);
    const next = new FileReader();
    reader.current = next;
    next.onload = () => { setDraft(current => ({ ...current, photo: next.result })); setReading(false); };
    next.onerror = () => { setReading(false); setNotice('Could not read that photo. Please try another.'); };
    next.readAsDataURL(file);
  }
  function discard() {
    reader.current?.abort();
    setReading(false);
    setDraft(saved);
    fileInput.current.value = '';
    setNotice('Changes discarded.');
  }
  async function save(event) {
    event.preventDefault();
    if (!draft.firstName.trim() || !draft.lastName.trim()) { setNotice('Please enter your first and last names.'); return; }
    const next = { ...draft, firstName: draft.firstName.trim(), middleName: draft.middleName.trim(), lastName: draft.lastName.trim() };
    setSaving(true); try { const result = await saveProfile(next); setSaved(result); setDraft(result); setNotice('Profile saved.'); } catch(error) { setNotice(error.message); } finally { setSaving(false); }
  }
  const security = <>
    <section className="settings-security-card"><h2><Icon name="shelter" />Security &amp; Privacy</h2><h3>Account Password</h3><p>Manage your sign-in password.</p><button type="button" onClick={() => { if (!user?.email) { setNotice('Sign in with a real account to update your password.'); return; } setModal('password'); }}>Update Password</button></section>
    <section className="settings-security-card"><h2><Icon name="delete" />Delete Account</h2><p>Permanently remove your personal account, data, and access to all shelter applications.<br />This action cannot be undone.</p><button className="settings-delete" type="button" onClick={onDelete}>Delete Account</button></section>
  </>;

  return (
    <UserLayout>
      <main className="user-settings-main">
        <h1>Account &amp; Application Settings</h1>
        <div className="settings-columns">
          <form onSubmit={save}>
            <section className="settings-profile-card">
              <header><div><h2>Personal Profile &amp; Verification Status</h2><p>Your identity helps verified animal rescues and neighbors coordinate reunification quickly.</p></div><span className="settings-verification">{verified ? '✓ Email verified' : user ? 'Email unverified' : 'Preview'}</span></header>
              <div className="settings-photo-row"><div className="settings-avatar">{draft.photo ? <img src={draft.photo} alt="Profile preview" /> : (draft.firstName[0] || 'R').toUpperCase()}</div><div><div className="settings-photo-actions"><button type="button" onClick={() => fileInput.current.click()} disabled={reading || saving}>Change Photo</button><button type="button" disabled={!draft.photo || reading} onClick={() => { setDraft(current => ({ ...current, photo: '' })); fileInput.current.value = ''; }}>Remove</button></div><p>Accepted formats: JPG, PNG. Max size 3MB.</p><input ref={fileInput} type="file" accept="image/jpeg,image/png" onChange={choosePhoto} hidden /></div></div>
              <div className="settings-fields">
                <label>Last Name<input value={draft.lastName} onChange={change('lastName')} autoComplete="family-name" maxLength={100} required /></label>
                <label>First Name<input value={draft.firstName} onChange={change('firstName')} autoComplete="given-name" maxLength={100} required /></label>
                <label>Middle Name<input value={draft.middleName} onChange={change('middleName')} autoComplete="additional-name" maxLength={100} /></label>
                <div className="settings-email"><div><span>Email Address</span>{verified && <span className="settings-verification">Verified Email</span>}</div><p>{user?.email || 'No email — demo account'}</p></div>
              </div>
            </section>
            <div className="settings-save-actions"><button type="button" onClick={discard} disabled={!dirty && !reading}>Discard Changes</button><button type="submit" disabled={!dirty || reading || saving}>{reading ? 'Reading photo…' : 'Save Changes'}</button></div>
          </form>
          <aside className="settings-security-stack">{security}</aside>
        </div>
        {notice && <p className="settings-notice" role="status">{notice}</p>}
        <p className="settings-preview-note">{user ? "Changes are saved to your account." : "Sign in with a real account to save settings."}</p>
      </main>
      {modal === 'password' && <PasswordResetModal account={user} onClose={() => setModal(null)} />}

    </UserLayout>
  );
}

export default function UserSettings() {
  const { user, loading } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  if (loading) return <UserLayout><main className="user-settings-main">Loading settings…</main></UserLayout>;
  return <><SettingsForm key={user?.id || 'demo'} user={user} onDelete={() => setShowDelete(true)} />{showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}</>;
}
