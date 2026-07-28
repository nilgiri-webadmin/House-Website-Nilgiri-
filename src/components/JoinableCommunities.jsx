import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import client from '../api/client';
import { getCommunityFormUrl } from '../data/communityForms';
import './JoinableCommunities.css';

const communityImg = 'https://placehold.co/400x300/1a1a2e/4ade80?text=Community';

const buildJoinState = (community) => ({
    fromJoinButton: true,
    community: {
        id: community.id,
        name: community.name,
        description: community.description || '',
        image: community.image || null,
        joining_form: community.joining_form
    }
});

const JoinableCommunityCard = ({ community }) => {
    const joinState = buildJoinState(community);

    return (
        <motion.div
            className="joinable-community-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <div className="community-image">
                <img
                    src={community.image || communityImg}
                    alt={community.name}
                />
                <div className="community-overlay"></div>
            </div>
            <div className="community-info">
                <h3>{community.name}</h3>
                {community.description && (
                    <p className="community-description">
                        {community.description.length > 100
                            ? community.description.substring(0, 100) + '...'
                            : community.description}
                    </p>
                )}
                <div className="community-actions">
                    <Link
                        to="/join"
                        state={joinState}
                        className="join-button"
                    >
                        Join Community
                        <ArrowRight size={14} strokeWidth={2} className="join-icon" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

const JoinableCommunities = () => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJoinableCommunities = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.get('/communities?cache=false');

            const mappedCommunities = response.data.map(community => ({
                id: community.id,
                name: community.name,
                description: community.description || '',
                image: community.image || null,
                joining_form: community.joining_form || getCommunityFormUrl(community.name)
            })).filter(community => community.joining_form && community.joining_form.trim() !== '');

            setCommunities(mappedCommunities);
        } catch (err) {
            console.error("Failed to fetch joinable communities:", err);
            setError('Failed to load communities. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJoinableCommunities();
    }, []);

    if (loading) {
        return (
            <div className="joinable-communities-loading">
                <div className="loading-spinner"></div>
                <p>Loading joinable communities...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="joinable-communities-error">
                <p>{error}</p>
                <button
                    onClick={fetchJoinableCommunities}
                    className="retry-button"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (communities.length === 0) {
        return (
            <div className="joinable-communities-empty">
                <h3>No Open Applications</h3>
                <p>Currently, there are no communities with open applications.</p>
                <p>Check back soon for new opportunities to join!</p>
            </div>
        );
    }

    return (
        <section className="joinable-communities-section">
            <div className="section-header">
                <h1>Join Our Communities</h1>
                <p>
                    Discover communities that are currently welcoming new members.
                    Click "Join Community" to access their application forms.
                </p>
            </div>

            <div className="cards-container">
                {communities.map((community) => (
                    <JoinableCommunityCard
                        key={community.id}
                        community={community}
                    />
                ))}
            </div>
        </section>
    );
};

export default JoinableCommunities;
