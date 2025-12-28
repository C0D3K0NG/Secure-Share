import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Shield, FileText, Settings, Menu, Unlock, LogOut, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

import logo from '../assets/logo.svg';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-all duration-200 
      ${active
        ? 'bg-primary/20 text-primary border-r-2 border-primary'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
  >
    <Icon size={20} className="mr-3" />
    <span className="font-medium tracking-wide">{label}</span>
  </button>
);

const DashboardLayout = ({ activeTab, setActiveTab, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'vault', label: 'The Vault', icon: Shield },
    { id: 'unlock', label: 'Unlock', icon: Unlock },
    { id: 'monitoring', label: 'Monitoring', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden">
      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-30 w-64 h-full bg-card border-r border-white/10 flex flex-col transition-transform duration-300 transform 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SecureShare Logo" className="w-8 h-8 filter drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
            <h1 className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              SECURE<span className="text-primary">SHARE</span>
            </h1>
          </div>
          <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(false)}>X</button>
        </div>


        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
            />
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm text-white font-medium truncate w-32" title={user?.email}>
                {user?.email || 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors text-xs font-medium border border-white/5 hover:border-red-500/30"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside >

      {/* Main Content */}
      < main className="flex-1 flex flex-col h-full overflow-hidden relative" >
        {/* Mobile Header */}
        < header className="md:hidden h-16 flex items-center px-4 border-b border-white/10 bg-card" >
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-white">
            <Menu />
          </button>
          <span className="ml-4 font-bold text-primary">SecureShare</span>
        </header >

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main >
    </div >
  );
};

export default DashboardLayout;
