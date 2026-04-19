import {
  LayoutDashboard, Building2, Cable, Settings
} from 'lucide-react';

export default function BottomNav({ currentView, onNavigate }) {
  const items = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'floors', label: 'Étages', icon: Building2 },
    { id: 'cables', label: 'Câbles', icon: Cable },
    { id: 'settings', label: 'Réglages', icon: Settings },
  ];

  return (
    <nav className="bottom-nav" id="bottom-navigation">
      {items.map(item => (
        <button
          key={item.id}
          id={`bottom-nav-${item.id}`}
          className={`bottom-nav-item ${currentView === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
