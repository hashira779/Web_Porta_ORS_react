import React, { useState, useEffect, useCallback } from 'react';
import { adminGetRoles, adminGetPermissions, adminUpdateRole, adminCreateRole, adminDeleteRole, adminCreatePermission } from '../api/api';
import { Role, Permission } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// --- Reusable Sub-Components ---

// A simple loading spinner
const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// A modern toast notification component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(), 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const isSuccess = type === 'success';
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}
        >
            {isSuccess ? <CheckCircleIcon className="h-6 w-6 mr-3" /> : <ExclamationCircleIcon className="h-6 w-6 mr-3" />}
            {message}
        </motion.div>
    );
};

// --- Main Settings Page Component ---
const SettingsPage: React.FC = () => {
    // Data states
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

    // UI/Input states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newPermissionName, setNewPermissionName] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const fetchData = useCallback(() => {
        Promise.all([adminGetRoles(), adminGetPermissions()])
            .then(([rolesRes, permsRes]) => {
                setRoles(rolesRes.data);
                setPermissions(permsRes.data);
                if (rolesRes.data.length > 0) {
                    const currentSelected = selectedRole ? rolesRes.data.find(r => r.id === selectedRole.id) : rolesRes.data[0];
                    if (currentSelected) handleRoleSelect(currentSelected);
                } else {
                    setSelectedRole(null);
                }
            })
            .catch(() => showToast("Failed to load settings data", "error"))
            .finally(() => setIsLoading(false));
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
        newSelection.has(permissionId) ? newSelection.delete(permissionId) : newSelection.add(permissionId);
        setSelectedPermissions(newSelection);
    };

    const handleSaveChanges = () => {
        if (!selectedRole) return;
        setIsSaving(true);
        const permission_ids = Array.from(selectedPermissions);
        adminUpdateRole(selectedRole.id, { ...selectedRole, permission_ids })
            .then(() => {
                showToast("Role updated successfully!", "success");
                fetchData();
            })
            .catch(() => showToast("Failed to save changes", "error"))
            .finally(() => setIsSaving(false));
    };

    const handleCreateRole = () => {
        if (!newRoleName.trim()) return showToast("Role name cannot be empty.", "error");
        adminCreateRole({ name: newRoleName, description: '' })
            .then(() => {
                showToast(`Role "${newRoleName}" created!`, "success");
                setNewRoleName('');
                fetchData();
            })
            .catch(() => showToast("Failed to create role", "error"));
    };

    const handleCreatePermission = () => {
        if (!newPermissionName.trim()) return showToast("Permission name cannot be empty.", "error");
        adminCreatePermission({ name: newPermissionName, description: '' })
            .then(() => {
                showToast(`Permission "${newPermissionName}" created!`, "success");
                setNewPermissionName('');
                fetchData();
            })
            .catch(() => showToast("Failed to create permission", "error"));
    };

    if (isLoading) return <p className="p-8">Loading settings...</p>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Role & Permission Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Panel */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Roles</h2>
                        <ul className="space-y-2">
                            {roles.map(role => (
                                <li key={role.id}>
                                    <button onClick={() => handleRoleSelect(role)} className={`w-full text-left px-4 py-2 rounded-lg ${selectedRole?.id === role.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}>
                                        {role.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 pt-4 border-t">
                            <h3 className="text-md font-semibold mb-3">Create New Role</h3>
                            <div className="flex"><input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="New role name..." className="flex-grow rounded-l-md border-gray-300"/><button onClick={handleCreateRole} className="p-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"><PlusIcon className="h-5 w-5"/></button></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Permissions</h2>
                        <p className="text-sm text-gray-500 mb-4">Create new permissions to be assigned to roles.</p>
                        <h3 className="text-md font-semibold mb-3">Create New Permission</h3>
                        <div className="flex"><input type="text" value={newPermissionName} onChange={(e) => setNewPermissionName(e.target.value)} placeholder="e.g., reports:export" className="flex-grow rounded-l-md border-gray-300"/><button onClick={handleCreatePermission} className="p-2 bg-green-600 text-white rounded-r-md hover:bg-green-700"><PlusIcon className="h-5 w-5"/></button></div>
                    </div>
                </div>

                {/* Permission Editor */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
                    {selectedRole ? (
                        <div>
                            <div className="flex justify-between items-start">
                                <h2 className="text-lg font-semibold mb-1">Permissions for <span className="text-indigo-600">{selectedRole.name}</span></h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                                {permissions.map(permission => (
                                    <div key={permission.id} className="flex items-center"><input type="checkbox" id={`perm-${permission.id}`} className="h-4 w-4 text-indigo-600 rounded" checked={selectedPermissions.has(permission.id)} onChange={() => handlePermissionChange(permission.id)}/><label htmlFor={`perm-${permission.id}`} className="ml-3 text-sm font-medium text-gray-700">{permission.name}</label></div>
                                ))}
                            </div>
                            <div className="mt-8 text-right">
                                <button onClick={handleSaveChanges} className="px-6 py-2 w-32 h-10 flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400" disabled={isSaving}>
                                    {isSaving ? <Spinner /> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    ) : <p>Select or create a role to manage its permissions.</p>}
                </div>
            </div>

            {/* Toast Notification Area */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            </AnimatePresence>
        </motion.div>
    );
};

export default SettingsPage;