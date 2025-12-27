import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, Ban, Activity } from 'lucide-react';

const Monitoring = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status.includes('Granted')) return 'text-primary';
    return 'text-error';
  };

  const maskIP = (ip) => {
    // Basic mask: 127.0.0.1 -> 127.0.0.***
    if (!ip) return 'Unknown';
    if (ip === '127.0.0.1') return ip; // Don't mask localhost
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    return ip; // IPv6 or other
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Activity className="mr-3 text-primary" />
          Live Access Logs
        </h2>
        <div className="flex items-center text-xs text-gray-500">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Live Monitoring
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-5 p-4 bg-white/5 font-mono text-sm text-gray-400 border-b border-white/10">
          <div className="col-span-1">TIMESTAMP</div>
          <div className="col-span-1">STATUS</div>
          <div className="col-span-1">IP ADDRESS</div>
          <div className="col-span-2">USER AGENT</div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Scanning network...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No access attempts recorded.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="grid grid-cols-5 p-3 hover:bg-white/5 rounded transition-colors text-sm border-b border-white/5 last:border-0 font-mono">
                <div className="col-span-1 text-gray-400">
                  {new Date(log.accessed_at).toLocaleTimeString()}
                </div>
                <div className={`col-span-1 font-bold flex items-center ${getStatusColor(log.status)}`}>
                  {log.status.includes('Granted') ? <CheckCircle size={14} className="mr-2" /> : <Ban size={14} className="mr-2" />}
                  {log.status.split(':')[0]}
                </div>
                <div className="col-span-1 text-gray-300">
                  {maskIP(log.ip_address)}
                </div>
                <div className="col-span-2 text-gray-500 truncate text-xs" title={log.user_agent}>
                  {log.user_agent}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
