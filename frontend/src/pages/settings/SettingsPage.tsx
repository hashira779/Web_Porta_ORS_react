// src/pages/SettingsPage.tsx

import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
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
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import {
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    PencilIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    Bars3Icon,
    CogIcon
} from '@heroicons/react/24/outline';

import SkeletonLoader from '../../components/settings/SkeletonLoader';
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
            className={`fixed top-5 right-5 z-[100] flex items-center p-4 rounded-xl shadow-lg max-w-xs sm-max-w-sm ${
                type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}
        >
            <div className="flex-shrink-0">
                {type === 'success' ? <CheckCircleIcon className="w-6 h-6" /> : <ExclamationCircleIcon className="w-6 h-6" />}
            </div>
            <div className="ml-3 flex-1"><p className="text-sm font-medium">{message}</p></div>
            <button onClick={onDismiss} className="ml-4 flex-shrink-0 hover:bg-white/10 rounded-full p-1"><XMarkIcon className="w-5 h-5" /></button>
        </motion.div>
    );
};

const SettingsPage: React.FC = () => {
    // --- All Hooks must be at the top level ---
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [modalState, setModalState] = useState<{ type: 'role' | 'permission' | 'confirm' | null; data?: any }>({ type: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRole, setEditingRole] = useState<{ id: number; name: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

    const handleToastDismiss = useCallback(() => {
        setToast(null);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([adminGetRoles(), adminGetPermissions()]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
        } catch (error) {
            // Using a function to set state avoids stale closures
            setToast({ message: "Failed to load settings data.", type: "error" });
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchData().finally(() => setIsLoading(false));
    }, [fetchData]);

    useEffect(() => {
        if (!selectedRole && roles.length > 0) {
            setSelectedRole(roles[0]);
        } else if (selectedRole) {
            const updatedRole = roles.find(r => r.id === selectedRole.id);
            setSelectedRole(updatedRole || roles[0] || null);
        }
    }, [roles, selectedRole]);

    const filteredRoles = useMemo(() =>
        roles.filter(role =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [roles, searchTerm]);

    // --- All Handler functions ---
    const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

    const handleSaveRole = async (roleData: { id?: number; name: string; description?: string | null }) => {
        try {
            if (roleData.id) {
                await adminUpdateRole(roleData.id, roleData as RoleDetailsUpdate);
                showToast(`Role "${roleData.name}" updated.`, "success");
            } else {
                await adminCreateRole(roleData);
                showToast(`Role "${roleData.name}" created.`, "success");
            }
            setModalState({ type: null });
            await fetchData();
        } catch (error) { showToast("Failed to save role.", "error"); }
    };

    const handleSavePermission = async (permData: PermissionCreate & { id?: number }) => {
        try {
            if (permData.id) {
                await adminUpdatePermission(permData.id, permData);
                showToast(`Permission updated successfully.`, "success");
            } else {
                await adminCreatePermission(permData);
                showToast(`Permission created successfully.`, "success");
            }
            setModalState({ type: null });
            await fetchData();
        } catch (error) {
            showToast("Failed to save permission.", "error");
        }
    };

    const handleConfirmDelete = async () => {
        const { data } = modalState;
        if (!data) return;
        try {
            if (data.type === 'role') await adminDeleteRole(data.id);
            else await adminDeletePermission(data.id);
            showToast(`${data.type} "${data.name}" deleted.`, "success");
            setModalState({ type: null });
            await fetchData();
        } catch (error) { showToast(`Failed to delete ${data.type}.`, "error"); }
    };

    const handleUpdateRoleName = async () => {
        if (!editingRole) return;
        const originalRole = roles.find(r => r.id === editingRole.id);
        if (!originalRole || originalRole.name === editingRole.name.trim()) {
            setEditingRole(null);
            return;
        }
        try {
            await adminUpdateRole(editingRole.id, { name: editingRole.name, description: originalRole.description });
            showToast(`Role renamed to "${editingRole.name}"`, "success");
            await fetchData();
        } catch (error) { showToast("Failed to rename role.", "error"); } finally { setEditingRole(null); }
    };

    // ✨ FIX: The early return is now AFTER all hooks have been called.
    if (isLoading && roles.length === 0) {
        return <SkeletonLoader />;
    }

    const sidebarContent = (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80">
            <div className="p-2 border-b border-gray-200/80">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                            activeTab === 'roles'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        Roles
                    </button>
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                            activeTab === 'permissions'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        Permissions
                    </button>
                </div>
            </div>

            {activeTab === 'roles' && (
                <div>
                    <div className="p-4 border-b border-gray-200/80 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <UserGroupIcon className="w-5 h-5 mr-3 text-indigo-600" />
                            Manage Roles
                        </h2>
                        <button onClick={() => setModalState({ type: 'role' })} className="inline-flex items-center justify-center p-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
                            <PlusIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="p-2">
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                            <input type="text" placeholder="Search roles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200/50 max-h-[calc(100vh-450px)] min-h-[150px] overflow-y-auto">
                        <LayoutGroup>
                            {filteredRoles.map(role => (
                                <motion.div layout="position" key={role.id} className={`group relative ${selectedRole?.id === role.id ? 'bg-indigo-50' : ''}`}>
                                    {editingRole?.id === role.id ? (
                                        <input type="text" value={editingRole.name} onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} onBlur={handleUpdateRoleName} onKeyDown={(e) => e.key === 'Enter' && handleUpdateRoleName()} className="w-full px-4 py-3 text-sm font-semibold text-indigo-800 bg-white border-0 ring-2 ring-indigo-500 rounded-md m-1" autoFocus />
                                    ) : (
                                        <>
                                            <button onClick={() => { setSelectedRole(role); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-between text-left px-4 py-3 transition-colors hover:bg-gray-50">
                                                <span className={`font-semibold truncate ${selectedRole?.id === role.id ? 'text-indigo-700' : 'text-gray-800'}`}>{role.name}</span>
                                                <span className="text-xs font-mono bg-gray-200 text-gray-600 rounded px-1.5 py-0.5 ml-2">{role.permissions.length}</span>
                                            </button>
                                            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-white/80 to-white/80 p-1">
                                                <button onClick={() => setEditingRole({ id: role.id, name: role.name })} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-200" title="Rename"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => setModalState({ type: 'confirm', data: { ...role, type: 'role' } })} className="p-1.5 text-gray-500 hover:text-rose-600 rounded hover:bg-gray-200" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </LayoutGroup>
                    </div>
                </div>
            )}

            {activeTab === 'permissions' && (
                <div>
                    <div className="p-4 border-b border-gray-200/80 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <CogIcon className="w-5 h-5 mr-3 text-emerald-600" />
                            Manage Permissions
                        </h2>
                        <button onClick={() => setModalState({ type: 'permission' })} className="inline-flex items-center justify-center p-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700">
                            <PlusIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-200/50 max-h-[calc(100vh-350px)] min-h-[150px] overflow-y-auto">
                        {permissions.map(permission => (
                            <div key={permission.id} className="group flex items-center justify-between px-4 py-3">
                                <span className="font-medium text-gray-700 truncate">{permission.name}</span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                    <button onClick={() => setModalState({ type: 'permission', data: permission })} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-200" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => setModalState({ type: 'confirm', data: { ...permission, type: 'permission' } })} className="p-1.5 text-gray-500 hover:text-rose-600 rounded hover:bg-gray-200" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // --- Main Return Statement ---
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                <header className="flex items-center justify-between mb-6 md:mb-10">
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                            <ShieldCheckIcon className="w-8 h-8 md:w-9 md:h-9 mr-3 text-indigo-600" />
                            Access Control
                        </h1>
                        <p className="mt-1 text-sm md:text-base text-gray-500 hidden md:block">
                            A centralized hub for managing roles and application permissions.
                        </p>
                    </motion.div>
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-100"><Bars3Icon className="w-6 h-6" /></button>
                    </div>
                </header>

                {toast && <Toast message={toast.message} type={toast.type} onDismiss={handleToastDismiss} />}

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                    <div className="hidden md:block md:col-span-1 lg:col-span-1">{sidebarContent}</div>
                    <div className="md:col-span-2 lg:col-span-3">
                        <AnimatePresence mode="wait">
                            <motion.div key={selectedRole ? selectedRole.id : 'empty'}>
                                {selectedRole ? (
                                    <RolePermissionEditor role={selectedRole} allPermissions={permissions} onSaveSuccess={fetchData} showToast={showToast} />
                                ) : (
                                    <div className="text-center p-10 bg-white rounded-xl shadow-sm border border-gray-200/80 h-full flex flex-col items-center justify-center">
                                        <ShieldCheckIcon className="w-16 h-16 text-gray-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-800">Select a Role</h3>
                                        <p className="text-gray-500 mt-1">Choose a role from the sidebar to manage its permissions.</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <Transition.Root show={isMobileMenuOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 md:hidden" onClose={setIsMobileMenuOpen}>
                    <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-50 flex">
                        <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                            <Dialog.Panel className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-gray-100 pb-12 shadow-xl">
                                <div className="flex px-4 pt-5 pb-2 justify-end">
                                    <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                                </div>
                                <div className="px-4">{sidebarContent}</div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            <AnimatePresence>
                {modalState.type === 'role' && <RoleFormModal isOpen={true} onClose={() => setModalState({ type: null })} onSave={handleSaveRole} role={modalState.data || null} />}
                {modalState.type === 'permission' && <PermissionFormModal isOpen={true} onClose={() => setModalState({ type: null })} onSave={handleSavePermission} permission={modalState.data || null} />}
                {modalState.type === 'confirm' && modalState.data && <ConfirmationModal isOpen={true} onClose={() => setModalState({ type: null })} onConfirm={handleConfirmDelete} title={`Delete ${modalState.data.type}`} message={`Are you sure you want to delete "${modalState.data.name}"? This action cannot be undone.`} />}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;