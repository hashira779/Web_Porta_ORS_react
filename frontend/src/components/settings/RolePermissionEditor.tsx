// src/components/settings/RolePermissionEditor.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Role, Permission } from '../../types';
import { adminUpdateRolePermissions } from '../../api/api';
import { motion } from 'framer-motion';
import { groupPermissions } from '../../utils/permissions';

interface RolePermissionEditorProps {
    role: Role;
    allPermissions: Permission[];
    onSaveSuccess: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const RolePermissionEditor: React.FC<RolePermissionEditorProps> = ({ role, allPermissions, onSaveSuccess, showToast }) => {
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSelectedPermissions(new Set(role.permissions.map(p => p.id)));
    }, [role]);

    const groupedPermissions = useMemo(() => groupPermissions(allPermissions), [allPermissions]);

    const handlePermissionChange = (permissionId: number) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permissionId)) {
                newSet.delete(permissionId);
            } else {
                newSet.add(permissionId);
            }
            return newSet;
        });
    };

    const handleGroupSelectAll = (groupPermissions: Permission[], shouldSelect: boolean) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            groupPermissions.forEach(p => {
                if (shouldSelect) {
                    newSet.add(p.id);
                } else {
                    newSet.delete(p.id);
                }
            });
            return newSet;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await adminUpdateRolePermissions(role.id, { permission_ids: Array.from(selectedPermissions) });
            showToast(`Permissions for "${role.name}" updated successfully.`, 'success');
            onSaveSuccess();
        } catch (error) {
            showToast('Failed to update permissions.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200/80 h-full flex flex-col"
        >
            <div className="px-5 py-4 sm:px-6 border-b border-gray-200/80">
                <h3 className="text-lg font-semibold text-gray-900">
                    Permissions for <span className="ml-1.5 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg font-bold text-base">{role.name}</span>
                </h3>
                {role.description && <p className="mt-1 text-sm text-gray-500">{role.description}</p>}
            </div>

            <div className="p-3 sm:p-4 flex-grow overflow-y-auto bg-gray-50/50">
                <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([groupName, permissionsInGroup]) => {
                        const allSelected = permissionsInGroup.every(p => selectedPermissions.has(p.id));
                        return (
                            <div key={groupName} className="bg-white p-4 border border-gray-200/80 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/80">
                                    <h4 className="text-base font-semibold text-gray-800">{groupName}</h4>
                                    <label className="flex items-center space-x-2 cursor-pointer text-sm group">
                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={allSelected} onChange={(e) => handleGroupSelectAll(permissionsInGroup, e.target.checked)} />
                                        <span className="font-medium text-gray-600 group-hover:text-indigo-600">Select All</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                    {permissionsInGroup.map(permission => (
                                        <label key={permission.id} className="flex items-center space-x-3 cursor-pointer p-1 rounded-md hover:bg-gray-100">
                                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={selectedPermissions.has(permission.id)} onChange={() => handlePermissionChange(permission.id)} />
                                            <span className="text-sm text-gray-700 font-medium capitalize">{permission.name.replace(/_/g, ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-5 py-4 sm:px-6 bg-white/60 backdrop-blur-sm border-t border-gray-200/80 rounded-b-xl sticky bottom-0">
                <div className="flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default RolePermissionEditor;