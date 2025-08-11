import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, Transition } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import useWebSocketNotifications from '../../hooks/useWebSocketNotifications';
import TerminationModal from '../common/TerminationModal';

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
    // --- State for the new termination modal ---
    const [isTerminationModalOpen, setTerminationModalOpen] = useState(false);
    const [terminationMessage, setTerminationMessage] = useState('');

    const showTerminationModal = (message: string) => {
        setTerminationMessage(message);
        setTerminationModalOpen(true);
    };

    // Initialize the WebSocket hook and pass it the function to call when a session is terminated
    useWebSocketNotifications(showTerminationModal);

    // --- Original state for the sidebar layout ---
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
            timeoutId = setTimeout(() => setIsButtonVisible(false), 2000);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        if (!isDesktop) {
            setIsOpen(false); // Hide on mobile
        } else {
            setIsOpen(true); // Show on desktop
        }
    }, [isDesktop]);

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
            <motion.div
                className="flex-1 flex flex-col"
                initial={false}
                animate={{ marginLeft: isDesktop ? (isOpen ? '18rem' : '5rem') : '0' }}
                transition={springTransition}
            >
                <Header />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
                    {isDesktop ? (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`fixed z-30 top-1/2 -translate-y-1/2 -ml-3.5 bg-white p-1.5 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 ${isButtonVisible ? 'opacity-100' : 'opacity-0'}`}
                            aria-label="Toggle sidebar"
                            style={{ transition: 'opacity 0.3s' }}
                        >
                            {isOpen ? <ChevronLeftIcon className="h-4 w-4 text-gray-600" /> : <ChevronRightIcon className="h-4 w-4 text-gray-600" />}
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="fixed top-4 left-4 z-30 bg-indigo-700 p-2.5 rounded-xl text-white shadow-lg transition-all duration-200"
                            aria-label="Toggle sidebar"
                        >
                            {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                        </button>
                    )}
                    {children}
                </main>
                <footer className="bg-white p-4 shadow-inner text-center text-gray-600">
                    &copy; 2025 Your Company. All rights reserved.
                </footer>
            </motion.div>

            {/* --- Render the modal here --- */}
            <TerminationModal
                isOpen={isTerminationModalOpen}
                message={terminationMessage}
            />
        </div>
    );
};

export default MainLayout;