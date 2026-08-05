import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import EventsPage from './pages/EventsPage';
import MeetupsPage from './pages/MeetupsPage';
import AchievementsPage from './pages/AchievementsPage';
import CommunityPage from './pages/CommunityPage';
import CouncilPage from './pages/CouncilPage';
import GalleryPage from './pages/GalleryPage';
import Login from './pages/Login';
import JoinPage from './pages/JoinPage';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminCommunities from './pages/admin/AdminCommunities';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminAchievements from './pages/admin/AdminAchievements';
import AdminMeetups from './pages/admin/AdminMeetups';
import AdminCouncil from './pages/admin/AdminCouncil';
import AdminResources from './pages/admin/AdminResources';
import ResourcesPage from './pages/ResourcesPage';
import './App.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.scrollTop = 0;
    }

    // Also target admin scroll container
    const adminContainer = document.getElementById('admin-scroll-container');
    if (adminContainer) {
      adminContainer.scrollTop = 0;
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname === '/login';
  const isJoin = location.pathname === '/join';

  return (
    <div className={`app-container ${isAdmin ? 'admin-mode' : ''} ${isJoin ? 'join-mode' : ''}`}>
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/meetups" element={<MeetupsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/council" element={<CouncilPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="communities" element={<AdminCommunities />} />
          <Route path="meetups" element={<AdminMeetups />} />
          <Route path="achievements" element={<AdminAchievements />} />
          <Route path="council" element={<AdminCouncil />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="resources" element={<AdminResources />} />
        </Route>
      </Routes>
      {!isAdmin && <Footer />}
    </div>
  );
};

export default App;
