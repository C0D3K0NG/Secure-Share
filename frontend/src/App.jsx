import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import UploadVault from './components/UploadVault';
import FileAccess from './components/FileAccess';
import Monitoring from './components/Monitoring';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';

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
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-xl border border-white/10 hover:border-primary/50 transition-colors">
              <h3 className="text-gray-400 text-sm font-mono uppercase">Total Uploads</h3>
              <p className="text-4xl font-bold text-white mt-2">128</p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-white/10 hover:border-primary/50 transition-colors">
              <h3 className="text-gray-400 text-sm font-mono uppercase">Active Links</h3>
              <p className="text-4xl font-bold text-primary mt-2">12</p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-white/10 hover:border-primary/50 transition-colors">
              <h3 className="text-gray-400 text-sm font-mono uppercase">Threats Blocked</h3>
              <p className="text-4xl font-bold text-error mt-2">0</p>
            </div>

            {/* Bento Grid Main Area Placeholder */}
            <div className="bg-card p-6 rounded-xl border border-white/10 md:col-span-2 h-64 flex items-center justify-center">
              <p className="text-gray-500 font-mono">Activity Graph Placeholder</p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-white/10 h-64 flex items-center justify-center">
              <p className="text-gray-500 font-mono">Quick Actions</p>
            </div>
          </div>
        );
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
    </DashboardLayout>
  );
}

export default App;
