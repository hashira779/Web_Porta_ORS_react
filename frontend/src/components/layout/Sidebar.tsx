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

// Type for NavLink className function
type NavLinkClassNameFn = (props: { isActive: boolean }) => string;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    // Auto-close on mobile when navigating
    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    }, [location, setIsOpen]);

    // Auto-expand parent items when child is active
    useEffect(() => {
        const newExpandedItems = { ...expandedItems };
        navItems.forEach(item => {
            if (item.subItems && item.subItems.some(subItem => location.pathname.startsWith(subItem.to))) {
                newExpandedItems[item.label] = true;
            }
        });
        setExpandedItems(newExpandedItems);
    }, [location.pathname]);

    const navItems: NavItem[] = [
        { to: "/dashboard", icon: ChartBarIcon, label: "Dashboard", permission: "view_dashboard" },
        {
            to: "/reports",
            icon: PresentationChartBarIcon,
            label: "Reports",
            permission: "view_reports",
            subItems: [
                { to: "/reports/daily", icon: ChartBarIcon, label: "Daily", permission: "view_daily_reports" },
                { to: "/reports/monthly", icon: ChartBarIcon, label: "Monthly", permission: "view_monthly_reports" },
                { to: "/reports/yearly", icon: ChartBarIcon, label: "Yearly", permission: "view_yearly_reports" },
                { to: "/reports/custom", icon: ChartBarIcon, label: "Custom", permission: "view_custom_reports" },
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

    const filteredNavItems = useMemo(() => {
        if (!currentUser) return [];

        // Admin sees all items
        if (currentUser.role?.name === 'admin') {
            return navItems;
        }

        // Filter based on permissions
        const userPermissions = new Set(currentUser.role?.permissions?.map(p => p.name) || []);
        return navItems.filter(item => {
            if (item.permission === 'all') return true;

            // Check if user has permission for this item
            const hasItemPermission = userPermissions.has(item.permission);

            // Handle items with sub-items
            if (item.subItems) {
                // Filter sub-items based on permissions
                item.subItems = item.subItems.filter(subItem =>
                    subItem.permission === 'all' || userPermissions.has(subItem.permission)
                );

                // Only show parent item if:
                // 1. User has permission for parent OR
                // 2. User has permission for at least one sub-item
                return hasItemPermission || item.subItems.length > 0;
            }

            // For items without sub-items, just check the permission
            return hasItemPermission;
        });
    }, [currentUser]);
    const toggleExpand = (itemLabel: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemLabel]: !prev[itemLabel]
        }));
    };

    const isItemActive = (item: NavItem) => {
        return location.pathname === item.to ||
            (item.subItems && item.subItems.some(subItem =>
                location.pathname.startsWith(subItem.to)
            ));
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getInitials = (name?: string) => {
        return name ? name.substring(0, 2).toUpperCase() : '?';
    };

    // NavLink className function
    const getNavLinkClass: NavLinkClassNameFn = ({ isActive }) => {
        return `flex items-center py-3 rounded-xl transition-all ${
            isActive
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-200 hover:bg-indigo-700/50 hover:text-white"
        } ${isOpen ? 'px-4' : 'justify-center px-0'}`;
    };

    // Sub-item NavLink className function
    const getSubNavLinkClass: NavLinkClassNameFn = ({ isActive }) => {
        return `flex items-center py-2 px-3 rounded-lg text-sm transition-all ${
            isActive
                ? "bg-indigo-700/30 text-white"
                : "text-gray-300 hover:bg-indigo-700/20 hover:text-white"
        }`;
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                aria-label={isOpen ? "Close menu" : "Open menu"}
                className="md:hidden fixed top-4 left-4 z-50 bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg transition-all"
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
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                                {item.subItems ? (
                                    <>
                                        <button
                                            onClick={() => toggleExpand(item.label)}
                                            className={`flex items-center justify-between w-full py-3 rounded-xl transition-all ${
                                                isItemActive(item)
                                                    ? "bg-indigo-600 text-white shadow-lg"
                                                    : "text-gray-200 hover:bg-indigo-700/50 hover:text-white"
                                            } ${isOpen ? 'px-4' : 'justify-center px-0'}`}
                                        >
                                            <div className="flex items-center">
                                                <item.icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                                                {isOpen && (
                                                    <motion.span
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="ml-3 text-sm font-medium"
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </div>
                                            {isOpen && (
                                                expandedItems[item.label] ? (
                                                    <ChevronUpIcon className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDownIcon className="h-4 w-4" />
                                                )
                                            )}
                                        </button>
                                        <AnimatePresence>
                                            {expandedItems[item.label] && isOpen && (
                                                <motion.ul
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="ml-8 space-y-1 mt-1"
                                                >
                                                    {item.subItems.map((subItem) => (
                                                        <li key={subItem.to}>
                                                            <NavLink
                                                                to={subItem.to}
                                                                className={getSubNavLinkClass}
                                                            >
                                                                <subItem.icon className="h-4 w-4 mr-2" />
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
                                        className={getNavLinkClass}
                                    >
                                        <div className="relative">
                                            <item.icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                                            {!isOpen && (
                                                <motion.span
                                                    className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: isHovered ? 1 : 0 }}
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </div>
                                        {isOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="ml-3 text-sm font-medium"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                        {isItemActive(item) && !isOpen && (
                                            <motion.span
                                                className="absolute right-2 w-2 h-2 bg-indigo-400 rounded-full"
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

                {/* User profile and logout */}
                <div className={`p-4 border-t border-gray-700/50 ${isOpen ? 'px-4' : 'flex flex-col items-center'}`}>
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                            {getInitials(currentUser?.username)}
                        </div>
                        {isOpen && currentUser && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="ml-3"
                            >
                                <div className="text-sm font-medium text-white">{currentUser.username}</div>
                                <div className="text-xs text-gray-300 capitalize">{currentUser.role?.name || 'User'}</div>
                            </motion.div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className={`w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium py-2.5 rounded-xl flex items-center justify-center transition-all ${
                            isOpen ? 'px-4' : 'px-2'
                        }`}
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
                        {isOpen && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="ml-3 text-sm font-medium"
                            >
                                Logout
                            </motion.span>
                        )}
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;