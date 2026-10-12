import AppIcon from './UserIcon';
import PasswordResetModal from './PasswordResetModal';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShelterPendingModal from './ShelterPendingModal';
import CreateAccountModal from './CreateAccountModal';
import {
  signIn,
  getShelterApproval,
} from '../lib/auth';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import './LoginForm.css';

function EyeIcon({ open }) { return <AppIcon name={open ? 'eye' : 'eye-off'} />; }

export default function LoginForm() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
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
    if (account.app_metadata?.role === 'admin') { navigate('/admin/dashboard'); return; }
    let pending;
    try { pending = await getShelterApproval(account); }
    catch (error) { await signOut(); throw error; }
    if (pending) {
      const result = await signOut();
      if (result?.error) throw result.error;
      setPendingShelter(pending);
      return;
    }
    navigate(account.user_metadata?.role === 'shelter' ? '/shelter/home' : '/user/home');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setStatus({ type: 'error', text: 'Please agree to the Terms of Service.' });
      return;
    }
    if (import.meta.env.DEV && email.trim() === 'shelter') {
      if (password !== 'shelter') {
        setStatus({ type: 'error', text: 'The shelter preview password is shelter.' });
        return;
      }
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) { setStatus({ type: 'error', text: error.message }); return; }
      navigate('/shelter/home');
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
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) { setStatus({ type: 'error', text: error.message }); return; }
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
            type={import.meta.env.DEV && ['test', 'shelter-test', 'shelter'].includes(email.trim()) ? 'text' : 'email'}
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
            <span>I agree to pawloc&apos;s <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</Link>.</span>
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
