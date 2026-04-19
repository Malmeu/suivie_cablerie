import { useState } from 'react';
import { useTracking } from '../context/TrackingContext';
import {
  LayoutDashboard, Building2, Menu, X, Cable, Activity, Settings, ClipboardList, Users
} from 'lucide-react';

export default function Header({ currentView, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { getGlobalStats } = useTracking();
  const globalStats = getGlobalStats();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'floors', label: 'Étages', icon: Building2 },
    { id: 'cables', label: 'Câblages', icon: Cable },
    { id: 'todo', label: 'Todo', icon: ClipboardList },
    { id: 'suppliers', label: 'Fournisseurs', icon: Users },
    { id: 'settings', label: 'Réglages', icon: Settings },
  ];

  const handleNav = (viewId) => {
    onNavigate(viewId);
    setMobileOpen(false);
  };

  return (
    <header className="header" id="main-header">
      <div className="header-logo">
        <div className="header-logo-icon">
          <Activity size={22} />
        </div>
        <div>
          <div className="header-title">CâbleTrack</div>
          <div className="header-subtitle">Suivi Câblerie Hôpital</div>
        </div>
      </div>

      <nav className={`header-nav ${mobileOpen ? 'mobile-open' : ''}`} id="main-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`header-nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => handleNav(item.id)}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header-right">
        <div className="header-stats-badge" id="global-progress-badge">
          <Activity size={14} />
          {globalStats.percentage}% Terminé
        </div>

        <button
          className="mobile-menu-btn"
          id="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu de navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
