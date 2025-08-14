import React, { useState, useEffect, useCallback } from 'react';
import {
    adminGetRoles,
    adminGetPermissions,
    adminUpdateRole,
    adminCreateRole,
    adminDeleteRole,
    adminCreatePermission,
    adminDeletePermission,
    adminUpdatePermission
} from '../../api/api';
import { Role, Permission, RoleDetailsUpdate, PermissionCreate } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon, ChevronRightIcon,
    CogIcon, ShieldCheckIcon, UserGroupIcon, PencilIcon, XMarkIcon,
    ArrowPathIcon, LockClosedIcon, SquaresPlusIcon, ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

import Spinner from '../../components/common/CalSpin';
import ConfirmationModal from '../../components/settings/ConfirmationModal';
import RoleFormModal from '../../components/settings/RoleFormModal';
import PermissionFormModal from '../../components/settings/PermissionFormModal';
import RolePermissionEditor from '../../components/settings/RolePermissionEditor';

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(), 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-xl shadow-lg max-w-xs sm:max-w-sm ${
                type === 'success'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                    : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white'
            }`}
        >
            <div className="flex-shrink-0">
                {type === 'success' ? (
                    <CheckCircleIcon className="w-6 h-6" />
                ) : (
                    <ExclamationCircleIcon className="w-6 h-6" />
                )}
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button
                onClick={onDismiss}
                className="ml-4 flex-shrink-0 hover:bg-white/10 rounded-full p-1"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
        </motion.div>
    );
};

const SettingsPage: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'role' | 'permission'; name: string } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [rolesRes, permsRes] = await Promise.all([adminGetRoles(), adminGetPermissions()]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
        } catch (error) {
            showToast("Failed to load settings data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setSelectedRole(currentSelectedRole => {
            if (currentSelectedRole) {
                const updatedRole = roles.find(r => r.id === currentSelectedRole.id);
                return updatedRole || roles[0] || null;
            }
            return roles[0] || null;
        });
    }, [roles]);

    const handleRoleSave = async (roleData: { id?: number; name: string; description?: string | null }) => {
        try {
            if (roleData.id) {
                const payload: RoleDetailsUpdate = { name: roleData.name, description: roleData.description };
                await adminUpdateRole(roleData.id, payload);
                showToast(`Role "${roleData.name}" updated successfully!`, "success");
            } else {
                await adminCreateRole({ name: roleData.name, description: roleData.description });
                showToast(`Role "${roleData.name}" created successfully!`, "success");
            }
            setShowRoleModal(false);
            await fetchData();
        } catch (error) {
            showToast("Failed to save role. Please try again.", "error");
        }
    };

    const handleDeleteRoleClick = (role: Role) => {
        setItemToDelete({ id: role.id, type: 'role', name: role.name });
        setShowConfirmModal(true);
    };

    const handlePermissionSave = async (permissionData: PermissionCreate & { id?: number }) => {
        try {
            if (permissionData.id) {
                await adminUpdatePermission(permissionData.id, permissionData);
                showToast(`Permission updated successfully!`, "success");
            } else {
                await adminCreatePermission(permissionData);
                showToast(`Permission created successfully!`, "success");
            }
            setShowPermissionModal(false);
            await fetchData();
        } catch(e) {
            showToast("Failed to save permission. Please try again.", "error");
        }
    };

    const handleDeletePermissionClick = (permission: Permission) => {
        setItemToDelete({ id: permission.id, type: 'permission', name: permission.name });
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (itemToDelete.type === 'role') {
                await adminDeleteRole(itemToDelete.id);
                showToast(`${itemToDelete.type} "${itemToDelete.name}" deleted successfully!`, "success");
            } else {
                await adminDeletePermission(itemToDelete.id);
                showToast(`${itemToDelete.type} "${itemToDelete.name}" deleted successfully!`, "success");
            }
            setShowConfirmModal(false);
            await fetchData();
        } catch (error) {
            showToast(`Failed to delete ${itemToDelete.type}. Please try again.`, "error");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <LockClosedIcon className="w-16 h-16 text-indigo-600 opacity-75" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <ShieldCheckIcon className="w-8 h-8 text-indigo-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-800">Access Control</h1>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        {isMobileMenuOpen ? (
                            <XMarkIcon className="w-6 h-6" />
                        ) : (
                            <ArrowsPointingOutIcon className="w-6 h-6" />
                        )}
                    </button>
                </div>

                <div className="mb-8 md:mb-10 hidden md:block">
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center"
                    >
                        <ShieldCheckIcon className="w-10 h-10 mr-4 text-indigo-600" />
                        Role & Permission Management
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mt-3 text-base text-gray-600"
                    >
                        Manage user roles and their associated permissions with clarity and confidence.
                    </motion.p>
                </div>

                {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                    {/* Sidebar - visible on desktop, conditionally on mobile */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`md:col-span-1 lg:col-span-1 space-y-6 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}
                    >
                        {/* Roles Card */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-indigo-100">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <UserGroupIcon className="w-5 h-5 mr-3 text-indigo-600" />
                                    Roles
                                </h2>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setEditingRole(null); setShowRoleModal(true); }}
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                >
                                    <PlusIcon className="h-4 w-4 mr-1.5" />
                                    <span className="hidden sm:inline">New</span>
                                </motion.button>
                            </div>
                            <div className="divide-y divide-gray-200/50">
                                <AnimatePresence>
                                    {roles.map((role, index) => (
                                        <motion.div
                                            key={role.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                                            exit={{ opacity: 0, x: -10 }}
                                            whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                                            className="flex items-center justify-between transition-colors duration-150"
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedRole(role);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={`flex-1 px-5 py-3 text-left flex items-center justify-between w-full ${selectedRole?.id === role.id ? 'bg-indigo-50 text-indigo-800' : 'text-gray-700'}`}
                                            >
                                                <span className="font-medium truncate">{role.name}</span>
                                                <ChevronRightIcon className="w-5 h-5 flex-shrink-0" />
                                            </button>
                                            <div className="flex-shrink-0 flex space-x-1 pr-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingRole(role);
                                                        setShowRoleModal(true);
                                                    }}
                                                    className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-200"
                                                    title="Edit role"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteRoleClick(role);
                                                    }}
                                                    className="text-gray-500 hover:text-rose-600 p-2 rounded-full hover:bg-gray-200"
                                                    title="Delete role"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Permissions Card */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-emerald-100">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <CogIcon className="w-5 h-5 mr-3 text-emerald-600" />
                                    Permissions
                                </h2>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setEditingPermission(null); setShowPermissionModal(true); }}
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                >
                                    <PlusIcon className="h-4 w-4 mr-1.5" />
                                    <span className="hidden sm:inline">New</span>
                                </motion.button>
                            </div>
                            <div className="divide-y divide-gray-200/50 max-h-96 overflow-y-auto">
                                <AnimatePresence>
                                    {permissions.map((permission, index) => (
                                        <motion.div
                                            key={permission.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                                            exit={{ opacity: 0, x: -10 }}
                                            whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                                            className="flex items-center justify-between transition-colors duration-150"
                                        >
                                            <div className="px-5 py-3 text-gray-700 font-medium truncate flex-1">
                                                {permission.name}
                                            </div>
                                            <div className="flex-shrink-0 flex space-x-1 pr-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                        setEditingPermission(permission);
                                                        setShowPermissionModal(true);
                                                    }}
                                                    className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-200"
                                                    title="Edit permission"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDeletePermissionClick(permission)}
                                                    className="text-gray-500 hover:text-rose-600 p-2 rounded-full hover:bg-gray-200"
                                                    title="Delete permission"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Main Content Area */}
                    <div className="md:col-span-2 lg:col-span-3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedRole ? selectedRole.id : 'empty-state'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="h-full"
                            >
                                {selectedRole ? (
                                    <RolePermissionEditor
                                        key={selectedRole.id}
                                        role={selectedRole}
                                        allPermissions={permissions}
                                        onSaveSuccess={fetchData}
                                        showToast={showToast}
                                    />
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 sm:p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]"
                                    >
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.05, 1],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatType: "reverse"
                                            }}
                                        >
                                            <ShieldCheckIcon className="w-20 h-20 text-gray-300 mb-6" />
                                        </motion.div>
                                        <h3 className="text-2xl font-bold text-gray-700 mb-3">Select a Role to Begin</h3>
                                        <p className="text-gray-500 max-w-md mb-6">
                                            Choose a role from the list to view and manage its permissions in this panel.
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setIsMobileMenuOpen(true)}
                                            className="md:hidden flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm"
                                        >
                                            <UserGroupIcon className="w-5 h-5 mr-2" />
                                            View Roles
                                        </motion.button>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showRoleModal && (
                    <RoleFormModal
                        isOpen={showRoleModal}
                        onClose={() => setShowRoleModal(false)}
                        onSave={handleRoleSave}
                        role={editingRole}
                    />
                )}

                {showPermissionModal && (
                    <PermissionFormModal
                        isOpen={showPermissionModal}
                        onClose={() => setShowPermissionModal(false)}
                        onSave={handlePermissionSave}
                        permission={editingPermission}
                    />
                )}

                {showConfirmModal && itemToDelete && (
                    <ConfirmationModal
                        isOpen={showConfirmModal}
                        onClose={() => setShowConfirmModal(false)}
                        onConfirm={handleConfirmDelete}
                        title={`Delete ${itemToDelete.type}`}
                        message={`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`}
                        icon={<TrashIcon className="w-12 h-12 text-rose-500 mx-auto" />}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;