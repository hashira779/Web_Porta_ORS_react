import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { adminGetStations, adminGetAllUsers, adminGetRoles, adminAssignStationsToOwner } from '../../api/api';
import { StationInfo, User, Role } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlassIcon as FiSearch,
    XMarkIcon as FiX,
    UserIcon as FiUser,
    MapPinIcon as FiMapPin,
    ArrowDownTrayIcon as FiSave,
    FunnelIcon as FiFilter,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({
                                                                                                    message,
                                                                                                    type,
                                                                                                    onDismiss
                                                                                                }) => {
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
            className={`fixed bottom-6 right-6 flex items-center p-4 rounded-xl shadow-2xl z-50 border border-opacity-20 ${
                type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-rose-600 text-white border-rose-400'
            }`}
        >
            {type === 'success' ? (
                <CheckCircleIcon className="w-6 h-6 mr-3" />
            ) : (
                <ExclamationCircleIcon className="w-6 h-6 mr-3" />
            )}
            <span className="text-sm font-medium tracking-wide">{message}</span>
        </motion.div>
    );
};

const StationAssignmentsPage: React.FC = () => {
    const [stations, setStations] = useState<StationInfo[]>([]);
    const [owners, setOwners] = useState<User[]>([]);
    const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
    const [assignedStationIds, setAssignedStationIds] = useState<Set<number>>(new Set());
    const [globallyAssignedStationIds, setGloballyAssignedStationIds] = useState<Map<number, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [ownerSearchTerm, setOwnerSearchTerm] = useState('');
    const [showAssignedOnly, setShowAssignedOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastStationRef = useRef<HTMLDivElement | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

    const fetchData = useCallback(async (pageNum: number = 1) => {
        setIsLoading(true);
        try {
            const [stationsRes, usersRes, rolesRes] = await Promise.all([
                adminGetStations(pageNum, 20), // Assuming pagination with page and limit
                adminGetAllUsers(),
                adminGetRoles(),
            ]);

            const ownerRole = rolesRes.data.find(r => r.name.toLowerCase() === 'owner');
            const ownerUsers = ownerRole ? usersRes.data.filter(u => u.role?.id === ownerRole.id) : [];

            setOwners(ownerUsers);

            const assignedMap = new Map<number, number>();
            stationsRes.data.forEach(station => {
                if (station.owners && station.owners.length > 0) {
                    assignedMap.set(station.id, station.owners[0].id);
                }
            });

            // Update stations based on page
            if (pageNum === 1) {
                setStations(stationsRes.data);
            } else {
                setStations(prev => [...prev, ...stationsRes.data]);
            }

            setGloballyAssignedStationIds(assignedMap);

            if (ownerUsers.length > 0) {
                const current = selectedOwner ? ownerUsers.find(o => o.id === selectedOwner.id) : null;
                handleOwnerSelect(current || ownerUsers[0]);
            }

            // Check if there are more stations to load
            setHasMore(stationsRes.data.length === 20); // Adjust based on API response structure
        } catch (err) {
            showToast("Failed to load data.", "error");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [selectedOwner]);

    useEffect(() => {
        fetchData(1);
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
            await fetchData(1); // Refresh data after saving
        } catch (err) {
            showToast("Failed to save assignments.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredStations = useMemo(() => {
        return stations.filter(station => {
            const matchesSearch = station.station_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = showAssignedOnly ? assignedStationIds.has(station.id) : true;
            return matchesSearch && matchesFilter;
        });
    }, [stations, searchTerm, assignedStationIds, showAssignedOnly]);

    const filteredOwners = useMemo(() => {
        return owners.filter(owner =>
            owner.username.toLowerCase().includes(ownerSearchTerm.toLowerCase())
        );
    }, [owners, ownerSearchTerm]);

    // Infinite scroll logic
    const loadMore = useCallback(() => {
        if (hasMore && !isLoadingMore && !isLoading) {
            setIsLoadingMore(true);
            setPage(prev => prev + 1);
            fetchData(page + 1);
        }
    }, [hasMore, isLoadingMore, isLoading, page, fetchData]);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });

        if (lastStationRef.current) {
            observerRef.current.observe(lastStationRef.current);
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [loadMore, hasMore]);

    if (isLoading && page === 1) return (
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-10">
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Station Owner Assignments</h1>
                        <p className="text-gray-600 mt-2 text-sm">Manage station ownership assignments with ease</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <button
                            onClick={handleSaveChanges}
                            disabled={isSaving || !selectedOwner}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-300"
                        >
                            <FiSave className="mr-2 w-5 h-5" />
                            {isSaving ? 'Saving...' : 'Save Assignments'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Owners Panel */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold flex items-center text-gray-900">
                                <FiUser className="mr-2 text-indigo-600 w-5 h-5" />
                                Select Owner
                            </h2>
                            <div className="mt-4 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="text-gray-400 w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search owners..."
                                    className="pl-10 w-full py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50"
                                    value={ownerSearchTerm}
                                    onChange={(e) => setOwnerSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                            <ul className="divide-y divide-gray-100">
                                {filteredOwners.length > 0 ? (
                                    filteredOwners.map(owner => (
                                        <li key={owner.id}>
                                            <button
                                                onClick={() => handleOwnerSelect(owner)}
                                                className={`w-full text-left px-6 py-4 flex items-center justify-between transition-all duration-200 ${
                                                    selectedOwner?.id === owner.id
                                                        ? 'bg-indigo-50 text-indigo-700'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="font-medium text-gray-900">{owner.username}</span>
                                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                                                    {owner.owned_stations.length} stations
                                                </span>
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-6 py-4 text-center text-gray-500">
                                        No owners found
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Stations Panel */}
                    <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        {selectedOwner ? (
                            <div className="h-full flex flex-col">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                                        <h2 className="text-lg font-semibold flex items-center mb-3 md:mb-0 text-gray-900">
                                            <FiMapPin className="mr-2 text-indigo-600 w-5 h-5" />
                                            Assign Stations for <span className="text-indigo-600 ml-1 font-medium">{selectedOwner.username}</span>
                                        </h2>
                                        <div className="flex space-x-3">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FiSearch className="text-gray-400 w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search stations..."
                                                    className="pl-10 w-full py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setShowAssignedOnly(!showAssignedOnly)}
                                                className={`flex items-center px-4 py-2.5 border rounded-xl transition-all duration-200 ${
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

                                <div className="flex-1 overflow-y-auto p-6">
                                    {filteredStations.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredStations.map((station, index) => {
                                                const assignedToAnother = globallyAssignedStationIds.has(station.id) &&
                                                    globallyAssignedStationIds.get(station.id) !== selectedOwner.id;
                                                const isLastStation = index === filteredStations.length - 1;
                                                return (
                                                    <motion.div
                                                        key={station.id}
                                                        ref={isLastStation ? lastStationRef : null}
                                                        whileHover={{ scale: 1.03 }}
                                                        className={`p-5 rounded-xl border transition-all duration-200 ${
                                                            assignedStationIds.has(station.id)
                                                                ? 'border-indigo-200 bg-indigo-50'
                                                                : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                                                        } ${
                                                            assignedToAnother ? 'opacity-70' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-start">
                                                            <input
                                                                type="checkbox"
                                                                id={`station-${station.id}`}
                                                                checked={assignedStationIds.has(station.id)}
                                                                onChange={() => handleStationToggle(station.id)}
                                                                disabled={assignedToAnother}
                                                                className={`mt-1 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 ${
                                                                    assignedToAnother ? 'cursor-not-allowed' : 'cursor-pointer'
                                                                }`}
                                                            />
                                                            <label
                                                                htmlFor={`station-${station.id}`}
                                                                className={`ml-3 flex-1 ${
                                                                    assignedToAnother ? 'text-gray-400' : 'text-gray-800'
                                                                }`}
                                                            >
                                                                <div className="font-medium text-gray-900">{station.station_name}</div>
                                                                {assignedToAnother && (
                                                                    <div className="text-xs text-rose-500 mt-1.5">
                                                                        Already assigned to another owner
                                                                    </div>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                            {isLoadingMore && (
                                                <div className="col-span-full flex justify-center items-center py-4">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                            <FiX className="text-4xl mb-3" />
                                            <p className="text-gray-600">No stations found matching your criteria</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-600">
                                            {assignedStationIds.size} of {filteredStations.length} stations selected
                                        </div>
                                        <button
                                            onClick={handleSaveChanges}
                                            disabled={isSaving}
                                            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow hover:bg-indigo-700 disabled-opacity-50 flex items-center transition-all duration-200"
                                        >
                                            <FiSave className="mr-2 w-5 h-5" />
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <FiUser className="text-4xl mb-3" />
                                <p className="text-gray-600">Please select an owner to manage their stations</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


export default StationAssignmentsPage;