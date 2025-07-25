// frontend/src/components/admin/UserManagement.tsx

import React, { useState, useEffect } from 'react';
import { adminGetAllUsers, adminUpdateUser, adminCreateUser, adminDeleteUser, adminGetRoles } from '../../api/api';
import { User, Role, UserFormData } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    ExclamationCircleIcon // Add this for warning/error alerts
} from '@heroicons/react/24/outline';
import UserModal from './UserModal';
import Spinner from '../common/CalSpin'; // Assume you have a Spinner component

// Define types for alert messages
type AlertType = 'success' | 'error' | 'info';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    // --- NEW STATES FOR CONFIRMATION MODAL AND ALERTS ---
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<AlertType | null>(null);

    // Function to show custom alert messages
    const showAlert = (message: string, type: AlertType) => {
        setAlertMessage(message);
        setAlertType(type);
        // Automatically hide alert after 5 seconds
        setTimeout(() => {
            setAlertMessage(null);
            setAlertType(null);
        }, 5000);
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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
                showAlert("Failed to load users or roles.", "error"); // Use custom alert
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsersAndRoles();
    }, []);

    const handleSave = (userData: UserFormData) => {
        const apiCall = userData.id
            ? adminUpdateUser(userData.id, userData)
            : adminCreateUser(userData);

        apiCall
            .then(() => {
                fetchUsersAndRoles();
                setIsModalOpen(false);
                showAlert(`User ${userData.username} ${userData.id ? 'updated' : 'created'} successfully!`, "success"); // Custom success alert
            })
            .catch(err => {
                console.error("Save user error:", err);
                // Attempt to get more specific error from backend response
                const errorMessage = err.response?.data?.detail || "Failed to save user. Please try again.";
                showAlert(errorMessage, "error"); // Custom error alert
            });
    };

    // --- MODIFIED handleDelete to open custom confirmation modal ---
    const handleDelete = (userId: number) => {
        setUserToDeleteId(userId);
        setShowConfirmDeleteModal(true);
    };

    // --- NEW FUNCTION: Called when user confirms delete in the custom modal ---
    const handleConfirmDelete = () => {
        if (userToDeleteId !== null) {
            adminDeleteUser(userToDeleteId)
                .then(() => {
                    fetchUsersAndRoles(); // Refresh user list
                    setShowConfirmDeleteModal(false); // Close modal
                    setUserToDeleteId(null); // Clear ID
                    showAlert("User deleted successfully!", "success"); // Custom success alert
                })
                .catch(err => {
                    console.error("Delete error:", err);
                    setShowConfirmDeleteModal(false); // Close modal even on error
                    setUserToDeleteId(null); // Clear ID
                    // Attempt to get more specific error from backend response
                    const errorMessage = err.response?.data?.detail || "Failed to delete user. Please try again.";
                    showAlert(errorMessage, "error"); // Custom error alert
                });
        }
    };

    // --- NEW FUNCTION: Called when user cancels delete in the custom modal ---
    const handleCancelDelete = () => {
        setShowConfirmDeleteModal(false);
        setUserToDeleteId(null);
    };
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };


    // ... (rest of the component remains the same)
    // ... (add the custom alert and confirmation modal JSX below)

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-center py-8">
                    <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading users</h3>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
                    <button
                        onClick={fetchUsersAndRoles}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* --- CUSTOM ALERT DISPLAY --- */}
            <AnimatePresence>
                {alertMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`relative z-50 p-4 rounded-md shadow-lg flex items-center transition-all duration-300
                            ${alertType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
                            ${alertType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
                            ${alertType === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' : ''}
                        `}
                        role="alert"
                    >
                        <div className="flex-shrink-0">
                            {alertType === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />}
                            {alertType === 'error' && <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />}
                            {alertType === 'info' && <ExclamationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />}
                        </div>
                        <div className="ml-3 flex-1 text-sm font-medium">
                            {alertMessage}
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setAlertMessage(null)}
                                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${alertType === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50' : ''}
                                    ${alertType === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50' : ''}
                                    ${alertType === 'info' ? 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50' : ''}
                                `}
                            >
                                <span className="sr-only">Dismiss</span>
                                <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ... (Existing Header and Table JSX) ... */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <UserIcon className="w-5 h-5 mr-2 text-indigo-600" />
                            User Management
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage all system users and their permissions
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>

                        <button
                            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New User
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {currentUsers.length > 0 ? (
                            currentUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-indigo-700">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.role?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                            >
                                                <PencilIcon className="h-4 w-4 mr-1" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)} // This now opens the custom confirm modal
                                                className="text-red-600 hover:text-red-900 flex items-center"
                                            >
                                                <TrashIcon className="h-4 w-4 mr-1" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    {searchTerm ? 'No users match your search' : 'No users found'}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredUsers.length > usersPerPage && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of{' '}
                                    <span className="font-medium">{filteredUsers.length}</span> users
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeftIcon className="h-5 w-5" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                currentPage === page
                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRightIcon className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal (for Create/Edit) */}
            <AnimatePresence>
                {isModalOpen && (
                    <UserModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        user={editingUser}
                        roles={roles}
                    />
                )}
            </AnimatePresence>

            {/* --- CUSTOM CONFIRMATION MODAL FOR DELETE --- */}
            <AnimatePresence>
                {showConfirmDeleteModal && (
                    <motion.div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full relative"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="text-center">
                                <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
                                <h3 className="mt-2 text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to delete this user? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                                    onClick={handleConfirmDelete}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                    onClick={handleCancelDelete}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;