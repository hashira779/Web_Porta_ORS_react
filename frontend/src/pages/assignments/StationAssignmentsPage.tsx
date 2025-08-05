import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminGetStations, adminGetAllUsers, adminGetRoles, adminAssignStationsToOwner } from '../../api/api';
import { StationInfo, User, Role } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlassIcon as FiSearch,
    UserIcon as FiUser,
    ArrowDownTrayIcon as FiSave,
    FunnelIcon as FiFilter,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ChevronUpDownIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
type ToastProps = {
    message: string;
    type: 'success' | 'error';
    onDismiss: () => void;
};
const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-6 right-6 flex items-center p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}
    >
        {type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
        ) : (
            <ExclamationCircleIcon className="w-5 h-5 mr-2 text-red-600" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onDismiss} className="ml-4 text-gray-400 hover:text-gray-500">
            <XMarkIcon className="w-4 h-4" />
        </button>
    </motion.div>
);
const StationAssignmentsPage = () => {
    const [stations, setStations] = useState<StationInfo[]>([]);
    const [owners, setOwners] = useState<User[]>([]);
    const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
    const [assignedStationIds, setAssignedStationIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [ownerSearchTerm, setOwnerSearchTerm] = useState('');
    const [showAssignedOnly, setShowAssignedOnly] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'station_name', direction: 'asc' });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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

            setOwners(ownerUsers);
            setStations(stationsRes.data);

            if (ownerUsers.length > 0) {
                handleOwnerSelect(ownerUsers[0]);
            }
        } catch (err) {
            showToast("Failed to load data. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOwnerSelect = (owner: User) => {
        setSelectedOwner(owner);
        setAssignedStationIds(new Set(owner.owned_stations?.map(station => station.id) || []));
    };

    const handleStationToggle = (stationId: number) => {
        setAssignedStationIds(prev => {
            const newSet = new Set(prev);
            newSet.has(stationId) ? newSet.delete(stationId) : newSet.add(stationId);
            return newSet;
        });
    };

    const handleSave = async () => {
        if (!selectedOwner) return;
        setIsSaving(true);
        try {
            await adminAssignStationsToOwner(selectedOwner.id, Array.from(assignedStationIds));
            showToast("Assignments saved successfully!", "success");
            fetchData();
        } catch (err) {
            showToast("Failed to save assignments.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const requestSort = (key: keyof StationInfo) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };


    const sortedStations = useMemo(() => {
        const sortableItems = [...stations];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof StationInfo];
                const bValue = b[sortConfig.key as keyof StationInfo];

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [stations, sortConfig]);

    const filteredStations = useMemo(() => {
        return sortedStations.filter(station => {
            const matchesSearch = station.station_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = showAssignedOnly ? assignedStationIds.has(station.id) : true;
            return matchesSearch && matchesFilter;
        });
    }, [sortedStations, searchTerm, showAssignedOnly, assignedStationIds]);

    const filteredOwners = useMemo(() => {
        return owners.filter(owner =>
            owner.username.toLowerCase().includes(ownerSearchTerm.toLowerCase()) ||
            owner.email?.toLowerCase().includes(ownerSearchTerm.toLowerCase())
        );
    }, [owners, ownerSearchTerm]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Station Owner Assignments</h1>
                    <p className="text-gray-600 mt-1">Manage station ownership assignments with ease</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Owners Panel */}
                    <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold flex items-center text-gray-900">
                                <FiUser className="mr-2 w-5 h-5 text-indigo-600" />
                                Select Owner
                            </h2>
                            <div className="mt-3 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="text-gray-400 w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search owners..."
                                    className="pl-9 w-full py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    value={ownerSearchTerm}
                                    onChange={(e) => setOwnerSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                            <ul className="divide-y divide-gray-200">
                                {filteredOwners.map(owner => (
                                    <li key={owner.id}>
                                        <button
                                            onClick={() => handleOwnerSelect(owner)}
                                            className={`w-full text-left px-4 py-3 text-sm ${
                                                selectedOwner?.id === owner.id
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">{owner.username}</span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    {owner.owned_stations?.length || 0}
                                                </span>
                                            </div>
                                            {owner.email && (
                                                <div className="text-xs text-gray-500 truncate mt-1">{owner.email}</div>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Stations Panel */}
                    <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200">
                        {selectedOwner ? (
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Assign Stations for <span className="text-indigo-600">{selectedOwner.username}</span>
                                            </h2>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {assignedStationIds.size} of {stations.length} stations selected
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FiSearch className="text-gray-400 w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search stations..."
                                                    className="pl-9 w-full sm:w-64 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setShowAssignedOnly(!showAssignedOnly)}
                                                className={`flex items-center px-3 py-2 border rounded-md text-sm ${
                                                    showAssignedOnly
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <FiFilter className="mr-1.5 w-4 h-4" />
                                                {showAssignedOnly ? 'Show All' : 'Assigned Only'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                        checked={filteredStations.length > 0 && filteredStations.every(s => assignedStationIds.has(s.id))}
                                                        onChange={() => {
                                                            const allSelected = filteredStations.every(s => assignedStationIds.has(s.id));
                                                            const newSelection = new Set(assignedStationIds);
                                                            filteredStations.forEach(station => {
                                                                allSelected ? newSelection.delete(station.id) : newSelection.add(station.id);
                                                            });
                                                            setAssignedStationIds(newSelection);
                                                        }}
                                                    />
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => requestSort('station_name')}
                                            >
                                                <div className="flex items-center">
                                                    Station Name
                                                    <ChevronUpDownIcon className="ml-1 w-4 h-4 text-gray-400" />
                                                    {sortConfig.key === 'station_name' && (
                                                        <span className="ml-1 text-xs">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStations.length > 0 ? (
                                            filteredStations.map(station => (
                                                <tr key={station.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                            checked={assignedStationIds.has(station.id)}
                                                            onChange={() => handleStationToggle(station.id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{station.station_name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {assignedStationIds.has(station.id) ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    Assigned
                                                                </span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                                    Unassigned
                                                                </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No stations found matching your criteria
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-600">
                                            Showing <span className="font-medium">{filteredStations.length}</span> of <span className="font-medium">{stations.length}</span> stations
                                        </div>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FiSave className="-ml-1 mr-2 h-4 w-4" />
                                                    Save Assignments
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <FiUser className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No owner selected</h3>
                                <p className="mt-1 text-sm text-gray-500">Select an owner from the list to manage their stations</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StationAssignmentsPage;