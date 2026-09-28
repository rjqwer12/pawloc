import { useEffect, useRef, useState } from 'react';
import {
  completeSignup,
  sendEmailOtp,
  uploadShelterDoc,
} from '../lib/auth';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './CreateAccountModal.css';

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function getAuthErrorMessage(error) {
  if (/rate limit/i.test(error?.message || '')) {
    return 'Email sending is temporarily rate-limited. Wait a few minutes and try again, or configure a custom SMTP provider in Supabase.';
  }
  return error?.message || 'Unable to send the verification email.';
}

function PasswordField({ id, label, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <label className="modal-field">
      <span>
        {label}
        <span className="required-indicator">*</span>
      </span>
      <span className="modal-password-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          minLength={8}
        />
        <button
          type="button"
          className="modal-eye"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={show} />
        </button>
      </span>
    </label>
  );
}

function StatusMessage({ status }) {
  if (!status) return null;
  return (
    <p className={`modal-status modal-status--${status.type}`}>{status.text}</p>
  );
}

function AdopterForm({ onSuccess }) {
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    otp: '',
    password: '',
    confirm: '',
  });
  const [otpSeconds, setOtpSeconds] = useState(0);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!sent || otpSeconds <= 0) return undefined;
    const id = setInterval(() => setOtpSeconds((n) => n - 1), 1000);
    return () => clearInterval(id);
  }, [sent, otpSeconds]);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSendOtp = async () => {
    if (!form.email) {
      setStatus({ type: 'error', text: 'Enter your email first.' });
      return;
    }
    if (loading || otpSeconds > 0) return;
    setLoading(true);
    setStatus(null);
    try {
      await sendEmailOtp(form.email);
      setSent(true);
      setOtpSeconds(300);
      setStatus({ type: 'success', text: 'OTP sent. Check your email.' });
    } catch (err) {
      setStatus({ type: 'error', text: getAuthErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await completeSignup({
        email: form.email,
        token: form.otp,
        password: form.password,
        metadata: {
          role: 'adopter',
          first_name: form.firstName,
          last_name: form.lastName,
        },
        profile: {
          role: 'adopter',
          first_name: form.firstName,
          middle_name: form.middleName,
          last_name: form.lastName,
        },
      });
      onSuccess({ role: 'adopter', name: [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' '), email: form.email });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="modal-row modal-row--3">
        <label className="modal-field">
          <span>
            First name
            <span className="required-indicator">*</span>
          </span>
          <input
            type="text"
            placeholder="RJ Molene"
            value={form.firstName}
            onChange={update('firstName')}
            required
          />
        </label>
        <label className="modal-field">
          <span>
            Middle name <em>Optional</em>
          </span>
          <input
            type="text"
            placeholder="Sepida"
            value={form.middleName}
            onChange={update('middleName')}
          />
        </label>
        <label className="modal-field">
          <span>
            Last name
            <span className="required-indicator">*</span>
          </span>
          <input
            type="text"
            placeholder="Socias"
            value={form.lastName}
            onChange={update('lastName')}
            required
          />
        </label>
      </div>

      <label className="modal-field">
        <span>
          Email address
          <span className="required-indicator">*</span>
        </span>
        <span className="modal-inline">
          <input
            type="email"
            placeholder="RJMolene@example.com"
            value={form.email}
            onChange={update('email')}
            required
          />
          <button
            type="button"
            className="modal-otp-btn"
            onClick={handleSendOtp}
            disabled={loading || otpSeconds > 0}
          >
            Send OTP
          </button>
        </span>
      </label>

      <label className="modal-field">
        <span className="modal-field-row">
          <span>
            Verification OTP
            <span className="required-indicator">*</span>
          </span>
          <span className="modal-timer">
            {sent
              ? otpSeconds > 0
                ? `Resend code in ${formatTime(otpSeconds)}`
                : 'Code expired'
              : 'Send a code to continue'}
          </span>
        </span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="• • • • • •"
          maxLength={8}
          pattern="[0-9]{8}"
          value={form.otp}
          onChange={update('otp')}
          required
        />
      </label>

      <div className="modal-row">
        <PasswordField
          id="adopter-password"
          label="Password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update('password')}
        />
        <PasswordField
          id="adopter-confirm"
          label="Confirm password"
          placeholder="Re-enter password"
          value={form.confirm}
          onChange={update('confirm')}
        />
      </div>

      <label className="modal-check">
        <input type="checkbox" required />
        <span>
          I agree to the <a href="#terms">Terms of Service</a> and acknowledge
          PAWLOC’s <Link to="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</Link>
        </span>
      </label>

      <StatusMessage status={status} />

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  );
}

function ShelterForm({ onSuccess }) {
  const [form, setForm] = useState({
    shelterName: '',
    representative: '',
    address: '',
    email: '',
    otp: '',
    password: '',
    confirm: '',
  });
  const [otpSeconds, setOtpSeconds] = useState(0);
  const [sent, setSent] = useState(false);
  const [birFile, setBirFile] = useState(null);
  const [permitFile, setPermitFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const birRef = useRef(null);
  const permitRef = useRef(null);

  useEffect(() => {
    if (!sent || otpSeconds <= 0) return undefined;
    const id = setInterval(() => setOtpSeconds((n) => n - 1), 1000);
    return () => clearInterval(id);
  }, [sent, otpSeconds]);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSendOtp = async () => {
    if (!form.email) {
      setStatus({ type: 'error', text: 'Enter the organization email first.' });
      return;
    }
    if (loading || otpSeconds > 0) return;
    setLoading(true);
    setStatus(null);
    try {
      await sendEmailOtp(form.email);
      setSent(true);
      setOtpSeconds(300);
      setStatus({ type: 'success', text: 'OTP sent. Check your email.' });
    } catch (err) {
      setStatus({ type: 'error', text: getAuthErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!birFile || !permitFile) {
      setStatus({ type: 'error', text: 'Upload both your shelter image and business permit before registering.' });
      return;
    }
    if ([birFile, permitFile].some(file => !['image/png', 'image/jpeg', 'application/pdf'].includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024)) {
      setStatus({ type: 'error', text: 'Each required document must be a PNG, JPG, or PDF file up to 10 MB.' });
      return;
    }
    if (form.password !== form.confirm) {
      setStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const user = await completeSignup({
        email: form.email,
        token: form.otp,
        password: form.password,
        metadata: {
          role: 'shelter',
          shelter_name: form.shelterName,
        },
        profile: {
          role: 'shelter',
          shelter_name: form.shelterName,
          representative: form.representative,
          address: form.address,
        },
      });

      const birPath = await uploadShelterDoc(user.id, 'bir', birFile);
      const permitPath = await uploadShelterDoc(user.id, 'permit', permitFile);

      if (birPath || permitPath) {
        const { error } = await supabase.from('profiles').update({
          bir_path: birPath,
          permit_path: permitPath,
        }).eq('id', user.id);
        if (error) throw error;
      }

      onSuccess({ role: 'shelter', name: form.shelterName, owner: form.representative, email: form.email, documents: Boolean(birPath && permitPath) });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="modal-row">
        <label className="modal-field">
          <span>
            Shelter name
            <span className="required-indicator">*</span>
          </span>
          <input
            type="text"
            placeholder="Pawloc Shelter"
            value={form.shelterName}
            onChange={update('shelterName')}
            required
          />
        </label>
        <label className="modal-field">
          <span>
            Owner name
            <span className="required-indicator">*</span>
          </span>
          <input
            type="text"
            placeholder="RJ Molene S. Socias"
            value={form.representative}
            onChange={update('representative')}
            required
          />
        </label>
      </div>

      <label className="modal-field">
        <span>
          Physical shelter address
          <span className="required-indicator">*</span>
        </span>
        <input
          type="text"
          placeholder="Delgado Animal Day Care & Rescue Center, Zone 2, Santa Barbara, 5002 Iloilo"
          value={form.address}
          onChange={update('address')}
          required
        />
      </label>

      <label className="modal-field">
        <span>
          Official email
          <span className="required-indicator">*</span>
        </span>
        <span className="modal-inline">
          <input
            type="email"
            placeholder="Pawloc@gmail.com"
            value={form.email}
            onChange={update('email')}
            required
          />
          <button
            type="button"
            className="modal-otp-btn"
            onClick={handleSendOtp}
            disabled={loading || otpSeconds > 0}
          >
            Send OTP
          </button>
        </span>
      </label>

      <label className="modal-field">
        <span className="modal-field-row">
          <span>
            Verification OTP
            <span className="required-indicator">*</span>
          </span>
          <span className="modal-timer modal-timer--warn">
            {sent
              ? otpSeconds > 0
                ? `Expires in ${formatTime(otpSeconds)}`
                : 'Expired'
              : 'Send a code to continue'}
          </span>
        </span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter shelter verification code"
          maxLength={8}
          pattern="[0-9]{8}"
          value={form.otp}
          onChange={update('otp')}
          required
        />
      </label>

      <div className="modal-row">
        <PasswordField
          id="shelter-password"
          label="Password"
          placeholder="Strong shelter password"
          value={form.password}
          onChange={update('password')}
        />
        <PasswordField
          id="shelter-confirm"
          label="Confirm password"
          placeholder="Confirm password"
          value={form.confirm}
          onChange={update('confirm')}
        />
      </div>

      <fieldset className="modal-docs">
        <legend>Legal verification documents <span className="required-indicator">*</span></legend>
        <p className="modal-docs-required">Both uploads are required. PNG, JPG, or PDF up to 10 MB each.</p>
        <div className="modal-uploads">
          <button
            type="button"
            className="modal-upload"
            onClick={() => birRef.current?.click()}
          >
            <UploadIcon />
            <strong>{birFile ? birFile.name : 'Upload Shelter Image *'}</strong>
            <span>PDF, PNG, JPG up to 10MB</span>
          </button>
          <input
            ref={birRef}
            aria-label="Shelter image (required)"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            hidden
            onChange={(e) => setBirFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="modal-upload"
            onClick={() => permitRef.current?.click()}
          >
            <FileIcon />
            <strong>
              {permitFile ? permitFile.name : 'Upload Business Permit *'}
            </strong>
            <span>PDF, PNG, JPG up to 10MB</span>
          </button>
          <input
            ref={permitRef}
            aria-label="Business or Mayor permit (required)"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            hidden
            onChange={(e) => setPermitFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </fieldset>

      <label className="modal-check">
        <input type="checkbox" required />
        <span>
          I certify that this shelter is a registered organization and all
          submitted compliance documents are authentic.
        </span>
      </label>

      <StatusMessage status={status} />

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? 'Submitting…' : 'Submit Shelter Application & Register'}
      </button>
    </form>
  );
}

export default function CreateAccountModal({ onClose }) {
  const [role, setRole] = useState('adopter');
  const [success, setSuccess] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    element.showModal();
    return () => { element.close(); focus?.focus(); };
  }, []);
  useEffect(() => { if (dialog.current) dialog.current.scrollTop = 0; }, [success, role]);
  async function proceedToLogin() {
    setLeaving(true);
    setLoginError('');
    const { error } = await supabase.auth.signOut();
    if (error) { setLoginError(error.message); setLeaving(false); return; }
    onClose();
  }
  return <dialog ref={dialog} className={`modal-dialog create-account-dialog${success ? ' account-success-dialog' : ''}`} aria-labelledby="create-account-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <button type="button" className="modal-close" onClick={onClose} aria-label="Close create account">&times;</button>
    {success ? <>
      <div className="account-success-check" aria-hidden="true">&#10003;</div>
      <h2 id="create-account-title">{success.role === 'shelter' ? 'Registration Submitted!' : 'Account Created Successfully!'}</h2>
      <p className="modal-subtitle">{success.role === 'shelter' ? 'Welcome to the PAWLOC Rescue Network. Your journey to helping lost paws find their way home starts here.' : `Welcome to PawLoc, ${success.name}! Your community profile is now active. Share, connect, and help pets find their way home.`}</p>
      <dl className="account-success-summary">
        <div><dt>{success.role === 'shelter' ? 'Registered Shelter' : 'Registered Member'}</dt><dd>{success.name}{success.role === 'shelter' && success.owner ? ` (${success.owner})` : ''}</dd></div>
        <div><dt>{success.role === 'shelter' ? 'Contact Email' : 'Account Email'}</dt><dd>{success.email}</dd></div>
        <div><dt>Account Type</dt><dd>{success.role === 'shelter' ? 'Shelter Partner Application' : 'Pet Owner / Adopter'}</dd></div>
        <div><dt>Security Status</dt><dd className="account-verified">&#10003; Email Verified via OTP</dd></div>
        {success.role === 'shelter' && <div><dt>Legal Verification</dt><dd>{success.documents ? 'Documents Uploaded' : 'Not all documents uploaded'}</dd></div>}
      </dl>
      {loginError && <p role="alert" className="modal-status modal-status--error">{loginError}</p>}
      <button className="btn btn-primary btn-full" onClick={proceedToLogin} disabled={leaving}>{leaving ? 'Please wait?' : 'Proceed to Login'}</button>
    </> : <>
      <h2 id="create-account-title">Create Account</h2>
      <p className="modal-subtitle">Join the network to help lost paws find their way home.</p>
      <div className="modal-tabs" aria-label="Account type">
        <button type="button" aria-pressed={role === 'adopter'} className={`modal-tab${role === 'adopter' ? ' modal-tab--active' : ''}`} onClick={() => setRole('adopter')}><UserIcon />User</button>
        <button type="button" aria-pressed={role === 'shelter'} className={`modal-tab${role === 'shelter' ? ' modal-tab--active' : ''}`} onClick={() => setRole('shelter')}><BuildingIcon />Shelter</button>
      </div>
      <div className="modal-body">{role === 'adopter' ? <AdopterForm onSuccess={setSuccess} /> : <ShelterForm onSuccess={setSuccess} />}</div>
    </>}
  </dialog>;
}
