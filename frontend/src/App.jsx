import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Overview from './components/Overview';
import UploadVault from './components/UploadVault';
import FileAccess from './components/FileAccess';
import Monitoring from './components/Monitoring';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('shareId')) {
      setActiveTab('unlock');
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} />;
      case 'vault':
        return <UploadVault />;
      case 'unlock':
        return <FileAccess />;
      case 'monitoring':
        return <Monitoring />;
      case 'settings':
        return <Settings />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-fade-in">
        <h2 className="text-3xl font-bold mb-6 capitalize">{activeTab.replace('-', ' ')}</h2>
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </div>
      <Toaster position="top-right" theme="dark" invert />
    </DashboardLayout>
  );
}

export default App;
