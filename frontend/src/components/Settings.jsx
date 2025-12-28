import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Trash2, Key, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const [apiKey, setApiKey] = useState('Sk-7x9d2...');
  const [defaultExpiry, setDefaultExpiry] = useState(60);
  const [defaultViews, setDefaultViews] = useState(1);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Load from local storage if available
    const savedExpiry = localStorage.getItem('defaultExpiry');
    if (savedExpiry) setDefaultExpiry(parseInt(savedExpiry));

    // Simulate fetching API key
    if (!localStorage.getItem('admin_api_key')) {
      localStorage.setItem('admin_api_key', 'ss_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now());
    }
    setApiKey(localStorage.getItem('admin_api_key'));
  }, []);

  const generateNewKey = () => {
    const newKey = 'ss_' + Math.random().toString(36).substr(2, 16);
    setApiKey(newKey);
    localStorage.setItem('admin_api_key', newKey);
    // In a real app, we'd POST this to the backend
  };

  const saveDefaults = () => {
    localStorage.setItem('defaultExpiry', defaultExpiry);
    localStorage.setItem('defaultViews', defaultViews);
    toast.success("Configurations saved locally!");
  };

  const clearLocalData = () => {
    if (window.confirm("Are you sure? This will clear all local keys and history.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center">
          <Shield className="mr-3 text-primary" />
          System Configuration
        </h2>
        <p className="text-gray-400 mt-2">Manage your security preferences and API access.</p>
      </div>

      {/* Global Defaults */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Clock className="mr-2 text-primary" size={20} />
          Default Upload Policies
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Default Expiry (Minutes)</label>
            <select
              value={defaultExpiry}
              onChange={(e) => setDefaultExpiry(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
            >
              <option value="15">15 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="1440">24 Hours</option>
              <option value="10080">7 Days</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Default Max Views</label>
            <input
              type="number"
              value={defaultViews}
              onChange={(e) => setDefaultViews(e.target.value)}
              min="1"
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={saveDefaults}
          className="mt-6 flex items-center bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors border border-white/10"
        >
          <Save size={18} className="mr-2" />
          Save Preferences
        </button>
      </div>

      {/* API Access */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Key className="mr-2 text-primary" size={20} />
          Developer API Access
        </h3>

        <div className="bg-black/50 border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1 mr-4">
            <label className="text-xs text-gray-500 block mb-1">Admin API Key</label>
            <code className="text-primary font-mono block text-lg">
              {showKey ? apiKey : '••••••••••••••••••••••••'}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={generateNewKey}
              className="flex items-center bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded transition-colors border border-primary/20"
            >
              <RefreshCw size={16} className="mr-2" />
              Regenerate
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Use this key to authenticate CLI uploads. Ensure you keep it secret.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
          <Trash2 className="mr-2" size={20} />
          Danger Zone
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Clearing local data will remove your saved API keys, encryption preferences, and viewing history from this browser.
        </p>
        <button
          onClick={clearLocalData}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Nuke Local Data
        </button>
      </div>

    </div>
  );
};

export default Settings;
