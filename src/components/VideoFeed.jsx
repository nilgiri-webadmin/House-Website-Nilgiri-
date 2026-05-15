import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ThreeDCard from './ThreeDCard';
import client from '../api/client';
import './VideoFeed.css';

const VideoFeed = () => {
    const [activeVideo, setActiveVideo] = useState(null);
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await client.get('/links?category=Video');
                const data = response.data.links || [];

                if (data.length > 0) {
                    const mapped = await Promise.all(data.map(async (link) => {
                        const videoId = extractYoutubeId(link.url);
                        const title = await fetchYoutubeTitle(videoId);
                        return {
                            id: link.id,
                            title: title || link.title || "Video",
                            desc: link.description || "Stream from Nilgiri House",
                            image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                            videoId: videoId
                        };
                    }));
                    setVideos(mapped);
                } else {
                    setVideos([]);
                }
            } catch (error) {
                console.error("Video fetch failed:", error);
                setVideos([]);
            }
        };
        fetchVideos();
    }, []);

    const fetchYoutubeTitle = async (videoId) => {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const data = await response.json();
            return data.title;
        } catch (error) {
            console.error("Failed to fetch YouTube title:", error);
            return null;
        }
    };

    const extractYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };



    return (
        <section className="video-section" id="videos">
            <motion.div
                className="section-header center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <span className="section-tag">Multimedia</span>
                <h2 className="section-title">Watch Our Stories</h2>
            </motion.div>

            {videos.length === 0 ? (
                <div className="forest-empty-state">
                    <p>The forest is quiet now, come back later to check</p>
                </div>
            ) : (
                <div className="video-grid">
                    {videos.map((vid, idx) => (
                        <motion.div
                            key={vid.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.2 }}
                            viewport={{ once: true }}
                            className="video-card-wrapper"
                            onClick={() => setActiveVideo(vid)}
                        >
                            <ThreeDCard
                                title={vid.title}
                                desc={vid.desc}
                                image={vid.image}
                            />
                            <div className="play-btn">
                                Tap to Watch
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Video Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <motion.div
                        className="video-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveVideo(null)}
                    >
                        <motion.div
                            className="video-modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="modal-close" onClick={() => setActiveVideo(null)}>
                                <X size={32} />
                            </button>
                            <div className="iframe-wrapper">
                                <iframe
                                    src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                                    title={activeVideo.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <div className="modal-info">
                                <h3>{activeVideo.title}</h3>
                                <p>{activeVideo.desc}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default VideoFeed;
