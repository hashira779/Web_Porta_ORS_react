import React, { useState, useEffect } from 'react';
import { adminUpdateRolePermissions } from '../../api/api';
import { Role, Permission, RoleUpdate } from '../../types';
import Spinner from '../common/CalSpin';

interface RolePermissionEditorProps {
    role: Role;
    allPermissions: Permission[];
    onSaveSuccess: () => void;
    showToast: (message: string, type: 'success' | 'error') => void; // Add this prop
}

const RolePermissionEditor: React.FC<RolePermissionEditorProps> = ({ role, allPermissions, onSaveSuccess, showToast }) => {
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const rolePermissionIds = new Set(role.permissions.map(p => p.id));
        setSelectedPermissions(rolePermissionIds);
    }, [role]);

    const handlePermissionChange = (permissionId: number) => {
        setSelectedPermissions(prev => {
            const newSelection = new Set(prev);
            newSelection.has(permissionId) ? newSelection.delete(permissionId) : newSelection.add(permissionId);
            return newSelection;
        });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const payload: RoleUpdate = {
            permission_ids: Array.from(selectedPermissions)
        };

        try {
            await adminUpdateRolePermissions(role.id, payload);
            showToast("Permissions updated successfully!", "success");
            onSaveSuccess();
        } catch (error) {
            showToast("Failed to save permission changes.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">
                    Permissions for <span className="text-indigo-600">{role.name}</span>
                </h2>
                <p className="mt-1 text-sm text-gray-500">{role.description || 'No description provided.'}</p>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {allPermissions.map(permission => (
                        <div key={permission.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`perm-${permission.id}`}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                checked={selectedPermissions.has(permission.id)}
                                onChange={() => handlePermissionChange(permission.id)}
                            />
                            <label htmlFor={`perm-${permission.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                                {permission.name}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <Spinner size="sm" color="white" className="mr-2" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </div>
    );
};

export default RolePermissionEditor;