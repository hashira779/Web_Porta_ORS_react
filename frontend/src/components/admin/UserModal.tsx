import React, { useState, useEffect } from 'react';
import { User, Role, UserFormData } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: UserFormData) => void;
    user: User | null;
    roles: Role[];
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, roles }) => {
    const [formData, setFormData] = useState<UserFormData>({
        username: '', email: '', role_id: 0
    });

    // DEBUG: Log when the isOpen prop changes
    useEffect(() => {
        console.log("Modal isOpen state:", isOpen);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (user) { // Editing existing user
                setFormData({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role_id: user.role.id,
                    is_active: user.is_active,
                });
            } else { // Creating a new user
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    role_id: roles.length > 0 ? roles[0].id : 0, // Safer default
                    is_active: true,
                });
            }
        }
    }, [user, isOpen, roles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'role_id' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                // CORRECTED: Increased z-index to z-[100] to ensure it's on top
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    {/* Modal Content */}
                    <motion.div
                        className="bg-white rounded-lg shadow-xl p-6 sm:p-8 z-10 w-full max-w-md"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <h2 className="text-2xl font-bold mb-6">{user ? 'Edit User' : 'Create New User'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Form fields remain the same */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                            </div>
                            {!user && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select name="role_id" value={formData.role_id} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">Save</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserModal;