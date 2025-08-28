import React, { useState, useEffect, useMemo } from 'react';
import { adminGetAllUsers, adminUpdateUser, adminCreateUser, adminDeleteUser, adminGetRoles } from '../../api/api';
import { User, Role, UserFormData, UserCreate, UserUpdate } from '../../types';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart, Bar, PieChart, Pie, Cell, Legend, Tooltip,
    ResponsiveContainer, CartesianGrid, XAxis, YAxis
} from 'recharts';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UsersIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CheckCircleIcon as CheckCircleOutline,
    XCircleIcon as XCircleOutline,
} from '@heroicons/react/24/outline';
import {
    ExclamationCircleIcon,
    ChartBarIcon,
    UserGroupIcon,
    ChartPieIcon
} from '@heroicons/react/24/solid';
import UserModal from './UserModal';
import CalSpin from '../common/CalSpin';
import ConfirmationModal from '../common/ConfirmationModal';
import { useNotificationStore } from '../../hooks/useNotification';

// A simple component for the stat cards
const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: number | string; color: string }> = ({ icon, title, value, color }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200/50 flex items-center gap-5"
    >
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </motion.div>
);


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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

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
                const payload: UserUpdate = { username: formData.username, email: formData.email, role_id: formData.role_id, user_id: formData.user_id, is_active: formData.is_active };
                if (formData.password) payload.password = formData.password;
                await adminUpdateUser(formData.id, payload);
                showNotification('User updated successfully!', 'success');
            } else {
                const payload: UserCreate = { username: formData.username, email: formData.email, password: formData.password, role_id: formData.role_id, user_id: formData.user_id, is_active: formData.is_active };
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

        setIsConfirmModalOpen(false);

        adminDeleteUser(userToDelete.id)
            .then(() => {
                showNotification(`User '${userToDelete.username}' deleted successfully.`, 'success');
                fetchUsersAndRoles();
            })
            .catch(err => {
                const errorMessage = err.response?.data?.detail || "Failed to delete user.";
                showNotification(errorMessage, 'error');
            })
            .finally(() => {
                setUserToDelete(null);
            });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const { activeUsersCount, inactiveUsersCount, barChartData, roleDistribution } = useMemo(() => {
        const active = users.filter(user => user.is_active).length;
        const inactive = users.length - active;
        const barData = [{ name: 'Users', Active: active, Inactive: inactive }];

        const roleCounts = users.reduce((acc, user) => {
            const roleName = user.role?.name || 'Unassigned';
            acc[roleName] = (acc[roleName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const roleData = Object.keys(roleCounts).map(name => ({
            name,
            value: roleCounts[name],
        }));

        return {
            activeUsersCount: active,
            inactiveUsersCount: inactive,
            barChartData: barData,
            roleDistribution: roleData,
        };
    }, [users]);

    const DONUT_CHART_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

    const filteredUsers = useMemo(() => users.filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const currentUsers = useMemo(() => {
        const indexOfLastUser = currentPage * usersPerPage;
        const indexOfFirstUser = indexOfLastUser - usersPerPage;
        return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    }, [filteredUsers, currentPage, usersPerPage]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><CalSpin size="lg" /></div>;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Error loading users</h3>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
                <button
                    onClick={fetchUsersAndRoles}
                    className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<UserGroupIcon className="w-6 h-6 text-indigo-600" />} title="Total Users" value={users.length} color="bg-indigo-100" />
                <StatCard icon={<CheckCircleOutline className="w-6 h-6 text-green-600" />} title="Active Users" value={activeUsersCount} color="bg-green-100" />
                <StatCard icon={<XCircleOutline className="w-6 h-6 text-red-600" />} title="Inactive Users" value={inactiveUsersCount} color="bg-red-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-full"><ChartBarIcon className="w-6 h-6 text-indigo-600" /></div>
                        <h2 className="text-lg font-bold text-gray-800">User Status Overview</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb' }} />
                            <Legend iconType="circle" />
                            <Bar dataKey="Active" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Inactive" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-full"><ChartPieIcon className="w-6 h-6 text-purple-600" /></div>
                        <h2 className="text-lg font-bold text-gray-800">Role Distribution</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={roleDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                                labelLine={false}
                            >
                                {roleDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={DONUT_CHART_COLORS[index % DONUT_CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb' }} />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden"
            >
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">All Users</h1>
                            <p className="text-sm text-gray-500 mt-1">{filteredUsers.length} results found</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-grow">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:border-indigo-500 focus:ring-0"
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                                className="inline-flex items-center justify-center px-4 py-2 font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all whitespace-nowrap"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add User
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                            {/* // NEW: Added Telegram ID column header, hidden on smaller screens */}
                            <th scope="col" className="hidden lg:table-cell px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Telegram ID</th>
                            <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {currentUsers.length > 0 ? (
                            currentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                                <div className="md:hidden text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* // NEW: Added Telegram ID data cell */}
                                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {user.user_id || 'N/A'}
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {user.role?.name || 'N/A'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full" title="Edit">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(user)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full" title="Delete">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                {/* // UPDATED: Changed colspan to 6 to account for the new column */}
                                <td colSpan={6} className="text-center py-16 px-6">
                                    <UsersIcon className="mx-auto h-12 w-12 text-gray-300" />
                                    <p className="mt-2 text-sm font-medium text-gray-500">No users found</p>
                                    {searchTerm && <p className="text-xs text-gray-400">Try adjusting your search.</p>}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50">
                                <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50">
                                <ChevronRightIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>

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