import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Settings, LogIn, Youtube, Instagram, Linkedin, ExternalLink } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-section">
            <div className="footer-glow"></div>
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-brand">
                        <div className="brand-logo">
                            <span className="logo-text">NILGIRI HOUSE</span>
                            <span className="logo-subtext">IIT Madras BS Degree</span>
                        </div>
                        <p className="brand-desc">
                            A vibrant college house providing an enriching environment for students to learn, grow, and build lasting connections in the digital frontier.
                        </p>
                        <div className="footer-socials">
                            <a href="https://www.youtube.com/@nilgirihouseiitm" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={20} /></a>
                            <a href="https://www.instagram.com/nilgirihouse_iitm/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="https://www.linkedin.com/company/nilgiri-house-iit-madras" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-column">
                        <h3>Quick Navigation</h3>
                        <ul className="footer-links">
                            <li><a href="#home">Home Base</a></li>
                            <li><a href="#about">Our Story</a></li>
                            <li><a href="#events">Active Ops</a></li>
                            <li><a href="#meetups">Pulse Gatherings</a></li>
                            <li><a href="#community">The Tribe</a></li>
                            <li><a href="#council">High Council</a></li>
                        </ul>
                    </div>

                    {/* Resource Hub */}
                    <div className="footer-column">
                        <h3>Resource Hub</h3>
                        <ul className="footer-links">
                            <li><a href="https://docs.google.com/document/d/e/2PACX-1vSUvKzH7yIXNVwUgRYSIT8M0x1jhFSkslEtj9UPo3dtWI_sJ38Hh_PzbBygpF0vIOo8K7lTy-uYkqdu/pub" target="_blank" rel="noreferrer">DS Grading Doc <ExternalLink size={12} /></a></li>
                            <li><a href="https://docs.google.com/document/u/1/d/e/2PACX-1vRxGnnDCVAO3KX2CGtMIcJQuDrAasVk2JHbDxkjsGrTP5ShhZK8N6ZSPX89lexKx86QPAUswSzGLsOA/pub" target="_blank" rel="noreferrer">Student Handbook <ExternalLink size={12} /></a></li>
                            <li><a href="https://forms.gle/NQkWj5p8146CPuCBA" target="_blank" rel="noreferrer">Grievance Redressal <ExternalLink size={12} /></a></li>
                            <li><a href="https://drive.google.com/file/d/1_vslwUdBNFCH6DSTLeVlqvX5Rtw57gSD/view" target="_blank" rel="noreferrer">Academic Calendar <ExternalLink size={12} /></a></li>
                        </ul>
                    </div>

                    {/* Contact & Admin */}
                    <div className="footer-column">
                        <h3>Communications</h3>
                        <div className="contact-item">
                            <Mail size={16} className="contact-icon" />
                            <a href="mailto:nilgiri-webad@ds.study.iitm.ac.in">nilgiri-webad@ds.study.iitm.ac.in</a>
                        </div>
                        <div className="admin-access">
                            <Link to="/login" className="admin-btn">
                                <Settings size={14} />
                                <span>ADMIN PORTAL</span>
                            </Link>
                            <p className="webops-credit">Made by Nilgiri WebOps team ❤️</p>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} NILGIRI HOUSE. DESIGNED FOR THE ELITE.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
