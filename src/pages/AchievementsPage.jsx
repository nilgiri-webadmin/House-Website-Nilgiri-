import React from 'react';
import Achievements from '../components/Achievements';

const AchievementsPage = () => {
    return (
        <div className="bg-black min-h-screen pt-24">
                <Achievements isPreview={false} />
        </div>
    );
};

export default AchievementsPage;
