import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendTelegramReport } from '../../api/api';
import { SendTelegramReportRequest } from '../../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Spinner from '../../components/common/CalSpin';
import {
    PaperAirplaneIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon,
    UserCircleIcon,
    UserGroupIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline';

// Date formatting helper (no change)
const getFormattedDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// Toast notification component (no change)
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
                {type === 'success' ? <CheckCircleIcon className="w-6 h-6 text-white" /> : <ExclamationCircleIcon className="w-6 h-6 text-white" />}
            </div>
            <div className="ml-3 text-sm font-normal text-white">{message}</div>
            <button type="button" className="ml-auto -mx-1.5 -my-1.5 text-white hover:text-gray-100 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8" onClick={onDismiss} aria-label="Close">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" /></svg>
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

    // --- 1. ADDED MODERATOR TO ROLES ---
    const availableRoles = [
        { label: 'Area Managers', value: 'Area', icon: UserGroupIcon, description: "Send to all Area Managers." },
        { label: 'Station Owners', value: 'Owner', icon: UserCircleIcon, description: "Send to all Station Owners." },
        { label: 'Moderators', value: 'Moderator', icon: ShieldCheckIcon, description: "Send to all Moderators." },
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

    // --- 2. UPDATED AUTHORIZATION CHECK ---
    const allowedRoles = ['admin', 'moderator'];
    const userRole = currentUser?.role?.name.toLowerCase();

    if (!userRole || !allowedRoles.includes(userRole)) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
                <div className="text-center p-8 bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-gray-800">Access Restricted</h2>
                    <p className="mt-2 text-gray-500">You do not have the necessary permissions to access this page.</p>
                </div>
            </div>
        );
    }

    // Animation variants for staggering form elements
    const formVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: i => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
        })
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <AnimatePresence>
                {toast && <Toast message={toast.text} type={toast.type} onDismiss={() => setToast(null)} />}
            </AnimatePresence>

            <div className="relative isolate overflow-hidden pt-12 pb-24">
                {/* Background Gradient */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#808afc] to-[#3c4bff] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-4xl mx-auto px-4"
                >
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Telegram Report Dispatch
                        </h1>
                        <p className="mt-3 text-lg text-slate-600">
                            Generate and send customized sales reports to users via Telegram.
                        </p>
                    </div>

                    <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden border border-gray-200/50">
                        <form onSubmit={handleSendReport} className="p-6 sm:p-8">
                            <div className="space-y-8">
                                <motion.fieldset custom={0} initial="hidden" animate="visible" variants={formVariants}>
                                    <legend className="text-lg font-semibold leading-6 text-gray-900">
                                        1. Select Recipient Roles
                                    </legend>
                                    <p className="mt-1 text-sm text-gray-600">Choose which user roles will receive this report.</p>
                                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {availableRoles.map((role) => {
                                            const isSelected = selectedRoles.includes(role.value);
                                            return (
                                                <div
                                                    key={role.value}
                                                    onClick={() => handleRoleChange(role.value)}
                                                    className={`relative flex flex-col items-center justify-center text-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                                        isSelected ? 'bg-indigo-50 border-indigo-500 shadow-inner' : 'bg-white border-gray-200 hover:border-indigo-400'
                                                    }`}
                                                >
                                                    <role.icon className={`h-8 w-8 mb-2 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                    <span className={`font-semibold ${isSelected ? 'text-indigo-800' : 'text-gray-800'}`}>{role.label}</span>
                                                    <p className={`text-xs mt-1 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>{role.description}</p>
                                                    {isSelected && <CheckCircleIcon className="h-6 w-6 text-white bg-indigo-600 rounded-full p-1 absolute top-2 right-2"/>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.fieldset>

                                <motion.fieldset custom={1} initial="hidden" animate="visible" variants={formVariants}>
                                    <legend className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                                        <CalendarDaysIcon className="h-6 w-6 mr-2 text-gray-500"/>
                                        2. Select Date Range
                                    </legend>
                                    <p className="mt-1 text-sm text-gray-600">Define the period for the sales data.</p>
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <input type="date" id="start_date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5" required />
                                        </div>
                                        <div>
                                            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                            <input type="date" id="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5" required />
                                        </div>
                                    </div>
                                </motion.fieldset>

                                <motion.div custom={2} initial="hidden" animate="visible" variants={formVariants} className="pt-5">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform duration-300 shadow-lg"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Spinner size="sm" color="white" className="mr-3" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <PaperAirplaneIcon className="h-5 w-5 mr-3" />
                                                Dispatch Reports
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SendTelegramReportPage;