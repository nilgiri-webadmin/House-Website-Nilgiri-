import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import {
    Users, Calendar, Award, BookOpen,
    ArrowUpRight, Clock, MapPin, Zap
} from "lucide-react";
import { motion } from "framer-motion";

/* ── Hide any black system navbar that sits above the app nav ── */
const HideSystemNav = () => {
    useEffect(() => {
        const id = 'dashboard-hide-nav';
        if (document.getElementById(id)) return;
        const s = document.createElement('style');
        s.id = id;
        s.innerHTML = `
            /* target common global navbar patterns above the app */
            body > nav:first-of-type,
            body > header:first-of-type,
            #root > nav:first-of-type,
            #root > header:first-of-type,
            .main-navbar, .navbar-container,
            [class*="top-nav"], [class*="topnav"],
            [class*="global-nav"], [class*="site-header"] {
                display: none !important;
            }
        `;
        document.head.appendChild(s);
        return () => { const el = document.getElementById(id); if (el) el.remove(); };
    }, []);
    return null;
};

/* ── Stagger animation helper ── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }
});

const Dashboard = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [stats, setStats] = useState({ communities: 0, events: 0, achievements: 0, council: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try { setCurrentUser(JSON.parse(userData)); } catch (e) { console.error("Failed to parse user data", e); }
        }
        fetchDashboardData();
    }, []);

    /* ── BACKEND LOGIC UNCHANGED ── */
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [commRes, eventRes, achRes, councilRes] = await Promise.allSettled([
                client.get('/communities'),
                client.get('/events'),
                client.get('/achievements'),
                client.get('/council')
            ]);
            const getData = (res) => res.status === 'fulfilled' ? res.value.data : null;
            const commData = getData(commRes);
            const eventDataRaw = getData(eventRes);
            const achData = getData(achRes);
            const councilData = getData(councilRes);

            const commCount = Array.isArray(commData) ? commData.length : (commData?.communities?.length || 0);
            const eventData = Array.isArray(eventDataRaw) ? eventDataRaw : (eventDataRaw?.events || []);
            const achCount = Array.isArray(achData) ? achData.length : (achData?.achievements?.length || 0);
            const councilCount = Array.isArray(councilData) ? councilData.length : (councilData?.members || councilData || []).length;

            setStats({ communities: commCount, events: eventData.length, achievements: achCount, council: councilCount });

            const now = new Date();
            const sortedEvents = eventData
                .filter(e => e.date && new Date(e.date) >= now)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 4);
            setUpcomingEvents(sortedEvents);
        } catch (error) {
            console.error("Dashboard sync failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const metricCards = [
        { label: "Communities", value: stats.communities, icon: BookOpen, color: "text-emerald-400", accent: "#34d399" },
        { label: "Total Events", value: stats.events, icon: Calendar, color: "text-blue-400", accent: "#60a5fa" },
        { label: "Milestones", value: stats.achievements, icon: Award, color: "text-amber-400", accent: "#fbbf24" },
        { label: "Council", value: stats.council, icon: Users, color: "text-purple-400", accent: "#c084fc" },
    ];

    /* ────────────────────────────────────────
       Loading state
    ──────────────────────────────────────── */
    if (loading) {
        return (
            <>
                <HideSystemNav />
                <div className="flex h-screen items-center justify-center bg-black">
                    <div className="flex flex-col items-center gap-8">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border border-emerald-500/10 rotate-45" />
                            <div className="absolute inset-1 border border-emerald-500/20 rotate-45 animate-spin" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-3 bg-emerald-500/20 rotate-45" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-emerald-500/50">Syncing</p>
                    </div>
                </div>
            </>
        );
    }

    /* ────────────────────────────────────────
       Main render
    ──────────────────────────────────────── */
    return (
        <>
            <HideSystemNav />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

                .dash-root {
                    --emerald: #34d399;
                    --bg: #050505;
                    --card: #0d0d0d;
                    --border: rgba(255,255,255,0.05);
                    --border-hover: rgba(52,211,153,0.25);
                    font-family: 'DM Mono', monospace;
                    background: var(--bg);
                    min-height: 100vh;
                    padding: 4rem 5vw 6rem;
                    overflow-x: hidden;
                }

                /* Subtle scanline texture */
                .dash-root::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background: repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(255,255,255,0.008) 2px,
                        rgba(255,255,255,0.008) 4px
                    );
                    pointer-events: none;
                    z-index: 0;
                }

                /* Faint green glow in top-left corner */
                .dash-root::after {
                    content: '';
                    position: fixed;
                    top: -20%;
                    left: -10%;
                    width: 50vw;
                    height: 50vh;
                    background: radial-gradient(ellipse, rgba(52,211,153,0.04) 0%, transparent 70%);
                    pointer-events: none;
                    z-index: 0;
                }

                .dash-content { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; }

                /* ── Metric card ── */
                .metric-card {
                    position: relative;
                    background: var(--card);
                    border: 1px solid var(--border);
                    padding: 2.5rem;
                    transition: border-color 0.5s ease, background 0.5s ease;
                    overflow: hidden;
                    cursor: default;
                }
                .metric-card::before {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, var(--accent, #34d399), transparent);
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
                .metric-card:hover { border-color: var(--border-hover); background: #111; }
                .metric-card:hover::before { opacity: 1; }
                .metric-card:hover .metric-icon { opacity: 1; }
                .metric-card:hover .metric-value { transform: translateX(4px); }

                .metric-icon { opacity: 0.25; transition: opacity 0.5s ease; }
                .metric-value {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 4.5rem;
                    line-height: 1;
                    color: white;
                    letter-spacing: 0.02em;
                    transition: transform 0.5s ease;
                }
                .metric-label {
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.35em;
                    color: #3f3f46;
                    margin-bottom: 0.5rem;
                }
                .metric-ghost {
                    position: absolute;
                    bottom: -1rem; right: -1rem;
                    opacity: 0.025;
                    transition: opacity 0.5s ease;
                }
                .metric-card:hover .metric-ghost { opacity: 0.06; }

                /* ── Event card ── */
                .event-card {
                    background: var(--card);
                    border: 1px solid var(--border);
                    padding: 2rem 2.5rem;
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    transition: border-color 0.4s ease, background 0.4s ease;
                    position: relative;
                    overflow: hidden;
                }
                .event-card::after {
                    content: '';
                    position: absolute;
                    left: 0; top: 0; bottom: 0;
                    width: 2px;
                    background: var(--emerald);
                    transform: scaleY(0);
                    transform-origin: bottom;
                    transition: transform 0.4s ease;
                }
                .event-card:hover { border-color: rgba(52,211,153,0.2); background: #0f0f0f; }
                .event-card:hover::after { transform: scaleY(1); }
                .event-card:hover .event-title { color: #34d399; }
                .event-card:hover .event-arrow { background: #34d399; color: black; }

                .event-date-box {
                    flex-shrink: 0;
                    width: 4rem;
                    height: 4rem;
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    transition: border-color 0.4s ease;
                }
                .event-card:hover .event-date-box { border-color: rgba(52,211,153,0.3); }

                .event-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.4rem;
                    letter-spacing: 0.05em;
                    color: white;
                    transition: color 0.3s ease;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                }

                .event-arrow {
                    flex-shrink: 0;
                    width: 2.5rem;
                    height: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.04);
                    color: white;
                    transition: background 0.3s ease, color 0.3s ease;
                    margin-left: auto;
                }

                /* ── Section header rule ── */
                .section-rule {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    margin-bottom: 2rem;
                }

                /* ── Archive button ── */
                .archive-btn {
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: #34d399;
                    background: rgba(52,211,153,0.04);
                    border: 1px solid rgba(52,211,153,0.12);
                    padding: 0.6rem 1.4rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: background 0.3s, color 0.3s;
                    text-decoration: none;
                }
                .archive-btn:hover { background: #34d399; color: black; }
            `}</style>

            <motion.div className="dash-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <div className="dash-content">

                    {/* ── Header ── */}
                    <motion.div {...fadeUp(0)} style={{ marginBottom: '5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '2.5rem', height: '1px', background: 'rgba(52,211,153,0.6)' }} />
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6em', color: 'rgba(52,211,153,0.7)' }}>
                                System Ready
                            </span>
                        </div>
                        <h1 style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(3.5rem, 8vw, 7rem)',
                            lineHeight: 0.9,
                            color: 'white',
                            letterSpacing: '0.03em',
                            marginBottom: '1.2rem'
                        }}>
                            Command<br />
                            <span style={{ color: '#34d399' }}>Center</span>
                        </h1>
                        <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#3f3f46' }}>
                            {currentUser?.name || 'Administrator'}
                        </p>
                    </motion.div>

                    {/* ── Metric cards ── */}
                    <motion.div {...fadeUp(0.1)} style={{ marginBottom: '5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
                            {metricCards.map((card, i) => (
                                <div
                                    key={i}
                                    className="metric-card"
                                    style={{ '--accent': card.accent }}
                                >
                                    <card.icon className={`metric-icon ${card.color}`} size={24} strokeWidth={1.5} style={{ marginBottom: '2rem' }} />
                                    <div className="metric-label">{card.label}</div>
                                    <div className="metric-value">{card.value}</div>
                                    <div className="metric-ghost">
                                        <card.icon size={80} strokeWidth={0.5} className={card.color} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── Upcoming events ── */}
                    <motion.div {...fadeUp(0.2)}>
                        <div className="section-rule">
                            <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(52,211,153,0.55)', marginBottom: '0.6rem' }}>
                                    Operational Queue
                                </div>
                                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: 'white', letterSpacing: '0.05em' }}>
                                    Upcoming Ops
                                </h2>
                            </div>
                            <Link to="/admin/events" className="archive-btn">
                                Archive
                                <ArrowUpRight size={13} />
                            </Link>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map((evt, i) => (
                                    <div key={i} className="event-card">
                                        <div className="event-date-box">
                                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: 'white', lineHeight: 1 }}>
                                                {new Date(evt.date).getDate()}
                                            </span>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                                {new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="event-title">{evt.title}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.4rem', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#52525b' }}>
                                                <span>{evt.location || 'Central HQ'}</span>
                                                <span style={{ opacity: 0.5, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Zap size={8} /> {evt.mode || 'Normal'}
                                                </span>
                                            </div>
                                        </div>

                                        <Link to="/admin/events" className="event-arrow">
                                            <ArrowUpRight size={15} />
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                    <p style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', color: '#1c1c1e' }}>
                                        Queue Offline
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Footer watermark ── */}
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem', opacity: 0.04 }}>
                        <span style={{ fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1em', color: 'white' }}>
                            SHARP SCALE v2.8
                        </span>
                    </div>

                </div>
            </motion.div>
        </>
    );
};

export default Dashboard;