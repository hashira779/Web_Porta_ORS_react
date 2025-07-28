import React, { useState, useEffect, useCallback } from 'react';
import { adminGetStations, adminGetAllUsers, adminGetRoles, adminAssignOwnersToStation } from '../api/api';
import { StationInfo, User, Role } from '../types';
import { motion } from 'framer-motion';
import Spinner from '../components/common/CalSpin';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(), 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg shadow-lg z-50 ${
                type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
        >
            {type === 'success' ? <CheckCircleIcon className="w-6 h-6 mr-3" /> : <ExclamationCircleIcon className="w-6 h-6 mr-3" />}
            <span className="text-sm font-medium">{message}</span>
        </motion.div>
    );
};

const StationAssignmentsPage: React.FC = () => {
    const [stations, setStations] = useState<StationInfo[]>([]);
    const [owners, setOwners] = useState<User[]>([]);
    const [selectedStation, setSelectedStation] = useState<StationInfo | null>(null);
    const [assignedOwnerIds, setAssignedOwnerIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

    const fetchData = useCallback(async () => {
        !selectedStation && setIsLoading(true);
        try {
            const [stationsRes, usersRes, rolesRes] = await Promise.all([
                adminGetStations(),
                adminGetAllUsers(),
                adminGetRoles(),
            ]);

            const ownerRole = rolesRes.data.find(r => r.name.toLowerCase() === 'owner');
            const ownerUsers = ownerRole ? usersRes.data.filter(u => u.role?.id === ownerRole.id) : [];

            setStations(stationsRes.data);
            setOwners(ownerUsers);

            if (stationsRes.data.length > 0) {
                const current = selectedStation ? stationsRes.data.find(s => s.id === selectedStation.id) : null;
                setSelectedStation(current || stationsRes.data[0]);
            }
        } catch (err) {
            showToast("Failed to load data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [selectedStation]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Find the full station detail to get its current owners
        const stationDetails = stations.find(s => s.id === selectedStation?.id) as any;
        if (stationDetails && stationDetails.owners) {
            setAssignedOwnerIds(new Set(stationDetails.owners.map((o: User) => o.id)));
        } else {
            setAssignedOwnerIds(new Set());
        }
    }, [selectedStation, stations]);

    const handleOwnerToggle = (ownerId: number) => {
        setAssignedOwnerIds(prev => {
            const newSelection = new Set(prev);
            newSelection.has(ownerId) ? newSelection.delete(ownerId) : newSelection.add(ownerId);
            return newSelection;
        });
    };

    const handleSaveChanges = async () => {
        if (!selectedStation) return;
        setIsSaving(true);
        try {
            await adminAssignOwnersToStation(selectedStation.id, Array.from(assignedOwnerIds));
            showToast("Owners assigned successfully!", "success");
            await fetchData();
        } catch (err) {
            showToast("Failed to save assignments.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Station Owner Assignments</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Select Station</h2>
                        <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {stations.map(station => (
                                <li key={station.id}>
                                    <button onClick={() => setSelectedStation(station)} className={`w-full text-left px-4 py-2 rounded-lg ${selectedStation?.id === station.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}>
                                        {station.station_name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
                        {selectedStation ? (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold">Assign Owners for <span className="text-indigo-600">{selectedStation.station_name}</span></h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 border rounded-md">
                                    {owners.map(owner => (
                                        <div key={owner.id} className="flex items-center">
                                            <input type="checkbox" id={`owner-${owner.id}`} checked={assignedOwnerIds.has(owner.id)} onChange={() => handleOwnerToggle(owner.id)} className="h-4 w-4 text-indigo-600 rounded"/>
                                            <label htmlFor={`owner-${owner.id}`} className="ml-2 text-sm">{owner.username}</label>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-right">
                                    <button onClick={handleSaveChanges} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50">
                                        {isSaving ? 'Saving...' : 'Save Assignments'}
                                    </button>
                                </div>
                            </div>
                        ) : <p>Select a station to manage its owners.</p>}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StationAssignmentsPage;