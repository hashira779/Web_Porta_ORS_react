// frontend/src/components/admin/settings/ConfirmationModal.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
    confirmButtonColor?: 'red' | 'indigo' | 'green';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 onConfirm,
                                                                 title,
                                                                 message,
                                                                 confirmButtonText = 'Confirm',
                                                                 confirmButtonColor = 'indigo'
                                                             }) => {
    if (!isOpen) return null;

    const confirmButtonClasses = {
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose} // Allows clicking outside to close
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full relative"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                    >
                        <div className="text-center">
                            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-yellow-500" /> {/* Changed to yellow for general warning */}
                            <h3 className="mt-2 text-lg leading-6 font-medium text-gray-900">{title}</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">{message}</p>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                                type="button"
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm ${confirmButtonClasses[confirmButtonColor]}`}
                                onClick={onConfirm}
                            >
                                {confirmButtonText}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;