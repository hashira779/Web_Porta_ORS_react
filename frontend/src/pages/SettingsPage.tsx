// frontend/src/pages/SettingsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { adminGetRoles, adminGetPermissions, adminUpdateRole, adminCreateRole, adminDeleteRole, adminCreatePermission, adminDeletePermission, adminUpdatePermission } from '../api/api';
import { Role, Permission } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon, ChevronRightIcon,
    CogIcon, ShieldCheckIcon, UserGroupIcon, PencilIcon
} from '@heroicons/react/24/outline';

// --- Reusable Components (ensure these are separate files or defined here if simple) ---
const Spinner: React.FC = () => (
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

import ConfirmationModal from '../components/settings/ConfirmationModal';
import RoleFormModal from '../components/settings/RoleFormModal';
import PermissionFormModal from '../components/settings/PermissionFormModal';

const SettingsPage: React.FC = () => {
    // Data states
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Modals states
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'role' | 'permission'; name: string } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    // --- MODIFIED fetchData: No longer handles role selection directly ---
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [rolesRes, permsRes] = await Promise.all([
                adminGetRoles(),
                adminGetPermissions()
            ]);

            setRoles(rolesRes.data);
            setPermissions(permsRes.data);

        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Failed to load settings data. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    }, []); // <--- Dependency array is now empty. fetchData is stable.

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- NEW useEffect for Role Selection Logic ---
    useEffect(() => {
        if (roles.length > 0) {
            // Find the previously selected role in the new list of roles
            const reselectedRole = selectedRole ? roles.find(r => r.id === selectedRole.id) : null;

            if (reselectedRole) {
                // If the previously selected role still exists, select it
                // Only update if the object reference is different to prevent unnecessary re-renders
                if (reselectedRole !== selectedRole) {
                    setSelectedRole(reselectedRole);
                    setSelectedPermissions(new Set(reselectedRole.permissions.map(p => p.id)));
                }
            } else {
                // If no role was previously selected, or the old one was deleted, select the first role
                setSelectedRole(roles[0]);
                setSelectedPermissions(new Set(roles[0].permissions.map(p => p.id)));
            }
        } else {
            // No roles available
            setSelectedRole(null);
            setSelectedPermissions(new Set());
        }
    }, [roles]); // <--- This effect runs when 'roles' data changes (i.e., after fetchData completes)

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
            showToast("Role permissions updated successfully!", "success");
            fetchData();
        } catch (error) {
            console.error("Failed to save changes:", error);
            const errorMessage = (error as any).response?.data?.detail || "Failed to save changes.";
            showToast(errorMessage, "error");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Role CRUD Handlers ---
    const handleAddRoleClick = () => {
        setEditingRole(null);
        setShowRoleModal(true);
    };

    const handleEditRoleClick = (role: Role) => {
        setEditingRole(role);
        setShowRoleModal(true);
    };

    const handleDeleteRoleClick = (role: Role) => {
        setItemToDelete({ id: role.id, type: 'role', name: role.name });
        setShowConfirmModal(true);
    };

    const handleRoleSave = async (roleData: { id?: number; name: string; description?: string | null }) => {
        try {
            if (roleData.id) {
                // Update existing role
                const currentRole = roles.find(r => r.id === roleData.id);
                if (currentRole) {
                    await adminUpdateRole(roleData.id, {
                        ...currentRole,
                        name: roleData.name,
                        description: roleData.description,
                        permission_ids: currentRole.permissions.map(p => p.id)
                    });
                    showToast(`Role "${roleData.name}" updated successfully!`, "success");
                }
            } else {
                // Create new role
                await adminCreateRole({ name: roleData.name, description: roleData.description, permission_ids: [] });
                showToast(`Role "${roleData.name}" created successfully!`, "success");
            }
            setShowRoleModal(false);
            fetchData();
        } catch (error) {
            console.error("Error saving role:", error);
            const errorMessage = (error as any).response?.data?.detail || "Failed to save role.";
            showToast(errorMessage, "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'role') {
                await adminDeleteRole(itemToDelete.id);
                showToast(`Role "${itemToDelete.name}" deleted successfully!`, "success");
            } else if (itemToDelete.type === 'permission') {
                await adminDeletePermission(itemToDelete.id);
                showToast(`Permission "${itemToDelete.name}" deleted successfully!`, "success");
            }
            setShowConfirmModal(false);
            setItemToDelete(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting item:", error);
            const errorMessage = (error as any).response?.data?.detail || "Failed to delete item. It might have associated data.";
            showToast(errorMessage, "error");
            setShowConfirmModal(false);
            setItemToDelete(null);
        }
    };

    // --- Permission CRUD Handlers ---
    const handleAddPermissionClick = () => {
        setEditingPermission(null);
        setShowPermissionModal(true);
    };

    const handleEditPermissionClick = (permission: Permission) => {
        setEditingPermission(permission);
        setShowPermissionModal(true);
    };

    const handleDeletePermissionClick = (permission: Permission) => {
        setItemToDelete({ id: permission.id, type: 'permission', name: permission.name });
        setShowConfirmModal(true);
    };

    const handlePermissionSave = async (permissionData: { id?: number; name: string; description?: string | null }) => {
        try {
            if (permissionData.id) {
                await adminUpdatePermission(permissionData.id, permissionData);
                showToast(`Permission "${permissionData.name}" updated successfully!`, "success");
            } else {
                await adminCreatePermission(permissionData);
                showToast(`Permission "${permissionData.name}" created successfully!`, "success");
            }
            setShowPermissionModal(false);
            fetchData();
        } catch (error) {
            console.error("Error saving permission:", error);
            const errorMessage = (error as any).response?.data?.detail || "Failed to save permission.";
            showToast(errorMessage, "error");
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
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <UserGroupIcon className="w-5 h-5 mr-2 text-indigo-600" />
                                Roles
                            </h2>
                            <button
                                onClick={handleAddRoleClick}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" /> New
                            </button>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {roles.length > 0 ? (
                                roles.map((role) => (
                                    <div key={role.id} className="flex items-center justify-between">
                                        <button
                                            onClick={() => handleRoleSelect(role)}
                                            className={`flex-1 px-5 py-3 text-left flex items-center justify-between transition-colors ${
                                                selectedRole?.id === role.id
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <span className="font-medium">{role.name}</span>
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                        <div className="flex-shrink-0 flex space-x-2 px-3">
                                            <button
                                                onClick={() => handleEditRoleClick(role)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Edit Role"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoleClick(role)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete Role"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-5 text-center text-gray-500 text-sm">No roles created yet.</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <CogIcon className="w-5 h-5 mr-2 text-indigo-600" />
                                Permissions
                            </h2>
                            <button
                                onClick={handleAddPermissionClick}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" /> New
                            </button>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {permissions.length > 0 ? (
                                permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center justify-between">
                                        <div className="flex-1 px-5 py-3 text-left flex items-center transition-colors hover:bg-gray-50 text-gray-700">
                                            <span className="font-medium">{permission.name}</span>
                                        </div>
                                        <div className="flex-shrink-0 flex space-x-2 px-3">
                                            <button
                                                onClick={() => handleEditPermissionClick(permission)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Edit Permission"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePermissionClick(permission)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete Permission"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-5 text-center text-gray-500 text-sm">No permissions created yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Permissions Editor for selected role */}
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

            {/* --- Modals for Role/Permission CRUD --- */}
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
                        title={`Delete ${itemToDelete.type === 'role' ? 'Role' : 'Permission'}`}
                        message={`Are you sure you want to delete the ${itemToDelete.type} "${itemToDelete.name}"? This action cannot be undone.`}
                        confirmButtonText="Delete"
                        confirmButtonColor="red"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;