import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Adoptable from './pages/Adoptable';
import Stories from './pages/Stories';
import Shelters from './pages/Shelters';
import ContactSupport from './pages/ContactSupport';
import FooterPage from './pages/FooterPage';
import UserHome from './pages/user/UserHome';
import ShelterDashboard from './pages/shelter/ShelterDashboard';
import ShelterPets from './pages/shelter/ShelterPets';
import UserShelters from './pages/user/UserShelters';
import UserMap from './pages/user/UserMap';
import UserAdoptable from './pages/user/UserAdoptable';
import UserLibrary from './pages/user/UserLibrary';
import UserSettings from './pages/user/UserSettings';
import UserNotifications from './pages/user/UserNotifications';
import { AuthProvider } from './lib/AuthContext';
import './App.css';

function AppContent() {
  const { pathname } = useLocation();
  const isContactSupport = ['/contact-support', '/about-us', '/privacy-policy', '/community-guidelines', '/terms-of-service'].includes(pathname);
  const isUserPage = pathname.startsWith('/user/') || pathname.startsWith('/shelter/');

  return (
    <AuthProvider>
      <div className={`page${isContactSupport ? ' page--support' : ''}`}>
        {!isUserPage && <Navbar informational={isContactSupport} />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shelter/home" element={<UserHome shelterView />} />
          <Route path="/shelter/dashboard" element={<ShelterDashboard />} />
          <Route path="/shelter/adoption-requests" element={<ShelterDashboard requestsPage />} />
          <Route path="/shelter/pets" element={<ShelterPets />} />
          <Route path="/shelter/settings" element={<UserSettings />} />
          <Route path="/shelter/notifications" element={<UserNotifications />} />
          <Route path="/user/home" element={<UserHome />} />
          <Route path="/user/shelters" element={<UserShelters />} />
          <Route path="/user/map" element={<UserMap />} />
          <Route path="/user/adoptable" element={<UserAdoptable />} />
          <Route path="/user/library" element={<UserLibrary />} />
          <Route path="/user/settings" element={<UserSettings />} />
          <Route path="/user/notifications" element={<UserNotifications />} />
          <Route path="/adoptable" element={<Adoptable />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/shelters" element={<Shelters />} />
          <Route path="/contact-support" element={<ContactSupport />} />
          <Route path="/terms-of-service" element={<FooterPage page="terms-of-service" />} />
          <Route path="/about-us" element={<FooterPage page="about-us" />} />
          <Route path="/privacy-policy" element={<FooterPage page="privacy-policy" />} />
          <Route path="/community-guidelines" element={<FooterPage page="community-guidelines" />} />
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
