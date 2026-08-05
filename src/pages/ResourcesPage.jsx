import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, Database, AlignLeft } from 'lucide-react';
import client from '../api/client';
import './ResourcesPage.css';

const ResourcesPage = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await client.get('/links?limit=500');
                setLinks(response.data.links || []);
            } catch (error) {
                console.error("Failed to fetch resources:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, []);

    // Group links by Section -> Subsection
    const categorizedLinks = links.reduce((acc, link) => {
        const parts = (link.category || 'Other').split(' > ');
        const section = parts[0].trim();
        const subsection = parts[1] ? parts[1].trim() : 'General';

        if (!acc[section]) acc[section] = {};
        if (!acc[section][subsection]) acc[section][subsection] = [];
        
        acc[section][subsection].push(link);
        return acc;
    }, {});

    const catColors = {
        Academics: '#a78bfa',
        Official: '#f59e0b',
        Community: '#f87171',
        Extracurriculars: '#34d399',
        Forms: '#60a5fa',
        Other: '#a1a1aa'
    };

    return (
        <div className="resources-page">
            <div className="resources-header-wrapper section-header">
                <span className="section-tag">Knowledge Base</span>
                <h1 className="section-title">All your resources in one place</h1>
                
                <div className="resources-intro-text">
                    <p>
                        Welcome to Nilgiri House! We've gathered an extensive collection of student resources from the entire community to cater to all your needs related to this degree. 
                        By accessing the official links below, you'll gain access to all resources provided directly by IITM. These are curated to ensure their relevance and authenticity.
                    </p>
                    <p>
                        Among our unique offerings is the course-wise question paper collection, unparalleled among all IITM resources. With this feature, you can easily find the question papers specific to your course, eliminating the need for tedious scrolling. 
                        Additionally, we provide access to student-made notes and other unofficial resources that have proven to be valuable supplements for academic success.
                    </p>
                    <p className="resources-intro-highlight">
                        Join us at Nilgiri House and explore the world of invaluable resources tailored to enhance your learning experience!
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="resources-loading">
                    Loading Resources...
                </div>
            ) : Object.keys(categorizedLinks).length === 0 ? (
                <div className="resources-empty">
                    The archives are currently empty. Check back soon.
                </div>
            ) : (
                <div className="resources-container">
                    {Object.entries(categorizedLinks).sort().map(([section, subsections]) => {
                        const color = catColors[section] || '#34d399';
                        return (
                            <div key={section} className="resource-section">
                                <div className="resource-section-header">
                                    <div className="resource-section-icon" style={{ background: `${color}15`, color: color }}>
                                        <Database size={20} />
                                    </div>
                                    <h2 className="resource-section-title" style={{ color: color }}>{section}</h2>
                                </div>

                                <div className="resource-subsections">
                                    {Object.entries(subsections).sort().map(([subsection, items]) => (
                                        <div key={subsection}>
                                            {subsection !== 'General' && (
                                                <h3 className="resource-subsection-title">
                                                    <BookOpen size={14} />
                                                    {subsection}
                                                </h3>
                                            )}
                                            
                                            <div className="resource-grid">
                                                {items.map((link) => (
                                                    <a 
                                                        key={link.id} 
                                                        href={link.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="resource-card"
                                                    >
                                                        <div className="resource-card-accent" style={{ background: color }}></div>
                                                        
                                                        <div className="resource-card-header">
                                                            <h4 className="resource-card-title">{link.title}</h4>
                                                            <ExternalLink size={16} className="resource-card-icon" style={{ '--hover-color': color }} />
                                                        </div>
                                                        
                                                        {link.description && (
                                                            <div className="resource-card-desc-wrap">
                                                                <AlignLeft size={12} className="resource-card-desc-icon" />
                                                                <p className="resource-card-desc">
                                                                    {link.description}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ResourcesPage;
