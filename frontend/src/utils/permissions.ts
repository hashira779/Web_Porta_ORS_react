// src/utils/permissions.ts

import { Permission } from '../types';

/**
 * Groups permissions by their prefix (e.g., 'view_reports', 'edit_reports' under "Reports").
 * This function capitalizes the group name for a cleaner display.
 * @param permissions - The flat array of all permission objects.
 * @returns An object where keys are group names and values are arrays of permissions.
 */
export const groupPermissions = (permissions: Permission[]): Record<string, Permission[]> => {
    const grouped: Record<string, Permission[]> = {};

    permissions.forEach(permission => {
        const parts = permission.name.split('_');
        // Use the first part as the group name, or 'general' if there's no underscore.
        const groupName = parts.length > 1 ? parts[0] : 'general';
        const capitalizedGroupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);

        if (!grouped[capitalizedGroupName]) {
            grouped[capitalizedGroupName] = [];
        }
        grouped[capitalizedGroupName].push(permission);
    });

    return grouped;
};