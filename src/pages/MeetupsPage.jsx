import React from 'react';
import Meetups from '../components/Meetups';

const MeetupsPage = () => {
    return (
        <div className="bg-black min-h-screen pt-24">
                <Meetups isPreview={false} eventType="upcoming" />
                <Meetups isPreview={false} eventType="past" />
        </div>
    );
};

export default MeetupsPage;
