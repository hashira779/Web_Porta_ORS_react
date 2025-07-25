import React, { useState, useEffect, useCallback } from 'react';
import { adminGetRoles, adminGetPermissions, adminUpdateRole, adminCreateRole, adminDeleteRole, adminCreatePermission } from '../api/api';
import { Role, Permission } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon, ChevronRightIcon, CogIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

// --- Reusable Components ---
const Spinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    </div>
);

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
            className={`flex items-center p-4 mb-4 rounded-lg shadow-md ${
                type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}
        >
            {type === 'success' ? (
                <CheckCircleIcon className="w-5 h-5 mr-2" />
            ) : (
                <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            )}
            <span className="text-sm font-medium">{message}</span>
        </motion.div>
    );
};

const PermissionToggle: React.FC<{
    permission: Permission;
    checked: boolean;
    onChange: (id: number) => void;
}> = ({ permission, checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input
            type="checkbox"
            checked={checked}
            onChange={() => onChange(permission.id)}
            className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        <span className="ml-3 text-sm font-medium text-gray-700">
      {permission.name}
    </span>
    </label>
);

// --- Main Component ---
const SettingsPage: React.FC = () => {
    // Data states
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newPermissionName, setNewPermissionName] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [rolesRes, permsRes] = await Promise.all([
                adminGetRoles(),
                adminGetPermissions()
            ]);

            setRoles(rolesRes.data);
            setPermissions(permsRes.data);

            if (rolesRes.data.length > 0) {
                const currentSelected = selectedRole
                    ? rolesRes.data.find(r => r.id === selectedRole.id)
                    : rolesRes.data[0];
                if (currentSelected) handleRoleSelect(currentSelected);
            }
        } catch (error) {
            showToast("Failed to load settings data", "error");
        } finally {
            setIsLoading(false);
        }
    }, [selectedRole]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role);
        setSelectedPermissions(new Set(role.permissions.map(p => p.id)));
    };

    const handlePermissionChange = (permissionId: number) => {
        const newSelection = new Set(selectedPermissions);
        newSelection.has(permissionId)
            ? newSelection.delete(permissionId)
            : newSelection.add(permissionId);
        setSelectedPermissions(newSelection);
    };

    const handleSaveChanges = async () => {
        if (!selectedRole) return;

        try {
            setIsSaving(true);
            const permission_ids = Array.from(selectedPermissions);
            await adminUpdateRole(selectedRole.id, { ...selectedRole, permission_ids });
            showToast("Role updated successfully!", "success");
            fetchData();
        } catch (error) {
            showToast("Failed to save changes", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) {
            showToast("Role name cannot be empty", "error");
            return;
        }

        try {
            await adminCreateRole({ name: newRoleName, description: '' });
            showToast(`Role "${newRoleName}" created!`, "success");
            setNewRoleName('');
            fetchData();
        } catch (error) {
            showToast("Failed to create role", "error");
        }
    };

    const handleCreatePermission = async () => {
        if (!newPermissionName.trim()) {
            showToast("Permission name cannot be empty", "error");
            return;
        }

        try {
            await adminCreatePermission({ name: newPermissionName, description: '' });
            showToast(`Permission "${newPermissionName}" created!`, "success");
            setNewPermissionName('');
            fetchData();
        } catch (error) {
            showToast("Failed to create permission", "error");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <ShieldCheckIcon className="w-8 h-8 mr-3 text-indigo-600" />
                    Role & Permission Management
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    Manage user roles and their associated permissions
                </p>
            </div>

            {toast && (
                <div className="fixed top-4 right-4 z-50 w-80">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onDismiss={() => setToast(null)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Roles Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <UserGroupIcon className="w-5 h-5 mr-2 text-indigo-600" />
                                Roles
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleSelect(role)}
                                    className={`w-full px-5 py-3 text-left flex items-center justify-between transition-colors ${
                                        selectedRole?.id === role.id
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <span className="font-medium">{role.name}</span>
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Create New Role
                            </h3>
                            <div className="flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="Enter role name..."
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <button
                                    onClick={handleCreateRole}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <CogIcon className="w-5 h-5 mr-2 text-indigo-600" />
                                Permissions
                            </h2>
                        </div>
                        <div className="px-5 py-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Create New Permission
                            </h3>
                            <div className="flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    value={newPermissionName}
                                    onChange={(e) => setNewPermissionName(e.target.value)}
                                    placeholder="e.g., reports:export"
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <button
                                    onClick={handleCreatePermission}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permissions Editor */}
                <div className="lg:col-span-3">
                    {selectedRole ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    <span className="text-indigo-600">{selectedRole.name}</span> Permissions
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {selectedRole.description || 'No description provided'}
                                </p>
                            </div>

                            <div className="p-6">
                                {permissions.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {permissions.map((permission) => (
                                                <PermissionToggle
                                                    key={permission.id}
                                                    permission={permission}
                                                    checked={selectedPermissions.has(permission.id)}
                                                    onChange={handlePermissionChange}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">
                                            No permissions available. Create some permissions first.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isSaving}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Spinner />
                                            <span className="ml-2">Saving...</span>
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                                <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mt-3 text-lg font-medium text-gray-900">
                                No role selected
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Select a role from the list to view and edit its permissions.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;