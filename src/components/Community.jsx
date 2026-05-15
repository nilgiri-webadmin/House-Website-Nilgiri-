import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Link2, Calendar, ExternalLink } from 'lucide-react';
import './Community.css';
import client from '../api/client';
import communityImg from '../assets/community.png';

const ClubCard = ({ comm, delay, onClick }) => {
    return (
        <motion.div
            className="club-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: delay }}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            <div className="club-image">
                <img src={comm.image || communityImg} alt={comm.name} />
                <div className="club-overlay"></div>
            </div>
            <div className="club-info">
                <h3>{comm.name}</h3>
                <p>{comm.desc}</p>
                <div className="club-footer">
                    <span className="members-tag">Active Community</span>
                    <div className="join-arrow">EXPLORE &rarr;</div>
                </div>
            </div>
        </motion.div>
    );
};

const Community = () => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [communityDetails, setCommunityDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const categories = [
        { id: "all", name: "All Flux" },
        { id: "technical", name: "Technical" },
        { id: "cultural", name: "Cultural" },
        { id: "sports", name: "Sports" },
        { id: "social", name: "Social" },
    ];

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await client.get('/communities?cache=true');
                const mappedCommunities = response.data.map(comm => ({
                    id: comm.id,
                    name: comm.name,
                    desc: comm.description,
                    image: comm.image || communityImg,
                    category: comm.category || 'social'
                }));
                setCommunities(mappedCommunities);
            } catch (err) {
                console.error("Failed to fetch communities:", err);
                // Fallback
                const demo = [
                    { id: 1, name: "Coding Club", desc: "Build the future with code.", category: "technical", image: communityImg },
                    { id: 2, name: "Trekking Club", desc: "Explore the Nilgiri hills.", category: "sports", image: communityImg },
                    { id: 3, name: "Cultural Club", desc: "Celebrate art and music.", category: "cultural", image: communityImg },
                    { id: 4, name: "Social Squad", desc: "Connect and grow together.", category: "social", image: communityImg },
                ];
                setCommunities(demo);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
    }, []);

    useEffect(() => {
        if (selectedCommunity) {
            document.body.style.overflow = 'hidden';
            fetchCommunityDetails(selectedCommunity.id);
        } else {
            document.body.style.overflow = 'unset';
            setCommunityDetails(null);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedCommunity]);

    const fetchCommunityDetails = async (id) => {
        setDetailsLoading(true);
        try {
            const response = await client.get(`/communities/${id}`);
            setCommunityDetails(response.data);
        } catch (err) {
            console.error("Failed to fetch community details:", err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeModal = () => setSelectedCommunity(null);

    const handleCardClick = (comm) => {
        setSelectedCommunity(comm);
    };

    const filteredCommunities = communities.filter(
        (comm) =>
            (comm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                comm.desc.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (categoryFilter === "all" || comm.category.toLowerCase() === categoryFilter.toLowerCase())
    );

    return (
        <section className="community-section" id="community">
            <motion.div
                className="section-header"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <span className="section-tag">Ecosystem</span>
                <h2 className="section-title">Join the Tribe</h2>
                <p className="section-subtitle">Find your frequency and grow with the pack.</p>
            </motion.div>

            <div className="community-content">
            {/* Search and Filters */}
            <div className="filter-container">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search signals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
                </div>
                <div className="category-chips">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`chip ${categoryFilter === cat.id ? 'active' : ''}`}
                            onClick={() => setCategoryFilter(cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="cards-container">
                <AnimatePresence mode='popLayout'>
                    {filteredCommunities.map((comm, index) => (
                        <ClubCard
                            key={comm.id}
                            comm={comm}
                            delay={0.1 * (index + 1)}
                            onClick={() => handleCardClick(comm)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredCommunities.length === 0 && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="no-results"
                >
                    <p>No matches detected for that frequency.</p>
                </motion.div>
            )}
            </div>

            {/* Community Modal */}
            <AnimatePresence>
                {selectedCommunity && (
                    <motion.div
                        className="comm-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className="comm-modal"
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="comm-modal-close" onClick={closeModal}>
                                <X size={14} strokeWidth={2} />
                            </button>

                            <div className="comm-modal-img-panel">
                                {communityDetails?.image || selectedCommunity?.image ? (
                                    <img
                                        src={communityDetails?.image || selectedCommunity?.image}
                                        alt={communityDetails?.name || selectedCommunity?.name}
                                        className="comm-modal-img"
                                    />
                                ) : (
                                    <div className="comm-modal-img-placeholder">
                                        <User size={40} color="rgba(74,222,128,0.2)" strokeWidth={1} />
                                    </div>
                                )}
                            </div>

                            <div className="comm-modal-body">
                                <div className="comm-modal-meta-row">
                                    <span className="comm-modal-badge">Community</span>
                                    {communityDetails?.category && (
                                        <span className="comm-modal-badge" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: '#4b5563' }}>
                                            {communityDetails.category}
                                        </span>
                                    )}
                                </div>

                                <div className="comm-modal-title">
                                    {communityDetails?.name || selectedCommunity?.name}
                                </div>

                                {detailsLoading ? (
                                    <p className="comm-modal-desc">Loading details...</p>
                                ) : (
                                    <>
                                        {(communityDetails?.description || selectedCommunity?.desc) && (
                                            <p className="comm-modal-desc">
                                                {communityDetails?.description || selectedCommunity?.desc}
                                            </p>
                                        )}

                                        <div className="comm-modal-details"
                                        >
                                            {communityDetails?.lead && (
                                                <div className="comm-modal-detail-pill">
                                                    <User size={10} strokeWidth={1.5} />
                                                    Lead: {communityDetails.lead}
                                                </div>
                                            )}
                                        </div>

                                        {/* Community Events Section */}
                                        {communityDetails?.events && (
                                            <>
                                                {(() => {
                                                    // Safely parse events in case backend returns stringified data
                                                    let events = communityDetails.events;
                                                    if (typeof events === 'string') {
                                                        try {
                                                            events = JSON.parse(events);
                                                        } catch {
                                                            console.warn('Failed to parse events:', events);
                                                            events = [];
                                                        }
                                                    }
                                                    
                                                    if (!Array.isArray(events)) {
                                                        events = [];
                                                    }
                                                    
                                                    return events.length > 0 ? (
                                                        <>
                                                            <div className="comm-modal-divider" />
                                                            <div className="comm-modal-events-section">
                                                                <h4 className="comm-modal-section-title">Events Hosted</h4>
                                                                <div className="comm-modal-events-list">
                                                                    {events.map((evt, idx) => (
                                                                        <div key={evt.id || idx} className="comm-modal-event-item">
                                                                            {evt.image && (
                                                                                <img src={evt.image} alt={evt.title} className="comm-event-thumb" />
                                                                            )}
                                                                            <div className="comm-event-info">
                                                                                <div className="comm-event-title">{evt.title}</div>
                                                                                <div className="comm-event-meta">
                                                                                    {evt.date && (
                                                                                        <span>{new Date(evt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                                    )}
                                                                                    {evt.location && (
                                                                                        <span> · {evt.location}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : null;
                                                })()}
                                            </>
                                        )}

                                        <div className="comm-modal-spacer" />
                                        <div className="comm-modal-divider" />

                                        <div className="comm-modal-actions">
                                            {communityDetails?.joining_form && (
                                                <a
                                                    href={communityDetails.joining_form}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="comm-modal-register-btn"
                                                >
                                                    <ExternalLink size={14} strokeWidth={2} />
                                                    Join Community
                                                </a>
                                            )}
                                            {communityDetails?.instagram && (
                                                <a
                                                    href={communityDetails.instagram}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="comm-modal-instagram-btn"
                                                >
                                                    <Link2 size={14} strokeWidth={2} />
                                                    Instagram
                                                </a>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="comm-modal-footer-text">Nilgiri Community</div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Community;
