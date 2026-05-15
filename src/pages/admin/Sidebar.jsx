import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Users,
    Calendar,
    MessageSquare,
    Trophy,
    UserCircle,
    BookOpen,
    LogOut,
    Mail,
    ShieldCheck
} from 'lucide-react';

const Sidebar = ({ navItems, handleLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

                .sidebar-wrap {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #080808;
                    z-index: 40;
                    flex-shrink: 0;
                    transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    border-right: 1px solid rgba(255,255,255,0.05);
                }

                .sidebar-inner {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    overflow: hidden;
                }

                /* ── Header ── */
                .sidebar-header {
                    padding: 2.5rem 1.75rem 2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    flex-shrink: 0;
                }
                .sidebar-header-collapsed {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    flex-shrink: 0;
                }

                .sidebar-brand {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.6rem;
                    letter-spacing: 0.08em;
                    color: white;
                    line-height: 1;
                    margin-bottom: 0.4rem;
                }
                .sidebar-brand span {
                    color: #34d399;
                }
                .sidebar-sub {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.55rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.3em;
                    color: #3f3f46;
                }

                .shield-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    background: #1b3d29;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #34d399;
                    border: 1px solid rgba(52,211,153,0.15);
                }

                /* ── Nav ── */
                .sidebar-nav {
                    flex: 1;
                    padding: 1.5rem 1rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .sidebar-nav::-webkit-scrollbar { width: 0; }

                /* Nav section label */
                .nav-section-label {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.5rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.4em;
                    color: #27272a;
                    padding: 1rem 0.75rem 0.5rem;
                }

                /* Nav item */
                .nav-item {
                    position: relative;
                    display: flex;
                    align-items: center;
                    height: 3rem;
                    text-decoration: none;
                    transition: all 0.25s ease;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.7rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: #52525b;
                    padding: 0 0.75rem;
                    gap: 0.875rem;
                    border: 1px solid transparent;
                }
                .nav-item:hover {
                    color: white;
                    background: rgba(255,255,255,0.03);
                    border-color: rgba(255,255,255,0.05);
                }
                .nav-item.active {
                    color: #34d399;
                    background: rgba(52,211,153,0.06);
                    border-color: rgba(52,211,153,0.15);
                }
                /* left accent bar on active */
                .nav-item.active::before {
                    content: '';
                    position: absolute;
                    left: -1px;
                    top: 20%;
                    bottom: 20%;
                    width: 2px;
                    background: #34d399;
                    box-shadow: 0 0 8px rgba(52,211,153,0.6);
                }

                .nav-icon {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 1.25rem;
                    transition: transform 0.25s ease;
                }
                .nav-item:hover .nav-icon,
                .nav-item.active .nav-icon {
                    transform: translateX(1px);
                }

                .nav-item-label {
                    white-space: nowrap;
                    overflow: hidden;
                }

                /* collapsed icon-only mode */
                .nav-item-collapsed {
                    justify-content: center;
                    padding: 0;
                    height: 3rem;
                    width: 3rem;
                    margin: 0 auto;
                }

                /* ── Footer ── */
                .sidebar-footer {
                    padding: 1.25rem 1rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    flex-shrink: 0;
                }
                .sidebar-version {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.5rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.4em;
                    color: #1c1c1e;
                    text-align: center;
                    padding: 0.6rem;
                    border: 1px solid rgba(255,255,255,0.03);
                }

                /* ── Collapse toggle ── */
                .collapse-btn {
                    position: absolute;
                    right: -14px;
                    bottom: 3.5rem;
                    width: 28px;
                    height: 28px;
                    background: #1b3d29;
                    border: 1px solid rgba(52,211,153,0.2);
                    color: #34d399;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 50;
                    transition: background 0.2s, transform 0.2s;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
                }
                .collapse-btn:hover {
                    background: #255238;
                    transform: scale(1.1);
                }
                .collapse-btn:active { transform: scale(0.92); }

                /* Tooltip on collapsed items */
                .nav-item-collapsed .nav-tooltip {
                    display: none;
                    position: absolute;
                    left: calc(100% + 12px);
                    top: 50%;
                    transform: translateY(-50%);
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 0.35rem 0.75rem;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.6rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: white;
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 100;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }
                .nav-item-collapsed:hover .nav-tooltip { display: block; }
            `}</style>

            <motion.div
                className="sidebar-wrap"
                initial={false}
                animate={{ width: isCollapsed ? 72 : 280 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="sidebar-inner">

                    {/* ── Header ── */}
                    <AnimatePresence mode="wait" initial={false}>
                        {!isCollapsed ? (
                            <motion.div
                                key="expanded-header"
                                className="sidebar-header"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="sidebar-brand">
                                    The <span>House</span>
                                </div>
                                <div className="sidebar-sub">Nilgiri Administration Layer</div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="collapsed-header"
                                className="sidebar-header-collapsed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="shield-icon">
                                    <ShieldCheck size={18} strokeWidth={1.5} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Nav ── */}
                    <nav className="sidebar-nav">
                        {!isCollapsed && (
                            <div className="nav-section-label">Navigation</div>
                        )}

                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'nav-item-collapsed' : ''}`}
                                >
                                    <div className="nav-icon">
                                        <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                                    </div>

                                    <AnimatePresence initial={false}>
                                        {!isCollapsed && (
                                            <motion.span
                                                className="nav-item-label"
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>

                                    {/* Tooltip shown only when collapsed */}
                                    {isCollapsed && (
                                        <span className="nav-tooltip">{item.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ── Footer ── */}
                    <div className="sidebar-footer">
                        {!isCollapsed ? (
                            <div className="sidebar-version">System v2.0.4</div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: '1.5rem', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Collapse toggle ── */}
                <button className="collapse-btn" onClick={toggleSidebar} title={isCollapsed ? 'Expand' : 'Collapse'}>
                    {isCollapsed
                        ? <ChevronRight size={14} strokeWidth={2.5} />
                        : <ChevronLeft size={14} strokeWidth={2.5} />
                    }
                </button>
            </motion.div>
        </>
    );
};

export default Sidebar;