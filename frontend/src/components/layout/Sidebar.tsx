import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    ShieldExclamationIcon,
    ChevronDownIcon,
    ChevronUpIcon,
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
    subItems?: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const navItems: NavItem[] = [
        { to: "/dashboard", icon: ChartBarIcon, label: "Dashboard", permission: "view_dashboard" },
        {
            to: "/reports",
            icon: PresentationChartBarIcon,
            label: "Reports",
            permission: "view_reports",
            subItems: [
                { to: "/reports/DailyReport", icon: ChartBarIcon, label: "Daily1", permission: "view_daily_reports" },
                { to: "/reports/monthly", icon: ChartBarIcon, label: "Monthly", permission: "view_monthly_reports" },
                { to: "/reports/yearly", icon: ChartBarIcon, label: "Yearly", permission: "view_yearly_reports" },
                { to: "/reports/custom", icon: ChartBarIcon, label: "Custom", permission: "view_custom_reports" },
                { to: "/reports/TelegramReport", icon: ChartBarIcon, label: "TelegramReport", permission: "view_telegram_reports" },
            ]
        },
        { to: "/admin", icon: UserGroupIcon, label: "Admin", permission: "access_admin" },
        { to: "/settings", icon: Cog6ToothIcon, label: "Settings", permission: "edit_settings" },
        { to: "/assignments/areas", icon: FolderOpenIcon, label: "Area Assignments", permission: "assign_areas" },
        { to: "/assignments/stations", icon: MapPinIcon, label: "Station Assignments", permission: "assign_stations" },
        { to: "/sessions", icon: ShieldExclamationIcon, label: "Sessions", permission: "manage_sessions" },
        { to: "/notifications", icon: BellIcon, label: "Notifications", permission: "view_notifications" },
        { to: "/help", icon: QuestionMarkCircleIcon, label: "Help", permission: "all" }
    ];

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsOpen(false); // Hide on mobile
            } else {
                setIsOpen(true); // Show on desktop
            }
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsOpen]);

    useEffect(() => {
        const newExpandedItems = { ...expandedItems };
        navItems.forEach(item => {
            if (item.subItems && item.subItems.some(subItem => location.pathname.startsWith(subItem.to))) {
                newExpandedItems[item.label] = true;
            }
        });
        setExpandedItems(newExpandedItems);
    }, [location.pathname]);

    const filteredNavItems = useMemo(() => {
        if (!currentUser) return [];

        if (currentUser.role?.name === 'admin') return navItems;

        const userPermissions = new Set(currentUser.role?.permissions?.map(p => p.name) || []);
        return navItems.filter(item => {
            if (item.permission === 'all') return true;

            const hasPermission = userPermissions.has(item.permission);
            if (item.subItems) {
                item.subItems = item.subItems.filter(sub =>
                    sub.permission === 'all' || userPermissions.has(sub.permission)
                );
                return hasPermission || item.subItems.length > 0;
            }
            return hasPermission;
        });
    }, [currentUser]);

    const toggleExpand = (label: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const isItemActive = (item: NavItem) =>
        location.pathname === item.to ||
        item.subItems?.some(subItem => location.pathname === subItem.to);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : '?';

    return (
        <>
            {filteredNavItems.length > 0 && (
                <button
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    className="fixed top-4 left-4 z-50 bg-indigo-700 p-2.5 rounded-xl text-white shadow-lg transition-all duration-200 md:hidden"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{
                    width: isOpen ? (window.innerWidth >= 768 ? '18rem' : '18rem') : (window.innerWidth >= 768 ? '5rem' : '0'),
                    opacity: isOpen ? 1 : (window.innerWidth >= 768 ? 1 : 0),
                    pointerEvents: isOpen || window.innerWidth >= 768 ? 'auto' : 'none'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col z-40 border-r border-gray-800/50 overflow-hidden"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <div className="flex items-center justify-center px-4 py-6 border-b border-gray-800/50 h-[80px]">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-700 rounded-xl shadow-md">
                            <ChartBarIcon className="h-6 w-6 text-white" />
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                    <span className="text-xl font-bold text-white tracking-tight">Portal</span>
                                    <span className="text-xs text-indigo-400">v2.4.1</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <nav className="flex-grow px-3 py-6 overflow-y-auto">
                    <ul className="space-y-2">
                        {filteredNavItems.map(item => (
                            <li key={item.to}>
                                {item.subItems ? (
                                    <>
                                        <button
                                            onClick={() => toggleExpand(item.label)}
                                            className={`group relative flex items-center transition-all duration-200 rounded-xl w-full ${
                                                isItemActive(item)
                                                    ? "bg-indigo-700 text-white shadow-md"
                                                    : "text-gray-400 hover:bg-indigo-800/50 hover:text-gray-100"
                                            } ${isOpen ? "px-4 py-3" : "w-14 h-14 mx-auto justify-center"}`}
                                        >
                                            <div className={`flex items-center ${isOpen ? "space-x-3" : "justify-center w-full h-full"}`}>
                                                <item.icon className="h-6 w-6" />
                                                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                                            </div>
                                            {!isOpen && window.innerWidth >= 768 && (
                                                <motion.span
                                                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: isHovered ? 1 : 0 }}
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                            {isOpen && (
                                                expandedItems[item.label]
                                                    ? <ChevronUpIcon className="h-5 w-5 ml-auto text-gray-400" />
                                                    : <ChevronDownIcon className="h-5 w-5 ml-auto text-gray-400" />
                                            )}
                                        </button>
                                        <AnimatePresence>
                                            {expandedItems[item.label] && isOpen && (
                                                <motion.ul
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="ml-10 space-y-1 mt-2"
                                                >
                                                    {item.subItems.map(subItem => (
                                                        <li key={subItem.to}>
                                                            <NavLink
                                                                to={subItem.to}
                                                                className={({ isActive }) =>
                                                                    `flex items-center py-2 px-4 rounded-lg text-sm transition-all duration-200 ${
                                                                        isActive
                                                                            ? "bg-indigo-800/40 text-white"
                                                                            : "text-gray-500 hover:bg-indigo-800/30 hover:text-gray-200"
                                                                    }`
                                                                }
                                                            >
                                                                <subItem.icon className="h-5 w-5 mr-3" />
                                                                {subItem.label}
                                                            </NavLink>
                                                        </li>
                                                    ))}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ) : (
                                    <NavLink
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `group relative flex items-center transition-all duration-200 rounded-xl ${
                                                isActive
                                                    ? "bg-indigo-700 text-white shadow-md"
                                                    : "text-gray-400 hover:bg-indigo-800/50 hover:text-gray-100"
                                            } ${isOpen ? "px-4 py-3" : "w-14 h-14 mx-auto justify-center"}`
                                        }
                                    >
                                        <div className={`flex items-center ${isOpen ? "space-x-3" : "justify-center w-full h-full"}`}>
                                            <item.icon className="h-6 w-6" />
                                            {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                                        </div>
                                        {!isOpen && window.innerWidth >= 768 && (
                                            <motion.span
                                                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: isHovered ? 1 : 0 }}
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                        {isItemActive(item) && !isOpen && window.innerWidth >= 768 && (
                                            <motion.span
                                                className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 500 }}
                                            />
                                        )}
                                    </NavLink>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                {currentUser && (
                    <div className={`p-4 border-t border-gray-800/50 ${isOpen ? '' : 'flex flex-col items-center gap-4'}`}>
                        <div className={`flex items-center ${isOpen ? 'mb-4' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center text-white font-semibold shadow-md">
                                {getInitials(currentUser?.username)}
                            </div>
                            {isOpen && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="ml-3">
                                    <div className="text-sm font-medium text-white">{currentUser.username}</div>
                                    <div className="text-xs text-gray-400 capitalize">{currentUser.role?.name || 'User'}</div>
                                </motion.div>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className={`bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                isOpen ? 'w-full px-4' : 'w-14 h-14'
                            }`}
                        >
                            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                            {isOpen && <span className="ml-3 text-sm font-medium">Logout</span>}
                        </button>
                    </div>
                )}
            </motion.aside>
        </>
    );
};

export default Sidebar;