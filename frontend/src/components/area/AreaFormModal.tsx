import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaDetail } from '../../types';

interface AreaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (areaData: { id?: number; name: string }) => void;
    area: AreaDetail | null; // Pass null for creating, an Area object for editing
}

const AreaFormModal: React.FC<AreaFormModalProps> = ({ isOpen, onClose, onSave, area }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(area ? area.name : '');
        }
    }, [area, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Area name cannot be empty.");
            return;
        }
        onSave({ id: area?.id, name });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {area ? 'Edit Area' : 'Create New Area'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="areaName" className="block text-sm font-medium text-gray-700">
                                Area Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="areaName"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                {area ? 'Save Changes' : 'Create Area'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AreaFormModal;