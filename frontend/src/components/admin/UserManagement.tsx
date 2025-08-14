import React, { useState, useEffect } from 'react';
import { adminGetAllUsers, adminUpdateUser, adminCreateUser, adminDeleteUser, adminGetRoles } from '../../api/api';
import { User, Role, UserFormData, UserCreate, UserUpdate } from '../../types';
import { AnimatePresence, motion } from 'framer-motion';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    XCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    ShieldCheckIcon,
    FunnelIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/solid';
import UserModal from './UserModal';
import CalSpin from '../common/CalSpin';
import ConfirmationModal from '../common/ConfirmationModal';
import { useNotificationStore } from '../../hooks/useNotification';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const showNotification = useNotificationStore((state) => state.showNotification);

    // Search and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    const filteredUsers = React.useMemo(() =>
        users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [users, searchTerm]);

    // --- THIS IS THE FIX ---
    // Calculate pagination variables in the main component scope
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    // Now use these variables to slice the array for the current page
    const currentUsers = React.useMemo(() => {
        return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    }, [filteredUsers, indexOfFirstUser, indexOfLastUser]);
    // --- END OF FIX ---

    const fetchUsersAndRoles = () => {
        setLoading(true);
        Promise.all([adminGetAllUsers(), adminGetRoles()])
            .then(([usersRes, rolesRes]) => {
                setUsers(usersRes.data);
                setRoles(rolesRes.data);
                setError(null);
            })
            .catch(err => {
                setError("Failed to fetch user data. Please try again later.");
                console.error("Error fetching data:", err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsersAndRoles();
    }, []);

    const handleSave = async (formData: UserFormData) => {
        try {
            if (formData.id) {
                const payload: UserUpdate = {
                    username: formData.username, email: formData.email, role_id: formData.role_id,
                    user_id: formData.user_id, is_active: formData.is_active,
                };
                if (formData.password) payload.password = formData.password;
                await adminUpdateUser(formData.id, payload);
                showNotification('User updated successfully!', 'success');
            } else {
                const payload: UserCreate = {
                    username: formData.username, email: formData.email, password: formData.password,
                    role_id: formData.role_id, user_id: formData.user_id, is_active: formData.is_active,
                };
                await adminCreateUser(payload);
                showNotification('User created successfully!', 'success');
            }
            fetchUsersAndRoles();
            setIsUserModalOpen(false);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "An unexpected error occurred.";
            showNotification(errorMessage, 'error');
            throw err;
        }
    };

    const handleDelete = (user: User) => {
        setUserToDelete(user);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (!userToDelete) return;
        adminDeleteUser(userToDelete.id)
            .then(() => {
                showNotification(`User '${userToDelete.username}' deleted successfully.`, 'success');
                fetchUsersAndRoles();
            })
            .catch(err => {
                const errorMessage = err.response?.data?.detail || "Failed to delete user.";
                showNotification(errorMessage, 'error');
            });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center items-center h-64"
            >
                <CalSpin size="lg" />
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                    <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500" />
                </motion.div>
                <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 text-xl font-semibold text-gray-900"
                >
                    Error loading users
                </motion.h3>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-2 text-sm text-gray-600"
                >
                    {error}
                </motion.p>
                <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchUsersAndRoles} 
                    className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Retry
                </motion.button>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2 xs:space-y-3 sm:space-y-4 lg:space-y-6 p-2 xs:p-3 sm:p-4 lg:p-6"
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="bg-gradient-to-br from-white via-gray-50 to-white rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-lg xs:shadow-xl sm:shadow-2xl border border-gray-200/50 overflow-hidden backdrop-blur-sm"
                style={{
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'
                }}
            >
                {/* Enhanced Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="px-3 py-4 xs:px-4 xs:py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
                    <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="space-y-1 xs:space-y-2 sm:space-y-3"
                        >
                            <div className="flex items-center">
                                <motion.div
                                    whileHover={{ rotate: 360, scale: 1.1 }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                    className="p-1.5 xs:p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg xs:rounded-xl sm:rounded-2xl mr-2 xs:mr-3 sm:mr-4 shadow-lg"
                                >
                                    <UsersIcon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                        User Management
                                    </h1>
                                    <p className="text-xs xs:text-xs sm:text-sm text-gray-600 font-medium mt-0.5 sm:mt-1">
                                        <span className="hidden sm:inline">Manage system users and permissions • </span>{filteredUsers.length} total users
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4 w-full lg:w-auto"
                        >
                            <div className="relative group flex-1 xs:flex-1 sm:flex-none sm:min-w-[180px] md:min-w-[220px]">
                                <motion.div 
                                    className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 sm:pl-4 flex items-center pointer-events-none"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <MagnifyingGlassIcon className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </motion.div>
                                <motion.input 
                                    whileFocus={{ scale: 1.01 }}
                                    type="text" 
                                    placeholder="Search users..." 
                                    value={searchTerm} 
                                    onChange={handleSearchChange} 
                                    className="block w-full pl-9 xs:pl-10 sm:pl-12 pr-2.5 xs:pr-3 sm:pr-4 py-3 xs:py-3.5 sm:py-4 border-2 border-gray-200 rounded-lg xs:rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-0 transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl min-h-[44px]"
                                />
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.03, y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} 
                                className="inline-flex items-center justify-center px-4 xs:px-5 sm:px-8 py-3 xs:py-3.5 sm:py-4 text-sm font-bold rounded-lg xs:rounded-xl sm:rounded-2xl text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 shadow-lg xs:shadow-xl sm:shadow-2xl hover:shadow-xl xs:hover:shadow-2xl sm:hover:shadow-2xl transition-all duration-300 transform whitespace-nowrap min-h-[44px] flex-shrink-0"
                            >
                                <PlusIcon className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5 mr-1.5 xs:mr-2" />
                                <span className="hidden xs:inline sm:inline">Add</span>
                                <span className="xs:hidden sm:hidden">+</span>
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Enhanced Users Table */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="overflow-x-auto"
                >
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <th scope="col" className="px-2 py-2 xs:px-3 xs:py-3 sm:px-4 sm:py-4 lg:px-8 lg:py-5 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center space-x-1 xs:space-x-1 sm:space-x-2">
                                        <UserIcon className="w-3 h-3 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden xs:inline sm:inline">User</span>
                                    </div>
                                </th>
                                <th scope="col" className="hidden md:table-cell px-4 py-4 lg:px-8 lg:py-5 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-2 py-2 xs:px-3 xs:py-3 sm:px-4 sm:py-4 lg:px-8 lg:py-5 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center space-x-1 xs:space-x-1 sm:space-x-2">
                                        <ShieldCheckIcon className="w-3 h-3 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden xs:inline sm:inline">Role</span>
                                    </div>
                                </th>
                                <th scope="col" className="px-2 py-2 xs:px-3 xs:py-3 sm:px-4 sm:py-4 lg:px-8 lg:py-5 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    <span className="hidden xs:inline sm:inline">Status</span>
                                    <span className="xs:hidden sm:hidden">St</span>
                                </th>
                                <th scope="col" className="px-2 py-2 xs:px-3 xs:py-3 sm:px-4 sm:py-4 lg:px-8 lg:py-5 text-right text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    <span className="hidden xs:inline sm:inline">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            <AnimatePresence>
                                {currentUsers.length > 0 ? (
                                    currentUsers.map((user, index) => (
                                        <motion.tr 
                                            key={user.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-300 group"
                                        >
                                            <td className="px-2 py-3 xs:px-3 xs:py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
                                                <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3 lg:space-x-4">
                                                    <motion.div
                                                        whileHover={{ scale: 1.05 }}
                                                        className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs xs:text-xs sm:text-sm flex-shrink-0"
                                                    >
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </motion.div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs xs:text-sm sm:text-sm font-semibold text-gray-900 truncate leading-4 xs:leading-5">{user.username}</div>
                                                        <div className="md:hidden text-xs xs:text-xs sm:text-sm text-gray-500 truncate mt-0.5 xs:mt-1 leading-3 xs:leading-4">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-4 py-5 lg:px-8 lg:py-6">
                                                <div className="text-sm text-gray-600 font-medium truncate">{user.email}</div>
                                            </td>
                                            <td className="px-2 py-3 xs:px-3 xs:py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
                                                <span className="inline-flex items-center px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 truncate max-w-full">
                                                    <span className="truncate">{user.role?.name || 'N/A'}</span>
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 xs:px-3 xs:py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
                                                <motion.span 
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`inline-flex items-center px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold ${
                                                        user.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    <span className="xs:hidden sm:hidden">
                                                        {user.is_active ? (
                                                            <CheckCircleIcon className="w-3 h-3" />
                                                        ) : (
                                                            <XCircleIcon className="w-3 h-3" />
                                                        )}
                                                    </span>
                                                    <span className="hidden xs:inline-flex sm:inline-flex items-center">
                                                        {user.is_active ? (
                                                            <>
                                                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                                <span className="hidden sm:inline">Active</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircleIcon className="w-3 h-3 mr-1" />
                                                                <span className="hidden sm:inline">Inactive</span>
                                                            </>
                                                        )}
                                                    </span>
                                                </motion.span>
                                            </td>
                                            <td className="px-1 py-3 xs:px-2 xs:py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6 text-right">
                                                <div className="flex justify-end space-x-0.5 xs:space-x-1 sm:space-x-2 lg:space-x-3 opacity-100 transition-opacity duration-200">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.05, y: -1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} 
                                                        className="p-2 xs:p-2.5 sm:p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md xs:rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] xs:min-w-[44px] xs:min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                                        title="Edit user"
                                                    >
                                                        <PencilIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.05, y: -1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleDelete(user)} 
                                                        className="p-2 xs:p-2.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md xs:rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] xs:min-w-[44px] xs:min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                                        title="Delete user"
                                                    >
                                                        <TrashIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <td colSpan={5} className="px-3 py-12 sm:px-4 sm:py-14 lg:px-8 lg:py-16 text-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.4, type: "spring" }}
                                                className="flex flex-col items-center space-y-3 sm:space-y-4"
                                            >
                                                <UsersIcon className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-gray-300" />
                                                <p className="text-base sm:text-lg font-medium text-gray-500 px-4">
                                                    {searchTerm ? 'No users match your search' : 'No users found'}
                                                </p>
                                                {searchTerm && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setSearchTerm('')}
                                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2"
                                                    >
                                                        Clear search
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        </td>
                                    </motion.tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </motion.div>

                {/* Enhanced Pagination */}
                {filteredUsers.length > usersPerPage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="px-2 py-3 xs:px-3 xs:py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white flex flex-col xs:flex-row items-center justify-between gap-2 xs:gap-3 sm:gap-0"
                    >
                        <div className="order-2 xs:order-1 sm:order-1">
                            <p className="text-xs xs:text-xs sm:text-sm text-gray-600 font-medium text-center xs:text-left sm:text-left">
                                <span className="hidden sm:inline">Showing </span>
                                <span className="font-bold text-indigo-600">{indexOfFirstUser + 1}</span>
                                <span className="hidden xs:inline sm:inline"> to </span>
                                <span className="xs:hidden sm:hidden">-</span>
                                <span className="font-bold text-indigo-600">{Math.min(indexOfLastUser, filteredUsers.length)}</span>
                                <span className="hidden xs:inline sm:inline"> of </span>
                                <span className="xs:hidden sm:hidden">/</span>
                                <span className="font-bold text-indigo-600">{filteredUsers.length}</span>
                                <span className="hidden sm:inline"> users</span>
                            </p>
                        </div>
                        <div className="order-1 xs:order-2 sm:order-2">
                            <nav className="flex items-center space-x-0.5 xs:space-x-1 sm:space-x-2" aria-label="Pagination">
                                <motion.button 
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                                    disabled={currentPage === 1} 
                                    className="p-2 xs:p-2.5 sm:p-3 rounded-md xs:rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                                >
                                    <ChevronLeftIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4" />
                                </motion.button>
                                
                                {Array.from({ length: Math.min(totalPages, window.innerWidth < 375 ? 3 : window.innerWidth < 640 ? 5 : 7) }, (_, i) => {
                                    let pageNum: number;
                                    const maxPages = window.innerWidth < 375 ? 3 : window.innerWidth < 640 ? 5 : 7;
                                    if (totalPages <= maxPages) {
                                        pageNum = i + 1;
                                    } else {
                                        const start = Math.max(1, currentPage - Math.floor(maxPages / 2));
                                        const end = Math.min(totalPages, start + maxPages - 1);
                                        pageNum = start + i;
                                        if (pageNum > end) return null;
                                    }
                                    
                                    return (
                                        <motion.button 
                                            key={pageNum}
                                            whileHover={{ scale: 1.05, y: -1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setCurrentPage(pageNum)} 
                                            className={`px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 rounded-md xs:rounded-lg sm:rounded-xl font-bold text-xs xs:text-sm sm:text-sm transition-all duration-200 min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center ${
                                                currentPage === pageNum 
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md xs:shadow-lg' 
                                                    : 'bg-white text-gray-600 hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-200 shadow-sm'
                                            }`}
                                        >
                                            {pageNum}
                                        </motion.button>
                                    );
                                })}
                                
                                <motion.button 
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                                    disabled={currentPage === totalPages} 
                                    className="p-2 xs:p-2.5 sm:p-3 rounded-md xs:rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                                >
                                    <ChevronRightIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4" />
                                </motion.button>
                            </nav>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {isUserModalOpen && (
                    <UserModal
                        isOpen={isUserModalOpen}
                        onClose={() => setIsUserModalOpen(false)}
                        onSave={handleSave}
                        user={editingUser}
                        roles={roles}
                    />
                )}

                {isConfirmModalOpen && (
                    <ConfirmationModal
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="Delete User"
                    >
                        Are you sure you want to delete the user '{userToDelete?.username}'? This action cannot be undone.
                    </ConfirmationModal>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserManagement;