import React, { useState, useEffect } from 'react';
import { adminTerminateUserSessions } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/CalSpin';
import { PowerIcon, UserCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../../components/common/ConfirmationModal';

interface ActiveUser {
    user_id: number;
    username: string;
    login_time: string;
}

// NEW: Interface for the viewer's location
interface LocationData {
    ip: string;
    city: string;
    country: string;
}

const SessionManagementPage: React.FC = () => {
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
    const [terminating, setTerminating] = useState(false);

    // NEW: State to hold the admin's location
    const [location, setLocation] = useState<LocationData | null>(null);

    const { currentUser } = useAuth();

    // This useEffect for the WebSocket remains the same
    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/active-sessions`;

        const socket = new WebSocket(wsUrl);
        socket.onopen = () => setLoading(false);
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'initial_state' || message.type === 'active_users_update') {
                setActiveUsers(message.data.filter((user: ActiveUser) => user.user_id !== currentUser?.id));
            }
        };
        socket.onerror = () => {
            setError("Connection to real-time service failed.");
            setLoading(false);
        };
        return () => socket.close();
    }, [currentUser]);

    // --- NEW: useEffect to fetch the admin's location once ---
    useEffect(() => {
        fetch('http://ip-api.com/json/?fields=query,city,country')
            .then(res => res.json())
            .then(data => {
                setLocation({ ip: data.query, city: data.city, country: data.country });
            })
            .catch(err => console.error("Could not fetch location:", err));
    }, []);

    // No changes to handleTerminate functions
    const handleTerminateClick = (user: ActiveUser) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleConfirmTerminate = async () => {
        if (!selectedUser) return;
        setTerminating(true);
        try {
            await adminTerminateUserSessions(selectedUser.user_id);
        } catch (err) {
            console.error("Failed to terminate session", err);
        } finally {
            setTerminating(false);
            setIsModalOpen(false);
            setSelectedUser(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    if (error) {
        return <div className="p-4 text-red-600 bg-red-50 rounded-md">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl shadow-sm border">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Real-Time Active Sessions</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            This list updates automatically. Terminating a session will force the user to log in again.
                        </p>
                    </div>
                    {/* --- NEW: Display for the admin's location --- */}
                    {location && (
                        <div className="text-right">
                            <h2 className="text-sm font-medium text-gray-500">Your Location</h2>
                            <div className="flex items-center justify-end text-sm text-gray-800 mt-1">
                                <MapPinIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                                {location.city}, {location.country} ({location.ip})
                            </div>
                        </div>
                    )}
                </div>

                {/* The rest of the page (table and modal) remains the same */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Time</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {activeUsers.length > 0 ? activeUsers.map(user => (
                            <tr key={user.user_id}>
                                <td className="px-4 py-4">
                                    <div className="flex items-center">
                                        <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
                                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">
                                    {new Date(user.login_time).toLocaleString()}
                                </td>
                                <td className="px-4 py-4 text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleTerminateClick(user)}
                                        className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
                                    >
                                        <PowerIcon className="h-4 w-4 mr-1.5" />
                                        Terminate Session
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                                    No users are currently logged in.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && (
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmTerminate}
                    title="Terminate Session"
                    confirmText="Terminate"
                    isConfirming={terminating}
                >
                    Are you sure you want to terminate all active sessions for <strong>{selectedUser.username}</strong>?
                </ConfirmationModal>
            )}
        </div>
    );
};

export default SessionManagementPage;