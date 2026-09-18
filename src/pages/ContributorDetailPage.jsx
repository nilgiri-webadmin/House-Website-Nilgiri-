import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { loadContributors } from '../lib/contributors';
import ContributorSocials from '../components/ContributorSocials';
import './contributorsBackground.css';
import './ContributorDetailPage.css';

const getInitials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

const ContributorDetailPage = () => {
    const { id } = useParams();
    const [contributor, setContributor] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let active = true;
        loadContributors()
            .then((list) => {
                if (!active) return;
                const found = list.find((c) => c.slug === id || c.id === id);
                if (!found) {
                    setNotFound(true);
                    return;
                }
                setContributor(found);
            })
            .catch((error) => {
                console.error('Failed to load contributor:', error);
                if (active) setLoadError(true);
            });
        return () => {
            active = false;
        };
    }, [id]);

    if (loadError || notFound) {
        return (
            <div className="contributor-detail-page">
                <Link to="/contributors" className="cdp-back">
                    <ArrowLeft size={14} /> Contributors
                </Link>
                <div className="resources-empty cdp-empty">
                    {notFound ? 'No builder found under this name.' : 'The registry could not be reached right now.'}
                </div>
            </div>
        );
    }

    if (!contributor) {
        return (
            <div className="contributor-detail-page">
                <div className="resources-empty">Reading the registry…</div>
            </div>
        );
    }

    const { name, tenure, role, image, bio, socials } = contributor;

    return (
        <div className="contributor-detail-page">
            <div className="contributors-bg" aria-hidden="true">
                <div className="contributors-blob contributors-blob--a"></div>
                <div className="contributors-blob contributors-blob--b"></div>
                <div className="contributors-blob contributors-blob--c"></div>
                <div className="contributors-noise"></div>
                <div className="contributors-vignette"></div>
            </div>
            <Link to="/contributors" className="cdp-back">
                <ArrowLeft size={14} /> Contributors
            </Link>

            <motion.header
                className="cdp-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <span className="section-tag">The Builders' Registry · {tenure}</span>
                <h1 className="section-title cdp-header-title">The Builder's Profile</h1>
                <p className="cdp-header-desc">
                    Every great house is built by the hands of many. This is one of the builders
                    behind the Nilgiri House website.
                </p>
            </motion.header>

            <motion.div
                className="cdp-layout"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="cdp-image-wrap">
                    {image ? (
                        <img src={image} alt={name} className="cdp-image" />
                    ) : (
                        <div className="cdp-image-placeholder">{getInitials(name)}</div>
                    )}
                </div>

                <div className="cdp-main">
                    <div className="cdp-chip">
                        <Sparkles size={12} />
                        {tenure}
                    </div>
                    <h1 className="cdp-name">{name}</h1>
                    {role && <p className="cdp-role">{role}</p>}

                    {bio && <p className="cdp-bio">{bio}</p>}

                    {socials.length > 0 && (
                        <div className="cdp-socials-section">
                            <h2 className="cdp-socials-title">Connect</h2>
                            <ContributorSocials socials={socials} withLabels />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ContributorDetailPage;