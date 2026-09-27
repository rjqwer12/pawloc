import LogoutButton from './LogoutButton';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import logo from '../assets/pawloc.svg';
import Icon from './UserIcon';
import '../pages/user/UserHome.css';

export default function UserLayout({ children }) {
  const { user } = useAuth();


  const name = user?.user_metadata?.first_name || 'RJ';
  const activeClass = ({ isActive }) => isActive ? 'user-nav-active' : '';

  return (
    <div className="user-home">
      <header className="user-topbar">
        <Link to="/user/home" aria-label="Pawloc home"><img src={logo} alt="PAWLOC" className="user-logo" /></Link>
        <div className="user-topbar-account">
          <button disabled title="Notifications are not available yet" aria-label="Notifications"><Icon name="bell" /><span className="user-notification-dot" /></button>
          <span className="user-avatar">{name.slice(0, 2).toUpperCase()}</span><span>{name}</span>
        </div>
      </header>
      <aside className="user-sidebar">
        <nav aria-label="User navigation">
          <NavLink className={activeClass} to="/user/home" title="Home"><Icon name="home" />Home</NavLink>
          <NavLink className={activeClass} to="/user/map" title="Map"><Icon name="map" />Map</NavLink>
          <NavLink className={activeClass} to="/user/shelters" title="Shelter"><Icon name="heart" />Shelter</NavLink>
          <NavLink className={activeClass} to="/user/adoptable" title="Adoptable Pets"><Icon name="paw" />Adoptable Pets</NavLink>
          <NavLink className={activeClass} to="/user/library" title="Library"><Icon name="library" />Library</NavLink>
        </nav>
        <div className="user-sidebar-bottom">
          <NavLink className={activeClass} to="/user/settings" title="Settings"><Icon name="settings" />Settings</NavLink>
          <LogoutButton title="Log out"><Icon name="logout" />Log out</LogoutButton>

        </div>
      </aside>
      {children}
    </div>
  );
}
