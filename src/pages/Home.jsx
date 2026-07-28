import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import Communities from '../components/Communities';
import Events from '../components/Events';
import Meetups from '../components/Meetups';
import Achievements from '../components/Achievements';
import VideoFeed from '../components/VideoFeed';
import JoinWhatsApp from '../components/JoinWhatsApp';
import GlobeScrollDemo from '../components/landing-page';

const Home = () => {
    return (
        <div className="bg-black">
            <div className="text-center text-white p-10">
                <h1>HOME PAGE MODIFICATION TEST</h1>
                <p>If you can see this, the home page is being rendered correctly.</p>
            </div>
            <Hero />

            {/* Globe animation landing page section */}
            <GlobeScrollDemo />

            {/* These components are now in preview mode for the Home page */}
            <VideoFeed />
            <Events isPreview={true} />
            <Meetups isPreview={true} />
            <Achievements isPreview={true} />

            {/* Communities carousel section */}
            <Communities />

            {/* Community page link for more details */}
            <div className="py-20 flex flex-col items-center">
                <Link to="/community" className="explore-button-animated mb-10">
                    EXPLORE ALL COMMUNITIES
                </Link>
            </div>

            <JoinWhatsApp />
        </div>
    );
};

export default Home;