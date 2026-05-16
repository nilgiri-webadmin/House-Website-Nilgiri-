import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import client from '../api/client';
import yaml from 'js-yaml';
import './Council.css';

const CouncilCard = ({ member, index }) => {
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

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="council-member-card"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
            viewport={{ once: true }}
        >
            <div className="portrait-container">
                <div className="portrait-bg"></div>
                {member.profile_photo_url ? (
                    <img src={member.profile_photo_url} alt={member.name} className="portrait-img" />
                ) : (
                    <div className="portrait-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                )}
                <div className="portrait-overlay"></div>
            </div>
            <div className="member-info">
                <h3>{member.name}</h3>
                <p className="role">{member.role}</p>
            </div>
        </motion.div>
    );
};

const Council = () => {
    const [council, setCouncil] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('UHC');

    useEffect(() => {
        const fetchCouncil = async () => {
            try {
                const response = await client.get('/council?limit=20');
                const councilData = Array.isArray(response.data)
                    ? response.data
                    : response.data?.council || [];

                if (councilData.length > 0) {
                    setCouncil(councilData);
                    return;
                }

                // Fallback to the static YAML file for local/offline support.
                const yamlResponse = await fetch('/council-data.yml');
                if (!yamlResponse.ok) {
                    setCouncil([]);
                    return;
                }

                const yamlText = await yamlResponse.text();
                const yamlData = yaml.load(yamlText) || {};

                const flattenedData = [];
                Object.keys(yamlData).forEach(category => {
                    (yamlData[category] || []).forEach(member => {
                        let team = '';
                        let subTeam = '';
                        if (category === 'niligiri_uhc') {
                            team = 'UHC';
                        } else if (category === 'operations') {
                            team = 'Multimedia/PR/WebOps';
                            const pos = (member.position || '').toLowerCase();
                            if (pos.includes('pr')) {
                                subTeam = 'PR';
                            } else if (pos.includes('webops') || pos.includes('web-ops')) {
                                subTeam = 'WebOps';
                            } else {
                                subTeam = 'Multimedia';
                            }
                        } else if (category === 'regional_coordinators') {
                            team = 'RC';
                        } else if (category === 'mentors') {
                            team = 'Mentors';
                        } else if (category === 'community_admins') {
                            team = 'Community Admins';
                        }

                        flattenedData.push({
                            ...member,
                            team,
                            subTeam,
                            role: member.position,
                            profile_photo_url: member.image
                        });
                    });
                });

                setCouncil(flattenedData);
            } catch (error) {
                console.error("Failed to fetch council:", error);
                setCouncil([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCouncil();
    }, []);

    let filteredCouncil = [];
    if (selectedCategory === 'Multimedia/PR/WebOps') {
        filteredCouncil = council.filter(member => member.team === 'Multimedia/PR/WebOps');
        // Sort: Multimedia first, then PR, then WebOps
        filteredCouncil.sort((a, b) => {
            const order = { 'Multimedia': 1, 'PR': 2, 'WebOps': 3 };
            return (order[a.subTeam] || 4) - (order[b.subTeam] || 4);
        });
    } else {
        filteredCouncil = council.filter(member => member.team === selectedCategory);
    }

    return (
        <section className="council-section" id="council">
            <motion.div
                className="section-header center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <span className="section-tag">Governance</span>
                <h2 className="section-title">The House Council</h2>
                <p className="section-subtitle">Meet the visionary leaders driving Nilgiri forward.</p>
            </motion.div>

            <div className="category-bar">
                <button
                    className={`category-btn ${selectedCategory === 'UHC' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('UHC')}
                >
                    UHC
                </button>
                <button
                    className={`category-btn ${selectedCategory === 'Multimedia/PR/WebOps' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('Multimedia/PR/WebOps')}
                >
                    Multimedia/PR/WebOps
                </button>
                <button
                    className={`category-btn ${selectedCategory === 'RC' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('RC')}
                >
                    RC
                </button>
                <button
                    className={`category-btn ${selectedCategory === 'Community Admins' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('Community Admins')}
                >
                    Community Admins
                </button>
                <button
                    className={`category-btn ${selectedCategory === 'Mentors' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('Mentors')}
                >
                    Mentors
                </button>
            </div>

            {filteredCouncil.length === 0 ? (
                <div className="forest-empty-state">
                    <p>The forest is quiet now, come back later to check</p>
                </div>
            ) : (
                <div className="council-grid">
                    {filteredCouncil.map((member, idx) => (
                        <CouncilCard key={member.id} member={member} index={idx} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default Council;
