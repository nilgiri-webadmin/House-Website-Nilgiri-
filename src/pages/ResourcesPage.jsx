import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Database, AlignLeft } from 'lucide-react';
import client from '../api/client';

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
        <div className="page-container bg-black min-h-screen text-white pb-20 pt-24 px-6 md:px-12">
            
            {/* Header Section */}
            <motion.div 
                className="max-w-4xl mx-auto mb-16 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-emerald-500/50"></div>
                    <span className="font-mono text-[0.65rem] tracking-[0.3em] text-emerald-400 uppercase">
                        Knowledge Base
                    </span>
                    <div className="h-[1px] w-8 bg-emerald-500/50"></div>
                </div>
                
                <h1 className="font-bebas text-5xl md:text-7xl mb-6 tracking-wide text-white">
                    All your resources in one place
                </h1>
                
                <div className="text-gray-400 font-mono text-sm leading-relaxed max-w-3xl mx-auto space-y-4 text-left md:text-center">
                    <p>
                        Welcome to Nilgiri House! We've gathered an extensive collection of student resources from the entire community to cater to all your needs related to this degree. 
                        By accessing the official links below, you'll gain access to all resources provided directly by IITM. These are curated to ensure their relevance and authenticity.
                    </p>
                    <p>
                        Among our unique offerings is the course-wise question paper collection, unparalleled among all IITM resources. With this feature, you can easily find the question papers specific to your course, eliminating the need for tedious scrolling. 
                        Additionally, we provide access to student-made notes and other unofficial resources that have proven to be valuable supplements for academic success.
                    </p>
                    <p className="text-emerald-400">
                        Join us at Nilgiri House and explore the world of invaluable resources tailored to enhance your learning experience!
                    </p>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <span className="font-mono text-xs tracking-[0.5em] text-emerald-400/40 uppercase animate-pulse">Loading Resources</span>
                </div>
            ) : Object.keys(categorizedLinks).length === 0 ? (
                <div className="text-center py-20 border border-white/5 font-mono text-xs tracking-widest uppercase text-gray-500">
                    The archives are currently empty. Check back soon.
                </div>
            ) : (
                <div className="max-w-6xl mx-auto space-y-16">
                    {Object.entries(categorizedLinks).sort().map(([section, subsections]) => {
                        const color = catColors[section] || '#34d399';
                        return (
                            <motion.div 
                                key={section}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-lg" style={{ background: `${color}15`, color: color }}>
                                        <Database size={20} />
                                    </div>
                                    <h2 className="font-bebas text-4xl tracking-wider" style={{ color: color }}>{section}</h2>
                                </div>

                                <div className="space-y-10 pl-2 md:pl-14">
                                    {Object.entries(subsections).sort().map(([subsection, items]) => (
                                        <div key={subsection}>
                                            {subsection !== 'General' && (
                                                <h3 className="font-mono text-[0.8rem] tracking-widest uppercase text-gray-400 mb-4 flex items-center gap-2">
                                                    <BookOpen size={14} className="text-gray-500" />
                                                    {subsection}
                                                </h3>
                                            )}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {items.map((link) => (
                                                    <a 
                                                        key={link.id} 
                                                        href={link.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="group block p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 hover:border-white/10 relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 left-0 w-1 h-full scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300" style={{ background: color }}></div>
                                                        
                                                        <div className="flex justify-between items-start mb-3">
                                                            <h4 className="font-bebas text-xl tracking-wide text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{link.title}</h4>
                                                            <ExternalLink size={16} className="text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-3" />
                                                        </div>
                                                        
                                                        {link.description && (
                                                            <div className="flex items-start gap-2 mt-2">
                                                                <AlignLeft size={12} className="text-gray-600 mt-1 flex-shrink-0" />
                                                                <p className="font-mono text-[0.65rem] text-gray-400 leading-relaxed line-clamp-2">
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
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ResourcesPage;
