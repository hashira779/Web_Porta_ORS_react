import React, { useState, useEffect } from 'react';
// CORRECTED: Ensure you import the correct admin-specific functions
import { adminGetAllUsers, adminUpdateUser } from '../../api/api';
import { User } from '../../types';
import { motion } from 'framer-motion';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        // CORRECTED: This now calls the correct adminGetAllUsers function
        adminGetAllUsers()
            .then(response => {
                setUsers(response.data);
                setError(null);
            })
            .catch(err => {
                setError("You do not have permission to view this page.");
                console.error("Error fetching users:", err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusChange = (user: User, is_active: boolean) => {
        // Make sure to handle cases where user.role might be undefined
        if (!user.role) {
            alert("Cannot update user without a role.");
            return;
        }
        adminUpdateUser(user.id, { role_id: user.role.id, is_active })
            .then(() => fetchUsers()) // Refresh data on success
            .catch(err => alert("Failed to update user."));
    };

    if (loading) return <p>Loading user data...</p>;
    if (error) return <p className="text-red-600 font-semibold">{error}</p>;

    return (
        <motion.div
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {user.is_active ? (
                                    <button onClick={() => handleStatusChange(user, false)} className="text-red-600 hover:text-red-900">Deactivate</button>
                                ) : (
                                    <button onClick={() => handleStatusChange(user, true)} className="text-indigo-600 hover:text-indigo-900">Activate</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default UserManagement;