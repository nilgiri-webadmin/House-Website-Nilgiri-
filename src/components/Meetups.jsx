import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Calendar, Clock, MapPin, User, Tag, Instagram, ExternalLink } from 'lucide-react';
import client from '../api/client';
import './Meetups.css';

const BATCH = 12;

const Meetups = ({ isPreview = false, eventType }) => {
    const [allMeetups, setAllMeetups] = useState([]);   // full dataset
    const [displayCount, setDisplayCount] = useState(BATCH);
    const [loading, setLoading] = useState(true);
    const [selectedMeetup, setSelectedMeetup] = useState(null);

    const closeModal = () => setSelectedMeetup(null);

    useEffect(() => {
        if (selectedMeetup) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedMeetup]);

    useEffect(() => {
        const fetchMeetups = async () => {
            try {
                // Fetch everything up front; client-side pagination handles the rest
                const response = await client.get(`/meetups?limit=200&offset=0`);
                let data = response.data.meetups || [];

                // Filter by eventType if specified
                if (eventType === 'upcoming') {
                    data = data.filter(m => !m.is_past);
                } else if (eventType === 'past') {
                    data = data.filter(m => m.is_past);
                }

                setAllMeetups(data);
                // Preview mode: only ever show first 4
                setDisplayCount(isPreview ? 4 : BATCH);
            } catch (error) {
                console.error("Failed to fetch meetups:", error);
                setAllMeetups([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMeetups();
    }, [isPreview, eventType]);

    const visibleMeetups = allMeetups.slice(0, displayCount);
    const hasMore = !isPreview && displayCount < allMeetups.length;

    const type = eventType || 'all';
    const sectionTag = isPreview ? "Gatherings" : (type === 'upcoming' ? "Upcoming" : type === 'past' ? "Past" : "Gatherings");
    const sectionTitle = isPreview ? "Nilgiri Meetups" : (type === 'upcoming' ? "Upcoming Meetups" : type === 'past' ? "Past Meetups" : "Historical Archive of Gatherings");

    return (
        <section className={`meetups-section ${isPreview ? 'preview-mode' : 'full-mode'}`} id={isPreview ? "meetups-preview" : "meetups-full"}>
            <motion.div
                className="section-header center"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <span className="section-tag">{sectionTag}</span>
                <h2 className="section-title">{sectionTitle}</h2>
            </motion.div>

            {allMeetups.length === 0 && !loading ? (
                <div className="forest-empty-state">
                    <p>The forest is quiet now, come back later to check</p>
                </div>
            ) : (
                <div className="meetups-container">
                    {visibleMeetups.map((m, idx) => (
                        <motion.div
                            key={m.id}
                            className={`meetup-item ${m.is_past ? 'archived' : 'active'}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: (idx % BATCH) * 0.05 }}
                            viewport={{ once: true }}
                            onClick={() => setSelectedMeetup(m)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="meetup-image-container">
                                {m.poster_url || m.img_url ? (
                                    <img
                                        src={m.poster_url || m.img_url}
                                        alt={m.title}
                                        className="meetup-image"
                                    />
                                ) : (
                                    <div className="meetup-image-placeholder">
                                        <Calendar size={32} strokeWidth={1} color="#222" />
                                    </div>
                                )}
                                <div className="meetup-image-overlay"></div>
                            </div>
                            <div className="meetup-content">
                                <h3>{m.title}</h3>
                                <div className="meetup-location">{m.location}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Load More — client-side, always shows when there's more data */}
            {hasMore && (
                <div className="load-more-container">
                    <button
                        className="explore-button-animated"
                        onClick={() => setDisplayCount(prev => prev + BATCH)}
                    >
                        LOAD MORE ({allMeetups.length - displayCount} remaining)
                    </button>
                </div>
            )}

            {isPreview && (
                <div className="explore-more-container" style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                    <Link to="/meetups" className="explore-button-animated">
                        LOAD ALL GATHERINGS
                    </Link>
                </div>
            )}

            {/* ── Meetup Modal ── */}
            <AnimatePresence>
                {selectedMeetup && (
                    <motion.div
                        className="mt-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className="mt-modal"
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="mt-modal-close" onClick={closeModal}>
                                <X size={14} strokeWidth={2} />
                            </button>

                            <div className="mt-modal-img-panel">
                                {selectedMeetup.poster_url || selectedMeetup.img_url
                                    ? <img src={selectedMeetup.poster_url || selectedMeetup.img_url} alt={selectedMeetup.title} className="mt-modal-img" />
                                    : <div className="mt-modal-img-placeholder">
                                        <Calendar size={22} color="rgba(74,222,128,0.2)" strokeWidth={1} />
                                    </div>
                                }
                            </div>

                            <div className="mt-modal-body">
                                <div className="mt-modal-meta-row">
                                    <span className="mt-modal-badge">
                                        {selectedMeetup.is_past ? 'ARCHIVED' : 'ACTIVE CHANNEL'}
                                    </span>
                                    {selectedMeetup.date && (
                                        <span className="mt-modal-date-badge">
                                            {new Date(selectedMeetup.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-modal-title">{selectedMeetup.title}</div>

                                {selectedMeetup.description && (
                                    <p className="mt-modal-desc">{selectedMeetup.description}</p>
                                )}

                                <div className="mt-modal-details">
                                    {selectedMeetup.date && (
                                        <div className="mt-modal-detail-pill">
                                            <Calendar size={10} strokeWidth={1.5} />
                                            {new Date(selectedMeetup.date).toLocaleDateString()}
                                        </div>
                                    )}
                                    {selectedMeetup.location && (
                                        <div className="mt-modal-detail-pill">
                                            <MapPin size={10} strokeWidth={1.5} />{selectedMeetup.location}
                                        </div>
                                    )}
                                    {selectedMeetup.organiser && (
                                        <div className="mt-modal-detail-pill">
                                            <User size={10} strokeWidth={1.5} />{selectedMeetup.organiser}
                                        </div>
                                    )}
                                </div>

                                {(selectedMeetup.insta_link || (selectedMeetup.register_link && !selectedMeetup.is_past)) && (
                                    <div className="mt-modal-actions">
                                        {selectedMeetup.register_link && !selectedMeetup.is_past && (
                                            <a
                                                href={selectedMeetup.register_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-modal-register-btn"
                                            >
                                                <ExternalLink size={14} strokeWidth={2} />
                                                Register Now
                                            </a>
                                        )}
                                        {selectedMeetup.insta_link && (
                                            <a
                                                href={selectedMeetup.insta_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-modal-instagram-btn"
                                            >
                                                <Instagram size={14} strokeWidth={2} />
                                                View on Instagram
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div className="mt-modal-spacer" />
                                <div className="mt-modal-divider" />
                                <div className="mt-modal-footer-text">Nilgiri Community Gathering</div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Meetups;