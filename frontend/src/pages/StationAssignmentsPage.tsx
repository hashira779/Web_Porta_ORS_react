import React, { useState, useEffect, useCallback } from 'react';
import { adminGetStations, adminGetAllUsers, adminGetRoles, adminAssignStationsToOwner } from '../api/api';
import { StationInfo, User, Role } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
    const [assignedStationIds, setAssignedStationIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
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

            if (ownerUsers.length > 0) {
                const current = selectedOwner ? ownerUsers.find(o => o.id === selectedOwner.id) : null;
                handleOwnerSelect(current || ownerUsers[0]);
            }
        } catch (err) {
            showToast("Failed to load data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [selectedOwner]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleOwnerSelect = (owner: User) => {
        setSelectedOwner(owner);
        const currentlyAssigned = new Set(owner.owned_stations.map(station => station.id));
        setAssignedStationIds(currentlyAssigned);
    };

    const handleStationToggle = (stationId: number) => {
        setAssignedStationIds(prev => {
            const newSelection = new Set(prev);
            newSelection.has(stationId) ? newSelection.delete(stationId) : newSelection.add(stationId);
            return newSelection;
        });
    };

    const handleSaveChanges = async () => {
        if (!selectedOwner) return;
        setIsSaving(true);
        try {
            await adminAssignStationsToOwner(selectedOwner.id, Array.from(assignedStationIds));
            showToast("Stations assigned successfully!", "success");
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
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            </AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Station Owner Assignments</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Select Owner</h2>
                        <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {owners.map(owner => (
                                <li key={owner.id}>
                                    <button onClick={() => handleOwnerSelect(owner)} className={`w-full text-left px-4 py-2 rounded-lg ${selectedOwner?.id === owner.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}>
                                        {owner.username}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
                        {selectedOwner ? (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold">Assign Stations for <span className="text-indigo-600">{selectedOwner.username}</span></h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 border rounded-md">
                                    {stations.length > 0 ? stations.map(station => (
                                        <div key={station.id} className="flex items-center">
                                            <input type="checkbox" id={`station-${station.id}`} checked={assignedStationIds.has(station.id)} onChange={() => handleStationToggle(station.id)} className="h-4 w-4 text-indigo-600 rounded"/>
                                            <label htmlFor={`station-${station.id}`} className="ml-2 text-sm">{station.station_name}</label>
                                        </div>
                                    )) : <p className="text-sm text-gray-500">No stations available to assign.</p>}
                                </div>
                                <div className="text-right">
                                    <button onClick={handleSaveChanges} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50">
                                        {isSaving ? 'Saving...' : 'Save Assignments'}
                                    </button>
                                </div>
                            </div>
                        ) : <p>Select an owner to manage their stations.</p>}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StationAssignmentsPage;