import LogoutButton from './LogoutButton';
import NotificationBell from './NotificationBell';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import logo from '../assets/pawloc.svg';
import Icon from './UserIcon';
import '../pages/user/UserHome.css';

export default function UserLayout({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const shelterView = pathname.startsWith('/shelter/');
  const base = shelterView ? '/shelter' : '/user';


  const name = shelterView ? user?.user_metadata?.shelter_name || 'Shelter' : user?.user_metadata?.first_name || 'RJ';
  const activeClass = ({ isActive }) => isActive ? 'user-nav-active' : '';

  return (
    <div className="user-home">
      <header className="user-topbar">
        <Link to={base + '/home'} aria-label="Pawloc home"><img src={logo} alt="PAWLOC" className="user-logo" /></Link>
        <div className="user-topbar-account">
          <NotificationBell to={base + '/notifications'} />
          <span className="user-avatar">{user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt={`${name}'s profile photo`} /> : name.slice(0, 2).toUpperCase()}</span><span>{name}</span>
        </div>
      </header>
      <aside className="user-sidebar">
        <nav aria-label="User navigation">
          {shelterView ? <>
            <NavLink className={activeClass} to="/shelter/home" title="Home"><Icon name="home" />Home</NavLink>
            <button disabled title="Dashboard will be available in a future update"><Icon name="library" />Dashboard</button>
            <button disabled title="Pet management will be available in a future update"><Icon name="search" />Pets</button>
            <button disabled title="Adoption request management will be available in a future update"><Icon name="heart" />Adoption Requests</button>
          </> : <>          <NavLink className={activeClass} to="/user/home" title="Home"><Icon name="home" />Home</NavLink>
          <NavLink className={activeClass} to="/user/map" title="Map"><Icon name="map" />Map</NavLink>
          <NavLink className={activeClass} to="/user/shelters" title="Shelter"><Icon name="heart" />Shelter</NavLink>
          <NavLink className={activeClass} to="/user/adoptable" title="Adoptable Pets"><Icon name="paw" />Adoptable Pets</NavLink>
          <NavLink className={activeClass} to="/user/library" title="Library"><Icon name="library" />Library</NavLink></>}
        </nav>
        <div className="user-sidebar-bottom">
          <NavLink className={activeClass} to={base + '/settings'} title="Settings"><Icon name="settings" />Settings</NavLink>
          <LogoutButton title="Log out"><Icon name="logout" />Log out</LogoutButton>

        </div>
      </aside>
      {children}
    </div>
  );
}
