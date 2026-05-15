import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';
import './JoinWhatsApp.css';

const JoinWhatsApp = () => {
    return (
        <section className="join-section">
            <div className="join-bg-glow"></div>
            <div className="join-container">
                <motion.div
                    className="join-card"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
                >
                    <div className="join-icon-wrapper">
                        <MessageCircle size={40} className="whatsapp-icon" />
                        <div className="icon-pulse"></div>
                    </div>

                    <div className="join-text">
                        <h2>Join the WhatsApp Pulse</h2>
                        <p>Get instant signals, mission updates, and stay synchronized with the Nilgiri ecosystem.</p>
                    </div>

                    <div className="join-actions">
                        <a href="https://forms.gle/2pD2dE5NWqxX57gu8" target="_blank" rel="noreferrer" className="join-btn-primary">
                            <span>CONNECT NOW</span>
                            <ArrowRight size={18} />
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default JoinWhatsApp;
