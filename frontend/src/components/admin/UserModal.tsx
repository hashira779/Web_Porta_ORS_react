import React, { useState, useEffect } from 'react';
import { User, Role, UserFormData } from '../../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    XMarkIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Spinner from '../common/CalSpin';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: UserFormData) => Promise<void> | void;
    user: User | null;
    roles: Role[];
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, roles }) => {
    const [formData, setFormData] = useState<UserFormData>({
        username: '', email: '', user_id: '', role_id: 0, is_active: true, password: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setSubmitError(null);
            if (user) {
                setFormData({ id: user.id, username: user.username, email: user.email, user_id: user.user_id || '', role_id: user.role?.id || 0, is_active: user.is_active, password: '' });
            } else {
                setFormData({ username: '', email: '', password: '', user_id: '', role_id: roles[0]?.id || 0, is_active: true });
            }
        }
    }, [user, isOpen, roles]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
        if (user && formData.password && formData.password.length < 6) {
            newErrors.password = 'New password must be at least 6 characters';
        } else if (!user && (!formData.password || formData.password.length < 6)) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (!formData.role_id) newErrors.role_id = 'Please select a role';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : name === 'role_id' ? parseInt(value) : value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await onSave(formData);
            // The parent component (`UserManagement`) is responsible for closing the modal on success now.
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to save user. Please try again.';
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- REFINED ANIMATION VARIANTS ---
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                type: 'spring',
                stiffness: 260,
                damping: 25
            }
        })
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b border-gray-200">
                            <h2 id="modal-title" className="text-2xl font-bold text-gray-900">{user ? 'Edit User' : 'Create New User'}</h2>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Close">
                                <XMarkIcon className="h-6 w-6" />
                            </motion.button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {submitError && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 flex items-start gap-2 text-sm">
                                    <ExclamationCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                    <span>{submitError}</span>
                                </motion.div>
                            )}

                            {/* Each form field has a staggered animation */}
                            <motion.div custom={0} initial="hidden" animate="visible" variants={itemVariants}>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                                <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} className={`form-input w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition ${errors.username ? 'border-red-400' : ''}`} />
                                {errors.username && <p className="mt-1.5 text-xs text-red-600">{errors.username}</p>}
                            </motion.div>

                            <motion.div custom={1} initial="hidden" animate="visible" variants={itemVariants}>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} className={`form-input w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition ${errors.email ? 'border-red-400' : ''}`} />
                                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                            </motion.div>

                            <motion.div custom={2} initial="hidden" animate="visible" variants={itemVariants}>
                                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1.5">Telegram Chat ID (Optional)</label>
                                <input id="user_id" type="text" name="user_id" value={formData.user_id || ''} onChange={handleChange} placeholder="e.g., 123456789" className="form-input w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" />
                            </motion.div>

                            <motion.div custom={3} initial="hidden" animate="visible" variants={itemVariants}>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {user ? 'New Password' : 'Password'}
                                    {!user && <span className="text-red-500"> *</span>}
                                </label>
                                <input id="password" type="password" name="password" value={formData.password || ''} onChange={handleChange} placeholder={user ? "Leave blank to keep current" : "Min. 6 characters"} className={`form-input w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition ${errors.password ? 'border-red-400' : ''}`} />
                                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
                            </motion.div>

                            <motion.div custom={4} initial="hidden" animate="visible" variants={itemVariants}>
                                <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                                <select id="role_id" name="role_id" value={formData.role_id} onChange={handleChange} className={`form-select w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition ${errors.role_id ? 'border-red-400' : ''}`}>
                                    {roles.length === 0 ? <option disabled>No roles available</option> : roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
                                </select>
                                {errors.role_id && <p className="mt-1.5 text-xs text-red-600">{errors.role_id}</p>}
                            </motion.div>

                            <motion.div custom={5} initial="hidden" animate="visible" variants={itemVariants} className="flex items-center pt-2">
                                <input id="is_active" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor="is_active" className="ml-3 block text-sm text-gray-700 cursor-pointer select-none">User is Active</label>
                            </motion.div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6">
                                <motion.button type="button" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-gray-800 bg-gray-100 hover:bg-gray-200 disabled:opacity-70 transition-colors font-semibold text-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>Cancel</motion.button>
                                <motion.button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center min-w-[120px] transition-colors font-semibold text-sm shadow-lg shadow-indigo-500/30" whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
                                    {isSubmitting ? <Spinner size="sm" color="white" /> : <>{user ? 'Save Changes' : 'Create User'}</>}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserModal;