import { useState, useEffect, useRef } from 'react';
import { TrackingProvider } from './context/TrackingContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import FloorView from './components/FloorView';
import BlockView from './components/BlockView';
import CablesView from './components/CablesView';
import SettingsView from './components/SettingsView';
import TodoListView from './components/TodoListView';
import SuppliersView from './components/SuppliersView';
import LogsView from './components/LogsView';
import Login from './components/Login';
import ReportTemplate from './components/ReportTemplate';
import { supabase } from './lib/supabase';

function AppContent() {
  const reportRef = useRef(null);
  
  // Auth state
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Navigation state
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
        return <Dashboard onNavigateFloor={handleNavigateFloor} onNavigateBlock={handleNavigateBlock} />;

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
        return <SettingsView reportRef={reportRef} onLogout={handleLogout} />;

      case 'todo':
        return <TodoListView />;

      case 'suppliers':
        return <SuppliersView />;

      case 'logs':
        return <LogsView />;

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
    if (currentView === 'todo') return 'todo';
    if (currentView === 'suppliers') return 'suppliers';
    if (currentView === 'logs') return 'logs';
    return 'dashboard';
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>Initialisation...</div>;
  }

  if (!session) {
    return <Login onLogin={(user) => setSession({ user })} />;
  }

  return (
    <div className="app-layout">
      <Header 
        currentView={getNavView()} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      <main className="app-content">
        {renderView()}
      </main>

      <BottomNav currentView={getNavView()} onNavigate={handleNavigate} />
      
      {/* Hidden Report Template for PDF generation */}
      <ReportTemplate reportRef={reportRef} />
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
