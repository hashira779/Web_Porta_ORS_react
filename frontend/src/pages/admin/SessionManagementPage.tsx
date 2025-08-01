import React, { useState, useEffect } from 'react';
import { adminTerminateUserSessions, adminGetUsersWithHistory, adminGetHistoryForUser } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/CalSpin';
import { PowerIcon, UserCircleIcon, UsersIcon, ClockIcon, DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { UserHistoryResponse, SessionDetail } from '../../types';

// --- Type Definitions ---
interface ActiveUser {
    user_id: number;
    username: string;
    login_time: string;
}

interface UserHistorySummary {
    user_id: number;
    username: string;
    session_count: number;
}

// ======================================================================
// PART 1: Active Sessions Tab
// ======================================================================
const ActiveSessionsTab: React.FC = () => {
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [terminating, setTerminating] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/active-sessions`;
        const socket = new WebSocket(wsUrl);
        socket.onopen = () => setLoading(false);
        socket.onmessage = (event) => {
            const rawSessions: ActiveUser[] = JSON.parse(event.data).data;
            const uniqueUsersMap = new Map<number, ActiveUser>();
            for (const session of rawSessions) {
                if (!uniqueUsersMap.has(session.user_id) || new Date(session.login_time) > new Date(uniqueUsersMap.get(session.user_id)!.login_time)) {
                    uniqueUsersMap.set(session.user_id, session);
                }
            }
            const uniqueActiveUsers = Array.from(uniqueUsersMap.values());
            uniqueActiveUsers.sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime());
            setActiveUsers(uniqueActiveUsers);
        };
        socket.onerror = () => setLoading(false);
        return () => socket.close();
    }, []);

    const handleTerminateClick = (user: ActiveUser) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleConfirmTerminate = async () => {
        if (!selectedUser) return;
        setTerminating(true);
        await adminTerminateUserSessions(selectedUser.user_id);
        setTerminating(false);
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login Time</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {activeUsers.length > 0 ? activeUsers.map(user => (
                    <tr key={`active-user-${user.user_id}`} className={user.user_id === currentUser?.id ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-4"><div className="flex items-center"><UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" /><div className="text-sm font-medium text-gray-900">{user.username} {user.user_id === currentUser?.id && <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">You</span>}</div></div></td>
                        <td className="px-4 py-4 text-sm text-gray-600">{new Date(user.login_time).toLocaleString()}</td>
                        <td className="px-4 py-4 text-right"><button onClick={() => handleTerminateClick(user)} className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50" disabled={user.user_id === currentUser?.id}><PowerIcon className="h-4 w-4 mr-1.5" />Terminate All Sessions</button></td>
                    </tr>
                )) : (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">No users are currently logged in.</td></tr>
                )}
                </tbody>
            </table>
            {selectedUser && <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmTerminate} title="Terminate All Sessions" confirmText="Terminate" isConfirming={terminating}>Are you sure you want to terminate all active sessions for <strong>{selectedUser.username}</strong>?</ConfirmationModal>}
        </div>
    );
};

// ======================================================================
// PART 2: Login History Tab
// ======================================================================
interface LoginHistoryTabProps {
    onViewDetails: (userId: number) => void; // Function to switch to the details view
}
const LoginHistoryTab: React.FC<LoginHistoryTabProps> = ({ onViewDetails }) => {
    const [userHistory, setUserHistory] = useState<UserHistorySummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminGetUsersWithHistory()
            .then(response => { setUserHistory(response.data); })
            .catch(err => { console.error("Failed to fetch user history:", err); })
            .finally(() => { setLoading(false); });
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Logins</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {userHistory.length > 0 ? userHistory.map(user => (
                    <tr key={user.user_id}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{user.session_count}</td>
                        <td className="px-4 py-4 text-right">
                            <button onClick={() => onViewDetails(user.user_id)} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md">
                                <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                                View Details
                            </button>
                        </td>
                    </tr>
                )) : (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">No session history found.</td></tr>
                )}
                </tbody>
            </table>
        </div>
    );
};

// ======================================================================
// PART 3: User Details View
// ======================================================================
interface UserDetailsViewProps {
    userId: number;
    onBack: () => void; // Function to go back to the main view
}
const UserDetailsView: React.FC<UserDetailsViewProps> = ({ userId, onBack }) => {
    const [history, setHistory] = useState<SessionDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');

    useEffect(() => {
        adminGetHistoryForUser(userId)
            .then(response => {
                const data: UserHistoryResponse = response.data;
                setHistory(data.history);
                setUsername(data.username);
            })
            .catch(err => console.error("Failed to fetch user details", err))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 mb-4">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Login History
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    Login History for <span className="text-blue-600">{username}</span>
                </h1>
            </div>
            <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logout Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device/Browser</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {history.length > 0 ? history.map(session => (
                        <tr key={session.id}>
                            <td className="px-4 py-4 text-sm text-gray-600">{new Date(session.login_time).toLocaleString()}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{session.logout_time ? new Date(session.logout_time).toLocaleString() : <span className="text-gray-400 italic">Still Active</span>}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{session.ip_address || 'Unknown'}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{session.user_agent || 'Unknown'}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No login history found for this user.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// ======================================================================
// MAIN PAGE CONTAINER: Manages which part of the page is visible
// ======================================================================
const SessionManagementPage: React.FC = () => {
    const [view, setView] = useState<'main' | 'details'>('main');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const handleViewDetails = (userId: number) => {
        setSelectedUserId(userId);
        setView('details');
    };

    const handleBackToMain = () => {
        setSelectedUserId(null);
        setView('main');
    };

    if (view === 'details' && selectedUserId) {
        return <UserDetailsView userId={selectedUserId} onBack={handleBackToMain} />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Session Management</h1>
                <p className="text-sm text-gray-600 mt-1">Monitor live sessions or review historical login data.</p>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('active')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <UsersIcon className="h-5 w-5 mr-2" /> Active Sessions
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <ClockIcon className="h-5 w-5 mr-2" /> Login History
                    </button>
                </nav>
            </div>
            <div>
                {activeTab === 'active' ? <ActiveSessionsTab /> : <LoginHistoryTab onViewDetails={handleViewDetails} />}
            </div>
        </div>
    );
};

export default SessionManagementPage;
