import React, { useState, useEffect } from 'react';
import { adminGetAllUsers, adminUpdateUser, adminCreateUser, adminDeleteUser, adminGetRoles } from '../../api/api';
import { User, Role, UserFormData, UserCreate, UserUpdate } from '../../types';
import { AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    XCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
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
        return <div className="flex justify-center items-center h-64"><CalSpin size="lg" /></div>;
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading users</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button onClick={fetchUsersAndRoles} className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center"><UserIcon className="w-5 h-5 mr-2 text-indigo-600" />User Management</h2>
                        <p className="mt-1 text-sm text-gray-500">Manage all system users and their permissions</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-4 w-4 text-gray-400" /></div>
                            <input type="text" placeholder="Search users..." value={searchTerm} onChange={handleSearchChange} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                            <PlusIcon className="h-4 w-4 mr-2" />New User
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {currentUsers.length > 0 ? (
                            currentUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{user.username}</div></td>
                                    <td className="px-6 py-4"><div className="text-sm text-gray-500">{user.email}</div></td>
                                    <td className="px-6 py-4"><div className="text-sm text-gray-500">{user.role?.name || 'N/A'}</div></td>
                                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-4">
                                            <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">{searchTerm ? 'No users match your search' : 'No users found'}</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredUsers.length > usersPerPage && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> users
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    <ChevronLeftIcon className="h-5 w-5" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => setCurrentPage(page)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                                        {page}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    <ChevronRightIcon className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                )}
            </div>

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
        </div>
    );
};

export default UserManagement;