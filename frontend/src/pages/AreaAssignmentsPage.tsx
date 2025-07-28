import React, { useState, useEffect, useCallback } from 'react';
import { adminGetAreaDetails, adminGetStations, adminGetRoles, adminCreateArea, adminUpdateArea, adminDeleteArea, adminAssignManagersToArea, adminAssignStationsToArea, adminGetAllUsers } from '../api/api';
import { AreaDetail, StationInfo, User, AreaUpdate } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Spinner from '../components/common/CalSpin';
import ConfirmationModal from '../components/area/ConfirmationModal';
import AreaFormModal from '../components/area/AreaFormModal';

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

const AreaAssignmentsPage: React.FC = () => {
    const [areas, setAreas] = useState<AreaDetail[]>([]);
    const [allStations, setAllStations] = useState<StationInfo[]>([]);
    const [areaManagers, setAreaManagers] = useState<User[]>([]);
    const [selectedArea, setSelectedArea] = useState<AreaDetail | null>(null);
    const [assignedStations, setAssignedStations] = useState<Set<number>>(new Set());
    const [assignedManagerId, setAssignedManagerId] = useState<number | string>('');
    const [newAreaName, setNewAreaName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [showAreaModal, setShowAreaModal] = useState(false);
    const [editingArea, setEditingArea] = useState<AreaDetail | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [areaToDelete, setAreaToDelete] = useState<AreaDetail | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

    const fetchData = useCallback(async () => {
        !selectedArea && setIsLoading(true); // Only show full-page loader on initial load
        try {
            const [areasRes, stationsRes, usersRes, rolesRes] = await Promise.all([
                adminGetAreaDetails(),
                adminGetStations(),
                adminGetAllUsers(),
                adminGetRoles(),
            ]);
            const managerRole = rolesRes.data.find(role => role.name.toLowerCase() === 'area');
            const managers = managerRole ? usersRes.data.filter(user => user.role?.id === managerRole.id) : [];
            setAreas(areasRes.data);
            setAllStations(stationsRes.data);
            setAreaManagers(managers);
            if (areasRes.data.length > 0) {
                const currentSelected = selectedArea ? areasRes.data.find(a => a.id === selectedArea.id) : null;
                setSelectedArea(currentSelected || areasRes.data[0]);
            } else {
                setSelectedArea(null);
            }
        } catch (err) {
            showToast("Failed to load assignment data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [selectedArea]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedArea) {
            setAssignedStations(new Set(selectedArea.stations.map(s => s.id)));
            setAssignedManagerId(selectedArea.managers[0]?.id || '');
        }
    }, [selectedArea]);

    const handleStationToggle = (stationId: number) => {
        setAssignedStations(prev => {
            const newSelection = new Set(prev);
            newSelection.has(stationId) ? newSelection.delete(stationId) : newSelection.add(stationId);
            return newSelection;
        });
    };

    const handleSaveChanges = async () => {
        if (!selectedArea) return;
        setIsSaving(true);
        try {
            const stationIds = Array.from(assignedStations);
            const managerId = assignedManagerId ? Number(assignedManagerId) : null;
            await Promise.all([
                adminAssignStationsToArea(selectedArea.id, stationIds),
                adminAssignManagersToArea(selectedArea.id, managerId ? [managerId] : [])
            ]);
            showToast("Assignments saved successfully!", "success");
            await fetchData();
        } catch (err) {
            showToast("Failed to save assignments.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateArea = async () => {
        if (!newAreaName.trim()) return;
        try {
            await adminCreateArea({ name: newAreaName });
            setNewAreaName('');
            showToast(`Area "${newAreaName}" created.`, "success");
            await fetchData();
        } catch (err) {
            showToast("Failed to create area.", "error");
        }
    };

    const handleSaveArea = async (areaData: { id?: number; name: string }) => {
        try {
            if (areaData.id) {
                const payload: AreaUpdate = { name: areaData.name };
                await adminUpdateArea(areaData.id, payload);
                showToast(`Area "${areaData.name}" updated.`, "success");
            }
            setShowAreaModal(false);
            await fetchData();
        } catch (err) {
            showToast("Failed to save area.", "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!areaToDelete) return;
        try {
            await adminDeleteArea(areaToDelete.id);
            showToast(`Area "${areaToDelete.name}" deleted.`, "success");
            setAreaToDelete(null);
            setShowConfirmModal(false);
            setSelectedArea(null);
            await fetchData();
        } catch (err) {
            showToast("Failed to delete area.", "error");
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

    return (
        <div>
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            </AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Area Assignments</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <motion.div layout className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Manage Areas</h2>
                        <motion.ul layout className="space-y-1">
                            {areas.map(area => (
                                <motion.li key={area.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between group hover:bg-gray-50 rounded-lg">
                                    <button onClick={() => setSelectedArea(area)} className={`w-full text-left px-4 py-2 rounded-lg ${selectedArea?.id === area.id ? 'bg-indigo-600 text-white' : ''}`}>{area.name}</button>
                                    <div className="flex items-center pr-2 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => { setEditingArea(area); setShowAreaModal(true); }} className="p-1 text-gray-400 hover:text-indigo-600"><PencilIcon className="h-4 w-4" /></button>
                                        <button onClick={() => { setAreaToDelete(area); setShowConfirmModal(true); }} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                        <div className="mt-6 pt-4 border-t">
                            <h3 className="text-md font-semibold mb-3">Create New Area</h3>
                            <div className="flex">
                                <input type="text" value={newAreaName} onChange={e => setNewAreaName(e.target.value)} placeholder="New area name..." className="flex-grow rounded-l-md border-gray-300"/>
                                <button onClick={handleCreateArea} className="p-2 bg-indigo-600 text-white rounded-r-md"><PlusIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                    </motion.div>
                    <div className="md:col-span-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedArea ? selectedArea.id : 'empty'}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white p-6 rounded-xl shadow-sm border"
                            >
                                {selectedArea ? (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-semibold">Assignments for <span className="text-indigo-600">{selectedArea.name}</span></h2>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Area Manager (AM)</label>
                                            <select value={assignedManagerId} onChange={e => setAssignedManagerId(e.target.value)} className="w-full rounded-md border-gray-300">
                                                <option value="">-- Unassigned --</option>
                                                {areaManagers.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <h3 className="text-md font-medium text-gray-700 mb-2">Stations in this Area</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 border rounded-md">
                                                {allStations.map(station => (
                                                    <div key={station.id} className="flex items-center">
                                                        <input type="checkbox" id={`station-${station.id}`} checked={assignedStations.has(station.id)} onChange={() => handleStationToggle(station.id)} className="h-4 w-4 text-indigo-600 rounded"/>
                                                        <label htmlFor={`station-${station.id}`} className="ml-2 text-sm">{station.station_name}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <button onClick={handleSaveChanges} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50">
                                                {isSaving ? 'Saving...' : 'Save Assignments'}
                                            </button>
                                        </div>
                                    </div>
                                ) : <p>Select an area to manage its assignments.</p>}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
                <AnimatePresence>
                    {showAreaModal && <AreaFormModal isOpen={showAreaModal} onClose={() => setShowAreaModal(false)} onSave={handleSaveArea} area={editingArea} />}
                    {showConfirmModal && areaToDelete && <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmDelete} title="Delete Area" message={`Are you sure you want to delete "${areaToDelete.name}"?`} />}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AreaAssignmentsPage;