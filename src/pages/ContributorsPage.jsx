import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { loadContributors, compareTenures } from '../lib/contributors';
import ContributorSocials from '../components/ContributorSocials';
import './contributorsBackground.css';
import './ContributorsPage.css';

const getInitials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

const ContributorCard = ({ contributor, index }) => {
    const ref = useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['17.5deg', '-17.5deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-17.5deg', '17.5deg']);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x.set(mouseX / rect.width - 0.5);
        y.set(mouseY / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div className="contributors-member-wrap">
            <Link to={`/contributors/${contributor.slug}`} className="contributors-member-link">
                <motion.div
                    ref={ref}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ rotateY, rotateX, transformStyle: 'preserve-3d' }}
                    className="contributors-member-card"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08, type: 'spring', stiffness: 100 }}
                    viewport={{ once: true }}
                >
                    <div className="portrait-container">
                        <div className="portrait-bg"></div>
                        {contributor.image ? (
                            <img src={contributor.image} alt={contributor.name} className="portrait-img" />
                        ) : (
                            <div className="portrait-placeholder">
                                <span className="portrait-placeholder-initials">{getInitials(contributor.name)}</span>
                            </div>
                        )}
                        <div className="portrait-overlay"></div>
                    </div>
                    <div className="member-info">
                        <h3>{contributor.name}</h3>
                        {contributor.role && <p className="role">{contributor.role}</p>}
                    </div>
                </motion.div>
            </Link>
            <ContributorSocials socials={contributor.socials} />
        </div>
    );
};

const ContributorsPage = () => {
    const [groups, setGroups] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let active = true;
        loadContributors()
            .then((list) => {
                if (!active) return;
                const g = {};
                list.forEach((c) => {
                    if (!g[c.tenure]) g[c.tenure] = [];
                    g[c.tenure].push(c);
                });
                setGroups(g);
            })
            .catch((error) => {
                console.error('Failed to load contributors:', error);
                if (active) setLoadError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const tenureGroups = groups ? Object.keys(groups).sort(compareTenures) : [];

    return (
        <div className="resources-page contributors-page">
            <div className="contributors-bg" aria-hidden="true">
                <div className="contributors-blob contributors-blob--a"></div>
                <div className="contributors-blob contributors-blob--b"></div>
                <div className="contributors-blob contributors-blob--c"></div>
                <div className="contributors-noise"></div>
                <div className="contributors-vignette"></div>
            </div>
            <div className="resources-header-wrapper section-header">
                <span className="section-tag">Credit Where It's Due</span>
                <h1 className="section-title">The Contributors</h1>
                <div className="resources-intro-text">
                    <p>
                        Every great house is built by the hands of many. These are the developers
                        who poured their nights and weekends into crafting the Nilgiri House website,
                        from the first line of code to the last pixel. Tap a builder to meet them.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="resources-loading">Assembling the squad…</div>
            ) : loadError ? (
                <div className="resources-empty">
                    The registry could not be reached right now. Please try again shortly.
                </div>
            ) : !tenureGroups.length ? (
                <div className="resources-empty">The forge is quiet for now, come back soon to meet the builders.</div>
            ) : (
                <div className="contributors-container">
                    {tenureGroups.map((tenure) => (
                        <div key={tenure} className="contributors-section">
                            <div className="contributors-section-header">
                                <div className="contributors-section-icon">
                                    <Sparkles size={20} />
                                </div>
                                <h2 className="contributors-section-title">{tenure}</h2>
                            </div>
                            <div className="contributors-grid">
                                {groups[tenure].map((contributor, index) => (
                                    <ContributorCard key={contributor.slug || contributor.id} contributor={contributor} index={index} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContributorsPage;