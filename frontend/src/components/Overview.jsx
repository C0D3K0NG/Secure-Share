import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Shield, Activity, FileText, Zap, Globe, Loader2 } from 'lucide-react';

const Card = ({ children, className, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={`bg-card/50 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors ${className}`}
    >
        {children}
    </motion.div>
);

import { supabase } from '../supabaseClient';

const Overview = ({ setActiveTab }) => {
    const [stats, setStats] = useState({
        total_uploads: 0,
        active_links: 0,
        threats_blocked: 0,
        activity_graph: Array(24).fill(0)
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id;

                const url = userId
                    ? `/api/stats?user_id=${userId}`
                    : '/api/stats';

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Stats fetch failed", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Poll every 30s
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

            {/* Stat 1 */}
            <Card delay={0.1}>
                <h3 className="text-gray-400 text-sm font-mono uppercase flex items-center mb-2">
                    <UploadCloud size={16} className="mr-2 text-primary" />
                    Network Uploads
                </h3>
                <p className="text-5xl font-bold text-white tracking-tighter">
                    {loading ? <Loader2 className="animate-spin" /> : stats.total_uploads}
                </p>
                <p className="text-xs text-green-400 mt-2">All time secured files</p>
            </Card>

            {/* Stat 2 */}
            <Card delay={0.2}>
                <h3 className="text-gray-400 text-sm font-mono uppercase flex items-center mb-2">
                    <Zap size={16} className="mr-2 text-yellow-400" />
                    Global Active Links
                </h3>
                <p className="text-5xl font-bold text-white tracking-tighter">
                    {loading ? <Loader2 className="animate-spin" /> : stats.active_links}
                </p>
                <div className="w-full bg-white/10 h-1 mt-4 rounded-full overflow-hidden">
                    <div
                        className="bg-yellow-400 h-full transition-all duration-1000"
                        style={{ width: `${Math.min(stats.active_links * 5, 100)}%` }}
                    ></div>
                </div>
            </Card>

            {/* Stat 3 */}
            <Card delay={0.3}>
                <h3 className="text-gray-400 text-sm font-mono uppercase flex items-center mb-2">
                    <Shield size={16} className="mr-2 text-red-400" />
                    Threats Blocked
                </h3>
                <p className="text-5xl font-bold text-white tracking-tighter">
                    {loading ? <Loader2 className="animate-spin" /> : stats.threats_blocked}
                </p>
                <p className="text-xs text-gray-500 mt-2">Unauthorized attempts denied</p>
            </Card>

            {/* Stat 4 - Storage */}
            <Card delay={0.4}>
                <h3 className="text-gray-400 text-sm font-mono uppercase flex items-center mb-2">
                    <Globe size={16} className="mr-2 text-blue-400" />
                    Vault Status
                </h3>
                <p className="text-3xl font-bold text-white tracking-tighter mt-2">SECURE</p>
                <p className="text-xs text-green-400 mt-2">System Online</p>
            </Card>

            {/* Main Activity Graph (Large Box) */}
            <Card className="md:col-span-3 md:row-span-2 relative overflow-hidden group" delay={0.5}>

                <h3 className="text-xl font-bold text-white mb-4">24h Access Activity</h3>

                {/* Real Graph Visual */}
                <div className="flex items-end justify-between h-48 space-x-2">
                    {stats.activity_graph.map((count, i) => {
                        const height = count === 0 ? 5 : Math.min((count / (Math.max(...stats.activity_graph) || 1)) * 100, 100);
                        return (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ duration: 1, delay: 0.5 + (i * 0.02) }}
                                className={`flex-1 transition-colors rounded-t-sm ${count > 0 ? 'bg-primary hover:bg-primary/80' : 'bg-white/5'}`}
                                title={`${count} requests`}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                    <span>24h ago</span>
                    <span>Now</span>
                </div>
            </Card>

            {/* Quick Actions (Tall Box) */}
            <Card className="md:row-span-2 flex flex-col justify-center gap-4" delay={0.6}>
                <h3 className="text-gray-400 text-sm font-mono uppercase mb-2">Quick Actions</h3>

                <button
                    onClick={() => setActiveTab('monitoring')}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl flex items-center transition-all hover:scale-105 group"
                >
                    <div className="bg-primary/20 p-2 rounded-lg mr-3 group-hover:bg-primary/30 transition-colors">
                        <FileText size={20} className="text-primary" />
                    </div>
                    <div className="text-left">
                        <span className="block text-white font-bold text-sm">View Audits</span>
                        <span className="text-xs text-gray-400">Check access logs</span>
                    </div>
                </button>

                <button
                    onClick={() => setActiveTab('vault')}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl flex items-center transition-all hover:scale-105 group"
                >
                    <div className="bg-primary/20 p-2 rounded-lg mr-3 group-hover:bg-primary/30 transition-colors">
                        <Shield size={20} className="text-primary" />
                    </div>
                    <div className="text-left">
                        <span className="block text-white font-bold text-sm">New Upload</span>
                        <span className="text-xs text-gray-400">Secure a file</span>
                    </div>
                </button>

                <div className="mt-auto pt-4 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-500">Live Monitoring Active</p>
                    <div className="flex items-center justify-center mt-2">
                        <span className="relative flex h-3 w-3 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-green-400 font-bold">ONLINE</span>
                    </div>
                </div>
            </Card>

        </div>
    );
};

export default Overview;
