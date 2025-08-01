import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendTelegramReport } from '../../api/api';
import { SendTelegramReportRequest } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from '../../components/common/CalSpin';
import { PaperAirplaneIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Date formatting helper
const getFormattedDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// Toast notification component
interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(), 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            className={`fixed bottom-6 right-6 flex items-center p-4 w-full max-w-xs rounded-lg shadow-lg z-50 ${
                type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
        >
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
                {type === 'success' ? (
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                ) : (
                    <ExclamationCircleIcon className="w-6 h-6 text-white" />
                )}
            </div>
            <div className="ml-3 text-sm font-normal text-white">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 text-white hover:text-gray-100 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8"
                onClick={onDismiss}
                aria-label="Close"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
            </button>
        </motion.div>
    );
};

const SendTelegramReportPage: React.FC = () => {
    const { currentUser } = useAuth();

    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(getFormattedDate(firstDayOfCurrentMonth));
    const [endDate, setEndDate] = useState(getFormattedDate(today));
    const [selectedRoles, setSelectedRoles] = useState<string[]>(['Area']);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const availableRoles = [
        { label: 'Area Managers', value: 'Area' },
        { label: 'Station Owners', value: 'Owner' },
    ];

    const showToast = (text: string, type: 'success' | 'error') => {
        setToast({ text, type });
    };

    const handleRoleChange = (roleValue: string) => {
        setSelectedRoles((prev) =>
            prev.includes(roleValue) ? prev.filter((r) => r !== roleValue) : [...prev, roleValue]
        );
    };

    const handleSendReport = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!startDate || !endDate || selectedRoles.length === 0) {
            showToast("Please set a date range and select at least one role", "error");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            showToast("End date cannot be before the start date", "error");
            return;
        }

        setIsLoading(true);
        try {
            const requestPayload: SendTelegramReportRequest = {
                start_date: startDate,
                end_date: endDate,
                roles: selectedRoles,
            };

            const response = await sendTelegramReport(requestPayload);
            showToast(response.data?.message || "Reports sent successfully", "success");
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || "Failed to send reports";
            showToast(errorMessage, "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (currentUser?.role?.name.toLowerCase() !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-gray-800">Access Restricted</h2>
                    <p className="mt-2 text-gray-500">Administrator privileges required to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <AnimatePresence>
                {toast && <Toast message={toast.text} type={toast.type} onDismiss={() => setToast(null)} />}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
            >
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Telegram Report Dispatch</h1>
                    <p className="mt-2 text-sm md:text-base text-gray-500">
                        Generate and send customized sales reports to users via Telegram
                    </p>
                </div>

                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">Report Configuration</h2>
                    </div>

                    <form onSubmit={handleSendReport} className="p-6 sm:p-8">
                        <div className="space-y-6">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Recipient Roles</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {availableRoles.map((role) => (
                                        <div key={role.value} className="relative flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id={role.value}
                                                    name="roles"
                                                    type="checkbox"
                                                    checked={selectedRoles.includes(role.value)}
                                                    onChange={() => handleRoleChange(role.value)}
                                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor={role.value} className="font-medium text-gray-700 cursor-pointer">
                                                    {role.label}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        id="start_date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        id="end_date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                        isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Spinner size="sm" color="white" className="mr-3" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <PaperAirplaneIcon className="h-5 w-5 mr-2 -ml-1" />
                                            Dispatch Reports
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>Reports will be delivered via Telegram to users with the selected roles</p>
                </div>
            </motion.div>
        </div>
    );
};

export default SendTelegramReportPage;