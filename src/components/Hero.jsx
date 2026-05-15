import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Hero.css';
import mask1 from '../assets/mask1.png';
import mask2 from '../assets/mask2.png';
import TubeCursor from './TubeCursor';

const Hero = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {

        const timer1 = setTimeout(() => setStep(1), 500);
        const timer2 = setTimeout(() => setStep(2), 3500);
        const timer3 = setTimeout(() => setStep(3), 4500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    return (
        <div className="hero-container" id="home">
            <TubeCursor />
            <AnimatePresence mode='wait'>
                {step === 1 && (
                    <motion.h1
                        key="text1"
                        className="masked-text window-frame"
                        style={{ backgroundImage: `url(${mask1})` }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
                        Welcome To
                    </motion.h1>
                )}

                {step === 3 && (
                    <motion.h1
                        key="text2"
                        className="masked-text window-frame"
                        style={{ backgroundImage: `url(${mask2})` }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
                        Nilgiri House
                    </motion.h1>
                )}
            </AnimatePresence>

            {step === 3 && (
                <motion.div
                    className="scroll-indicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    style={{ position: 'absolute', bottom: '2rem', color: '#fff', fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}
                >
                    Scroll to Explore
                </motion.div>
            )}
        </div>
    );
};

export default Hero;
