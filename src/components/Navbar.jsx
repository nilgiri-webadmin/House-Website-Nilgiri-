import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, MessageCircle } from 'lucide-react';
import './Navbar.css';

const NavDropdown = ({ label, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300);
    };

    return (
        <div
            className="nav-dropdown-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button className="nav-link-btn">
                {label} <ChevronDown size={12} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="nav-dropdown-panel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {items.map((item) => (
                            <Link key={item.path} to={item.path} className="dropdown-item">
                                {item.name}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const studentItems = [
        { name: "Hall of Fame", path: "/achievements" },
        { name: "Community", path: "/community" },
    ];

    return (
        <>
            <nav className={`main-navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="navbar-container">
                    <Link to="/" className="navbar-brand">
                        <span className="brand-main">NILGIRI HOUSE</span>
                        <span className="brand-sub">IIT MADRAS BS</span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="navbar-links-desktop">
                        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
                        <Link to="/council" className={location.pathname === '/council' ? 'active' : ''}>Council</Link>
                        <Link to="/events" className={location.pathname === '/events' ? 'active' : ''}>Events</Link>
                        <Link to="/meetups" className={location.pathname === '/meetups' ? 'active' : ''}>Meetups</Link>
                        <NavDropdown label="Students" items={studentItems} />
                    </div>

                    {/* Actions */}
                    <div className="navbar-actions">
                        <a href="https://forms.gle/2pD2dE5NWqxX57gu8" target="_blank" rel="noreferrer" className="navbar-whatsapp-btn">
                            <MessageCircle size={16} />
                            <span>JOIN PULSE</span>
                        </a>
                        <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu — rendered via Portal to avoid nav overflow clipping */}
            {createPortal(
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            className="navbar-mobile-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'tween', duration: 0.2 }}
                        >
                            <div className="mobile-menu-header">
                                <span className="mobile-menu-title">MENU</span>
                                <button onClick={() => setMobileOpen(false)}><X size={24} /></button>
                            </div>
                            <div className="mobile-menu-links">
                                <Link to="/" onClick={() => setMobileOpen(false)}>HOME</Link>
                                <Link to="/council" onClick={() => setMobileOpen(false)}>COUNCIL</Link>
                                <Link to="/events" onClick={() => setMobileOpen(false)}>EVENTS</Link>
                                <Link to="/meetups" onClick={() => setMobileOpen(false)}>MEETUPS</Link>
                                <Link to="/achievements" onClick={() => setMobileOpen(false)}>HALL OF FAME</Link>
                                <Link to="/community" onClick={() => setMobileOpen(false)}>COMMUNITY</Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default Navbar;
