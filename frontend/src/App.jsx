import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import DashboardLayout from './components/DashboardLayout';
import Auth from './components/Auth';
import Overview from './components/Overview';
import UploadVault from './components/UploadVault';
import FileAccess from './components/FileAccess';
import Monitoring from './components/Monitoring';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Check for session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for URL-based share access (Unlock Tab)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('shareId');
    if (shareId) {
      setActiveTab('unlock');
    }
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-primary">
      Loading SecureShare...
    </div>
  );

  // If viewing a public share link (Unlock Tab), allow access without auth?
  // User Requirement: "Authentication with supabase". 
  // Usually file receivers shouldn't need to login, only uploaders. 
  // Let's implement logic: 
  // IF activeTab === 'unlock', render Layout -> FileAccess regardless of session (Public Access).
  // ELSE, require Session.

  const isUnlockMode = activeTab === 'unlock';

  if (!session && !isUnlockMode) {
    return (
      <>
        <Auth />
        <Toaster theme="dark" position="top-right" />
      </>
    );
  }

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
        return <Overview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-primary/30">
        <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
          {renderContent()}
        </DashboardLayout>
        <Toaster theme="dark" position="top-right" closeButton richColors />
      </div>
    </ErrorBoundary>
  );
}

export default App;
