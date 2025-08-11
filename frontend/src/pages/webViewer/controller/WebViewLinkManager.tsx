import React, { useState, useEffect, useCallback } from 'react';
import { WebViewLink } from '../../../types';
import {
    adminGetAllWebViewLinks,
    adminCreateWebViewLink,
    adminUpdateWebViewLink,
    adminDeleteWebViewLink
} from '../../../api/api';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Helper function to format date strings nicely
const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

interface Notification {
    id: number;
    type: 'success' | 'error';
    message: string;
}

const WebViewLinkManager: React.FC = () => {
    const [links, setLinks] = useState<WebViewLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLink, setCurrentLink] = useState<Partial<WebViewLink>>({});
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000); // Auto-dismiss after 5 seconds
    };

    const fetchLinks = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await adminGetAllWebViewLinks();
            setLinks(response.data);
            setError(null);
        } catch (err: any) {
            setError('Failed to fetch links.');
            addNotification('error', 'Failed to fetch links.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleOpenModal = (link: Partial<WebViewLink> = {}) => {
        const initialState = link.id ? link : { ...link, is_active: true };
        setCurrentLink(initialState);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentLink({});
    };

    const handleSave = async () => {
        if (!currentLink.title || !currentLink.url) {
            addNotification('error', 'Title and URL are required.');
            return;
        }

        try {
            if (currentLink.id) {
                const updatePayload = {
                    title: currentLink.title,
                    url: currentLink.url,
                    is_active: currentLink.is_active
                };
                await adminUpdateWebViewLink(currentLink.id, updatePayload);
                addNotification('success', 'Link updated successfully.');
            } else {
                const createData = {
                    title: currentLink.title,
                    url: currentLink.url,
                    is_active: currentLink.is_active ?? true,
                };
                await adminCreateWebViewLink(createData);
                addNotification('success', 'Link created successfully.');
            }
            handleCloseModal();
            fetchLinks();
        } catch (err: any) {
            addNotification('error', 'Failed to save link.');
        }
    };

    const handleConfirmDelete = async () => {
        if (confirmDeleteId === null) return;
        try {
            await adminDeleteWebViewLink(confirmDeleteId);
            addNotification('success', 'Link deleted successfully.');
            fetchLinks();
        } catch (err: any) {
            addNotification('error', 'Failed to delete link.');
        } finally {
            setConfirmDeleteId(null);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage WebViewer Links</h1>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md shadow hover:bg-gray-700 transition-colors duration-300 flex items-center"
                >
                    <XMarkIcon className="w-5 h-5 mr-2" />
                    Back
                </button>
            </div>
            <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors duration-300 mb-6 flex items-center animate-fade-in"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add New Link
            </button>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md animate-fade-in">
                    {error}
                </div>
            )}

            <div className="bg-white shadow-lg rounded-xl overflow-hidden animate-slide-up">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {links.map((link) => (
                        <tr key={link.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{link.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-md">{link.url}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            link.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {link.is_active ? 'Active' : 'Inactive'}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(link.created_at)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(link.updated_at)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-4">
                                <button
                                    onClick={() => handleOpenModal(link)}
                                    className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                >
                                    <PencilIcon className="w-4 h-4 mr-1" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteId(link.id)}
                                    className="text-red-600 hover:text-red-900 flex items-center"
                                >
                                    <TrashIcon className="w-4 h-4 mr-1" />
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentLink.id ? 'Edit' : 'Add New'} Link</h2>
                        <div className="space-y-6">
                            <input
                                type="text"
                                placeholder="Title"
                                value={currentLink.title || ''}
                                onChange={(e) => setCurrentLink({ ...currentLink, title: e.target.value })}
                                className="border border-gray-300 p-3 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                            <input
                                type="text"
                                placeholder="URL (e.g., http://example.com)"
                                value={currentLink.url || ''}
                                onChange={(e) => setCurrentLink({ ...currentLink, url: e.target.value })}
                                className="border border-gray-300 p-3 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentLink.is_active === true}
                                    onChange={(e) => setCurrentLink({ ...currentLink, is_active: e.target.checked })}
                                    className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500"
                                />
                                Active
                            </label>
                        </div>
                        <div className="flex justify-end mt-8 space-x-4">
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-300 flex items-center"
                            >
                                <XMarkIcon className="w-5 h-5 mr-2" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center"
                            >
                                <CheckIcon className="w-5 h-5 mr-2" />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmDeleteId !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this link? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-300 flex items-center"
                            >
                                <XMarkIcon className="w-5 h-5 mr-2" />
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300 flex items-center"
                            >
                                <TrashIcon className="w-5 h-5 mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`p-4 rounded-md shadow-md flex items-center space-x-3 animate-slide-in ${
                            notif.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                    >
                        {notif.type === 'success' ? (
                            <CheckCircleIcon className="w-6 h-6" />
                        ) : (
                            <ExclamationCircleIcon className="w-6 h-6" />
                        )}
                        <span>{notif.message}</span>
                    </div>
                ))}
            </div>

            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    .animate-fade-in {
                        animation: fadeIn 0.5s ease-in-out;
                    }
                    .animate-slide-up {
                        animation: slideUp 0.5s ease-in-out;
                    }
                    .animate-slide-in {
                        animation: slideIn 0.3s ease-out;
                    }
                `}
            </style>
        </div>
    );
};

export default WebViewLinkManager;