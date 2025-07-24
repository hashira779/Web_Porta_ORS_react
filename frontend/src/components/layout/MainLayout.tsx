import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
// CORRECTED: Import the 'Transition' type
import { motion, Transition } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(true);

    // CORRECTED: Added the 'Transition' type to the constant
    const springTransition: Transition = {
        type: "spring",
        stiffness: 300,
        damping: 30,
    };

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar isOpen={isOpen} />

            <motion.div
                className="flex-1 flex flex-col"
                initial={false}
                animate={{ marginLeft: isOpen ? '17rem' : '5rem' }}
                transition={springTransition}
            >
                <Header />
                <main className="flex-1 p-8 relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute z-50 top-1/2 -translate-y-1/2 -ml-3.5 bg-white p-1.5 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50"
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