import React, { useState, useEffect, useCallback } from 'react';
// CORRECTED: All function imports now match the final api.ts file
import {
    adminGetRoles,
    adminGetPermissions,
    adminUpdateRole,
    adminCreateRole,
    adminDeleteRole,
    adminCreatePermission,
    adminDeletePermission,
    adminUpdatePermission,
    adminUpdateRolePermissions // This was a key missing import
} from '../api/api';
import { Role, Permission, RoleDetailsUpdate, PermissionCreate } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon, ChevronRightIcon,
    CogIcon, ShieldCheckIcon, UserGroupIcon, PencilIcon
} from '@heroicons/react/24/outline';

// CORRECTED: Import the Spinner component from its correct location
import Spinner from '../components/common/CalSpin';
import ConfirmationModal from '../components/settings/ConfirmationModal';
import RoleFormModal from '../components/settings/RoleFormModal';
import PermissionFormModal from '../components/settings/PermissionFormModal';
import RolePermissionEditor from '../components/settings/RolePermissionEditor';

// --- Reusable Toast Component ---
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
            {type === 'success' ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <ExclamationCircleIcon className="w-5 h-5 mr-2" />}
            <span className="text-sm font-medium">{message}</span>
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
        if (roles.length > 0) {
            const reselectedRole = selectedRole ? roles.find(r => r.id === selectedRole.id) : null;
            if (reselectedRole) {
                if (JSON.stringify(reselectedRole) !== JSON.stringify(selectedRole)) {
                    setSelectedRole(reselectedRole);
                }
            } else {
                setSelectedRole(roles[0]);
            }
        } else {
            setSelectedRole(null);
        }
    }, [roles, selectedRole]);

    // --- Role CRUD Handlers ---
    const handleRoleSave = async (roleData: { id?: number; name: string; description?: string | null }) => {
        try {
            if (roleData.id) {
                const payload: RoleDetailsUpdate = { name: roleData.name, description: roleData.description };
                await adminUpdateRole(roleData.id, payload);
                showToast(`Role "${roleData.name}" updated.`, "success");
            } else {
                await adminCreateRole({ name: roleData.name, description: roleData.description });
                showToast(`Role "${roleData.name}" created.`, "success");
            }
            setShowRoleModal(false);
            fetchData();
        } catch (error) {
            showToast("Failed to save role.", "error");
        }
    };

    const handleDeleteRoleClick = (role: Role) => {
        setItemToDelete({ id: role.id, type: 'role', name: role.name });
        setShowConfirmModal(true);
    };

    // --- Permission CRUD Handlers ---
    const handlePermissionSave = async (permissionData: PermissionCreate & { id?: number }) => {
        try {
            if (permissionData.id) {
                await adminUpdatePermission(permissionData.id, permissionData);
                showToast(`Permission updated.`, "success");
            } else {
                await adminCreatePermission(permissionData);
                showToast(`Permission created.`, "success");
            }
            setShowPermissionModal(false);
            fetchData();
        } catch(e) {
            showToast("Failed to save permission", "error");
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
                showToast(`Role "${itemToDelete.name}" deleted.`, "success");
            } else {
                await adminDeletePermission(itemToDelete.id);
                showToast(`Permission "${itemToDelete.name}" deleted.`, "success");
            }
            setShowConfirmModal(false);
            fetchData();
        } catch (error) {
            showToast("Failed to delete item.", "error");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
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
                <p className="mt-2 text-sm text-gray-500">Manage user roles and their associated permissions</p>
            </div>

            {toast && <div className="fixed top-4 right-4 z-50 w-80"><Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} /></div>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center"><UserGroupIcon className="w-5 h-5 mr-2 text-indigo-600" />Roles</h2>
                            <button onClick={() => { setEditingRole(null); setShowRoleModal(true); }} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"><PlusIcon className="h-4 w-4 mr-1" /> New</button>
                        </div>
                        <div>
                            {roles.map(role => (
                                <div key={role.id} className="flex items-center justify-between border-t">
                                    <button onClick={() => setSelectedRole(role)} className={`flex-1 px-5 py-3 text-left flex items-center justify-between ${selectedRole?.id === role.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                                        <span className="font-medium">{role.name}</span>
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                    <div className="flex-shrink-0 flex space-x-2 px-3">
                                        <button onClick={() => { setEditingRole(role); setShowRoleModal(true); }} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteRoleClick(role)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-3">
                    {selectedRole ? (
                        <RolePermissionEditor
                            key={selectedRole.id}
                            role={selectedRole}
                            allPermissions={permissions}
                            onSaveSuccess={fetchData}
                        />
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                            <h3 className="mt-3 text-lg font-medium text-gray-900">No role selected</h3>
                            <p className="mt-2 text-sm text-gray-500">Select a role to manage its permissions.</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showRoleModal && <RoleFormModal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} onSave={handleRoleSave} role={editingRole} />}
                {showPermissionModal && <PermissionFormModal isOpen={showPermissionModal} onClose={() => setShowPermissionModal(false)} onSave={handlePermissionSave} permission={editingPermission} />}
                {showConfirmModal && itemToDelete && <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmDelete} title={`Delete ${itemToDelete.type}`} message={`Are you sure you want to delete "${itemToDelete.name}"?`} />}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;