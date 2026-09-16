import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Adoptable from './pages/Adoptable';
import Stories from './pages/Stories';
import Shelters from './pages/Shelters';
import RoleDashboard from './pages/RoleDashboard';
import UserHome from './pages/UserHome';
import { AuthProvider } from './lib/AuthContext';
import './App.css';

function AppRoutes() {
  const { pathname } = useLocation();
  const isUserHome = pathname === '/user-home';

  return (
    <div className="page">
      {!isUserHome && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adoptable" element={<Adoptable />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/shelters" element={<Shelters />} />
        <Route path="/shelter-dashboard" element={<RoleDashboard role="shelter" />} />
        <Route path="/admin-dashboard" element={<RoleDashboard role="admin" />} />
        <Route path="/user-home" element={<UserHome />} />
      </Routes>
      {!isUserHome && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
