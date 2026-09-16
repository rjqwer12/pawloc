import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import pawlocLogo from '../assets/pawloc.svg';
import './Navbar.css';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shelters', to: '/shelters' },
  { label: 'Adoptable', to: '/adoptable' },
  { label: 'Reunited Stories', to: '/stories' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const isHome = pathname === '/';

  return (
    <header className="navbar">
      <Link to="/" className="logo" aria-label="PAWLOC home">
        <img src={pawlocLogo} alt="PAWLOC logo" className="logo-paw" />
      </Link>

      <nav className="nav-links" aria-label="Main navigation">
        {navLinks.map(({ label, to }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link--active' : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {isHome ? (
        <span className="nav-login-spacer" aria-hidden="true" />
      ) : user ? (
        <button type="button" className="nav-login-btn" onClick={signOut}>
          Log out
        </button>
      ) : (
        <Link to="/" className="nav-login-btn">
          Login
        </Link>
      )}
    </header>
  );
}
