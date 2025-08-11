import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '../../hooks/useNotification';

const Notification: React.FC = () => {
    const { isOpen, message, type, hideNotification } = useNotificationStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.5 }}
                    className="fixed bottom-5 right-5 z-[200] w-full max-w-sm"
                >
                    <div className="rounded-xl bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                {type === 'success' ? (
                                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                ) : (
                                    <XCircleIcon className="h-6 w-6 text-red-500" />
                                )}
                            </div>
                            <div className="ml-3 w-0 flex-1 pt-0.5">
                                <p className="font-semibold text-gray-900">{type === 'success' ? 'Success' : 'Error'}</p>
                                <p className="mt-1 text-sm text-gray-600">{message}</p>
                            </div>
                            <div className="ml-4 flex flex-shrink-0">
                                <button
                                    onClick={hideNotification}
                                    className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Notification;