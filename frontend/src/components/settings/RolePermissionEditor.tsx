import React, { useState, useEffect } from 'react';
// CORRECTED: Import the correct function name for updating permissions
import { adminUpdateRolePermissions } from '../../api/api';
import { Role, Permission, RoleUpdate } from '../../types';

interface RolePermissionEditorProps {
    role: Role;
    allPermissions: Permission[];
    onSaveSuccess: () => void;
}

const RolePermissionEditor: React.FC<RolePermissionEditorProps> = ({ role, allPermissions, onSaveSuccess }) => {
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

    useEffect(() => {
        const rolePermissionIds = new Set(role.permissions.map(p => p.id));
        setSelectedPermissions(rolePermissionIds);
    }, [role]);

    const handlePermissionChange = (permissionId: number) => {
        const newSelection = new Set(selectedPermissions);
        if (newSelection.has(permissionId)) {
            newSelection.delete(permissionId);
        } else {
            newSelection.add(permissionId);
        }
        setSelectedPermissions(newSelection);
    };

    const handleSaveChanges = () => {
        // CORRECTED: Create a payload that matches the RoleUpdate type
        const payload: RoleUpdate = {
            permission_ids: Array.from(selectedPermissions)
        };

        // CORRECTED: Call the right function with the correct payload
        adminUpdateRolePermissions(role.id, payload)
            .then(() => {
                alert("Role permissions updated successfully!");
                onSaveSuccess();
            })
            .catch(() => alert("Failed to save permission changes."));
    };

    // ... Your JSX remains the same ...
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-1">Permissions for <span className="text-indigo-600">{role.name}</span></h2>
            <p className="text-sm text-gray-500 mb-6">{role.description || 'No description provided.'}</p>
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
            <div className="mt-8 text-right">
                <button
                    onClick={handleSaveChanges}
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default RolePermissionEditor;