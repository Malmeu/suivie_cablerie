import { useState } from 'react';
import { TrackingProvider } from './context/TrackingContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import FloorView from './components/FloorView';
import BlockView from './components/BlockView';
import CablesView from './components/CablesView';
import SettingsView from './components/SettingsView';

function AppContent() {
  // Navigation state
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);

  /**
   * Gestion de la navigation
   */
  const handleNavigate = (viewId) => {
    setCurrentView(viewId);
    setSelectedFloor(null);
    setSelectedBlock(null);
  };

  const handleNavigateFloor = (floorId) => {
    setSelectedFloor(floorId);
    setSelectedBlock(null);
    setCurrentView('floor-detail');
  };

  const handleNavigateBlock = (floorId, blockNum) => {
    setSelectedFloor(floorId);
    setSelectedBlock(blockNum);
    setCurrentView('block-detail');
  };

  const handleBackToFloor = () => {
    setSelectedBlock(null);
    setCurrentView('floor-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedFloor(null);
    setSelectedBlock(null);
    setCurrentView('dashboard');
  };

  /**
   * Rendu de la vue active
   */
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigateFloor={handleNavigateFloor} />;

      case 'floors':
      case 'floor-detail':
        return (
          <FloorView
            initialFloor={selectedFloor}
            onNavigateBlock={handleNavigateBlock}
            onBack={handleBackToDashboard}
          />
        );

      case 'block-detail':
        return (
          <BlockView
            floorId={selectedFloor}
            blockNum={selectedBlock}
            onBack={handleBackToFloor}
          />
        );

      case 'cables':
        return <CablesView />;

      case 'settings':
        return <SettingsView />;

      default:
        return <Dashboard onNavigateFloor={handleNavigateFloor} />;
    }
  };

  // Déterminer la vue active pour la nav
  const getNavView = () => {
    if (['dashboard'].includes(currentView)) return 'dashboard';
    if (['floors', 'floor-detail', 'block-detail'].includes(currentView)) return 'floors';
    if (currentView === 'cables') return 'cables';
    if (currentView === 'settings') return 'settings';
    return 'dashboard';
  };

  return (
    <div className="app-layout">
      <Header currentView={getNavView()} onNavigate={handleNavigate} />

      <main className="app-content">
        {renderView()}
      </main>

      <BottomNav currentView={getNavView()} onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <TrackingProvider>
      <AppContent />
    </TrackingProvider>
  );
}
