import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAccountModal from './CreateAccountModal';
import {
  signIn,
  sendPasswordResetCode,
  updatePassword,
  verifyPasswordResetCode,
  getUserRole,
  EMAIL_OTP_LENGTH,
  getAuthErrorMessage,
} from '../lib/auth';
import { useAuth } from '../lib/AuthContext';
import './LoginForm.css';

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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckBadge({ active }) {
  return (
    <span className={`step-badge${active ? ' step-badge--active' : ''}`} aria-hidden="true">
      {active ? '✓' : ''}
    </span>
  );
}

function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(EMAIL_OTP_LENGTH).fill(''));
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
      await sendPasswordResetCode(email);
      setStatus({ type: 'success', text: 'Code sent to your email.' });
      setStep('otp');
    } catch (err) {
      setStatus({ type: 'error', text: getAuthErrorMessage(err, 'Unable to send reset code. Please try again.') });
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
    if (code.length !== EMAIL_OTP_LENGTH) {
      setStatus({ type: 'error', text: `Enter the full ${EMAIL_OTP_LENGTH}-digit code.` });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      await verifyPasswordResetCode(email, code);
      setStep('password');
    } catch (err) {
      setStatus({ type: 'error', text: getAuthErrorMessage(err, 'Invalid or expired code.') });
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

    if (password.length < 8) {
      setStatus({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      await updatePassword(password);
      setStatus({ type: 'success', text: 'Password updated successfully.' });
      setTimeout(onClose, 800);
    } catch (err) {
      setStatus({ type: 'error', text: getAuthErrorMessage(err, 'Unable to update password. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const activeIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="forgot-modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className="forgot-modal-header">
          <div className="forgot-icon-wrap">
            <LockIcon />
          </div>
        </div>

        <div className="forgot-progress">
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
                <CheckBadge active={isDone} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {step === 'email' && (
          <form className="forgot-form" onSubmit={handleEmailSubmit}>
            <div className="forgot-title-wrap">
              <h3>Reset your password</h3>
            </div>

            <label className="forgot-field">
              <span>Email address *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
              />
            </label>

            <button type="submit" className="forgot-primary-btn" disabled={loading}>
              {loading ? 'Sending code…' : 'Send 8-digit code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="forgot-form" onSubmit={handleOtpSubmit}>
            <div className="forgot-title-wrap">
              <h3>Enter 8-digit security code</h3>
            </div>

            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
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

            <div className="forgot-form-actions">
              <button type="button" className="forgot-secondary-btn" onClick={() => setStep('email')}>
                Back to email entry
              </button>
            </div>

            <button type="submit" className="forgot-primary-btn">
              Verify code &amp; reset password
            </button>
          </form>
        )}

        {step === 'password' && (
          <form className="forgot-form forgot-form--password" onSubmit={handlePasswordSubmit}>
            <div className="forgot-title-wrap">
              <h3><span className="forgot-title-icon"><LockIcon /></span>Create new password</h3>
            </div>

            <label className="forgot-field">
              <span>New password</span>
              <div className="forgot-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Example1234!"
                  required
                />
                <button type="button" className="forgot-eye" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            <div className="password-checklist" aria-live="polite">
              {passwordChecks.map(({ label, valid }) => (
                <div key={label} className={`password-check${valid ? ' password-check--valid' : ''}`}>
                  <span className="password-check-mark">{valid ? '✓' : '○'}</span>
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
              </div>
            </label>

            {status ? <p className={`forgot-status forgot-status--${status.type}`}>{status.text}</p> : null}

            <button type="submit" className="forgot-primary-btn" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset password & log in'}
            </button>

            <button type="button" className="forgot-cancel-btn" onClick={onClose}>
              Cancel and return to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setStatus({ type: 'error', text: 'Please agree to the Terms of Service.' });
      return;
    }
    setLoading(true);
    setIsRedirecting(true);
    setStatus(null);
    try {
      const { user: signedInUser } = await signIn(email, password);
      const role = await getUserRole(signedInUser);
      const destination = role === 'shelter'
        ? '/shelter-dashboard'
        : role === 'admin'
          ? '/admin-dashboard'
          : '/user-home';
      navigate(destination);
    } catch (err) {
      setIsRedirecting(false);
      setStatus({ type: 'error', text: getAuthErrorMessage(err, 'Unable to sign in. Check your credentials and try again.') });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  if (user && !showForgotPassword && !isRedirecting) return null;

  return (
    <section className="login-section" aria-labelledby="login-heading">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 id="login-heading" className="login-title">
          Login
        </h2>

        <div className="form-group">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group password-group">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>I agree to pawloc&apos;s Terms of Service.</span>
          </label>
          <a href="#forgot-password" className="forgot-link" onClick={handleForgotPasswordClick}>
            Forgot password?
          </a>
        </div>

        {status ? (
          <p className={`login-status login-status--${status.type}`}>{status.text}</p>
        ) : null}

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </button>

        <button
          type="button"
          className="btn btn-outline btn-full"
          onClick={() => setShowCreateAccount(true)}
        >
          Create new account
        </button>
      </form>
      {showCreateAccount ? (
        <CreateAccountModal onClose={() => setShowCreateAccount(false)} />
      ) : null}
      {showForgotPassword ? (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      ) : null}
    </section>
  );
}
