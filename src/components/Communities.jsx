import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Trophy, Brain, Music, Code, Zap, Activity
} from 'lucide-react';
import client from '../api/client';
import './Communities.css';

const iconMap = {
    'technical': Code,
    'sports': Users,
    'cultural': Music,
    'social': Users,
    'esports': Zap,
    'chess': Brain,
    'statistics': Activity,
    'coding': Code,
};

const Communities = () => {
    const [communities, setCommunities] = useState([]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await client.get('/communities?cache=true');
                if (response.data && response.data.length > 0) {
                    const mapped = response.data.map((comm, idx) => {
                        const catLower = (comm.category || 'social').toLowerCase();
                        return {
                            id: comm.id || idx,
                            name: comm.name,
                            description: comm.description || 'Active community',
                            icon: iconMap[catLower] || Users
                        };
                    });
                    setCommunities(mapped);
                } else {
                    setCommunities([]);
                }
            } catch (err) {
                console.error("Failed to fetch communities:", err);
                setCommunities([]);
            }
        };

        fetchCommunities();
    }, []);

    return (
        <section className="communities-showcase" id="communities">
            <motion.div
                className="section-header center"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <div className="section-tag">Join Our Flux</div>
                <h2 className="section-title">Communities</h2>
            </motion.div>

            {communities.length === 0 ? (
                <div className="forest-empty-state">
                    <p>The forest is quiet now, come back later to check</p>
                </div>
            ) : (
                <div className="communities-carousel-wrapper">
                    <div className="communities-carousel">
                        {/* First set of cards */}
                        {communities.map((community) => (
                            <div key={community.id} className="community-card-wrapper">
                                <div className="community-card">
                                    <div className="community-card-inner">
                                        <div className="community-icon-wrapper">
                                            <community.icon className="community-icon" />
                                        </div>
                                        <h3 className="community-title">{community.name}</h3>
                                        <p className="community-description">{community.description}</p>
                                        <div className="community-tail"></div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Duplicate set for infinite scroll */}
                        {communities.map((community) => (
                            <div key={`${community.id}-duplicate`} className="community-card-wrapper">
                                <div className="community-card">
                                    <div className="community-card-inner">
                                        <div className="community-icon-wrapper">
                                            <community.icon className="community-icon" />
                                        </div>
                                        <h3 className="community-title">{community.name}</h3>
                                        <p className="community-description">{community.description}</p>
                                        <div className="community-tail"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default Communities;
