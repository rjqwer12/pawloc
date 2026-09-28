import { useEffect, useRef, useState } from 'react';
import { saveProfile, currentUser, deleteAccount } from '../../lib/userData';
import { supabase } from '../../lib/supabase';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { useAuth } from '../../lib/AuthContext';
import './UserSettings.css';

function SettingsForm({ user }) {
  const [saved, setSaved] = useState(() => ({ firstName: user?.user_metadata?.first_name || 'RJ Molene', middleName: user?.user_metadata?.middle_name || '', lastName: user?.user_metadata?.last_name || '', photo: user?.user_metadata?.avatar_url || '' }));
  const [draft, setDraft] = useState(saved);
  const [tab, setTab] = useState('profile');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [modal, setModal] = useState(null);
  const fileInput = useRef(null);
  const reader = useRef(null);
  const dialog = useRef(null);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const verified = Boolean(user?.email_confirmed_at);

  useEffect(() => () => reader.current?.abort(), []);
  useEffect(() => {
    if (!modal) return;
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, [modal]);

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
  async function previewPassword(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get('password').length < 8) { setPasswordError('Use at least 8 characters.'); return; }
    if (data.get('password') !== data.get('confirm')) { setPasswordError('Passwords do not match.'); return; }
    setSaving(true); try { await currentUser(); const { error } = await supabase.auth.updateUser({ password: data.get('password') }); if (error) throw error; setModal(null); setNotice('Password updated.'); } catch(error) { setPasswordError(error.message); } finally { setSaving(false); }
  }

  const security = <>
    <section className="settings-security-card"><h2><Icon name="shelter" />Security &amp; Privacy</h2><h3>Account Password</h3><p>Manage your sign-in password.</p><button type="button" onClick={() => { setPasswordError(''); setModal('password'); }}>Update Password</button></section>
    <section className="settings-security-card"><h2><Icon name="delete" />Delete Account</h2><p>Permanently remove your personal account, data, and access to all shelter applications.<br />This action cannot be undone.</p><button className="settings-delete" type="button" onClick={() => setModal('delete')}>Delete Account</button></section>
  </>;

  return (
    <UserLayout>
      <main className="user-settings-main">
        <h1>Account &amp; Application Settings</h1>
        <div className="settings-tabs" role="tablist" aria-label="Settings sections">
          <button id="profile-tab" role="tab" aria-selected={tab === 'profile'} aria-controls="profile-panel" onClick={() => setTab('profile')}><Icon name="profile" />Profile &amp; Contact</button>
          <button id="security-tab" role="tab" aria-selected={tab === 'security'} aria-controls="security-panel" onClick={() => setTab('security')}><Icon name="shelter" />Privacy &amp; Security</button>
        </div>
        <div className="settings-columns" hidden={tab !== 'profile'} id="profile-panel" role="tabpanel" aria-labelledby="profile-tab">
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
        {tab === 'security' && <div id="security-panel" role="tabpanel" aria-labelledby="security-tab" className="settings-security-panel">{security}</div>}
        {notice && <p className="settings-notice" role="status">{notice}</p>}
        <p className="settings-preview-note">{user ? "Changes are saved to your account." : "Sign in with a real account to save settings."}</p>
      </main>
      {modal && <dialog ref={dialog} className="settings-dialog" aria-labelledby="settings-dialog-title" onCancel={event => { event.preventDefault(); setModal(null); }}>
        <h2 id="settings-dialog-title">{modal === 'password' ? 'Update Password' : 'Delete Account'}</h2>
        {modal === 'password' ? <form onSubmit={previewPassword}><p>Choose a new password for your account.</p><label>New password<input name="password" type="password" autoComplete="new-password" required minLength={8} /></label><label>Confirm password<input name="confirm" type="password" autoComplete="new-password" required minLength={8} /></label>{passwordError && <p role="alert">{passwordError}</p>}<div><button type="button" onClick={() => setModal(null)}>Cancel</button><button type="submit" disabled={saving}>Update password</button></div></form> : <><p>Permanently delete your account and your database records? This cannot be undone.</p>{passwordError && <p role="alert">{passwordError}</p>}<button disabled={saving} onClick={async () => { setSaving(true); try { await deleteAccount(); window.location.hash = '/'; } catch(error) { setPasswordError(error.message); } finally { setSaving(false); } }}>Permanently Delete Account</button><button type="button" onClick={() => setModal(null)}>Cancel</button></>}
      </dialog>}
    </UserLayout>
  );
}

export default function UserSettings() {
  const { user, loading } = useAuth();
  if (loading) return <UserLayout><main className="user-settings-main">Loading settings…</main></UserLayout>;
  return <SettingsForm key={user?.id || 'demo'} user={user} />;
}
