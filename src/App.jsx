import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Adoptable from './pages/Adoptable';
import Stories from './pages/Stories';
import Shelters from './pages/Shelters';
import ContactSupport from './pages/ContactSupport';
import UserHome from './pages/user/UserHome';
import UserShelters from './pages/user/UserShelters';
import UserMap from './pages/user/UserMap';
import UserAdoptable from './pages/user/UserAdoptable';
import UserLibrary from './pages/user/UserLibrary';
import UserSettings from './pages/user/UserSettings';
import { AuthProvider } from './lib/AuthContext';
import './App.css';

function AppContent() {
  const { pathname } = useLocation();
  const isContactSupport = pathname === '/contact-support';
  const isUserPage = pathname.startsWith('/user/');

  return (
    <AuthProvider>
      <div className={`page${isContactSupport ? ' page--support' : ''}`}>
        {!isContactSupport && !isUserPage && <Navbar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user/home" element={<UserHome />} />
          <Route path="/user/shelters" element={<UserShelters />} />
          <Route path="/user/map" element={<UserMap />} />
          <Route path="/user/adoptable" element={<UserAdoptable />} />
          <Route path="/user/library" element={<UserLibrary />} />
          <Route path="/user/settings" element={<UserSettings />} />
          <Route path="/adoptable" element={<Adoptable />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/shelters" element={<Shelters />} />
          <Route path="/contact-support" element={<ContactSupport />} />
        </Routes>
        {!isContactSupport && !isUserPage && <Footer />}
      </div>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
