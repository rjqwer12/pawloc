import PasswordResetModal from './PasswordResetModal';
import LogoutButton from './LogoutButton';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShelterPendingModal from './ShelterPendingModal';
import CreateAccountModal from './CreateAccountModal';
import {
  signIn,
  getShelterApproval,
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

export default function LoginForm() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [pendingShelter, setPendingShelter] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  async function continueAccount(account) {
    let pending;
    try { pending = await getShelterApproval(account); }
    catch (error) { await signOut(); throw error; }
    if (pending) {
      const result = await signOut();
      if (result?.error) throw result.error;
      setPendingShelter(pending);
      return;
    }
    navigate(account.user_metadata?.role === 'adopter' ? '/user/home' : '/adoptable');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setStatus({ type: 'error', text: 'Please agree to the Terms of Service.' });
      return;
    }
    if (import.meta.env.DEV && email.trim() === 'shelter-test') {
      if (password !== 'test') { setStatus({ type: 'error', text: 'The preview password is test.' }); return; }
      setPendingShelter({ status: 'pending', name: 'Pawloc Shelter (Preview)', owner: 'RJ Molene S. Socias', email: 'shelter-test@example.com' });
      return;
    }
    // Local UI preview only; this does not create a Supabase session.
    if (import.meta.env.DEV && email.trim() === 'test') {
      if (password !== 'test') {
        setStatus({ type: 'error', text: 'The preview password is test.' });
        return;
      }
      navigate('/user/home');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const { user: signedInUser } = await signIn(email, password);
      await continueAccount(signedInUser);
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  if (user && !showForgotPassword && !showCreateAccount) {
    const name =
      user.user_metadata?.first_name ||
      user.user_metadata?.shelter_name ||
      user.email;

    return (
      <section className="login-section">
        <div className="login-form">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-status login-status--success">Signed in as {name}</p>
          <button type="button" className="btn btn-primary btn-full" disabled={loading} onClick={async () => { setLoading(true); try { await continueAccount(user); } catch (error) { setStatus({ type: 'error', text: error.message }); } finally { setLoading(false); } }}>
            Continue
          </button>
          {status && <p role="alert" className="login-status">{status.text}</p>}
          <LogoutButton className="btn btn-outline btn-full">Log out</LogoutButton>
        </div>
      </section>
    );
  }

  return (
    <section className="login-section" aria-labelledby="login-heading">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 id="login-heading" className="login-title">
          Login
        </h2>

        <div className="form-group">
          <label htmlFor="email" className="sr-only">
            {import.meta.env.DEV ? 'Email address or test username' : 'Email address'}
          </label>
          <input
            id="email"
            type={import.meta.env.DEV && ['test', 'shelter-test'].includes(email.trim()) ? 'text' : 'email'}
            placeholder={import.meta.env.DEV ? 'Email address or test' : 'Email address'}
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
      {pendingShelter && <ShelterPendingModal account={pendingShelter} onClose={() => setPendingShelter(null)} />}
      {showCreateAccount ? (
        <CreateAccountModal onClose={() => setShowCreateAccount(false)} />
      ) : null}
      {showForgotPassword ? (
        <PasswordResetModal onClose={() => setShowForgotPassword(false)} />
      ) : null}
    </section>
  );
}
