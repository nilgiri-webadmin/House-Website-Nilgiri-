import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import client from '../api/client';
import './Achievements.css';

const Achievements = ({ isPreview = false }) => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const limit = isPreview ? 3 : 100;
                const response = await client.get(`/achievements?limit=${limit}`);
                const data = response.data.achievements || [];
                setAchievements(isPreview ? data.slice(0, 3) : data);
            } catch (error) {
                console.error("Failed to fetch achievements:", error);
                setAchievements([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAchievements();
    }, [isPreview]);

    return (
        <section className={`achievements-section ${isPreview ? 'preview-mode' : 'full-mode'}`} id={isPreview ? "achievements-preview" : "achievements-full"}>
            <motion.div
                className="section-header center"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <span className="section-tag">Hall of Fame</span>
                <h2 className="section-title">{isPreview ? "Nilgiri Achievements" : "The Nilgiri Legacy"}</h2>
            </motion.div>

            {achievements.length === 0 ? (
                <div className="forest-empty-state">
                    <p>The forest is quiet now, come back later to check</p>
                </div>
            ) : (
                <div className="achievements-grid">
                    {achievements.map((ach, idx) => (
                        <motion.div
                            key={ach.id}
                            className="achievement-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <div className="ach-image-container">
                                {ach.image ? (
                                    <img src={ach.image} alt={ach.title} />
                                ) : (
                                    <div className="ach-placeholder">
                                        <span>{ach.title.charAt(0)}</span>
                                    </div>
                                )}
                                <div className="ach-category">{ach.category || 'General'}</div>
                            </div>
                            <div className="ach-info">
                                <h3>{ach.title}</h3>
                                <p>{ach.description}</p>
                            </div>
                            <div className="ach-glow"></div>
                        </motion.div>
                    ))}
                </div>
            )}

            {isPreview && (
                <div className="explore-more-container" style={{ marginTop: '50px', display: 'flex', justifyContent: 'center' }}>
                    <Link to="/achievements" className="explore-button-animated">
                        ENTER HALL OF FAME
                    </Link>
                </div>
            )}
        </section>
    );
};

export default Achievements;
