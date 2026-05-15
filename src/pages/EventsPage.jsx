import React from 'react';
import Events from '../components/Events';

const EventsPage = () => {
    return (
        <div className="bg-black min-h-screen pt-24">
                <Events isPreview={false} eventType="upcoming" />
                <Events isPreview={false} eventType="past" />
        </div>
    );
};

export default EventsPage;
