// src/components/settings/PermissionFormModal.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Permission } from '../../types';

interface PermissionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (permissionData: { id?: number; name: string; description?: string | null }) => void;
    permission: Permission | null;
}

const PermissionFormModal: React.FC<PermissionFormModalProps> = ({ isOpen, onClose, onSave, permission }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState<string | null>('');

    useEffect(() => {
        if (permission) {
            setName(permission.name);
            setDescription(permission.description || '');
        } else {
            setName('');
            setDescription('');
        }
    }, [permission]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            return;
        }
        onSave({ id: permission?.id, name, description: description || null });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {permission ? 'Edit Permission' : 'Create New Permission'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor="permissionName" className="block text-sm font-medium text-gray-700">
                                    Permission Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="permissionName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., view_reports"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="permissionDescription" className="block text-sm font-medium text-gray-700">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="permissionDescription"
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={description || ''}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {permission ? 'Save Changes' : 'Create Permission'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PermissionFormModal;