import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Events.css';
import client from '../api/client';
import { X, Calendar, Clock, MapPin, Wifi, Tag, ExternalLink } from 'lucide-react';

/* ─────────────────────────────────────────────
   EventCard — mirrors CouncilCard 1-to-1
   portrait image + title + desc label below
───────────────────────────────────────────── */
const EventCard = ({ evt, index, onClick }) => {
    const ref = useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => { x.set(0); y.set(0); };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
            className="event-card-council"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
            viewport={{ once: true }}
        >
            <div className="event-portrait-container">
                <div className="event-portrait-bg"></div>
                {evt.image ? (
                    <img src={evt.image} alt={evt.title} className="event-portrait-img" />
                ) : (
                    <div className="event-portrait-placeholder">
                        <Calendar size={40} strokeWidth={1} color="#222" />
                    </div>
                )}
                <div className="event-portrait-overlay"></div>
            </div>
            <div className="event-info">
                <h3>{evt.title}</h3>
                <p className="event-desc">{evt.desc}</p>
            </div>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────
   Main Events component
───────────────────────────────────────────── */
const Events = ({ isPreview = false, eventType }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayCount, setDisplayCount] = useState(12);
    const ITEMS_PER_PAGE = 12;
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleEventClick = (event) => setSelectedEvent(event);
    const closeModal = () => setSelectedEvent(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const limit = isPreview ? 4 : 100;
                const response = await client.get(`/events?limit=${limit}`);
                const rawEvents = response.data.events || [];

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const mappedEvents = rawEvents.map(evt => {
                    const evtDate = new Date(evt.date);
                    evtDate.setHours(0, 0, 0, 0);
                    return {
                        id: evt.id,
                        title: evt.title,
                        desc: `${evtDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${evt.location || evt.mode || 'TBA'}`,
                        image: evt.img_url || evt.image_url,
                        date: evt.date,
                        description: evt.description,
                        mode: evt.mode,
                        category: evt.category,
                        location: evt.location,
                        registration_link: evt.registration_link || evt.register_link,
                        time: evt.time,
                        isPast: evtDate < today,
                    };
                });

                const type = eventType || (isPreview ? 'upcoming' : 'past');
                const filtered = mappedEvents.filter(e =>
                    type === 'upcoming' ? !e.isPast : e.isPast
                );
                filtered.sort((a, b) => {
                    const dA = new Date(a.date), dB = new Date(b.date);
                    return type === 'past' ? dB - dA : dA - dB;
                });
                setEvents(filtered);
            } catch (err) {
                console.error("Failed to fetch events:", err);
                setError("Failed to load events.");
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [isPreview, eventType]);

    const type = eventType || (isPreview ? 'upcoming' : 'past');
    const sectionTag = isPreview ? "Recent Highlights" : (type === 'upcoming' ? "Upcoming" : "Past");
    const sectionTitle = isPreview ? "Events" : (type === 'upcoming' ? "Upcoming Events" : "Past Events");

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

                /* ── Modal ── */
                .ev-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    background: rgba(0,0,0,0.88);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                .ev-modal {
                    position: relative;
                    width: 100%;
                    max-width: 820px;
                    max-height: 88vh;
                    background: #060e08;
                    border: 1px solid rgba(34,197,94,0.12);
                    box-shadow: 0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(34,197,94,0.04) inset;
                    overflow: hidden;
                    display: flex;
                    flex-direction: row;
                }
                .ev-modal::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; bottom: 0;
                    width: 2px;
                    background: linear-gradient(180deg, #4ade80, #16a34a 50%, transparent);
                    z-index: 2;
                }
                .ev-modal::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at 0% 30%, rgba(22,163,74,0.05) 0%, transparent 55%);
                    pointer-events: none;
                    z-index: 0;
                }
                .ev-modal-img-panel {
                    width: 400px;
                    flex-shrink: 0;
                    position: relative;
                    overflow: hidden;
                    background: #0a1a0e;
                }
                .ev-modal-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    opacity: 0.85;
                    display: block;
                }
                .ev-modal-img-panel::after {
                    content: '';
                    position: absolute;
                    top: 0; right: 0; bottom: 0;
                    width: 40px;
                    background: linear-gradient(to right, transparent, #060e08);
                }
                .ev-modal-img-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0a1a0e;
                }
                .ev-modal-close {
                    position: absolute;
                    top: 0.75rem; right: 0.75rem;
                    width: 1.75rem; height: 1.75rem;
                    background: rgba(0,0,0,0.6);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: background 0.2s, color 0.2s;
                    backdrop-filter: blur(4px);
                }
                .ev-modal-close:hover { background: rgba(0,0,0,0.9); color: white; }
                .ev-modal-body {
                    flex: 1;
                    padding: 2rem 2.5rem 2.5rem 2rem;
                    overflow-y: auto;
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                }
                .ev-modal-body::-webkit-scrollbar { width: 3px; }
                .ev-modal-body::-webkit-scrollbar-track { background: #060e08; }
                .ev-modal-body::-webkit-scrollbar-thumb { background: #1a4d27; }
                .ev-modal-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 0.45rem;
                    margin-bottom: 0.65rem;
                    flex-wrap: wrap;
                }
                .ev-modal-badge {
                    display: inline-block;
                    padding: 0.15rem 0.55rem;
                    background: rgba(22,163,74,0.1);
                    border: 1px solid rgba(22,163,74,0.25);
                    color: #4ade80;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.65rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.18em;
                }
                .ev-modal-date-badge {
                    display: inline-block;
                    padding: 0.15rem 0.55rem;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #4b5563;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.65rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.13em;
                }
                .ev-modal-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: clamp(1.8rem, 4vw, 2.4rem);
                    letter-spacing: 0.04em;
                    color: #f0fdf4;
                    line-height: 1.05;
                    margin-bottom: 0.65rem;
                }
                .ev-modal-desc {
                    font-family: 'DM Mono', monospace;
                    font-size: 0.85rem;
                    line-height: 1.8;
                    color: #6b7280;
                    margin-bottom: 0.875rem;
                }
                .ev-modal-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.35rem;
                    margin-bottom: 1rem;
                }
                .ev-modal-detail-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.28rem 0.6rem;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(34,197,94,0.1);
                    color: #9ca3af;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    white-space: nowrap;
                }
                .ev-modal-detail-pill svg { color: rgba(74,222,128,0.5); flex-shrink: 0; }
                .ev-modal-spacer { flex: 1; }
                .ev-modal-register {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    height: 3rem;
                    padding: 0 1.4rem;
                    background: #16a34a;
                    color: #f0fdf4;
                    font-family: 'DM Mono', monospace;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.18em;
                    text-decoration: none;
                    border: none;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.15s;
                    align-self: flex-start;
                    margin-top: 0.75rem;
                }
                .ev-modal-register:hover { background: #22c55e; color: #000; }
                .ev-modal-register:active { transform: scale(0.97); }
                .ev-modal-divider {
                    height: 1px;
                    background: rgba(34,197,94,0.08);
                    margin: 0.75rem 0;
                }
                @media (max-width: 560px) {
                    .ev-modal { flex-direction: column; }
                    .ev-modal-img-panel { width: 100%; height: 180px; flex-shrink: 0; }
                    .ev-modal::before { top:0;left:0;right:0;bottom:auto;width:auto;height:2px;
                        background:linear-gradient(90deg,#4ade80,#16a34a 50%,transparent); }
                    .ev-modal-body { padding: 1.25rem; }
                }
            `}</style>

            <section
                className={`events-section ${isPreview ? 'preview-mode' : 'full-mode'}`}
                id={isPreview ? "events-preview" : "events-full"}
            >
                <motion.div
                    className="center"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="section-tag">{sectionTag}</div>
                    <h2 className="section-title">{sectionTitle}</h2>
                </motion.div>

                {events.length === 0 ? (
                    <div className="forest-empty-state">
                        <p>The forest is quiet now, come back later to check</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {events.slice(0, displayCount).map((evt, index) => (
                            <EventCard
                                key={evt.id}
                                evt={evt}
                                index={index}
                                onClick={() => handleEventClick(evt)}
                            />
                        ))}
                    </div>
                )}

                {!isPreview && displayCount < events.length && (
                    <div className="load-more-container">
                        <button
                            className="load-more-btn"
                            onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                        >
                            LOAD MORE EVENTS
                        </button>
                    </div>
                )}

                {isPreview && (
                    <div className="explore-more-container">
                        <Link to="/events" className="explore-button-animated">
                            EXPLORE FULL ARCHIVE
                        </Link>
                    </div>
                )}
            </section>

            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        className="ev-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className="ev-modal"
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="ev-modal-close" onClick={closeModal}>
                                <X size={14} strokeWidth={2} />
                            </button>

                            <div className="ev-modal-img-panel">
                                {selectedEvent.image
                                    ? <img src={selectedEvent.image} alt={selectedEvent.title} className="ev-modal-img" />
                                    : <div className="ev-modal-img-placeholder">
                                        <Calendar size={22} color="rgba(74,222,128,0.2)" strokeWidth={1} />
                                    </div>
                                }
                            </div>

                            <div className="ev-modal-body">
                                <div className="ev-modal-meta-row">
                                    {selectedEvent.mode && (
                                        <span className="ev-modal-badge">{selectedEvent.mode}</span>
                                    )}
                                    {selectedEvent.category && (
                                        <span className="ev-modal-badge" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: '#4b5563' }}>
                                            {selectedEvent.category}
                                        </span>
                                    )}
                                    <span className="ev-modal-date-badge">
                                        {new Date(selectedEvent.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                <div className="ev-modal-title">{selectedEvent.title}</div>

                                {selectedEvent.description && (
                                    <p className="ev-modal-desc">{selectedEvent.description}</p>
                                )}

                                <div className="ev-modal-details">
                                    {selectedEvent.time && (
                                        <div className="ev-modal-detail-pill"><Clock size={10} strokeWidth={1.5} />{selectedEvent.time}</div>
                                    )}
                                    {selectedEvent.location && (
                                        <div className="ev-modal-detail-pill"><MapPin size={10} strokeWidth={1.5} />{selectedEvent.location}</div>
                                    )}
                                    {selectedEvent.mode && (
                                        <div className="ev-modal-detail-pill"><Wifi size={10} strokeWidth={1.5} />{selectedEvent.mode}</div>
                                    )}
                                    {selectedEvent.category && (
                                        <div className="ev-modal-detail-pill"><Tag size={10} strokeWidth={1.5} />{selectedEvent.category}</div>
                                    )}
                                </div>

                                <div className="ev-modal-spacer" />

                                {selectedEvent.registration_link && !selectedEvent.isPast && (
                                    <>
                                        <div className="ev-modal-divider" />
                                        <a
                                            href={selectedEvent.registration_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ev-modal-register"
                                        >
                                            <ExternalLink size={12} strokeWidth={2} />
                                            Register Now
                                        </a>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Events;