import React, { useState, useEffect } from 'react';
import { adminGetAllUsers, adminUpdateUser, adminCreateUser, adminDeleteUser, adminGetRoles } from '../../api/api';
import { User, Role, UserFormData } from '../../types';
import { motion } from 'framer-motion';
import UserModal from './UserModal'; // Make sure this modal component exists

// Helper function to generate initials from a username
const getInitials = (name: string) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State to control the create/edit modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // --- Data Fetching ---
    const fetchUsersAndRoles = () => {
        setLoading(true);
        Promise.all([adminGetAllUsers(), adminGetRoles()])
            .then(([usersRes, rolesRes]) => {
                setUsers(usersRes.data);
                setRoles(rolesRes.data);
                setError(null);
            })
            .catch(err => {
                setError("You do not have permission to view this page.");
                console.error("Error fetching data:", err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsersAndRoles();
    }, []);

    // --- Event Handlers ---
    const handleSave = (userData: UserFormData) => {
        const apiCall = userData.id
            ? adminUpdateUser(userData.id, userData) // If user has an ID, update them
            : adminCreateUser(userData);              // Otherwise, create a new one

        apiCall
            .then(() => {
                fetchUsersAndRoles(); // Refresh data on success
                setIsModalOpen(false); // Close the modal
            })
            .catch(err => {
                alert("Failed to save user. Please check the console for details.");
                console.error("Save user error:", err);
            });
    };

    const handleDelete = (userId: number) => {
        if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            adminDeleteUser(userId)
                .then(() => fetchUsersAndRoles())
                .catch(err => alert("Failed to delete user."));
        }
    };

    if (loading) return <p className="text-center p-4">Loading user data...</p>;
    if (error) return <p className="text-center p-4 text-red-600 font-semibold">{error}</p>;

    return (
        <motion.div
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">All Users</h2>
                    <p className="text-sm text-gray-500">{users.length} users found</p>
                </div>
                <button
                    onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700"
                >
                    Create New User
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0 bg-indigo-200 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-semibold text-indigo-700">{getInitials(user.username)}</span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-4">
                                <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls can be added here */}

            {/* Render the modal component */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                user={editingUser}
                roles={roles}
            />
        </motion.div>
    );
};

export default UserManagement;