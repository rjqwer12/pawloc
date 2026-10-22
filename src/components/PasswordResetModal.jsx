import { authMessage } from '../lib/authMessages';
import AppIcon from './UserIcon';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sendPasswordResetCode, verifyPasswordResetCode, updatePassword } from '../lib/auth';
import { currentUser } from '../lib/userData';
import { supabase } from '../lib/supabase';
import './LoginForm.css';
function EyeIcon({ open }) { return <AppIcon name={open ? 'eye' : 'eye-off'} />; }

function CloseIcon() { return <AppIcon name="close" />; }

function CheckBadge({ active, number }) {
  return (
    <span className={`step-badge${active ? ' step-badge--active' : ''}`} aria-hidden="true">
      {active ? <AppIcon name="check" /> : number}
    </span>
  );
}

export default function PasswordResetModal({ onClose, account = null, shelter = false }) {
  const dialog = useRef(null);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => { const element = dialog.current; const focus = document.activeElement; element.showModal(); return () => { element.close(); focus?.focus(); }; }, []);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(value => value - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(account?.email || '');
  const [otp, setOtp] = useState(Array(8).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const progressSteps = useMemo(() => ['Email', 'OTP Code', 'Password'], []);
  const passwordChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'At least one number or special character', valid: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: 'Passwords match', valid: password.length > 0 && password === confirmPassword },
  ];

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus({ type: 'error', text: 'Enter your email first.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      if (account) { const current = await currentUser(); if (current.id !== account.id) throw new Error('Your signed-in account changed. Please reopen Settings.'); }
      await sendPasswordResetCode(email);
      setCooldown(60);
      setOtp(Array(8).fill(''));
      setStatus({ type: 'success', text: 'Code sent to your email.' });
      setStep('otp');
    } catch (err) {
      setStatus({ type: 'error', text: authMessage(err) || 'Unable to send reset code.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = sanitized;
    setOtp(next);

    if (sanitized && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 8) {
      setStatus({ type: 'error', text: 'Enter the full 8-digit code.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const result = await verifyPasswordResetCode(email, code);
      if (account && result.user?.id !== account.id) throw new Error('The verification does not match your account.');
      setStep('password');
    } catch (err) {
      setStatus({ type: 'error', text: authMessage(err) || 'Incorrect or expired code.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setStatus({ type: 'error', text: 'Please complete both password fields.' });
      return;
    }

    if (!passwordChecks.every(check => check.valid)) {
      setStatus({ type: 'error', text: 'Complete all password requirements below.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      if (account) { const current = await currentUser(); if (current.id !== account.id) throw new Error('Your signed-in account changed. Please reopen Settings.'); }
      await updatePassword(password);
      setStatus({ type: 'success', text: 'Password updated successfully.' });
      setPassword(''); setConfirmPassword(''); setStep('success');
    } catch (err) {
      setStatus({ type: 'error', text: authMessage(err) || 'Unable to update password.' });
    } finally {
      setLoading(false);
    }
  };

  async function returnToLogin() {
    setLoading(true); setStatus(null);
    try { const { error } = await supabase.auth.signOut(); if (error) throw error; window.location.hash = '/'; onClose(); }
    catch(error) { setStatus({ type: 'error', text: authMessage(error) }); } finally { setLoading(false); }
  }
  const activeIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

  return (
    <dialog ref={dialog} className={`forgot-password-modal${shelter ? ' shelter-password-modal' : ''} forgot-stage-${step}`} aria-label={account ? "Update your password" : "Reset your password"} onCancel={event => { event.preventDefault(); if (!loading) onClose(); }}>
        <button type="button" className="forgot-modal-close" disabled={loading} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        {step === 'success' ? <section className="settings-password-success"><div className="settings-password-check" aria-hidden="true"><AppIcon name="check" /></div><h2>{account ? 'Password Updated Successfully' : 'Password reset successful'}</h2><p>Your password has been securely updated. You can now use your new credentials to sign in to your account.</p><p className="settings-password-confirmed"><span aria-hidden="true" className="password-confirmed-icon"><AppIcon name="check" /></span> Account updated: {email}</p>{status?.type === 'error' && <p role="alert">{status.text}</p>}<button className="forgot-primary-btn" disabled={loading} onClick={returnToLogin}>Sign in to account</button></section> : <div className="forgot-progress">
          {progressSteps.map((label, index) => {
            const isDone = index < activeIndex;
            const isActive = index === activeIndex;

            return (
              <button
                key={label}
                type="button"
                className={`forgot-step-pill${isActive ? ' forgot-step-pill--active' : ''}${isDone ? ' forgot-step-pill--done' : ''}`}
                disabled
              >
                <CheckBadge active={isDone} number={index + 1} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>}

        {step === 'email' && (
          <form className="forgot-form" onSubmit={handleEmailSubmit}>
            <div className="forgot-title-wrap">
              <small>STEP 1 OF 3 &middot; ACCOUNT IDENTIFICATION</small><h3>{account ? 'Update your password' : 'Reset your password'}</h3><p>{shelter ? 'Enter your verified organization email and we will send a time-limited code for secure account access.' : 'Enter your verified registration email and we will send a time-limited code for secure account access.'}</p>
            </div>

            <label className="forgot-field">
              <span>Email address *</span>
              <input
                type="email"
                readOnly={Boolean(account)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
              />
            </label>

            {status && <p role="alert" className={`forgot-status forgot-status--${status.type}`}>{status.text}</p>}
            <button type="submit" className="forgot-primary-btn" disabled={loading || (Boolean(account) && !account.email)}>
              {loading ? 'Sending code…' : 'Send 8-digit code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="forgot-form" onSubmit={handleOtpSubmit}>
            <div className="forgot-title-wrap">
              <small>STEP 2 OF 3 &middot; SECURITY VERIFICATION</small><h3>Enter 8-digit security code</h3><p>We sent a one-time verification code to <strong>{email}</strong>.</p>
            </div>

            <span className="forgot-otp-label">8-digit security code</span><div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  aria-label={`Code digit ${index + 1}`}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  onPaste={event => { const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8); if (digits) { event.preventDefault(); setOtp(Array.from({length: 8}, (_, i) => digits[i] || "")); } }}
                  onKeyDown={event => { if (event.key === "Backspace" && !digit && index > 0) document.getElementById(`otp-${index - 1}`)?.focus(); }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="otp-box"
                />
              ))}
            </div>

            {status ? <p className={`forgot-status forgot-status--${status.type}`}>{status.text}</p> : null}

            <button type="button" className="forgot-resend" disabled={loading || cooldown > 0} onClick={handleEmailSubmit}>{cooldown > 0 ? `Resend in ${String(Math.floor(cooldown / 60)).padStart(2, '0')}:${String(cooldown % 60).padStart(2, '0')}` : "Resend code"}</button>
            <div className="forgot-form-actions">
              <button type="button" className="forgot-secondary-btn" onClick={() => { setStep('email'); setStatus(null); }}>
                Back to email entry
              </button>
            </div>

            <button type="submit" className="forgot-primary-btn" disabled={loading}>
              Verify code &amp; reset password
            </button>
          </form>
        )}

        {step === 'password' && (
          <form className="forgot-form forgot-form--password" onSubmit={handlePasswordSubmit}>
            <div className="forgot-title-wrap">
              <h3>Create new password</h3><p>Your 8-digit security code was verified. Choose a strong, unique password to protect your account.</p>
            </div>

            <label className="forgot-field">
              <span>New password{shelter && password && <small className="password-strength-label">{passwordChecks.slice(0, 3).every(check => check.valid) ? 'Requirements met' : 'Keep improving'}</small>}</span>
              <div className="forgot-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Example1234!"
                  required
                />
                <button type="button" className="forgot-eye" aria-label={showPassword ? "Hide passwords" : "Show passwords"} onClick={() => setShowPassword((prev) => !prev)}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            <div className="password-checklist" aria-live="polite">
              {passwordChecks.map(({ label, valid }) => (
                <div key={label} className={`password-check${valid ? ' password-check--valid' : ''}`}>
                  <span className="password-check-mark">{valid ? <AppIcon name="check" /> : <AppIcon name="circle" />}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <label className="forgot-field">
              <span>Confirm new password</span>
              <div className="forgot-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Example1234!"
                  required
                />
                <button type="button" className="forgot-eye" aria-label={showPassword ? "Hide passwords" : "Show passwords"} onClick={() => setShowPassword((prev) => !prev)}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            {confirmPassword && <p className="password-match" role="status">{password === confirmPassword ? 'Passwords match' : 'Passwords do not match yet'}</p>}
            {status ? <p className={`forgot-status forgot-status--${status.type}`}>{status.text}</p> : null}

            <button type="submit" className="forgot-primary-btn" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>

            {!shelter && <button type="button" className="forgot-cancel-btn" onClick={onClose}>
              {account ? 'Cancel' : 'Cancel and return to login'}
            </button>}
          </form>
        )}
    </dialog>
  );
}

