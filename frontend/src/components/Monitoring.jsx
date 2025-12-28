import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, CheckCircle, Ban, Activity, Filter, RefreshCw, Hexagon, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_RANGES = [
  { label: 'All History', value: 'all' },
  { label: 'Last 1 Hour', value: '1h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last 1 Year', value: '1y' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Status: Granted', value: 'status_granted' },
  { label: 'Status: Denied', value: 'status_denied' },
];

import { supabase } from '../supabaseClient';

// ... (existing imports)

const Monitoring = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);
  // ... (existing state)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [timeFilter, sortBy]);

  // ... (existing click outside effect)

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      let url = `/api/logs?range=${timeFilter}&sort=${sortBy}`;
      if (userId) {
        url += `&user_id=${userId}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const getStatusColor = (status) => {
    if (status.includes('Granted')) return 'text-green-400 bg-green-400/10 border-green-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  const maskIP = (ip) => {
    if (!ip) return 'Unknown';
    if (ip === '127.0.0.1') return ip;
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    return ip;
  };

  const selectedTimeLabel = TIME_RANGES.find(r => r.value === timeFilter)?.label || 'Filter';
  const selectedSortLabel = SORT_OPTIONS.find(r => r.value === sortBy)?.label || 'Sort';

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center text-white">
            <div className="p-2 bg-primary/10 rounded-lg mr-3 border border-primary/20">
              <Activity className="text-primary" />
            </div>
            Security Audit Logs
          </h2>
          <p className="text-gray-400 text-sm mt-1 ml-12">Real-time surveillance of file access and threats.</p>
        </div>

        <div className="flex items-center gap-3">

          {/* Time Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-200 hover:bg-white/5 hover:border-primary/50 transition-all w-48 justify-between group"
            >
              <Filter className="absolute left-3 text-gray-400 group-hover:text-primary transition-colors" size={14} />
              <span>{selectedTimeLabel}</span>
              <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute top-full mt-2 left-0 w-full bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 py-1"
                >
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => {
                        setTimeFilter(range.value);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${timeFilter === range.value ? 'text-primary bg-primary/5' : 'text-gray-400'}`}
                    >
                      {range.label}
                      {timeFilter === range.value && <CheckCircle size={12} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-200 hover:bg-white/5 hover:border-primary/50 transition-all w-44 justify-between group"
            >
              <Search className="absolute left-3 text-gray-400 group-hover:text-primary transition-colors" size={14} />
              <span>{selectedSortLabel}</span>
              <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute top-full mt-2 left-0 w-full bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 py-1"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${sortBy === opt.value ? 'text-primary bg-primary/5' : 'text-gray-400'}`}
                    >
                      {opt.label}
                      {sortBy === opt.value && <CheckCircle size={12} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={fetchLogs}
            disabled={refreshing}
            className="p-2 bg-black/40 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col shadow-2xl relative">

        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>

        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-4 bg-white/5 text-xs font-mono text-gray-400 uppercase tracking-wider border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
          <div className="col-span-2">Time</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">File Accessed</div>
          <div className="col-span-2">Origin IP</div>
          <div className="col-span-3">Client Fingerprint</div>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1 relative z-0 custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <RefreshCw className="animate-spin text-primary" size={32} />
              <span className="font-mono text-xs">ESTABLISHING UPLINK...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3 opacity-50">
              <Hexagon size={48} />
              <span className="font-mono text-sm">NO LOGS FOUND</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="grid grid-cols-12 px-4 py-3 items-center rounded-lg hover:bg-white/5 transition-all group border border-transparent hover:border-white/5 text-sm"
                >
                  <div className="col-span-2 text-gray-400 font-mono text-xs">
                    {new Date(log.accessed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    <span className="block text-[10px] text-gray-600">
                      {new Date(log.accessed_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(log.status)}`}>
                      {log.status.includes('Granted')
                        ? <CheckCircle size={12} className="mr-1.5" />
                        : <Ban size={12} className="mr-1.5" />
                      }
                      {log.status.split(':')[0].toUpperCase()}
                    </span>
                  </div>

                  <div className="col-span-3 text-gray-300 font-medium truncate pr-4 group-hover:text-primary transition-colors flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2 group-hover:bg-primary transition-colors"></span>
                    {log.filename || 'Unknown File'}
                  </div>

                  <div className="col-span-2 text-gray-500 font-mono text-xs flex items-center">
                    {maskIP(log.ip_address)}
                  </div>

                  <div className="col-span-3 text-gray-600 text-xs truncate font-mono" title={log.user_agent}>
                    {log.user_agent}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
