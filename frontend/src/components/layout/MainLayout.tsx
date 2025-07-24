import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, Transition } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// --- Custom Hook to detect screen size ---
const useMediaQuery = (query: string) => {
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
    // Use the hook to check if we're on a desktop-sized screen (Tailwind's 'md' breakpoint is 768px)
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const springTransition: Transition = {
        type: "spring",
        stiffness: 300,
        damping: 30,
    };

    return (
        <div className="flex bg-gray-100 min-h-screen">
            {/* The Sidebar now receives the setter function to close itself on mobile */}
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            {/* Wrapper for Header and Main Content */}
            <motion.div
                className="flex-1 flex flex-col"
                initial={false}
                // Animate marginLeft only on desktop
                animate={{ marginLeft: isDesktop ? (isOpen ? '17rem' : '5rem') : '0' }}
                transition={springTransition}
            >
                <Header />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
                    {/* The desktop toggle button, now hidden on mobile */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="hidden md:block absolute z-50 top-1/2 -translate-y-1/2 -ml-3.5 bg-white p-1.5 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50"
                        aria-label="Toggle sidebar"
                    >
                        {isOpen ? (
                            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                        ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                        )}
                    </button>
                    {children}
                </main>
            </motion.div>
        </div>
    );
};

export default MainLayout;