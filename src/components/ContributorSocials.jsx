import React from 'react';
import { Github, Linkedin, Globe, Instagram, Twitter, Youtube, Mail, MessagesSquare, Send, Phone, Link2, PenLine, Music2 } from 'lucide-react';

const PLATFORM_ICONS = {
    github: Github,
    gitlab: Github,
    linkedin: Linkedin,
    portfolio: Globe,
    website: Globe,
    web: Globe,
    instagram: Instagram,
    twitter: Twitter,
    x: Twitter,
    youtube: Youtube,
    email: Mail,
    mail: Mail,
    discord: MessagesSquare,
    telegram: Send,
    whatsapp: Phone,
    medium: PenLine,
    spotify: Music2
};

const getPlatformLabel = (platform = '') => {
    const key = String(platform).toLowerCase().trim();
    const label = key.replace(/[-_]/g, ' ');
    if (['portfolio', 'website', 'web'].includes(key)) return 'Website';
    if (label) return label.charAt(0).toUpperCase() + label.slice(1);
    return 'Link';
};

const ContributorSocials = ({ socials = [], withLabels = false, className = '' }) => {
    if (!socials.length) return null;

    if (withLabels) {
        return (
            <div className={`contributor-socials-labeled ${className}`}>
                {socials.map((s, i) => (
                    <a
                        key={`${s.platform}-${i}`}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contributor-social-chip"
                    >
                        {(() => {
                            const Icon = PLATFORM_ICONS[s.platform?.toLowerCase().trim()] || Link2;
                            return <Icon size={16} />;
                        })()}
                        <span>{getPlatformLabel(s.platform)}</span>
                    </a>
                ))}
            </div>
        );
    }

    return (
        <div className={`contributors-socials ${className}`}>
            {socials.map((s, i) => (
                <a
                    key={`${s.platform}-${i}`}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={getPlatformLabel(s.platform)}
                >
                    {(() => {
                        const Icon = PLATFORM_ICONS[s.platform?.toLowerCase().trim()] || Link2;
                        return <Icon size={14} />;
                    })()}
                </a>
            ))}
        </div>
    );
};

export default ContributorSocials;