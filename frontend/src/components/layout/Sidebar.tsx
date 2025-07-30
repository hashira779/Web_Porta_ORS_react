import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
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
    Bars3Icon,
    MapPinIcon,
    FolderOpenIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    permission: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    }, [location, setIsOpen]);

    const navItems: NavItem[] = [
        { to: "/dashboard", icon: ChartBarIcon, label: "Dashboard", permission: "view_dashboard" },
        { to: "/reports", icon: PresentationChartBarIcon, label: " Daily Report", permission: "daily_report" },
        { to: "/admin", icon: UserGroupIcon, label: "Admin", permission: "access_admin" },
        { to: "/settings", icon: Cog6ToothIcon, label: "Settings", permission: "edit_settings" },
        { to: "/assign", icon: FolderOpenIcon, label: "Area Assignments", permission: "assign_areas" },
        { to: "/StationAssignmentsPage", icon: MapPinIcon, label: "Station Assignments", permission: "assign_stations" },
        { to: "/notifications", icon: BellIcon, label: "Notifications", permission: "all" },
        { to: "/help", icon: QuestionMarkCircleIcon, label: "Help", permission: "all" }
    ];

    // --- UPDATED: Added a special rule for the 'admin' role ---
    const filteredNavItems = useMemo(() => {
        if (!currentUser) return [];

        // If the user's role is 'admin', show them everything.
        if (currentUser.role?.name === 'admin') {
            return navItems;
        }

        // For all other roles, check their specific permissions.
        const userPermissions = new Set(currentUser.role.permissions.map(p => p.name));
        return navItems.filter(item =>
            item.permission === 'all' || userPermissions.has(item.permission)
        );
    }, [currentUser]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getInitials = (name: string = '') => {
        return name ? name.substring(0, 2).toUpperCase() : '?';
    };

    const springTransition: Transition = {
        type: "spring", stiffness: 300, damping: 30, restDelta: 0.001
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                aria-label={isOpen ? "Close menu" : "Open menu"}
                className="md:hidden fixed top-4 left-4 z-50 bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="md:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isOpen ? '18rem' : '4.5rem',
                    boxShadow: isHovered && !isOpen ? '0 0 25px rgba(99, 102, 241, 0.2)' : 'none'
                }}
                transition={springTransition}
                className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col z-40
                   ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} border-r border-gray-700/30`}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                {/* Header */}
                <div className="flex items-center justify-center px-4 py-6 border-b border-gray-700/50 h-[80px]">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md">
                            <ChartBarIcon className="h-6 w-6 text-white" />
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex flex-col"
                                >
                                    <span className="text-xl font-bold text-white tracking-tight">Portal</span>
                                    <span className="text-xs text-indigo-300">v2.4.1</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-grow px-3 py-6 overflow-y-auto">
                    <ul className="space-y-1.5">
                        {filteredNavItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center py-3 rounded-xl transition-all duration-300 relative group ${
                                            isActive
                                                ? "bg-indigo-600 text-white shadow-lg"
                                                : "text-gray-200 hover:bg-indigo-700/50 hover:text-white"
                                        } ${isOpen ? 'px-4' : 'justify-center px-0'}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className="relative">
                                                <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                                                {!isOpen && (
                                                    <motion.span
                                                        className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: isHovered ? 1 : 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </div>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.span
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="ml-3 text-sm font-medium tracking-wide"
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
                <div className={`p-4 border-t border-gray-700/50 ${isOpen ? 'px-4' : 'flex justify-center flex-col items-center'}`}>
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
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
                                    <div className="text-sm font-medium text-white tracking-wide">{currentUser.username}</div>
                                    <div className="text-xs text-gray-300 capitalize">{currentUser.role?.name || 'User'}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={handleLogout}
                        className={`w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium py-2.5 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                            isOpen ? 'px-4' : 'px-2'
                        }`}
                        aria-label="Logout"
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="ml-3 text-sm font-medium"
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