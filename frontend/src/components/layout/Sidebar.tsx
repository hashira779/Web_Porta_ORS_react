import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {motion, AnimatePresence, Transition} from 'framer-motion';
import authService from '../../services/auth.service';
import {
    ChartBarIcon,
    PresentationChartBarIcon,
    UserGroupIcon,
    ArrowLeftOnRectangleIcon,
    Cog6ToothIcon,
    BellIcon,
    QuestionMarkCircleIcon,
    XMarkIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';

interface CurrentUser {
    username: string;
    role?: { name: string };
}

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    adminOnly?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    // Close sidebar when navigating on mobile
    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    }, [location, setIsOpen]);

    const navItems: NavItem[] = [
        { to: "/dashboard", icon: ChartBarIcon, label: "Dashboard" },
        { to: "/reports", icon: PresentationChartBarIcon, label: "Reports" },
        { to: "/admin", icon: UserGroupIcon, label: "Admin", adminOnly: true },
        { to: "/settings", icon: Cog6ToothIcon, label: "Settings", adminOnly: true },
        { to: "/notifications", icon: BellIcon, label: "Notifications" },
        { to: "/help", icon: QuestionMarkCircleIcon, label: "Help" }
    ];

    const filteredNavItems = navItems.filter(item =>
        !item.adminOnly || currentUser?.role?.name === 'admin'
    );

    const getInitials = (name: string = '') => {
        return name ? name.substring(0, 2).toUpperCase() : '?';
    };

    // Properly typed spring transition
    const springTransition: Transition = {
        type: "spring",
        stiffness: 300,
        damping: 30,
        restDelta: 0.001
    };


    return (
        <>
            {/* Mobile menu button */}
            <button
                aria-label={isOpen ? "Close menu" : "Open menu"}
                className="md:hidden fixed top-4 left-4 z-50 bg-indigo-700 p-2 rounded-lg text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="md:hidden fixed inset-0 bg-black/30 z-30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isOpen ? '17rem' : '5rem',
                    boxShadow: isHovered && !isOpen ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none'
                }}
                transition={springTransition}
                className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col z-40
                   ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                aria-label="Sidebar"
            >
                {/* Header */}
                <div className="flex items-center justify-center px-4 py-5 border-b border-gray-700 h-[77px]">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex flex-col"
                                >
                                    <span className="text-xl font-bold text-white">Portal</span>
                                    <span className="text-xs text-indigo-300">v2.4.1</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-grow px-3 py-6 overflow-y-auto">
                    <ul className="space-y-1">
                        {filteredNavItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center py-3 rounded-lg transition-all duration-300 relative ${
                                            isActive
                                                ? "bg-indigo-600/90 text-white shadow-md"
                                                : "text-gray-300 hover:bg-indigo-600/30 hover:text-white"
                                        } ${isOpen ? 'px-4' : 'justify-center px-0'}`
                                    }
                                    aria-current={location.pathname === item.to ? "page" : undefined}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.span
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="ml-3 text-sm font-medium"
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                            {isActive && !isOpen && (
                                                <motion.span
                                                    className="absolute right-2 w-2 h-2 bg-indigo-400 rounded-full"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 500 }}
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User profile and logout */}
                <div className={`p-4 border-t border-gray-700 ${isOpen ? 'px-4' : 'flex justify-center flex-col items-center'}`}>
                    <div className="flex items-center mb-4">
                        <div
                            className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold"
                            aria-label="User avatar"
                        >
                            {getInitials(currentUser?.username)}
                        </div>
                        <AnimatePresence>
                            {isOpen && currentUser && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="ml-3"
                                >
                                    <div className="text-sm font-medium text-white">{currentUser.username}</div>
                                    <div className="text-xs text-gray-400">{currentUser.role?.name || 'User'}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => authService.logout()}
                        className={`w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                            isOpen ? 'px-4' : 'px-2'
                        }`}
                        aria-label="Logout"
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="ml-3 text-sm"
                                >
                                    Logout
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;