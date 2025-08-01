import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, Transition } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// --- Custom Hook to detect screen size ---
const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isButtonVisible, setIsButtonVisible] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const springTransition: Transition = {
        type: "spring",
        stiffness: 300,
        damping: 30,
    };

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        const handleMouseMove = () => {
            setIsButtonVisible(true);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setIsButtonVisible(false), 2000); // Hide after 2 seconds of inactivity
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
            <motion.div
                className="flex-1 flex flex-col"
                initial={false}
                animate={{ marginLeft: isDesktop ? (isOpen ? '17rem' : '5rem') : '0' }}
                transition={springTransition}
            >
                <Header />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`hidden md:block fixed z-50 top-1/2 -translate-y-1/2 -ml-3.5 bg-white p-1.5 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 ${isButtonVisible ? 'opacity-100' : 'opacity-0'}`}
                        aria-label="Toggle sidebar"
                        style={{ transition: 'opacity 0.3s' }}
                    >
                        {isOpen ? <ChevronLeftIcon className="h-4 w-4 text-gray-600" /> : <ChevronRightIcon className="h-4 w-4 text-gray-600" />}
                    </button>
                    {children}
                </main>
                <footer className="bg-white p-4 shadow-inner text-center text-gray-600">
                    &copy; 2025 Your Company. All rights reserved.
                </footer>
            </motion.div>
        </div>
    );
};

export default MainLayout;