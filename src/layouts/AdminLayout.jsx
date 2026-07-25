import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Grid, LogOut, LayoutDashboard, Users, Calendar, MessageSquare, Trophy, UserCircle, BookOpen } from 'lucide-react';
import Sidebar from '../pages/admin/Sidebar';

const ROLE_DISPLAY_NAMES = {
    secretary: 'Secretary',
    depsec: 'Deputy Secretary',
    webadmin: 'Web Admin',
    admin: 'Admin',
    club: 'Club Admin',
};

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Read logged-in user info
    const getUserInfo = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return { name: user.name || user.email || 'User', role: user.role || 'admin' };
            }
            // Fallback: decode JWT payload
            const token = localStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return { name: payload.name || payload.email || 'User', role: payload.role || 'admin' };
            }
        } catch (e) { /* ignore */ }
        return { name: 'User', role: 'admin' };
    };

    const userInfo = getUserInfo();
    const displayRole = ROLE_DISPLAY_NAMES[userInfo.role?.toLowerCase()] || userInfo.role || 'Admin';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/communities', label: 'Communities', icon: Users },
        { path: '/admin/events', label: 'Events', icon: Calendar },
        { path: '/admin/meetups', label: 'Meetups', icon: MessageSquare },
        { path: '/admin/achievements', label: 'Achievements', icon: Trophy },
        { path: '/admin/council', label: 'Council Members', icon: UserCircle },
        { path: '/admin/complaints', label: 'Complaints', icon: BookOpen },
        { path: '/admin/study-space', label: 'Study Space', icon: BookOpen },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 font-['Outfit'] overflow-hidden">

            {/* ── Top bar ── */}
            <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-[#1b3d29] z-50">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-white opacity-40 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                    <h1 className="text-xl font-serif font-bold tracking-tight text-white italic">Nilgiri House</h1>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-6">
                        <a
                            href="https://web-production-3f8cc.up.railway.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white/80 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest bg-white/5 py-2 px-6 rounded-none border border-white/5"
                        >
                            <Grid size={14} />
                            Convert
                        </a>
                        <button className="flex items-center gap-2 text-white/80 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest bg-white/5 py-2 px-6 rounded-none border border-white/5">
                            <Bell size={14} />
                            Inbox
                        </button>
                    </div>

                    <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-black text-white leading-none uppercase tracking-widest">{displayRole}</span>
                            <span className="text-[8px] text-white/40 font-black uppercase mt-1 tracking-widest">Authorized</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-none text-white/60 hover:text-white hover:bg-white/5 transition-all border border-white/5 flex items-center justify-center bg-white/[0.02]"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar navItems={navItems} handleLogout={handleLogout} />

                {/* Spatial separation */}
                <div className="w-[1px] bg-white/5 h-full" />
                <div className="w-12 bg-black h-full shrink-0" />
                <div className="w-[1px] bg-white/5 h-full" />

                {/* ── Page content ──
                    OLD: pl-[6vw] pr-[35vw] py-[8vh]
                         pr-[35vw] was eating ~35% of the viewport, leaving a
                         black dead zone that looked like a second scrollable navbar.
                    NEW: symmetric px-[5vw] with a sensible max-width so wide
                         screens don't stretch content uncomfortably.
                ── */}
                <main className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
                    <div className="w-full min-h-full px-[5vw] py-[6vh] max-w-[1200px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.6em] text-emerald-500/40">
                                        Authorized System Access // v2.8
                                    </span>
                                </div>
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Scrollbar styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar       { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #000000; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1b3d29; border-radius: 2px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #255238; }
            `}</style>
        </div>
    );
};

export default AdminLayout;