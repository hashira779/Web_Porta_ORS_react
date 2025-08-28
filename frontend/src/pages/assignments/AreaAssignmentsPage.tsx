import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  adminGetAreaDetails,
  adminGetStations,
  adminGetRoles,
  adminCreateArea,
  adminUpdateArea,
  adminDeleteArea,
  adminUpdateAreaAssignments,
  adminGetAllUsers,
} from '../../api/api';
import { AreaDetail, StationInfo, User } from '../../types';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon,
  MagnifyingGlassIcon, MapPinIcon, ArrowRightIcon, ArrowLeftIcon,
  DocumentArrowUpIcon, ClipboardDocumentListIcon, ChevronDownIcon, ChevronUpIcon
} from '@heroicons/react/24/outline';
import Spinner from '../../components/common/CalSpin';
import ConfirmationModal from '../../components/area/ConfirmationModal';
import AreaFormModal from '../../components/area/AreaFormModal';

// Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
  const handleDismiss = useCallback(onDismiss, [onDismiss]);
  useEffect(() => {
    const timer = setTimeout(() => handleDismiss(), 5000);
    return () => clearTimeout(timer);
  }, [handleDismiss]);
  return (
      <motion.div layout initial={{ opacity: 0, y: 50, scale: 0.3 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.5 }}
                  className={`fixed bottom-6 right-6 flex items-center p-4 rounded-xl shadow-xl z-50 backdrop-blur-md ${type === 'success' ? 'bg-emerald-600/80 text-white border-emerald-400/50' : 'bg-red-600/80 text-white border-red-400/50'} border`}>
        {type === 'success' ? <CheckCircleIcon className="w-6 h-6 mr-3" /> : <ExclamationCircleIcon className="w-6 h-6 mr-3" />}
        <span className="text-sm font-medium tracking-wide">{message}</span>
      </motion.div>
  );
};

// Station Card Component
const StationCard: React.FC<{ station: StationInfo; status: 'assigned' | 'available' | 'conflicted'; onToggle: (id: number) => void; }> = ({ station, status, onToggle }) => {
  const statusStyles = {
    assigned: { button: 'bg-red-100 text-red-700 hover:bg-red-200', icon: <ArrowLeftIcon className="h-4 w-4 mr-1.5" />, text: 'Remove' },
    available: { button: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200', icon: <ArrowRightIcon className="h-4 w-4 mr-1.5" />, text: 'Add' },
    conflicted: { button: 'bg-gray-200 text-gray-500 cursor-not-allowed', icon: <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />, text: 'Assigned' },
  };
  const currentStyle = statusStyles[status];
  return (
      <motion.div layout="position" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200/80">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{station.station_name}</p>
          {/* --- UPDATED to use lowercase 'station_id' --- */}
          <p className="text-xs text-gray-500">Station ID: {station.station_id || 'N/A'}</p>
        </div>
        <button onClick={() => onToggle(station.id)} disabled={status === 'conflicted'} className={`ml-4 flex-shrink-0 flex items-center text-xs font-bold px-3 py-1.5 rounded-md transition-all duration-200 ${currentStyle.button}`}>
          {currentStyle.icon}
          {currentStyle.text}
        </button>
      </motion.div>
  );
};

const AreaAssignmentsPage: React.FC = () => {
  const [areas, setAreas] = useState<AreaDetail[]>([]);
  const [allStations, setAllStations] = useState<StationInfo[]>([]);
  const [areaManagers, setAreaManagers] = useState<User[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaDetail | null>(null);
  const [assignedStationIds, setAssignedStationIds] = useState<Set<number>>(new Set());
  const [assignedManagerId, setAssignedManagerId] = useState<number | string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [stationSearch, setStationSearch] = useState('');
  const [importIds, setImportIds] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaDetail | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<AreaDetail | null>(null);
  const [showAssignedManagers, setShowAssignedManagers] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error') => { setToast({ message, type }); }, []);
  const handleToastDismiss = useCallback(() => { setToast(null); }, []);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const [areasRes, stationsRes, usersRes, rolesRes] = await Promise.all([
        adminGetAreaDetails(),
        adminGetStations(),
        adminGetAllUsers(),
        adminGetRoles(),
      ]);
      const managerRole = rolesRes.data.find((role) => role.name.toLowerCase() === 'area');
      const managers = managerRole ? usersRes.data.filter((user) => user.role?.id === managerRole.id) : [];
      const sortedAreas = areasRes.data.sort((a, b) => a.name.localeCompare(b.name));
      setAreas(sortedAreas);
      setAllStations(stationsRes.data);
      setAreaManagers(managers);
      setSelectedArea(current => {
        if (sortedAreas.length === 0) return null;
        if (current && !sortedAreas.find(a => a.id === current.id)) {
          return sortedAreas[0];
        }
        return current ? sortedAreas.find(a => a.id === current.id) || sortedAreas[0] : sortedAreas[0];
      });
    } catch (err) {
      showToast('Failed to load assignment data.', 'error');
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(true); }, [fetchData]);

  useEffect(() => {
    if (selectedArea) {
      setAssignedStationIds(new Set(selectedArea.stations.map((s) => s.id)));
      setAssignedManagerId(selectedArea.managers[0]?.id || '');
    } else {
      setAssignedStationIds(new Set());
      setAssignedManagerId('');
    }
  }, [selectedArea]);

  const { assignedStationsList, availableStationsList, stationIsAssignedToOtherArea } = useMemo(() => {
    const assignedToOtherMap = new Map<number, boolean>();
    areas.forEach(area => {
      if (area.id !== selectedArea?.id) {
        area.stations.forEach(station => assignedToOtherMap.set(station.id, true));
      }
    });
    const searchLower = stationSearch.toLowerCase();
    // --- UPDATED search logic to use lowercase 'station_id' ---
    const available = allStations.filter(station => !assignedStationIds.has(station.id) && (station.station_name.toLowerCase().includes(searchLower) || (station.station_id || '').toLowerCase().includes(searchLower) || station.id.toString().includes(searchLower)));
    const assigned = allStations.filter(station => assignedStationIds.has(station.id));
    return { assignedStationsList: assigned, availableStationsList: available, stationIsAssignedToOtherArea: assignedToOtherMap };
  }, [allStations, areas, selectedArea, assignedStationIds, stationSearch]);

  const handleStationToggle = (stationId: number) => {
    setAssignedStationIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stationId)) {
        newSet.delete(stationId);
      } else {
        if (stationIsAssignedToOtherArea.get(stationId)) {
          showToast('This station is already assigned to another area.', 'error');
          return prev;
        }
        newSet.add(stationId);
      }
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedArea) return;
    setIsSaving(true);
    try {
      const areaResponse = await adminGetAreaDetails();
      const areaExists = areaResponse.data.some(area => area.id === selectedArea.id);
      if (!areaExists) {
        showToast('Selected area no longer exists. Please select another area.', 'error');
        setSelectedArea(null);
        await fetchData();
        return;
      }

      const payload = {
        station_ids: Array.from(assignedStationIds),
        manager_ids: assignedManagerId ? [Number(assignedManagerId)] : []
      };

      await adminUpdateAreaAssignments(selectedArea.id, payload);
      showToast('Assignments saved successfully!', 'success');
      await fetchData();
    } catch (err) {
      showToast('Failed to save assignments.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveArea = async (areaData: { id?: number; name: string }) => {
    try {
      if (areaData.id) {
        await adminUpdateArea(areaData.id, { name: areaData.name });
        showToast(`Area "${areaData.name}" updated.`, 'success');
      } else {
        await adminCreateArea({ name: areaData.name });
        showToast(`Area "${areaData.name}" created.`, 'success');
      }
      setShowAreaModal(false);
      setEditingArea(null);
      await fetchData();
    } catch (err) { showToast('Failed to save area.', 'error'); }
  };

  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    try {
      await adminDeleteArea(areaToDelete.id);
      showToast(`Area "${areaToDelete.name}" deleted.`, 'success');
      if (selectedArea?.id === areaToDelete.id) { setSelectedArea(null); }
      setAreaToDelete(null);
      setShowConfirmModal(false);
      await fetchData();
    } catch (err) { showToast('Failed to delete area.', 'error'); }
  };

  const handleImportIds = () => {
    const ids = importIds.split(/[,\s\n]+/).map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) return;
    const assignedStationDbIds = new Set(areas.flatMap(area => area.stations.map(s => s.id)));
    const validStationIdsToAdd = new Set<number>();
    const skippedIds = new Set<string>();

    ids.forEach(inputId => {
      // --- UPDATED import logic to find by lowercase 'station_id' ---
      const station = allStations.find(s => s.station_id === inputId);

      if (station && !assignedStationDbIds.has(station.id)) {
        validStationIdsToAdd.add(station.id);
      } else {
        skippedIds.add(inputId);
      }
    });

    setAssignedStationIds(prev => new Set([...Array.from(prev), ...validStationIdsToAdd]));
    setImportIds('');
    if (validStationIdsToAdd.size > 0) showToast(`Added ${validStationIdsToAdd.size} new stations.`, 'success');
    if (skippedIds.size > 0) showToast(`Skipped ${skippedIds.size} stations (already assigned or invalid).`, 'error');
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const idsFromFile = text.split(/[,\s\n]+/).filter(Boolean);
      setImportIds(idsFromFile.join(', '));
      showToast(`Loaded ${idsFromFile.length} IDs from file. Click 'Add' to assign.`, 'success');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;

  return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} onDismiss={handleToastDismiss} />}
        </AnimatePresence>
        <div className="max-w-8xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Area Assignments</h1>
            <p className="mt-1 text-gray-500">Organize stations and managers into distinct geographical or operational areas.</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <motion.div layout className="lg:col-span-1 lg:sticky top-8 space-y-4">
              <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-md border border-gray-200/80 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center"><MapPinIcon className="w-5 h-5 mr-2 text-indigo-600"/> Areas</h2>
                  <button onClick={() => { setEditingArea(null); setShowAreaModal(true); }} className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-all" title="Add New Area">
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {areas.map((area) => (
                      <li key={area.id} className="group flex items-center justify-between rounded-lg hover:bg-gray-100">
                        <button onClick={() => setSelectedArea(area)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${selectedArea?.id === area.id ? 'bg-indigo-600 text-white shadow-inner' : 'text-gray-700'}`}>
                          {area.name}
                        </button>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingArea(area); setShowAreaModal(true); }} className="p-2 text-gray-500 hover:text-indigo-600"><PencilIcon className="h-4 w-4" /></button>
                          <button onClick={() => { setAreaToDelete(area); setShowConfirmModal(true); }} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
                        </div>
                      </li>
                  ))}
                </ul>
              </div>
            </motion.div>
            <motion.div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div key={selectedArea ? selectedArea.id : 'empty'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  {!selectedArea ? (
                      <div className="text-center py-20 bg-white/70 backdrop-blur-md rounded-xl shadow-md border"><p>Select an area to begin, or create a new one.</p></div>
                  ) : (
                      <div className="space-y-6">
                        {/* Collapsible Assigned Managers Section */}
                        <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-md border border-gray-200/80 p-6">
                          <button
                              onClick={() => setShowAssignedManagers(!showAssignedManagers)}
                              className="w-full flex justify-between items-center text-xl font-bold text-gray-800 mb-2"
                          >
                            Assigned Managers for {selectedArea.name}
                            {showAssignedManagers ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                          </button>
                          <AnimatePresence>
                            {showAssignedManagers && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 max-h-[200px] overflow-y-auto"
                                >
                                  {selectedArea.managers.length > 0 ? (
                                      <ul className="space-y-2">
                                        {selectedArea.managers.map((manager) => (
                                            <li key={manager.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                              <span className="text-sm font-medium text-gray-700">{manager.username}</span>
                                            </li>
                                        ))}
                                      </ul>
                                  ) : (
                                      <p className="text-sm text-gray-500">No managers assigned to this area.</p>
                                  )}
                                </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-md border border-gray-200/80 p-6">
                          <h2 className="text-xl font-bold text-gray-800">Assign Manager to {selectedArea.name}</h2>
                          <div className="mt-4 max-w-sm">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area Manager (AM)</label>
                            <select value={assignedManagerId} onChange={(e) => setAssignedManagerId(e.target.value)} className="w-full rounded-lg border-gray-300 p-2 focus:ring-2 focus:ring-indigo-500 transition-all">
                              <option value="">-- Unassigned --</option>
                              {areaManagers.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-md border border-gray-200/80 p-4 space-y-3 flex flex-col">
                            <h3 className="font-semibold text-gray-800 px-2">Assigned to {selectedArea.name} ({assignedStationsList.length})</h3>
                            <div className="flex-grow space-y-2 overflow-y-auto max-h-[400px] p-1">
                              <AnimatePresence>
                                {assignedStationsList.length > 0 ? (
                                    assignedStationsList.map(station => (
                                        <StationCard key={station.id} station={station} status="assigned" onToggle={handleStationToggle} />
                                    ))
                                ) : (
                                    <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-center text-sm text-gray-500 py-10">Add stations from the right panel.</motion.p>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-md border border-gray-200/80 p-4 space-y-3 flex flex-col">
                            <div className="px-2">
                              <h3 className="font-semibold text-gray-800">Available Stations ({availableStationsList.length})</h3>
                              <div className="relative mt-2">
                                <input type="text" value={stationSearch} onChange={(e) => setStationSearch(e.target.value)} placeholder="Search available stations..." className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500" />
                                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="px-2 text-sm">
                              <p className="font-medium text-gray-600 mb-2">Bulk Add Stations</p>
                              <div className="flex space-x-2">
                                <input type="text" value={importIds} onChange={(e) => setImportIds(e.target.value)} placeholder="Paste IDs, separated by comma/space" className="flex-grow text-xs rounded-lg border-gray-300 p-2 focus:ring-2 focus:ring-indigo-500"/>
                                <button onClick={handleImportIds} className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700" title="Add IDs from text"><ClipboardDocumentListIcon className="h-5 w-5" /></button>
                                <input type="file" ref={fileInputRef} accept=".csv, .txt" onChange={handleFileImport} className="hidden"/>
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700" title="Import IDs from file"><DocumentArrowUpIcon className="h-5 w-5" /></button>
                              </div>
                            </div>
                            <div className="flex-grow space-y-2 overflow-y-auto max-h-[400px] p-1">
                              <AnimatePresence>
                                {availableStationsList.map(station => (
                                    <StationCard
                                        key={station.id}
                                        station={station}
                                        status={stationIsAssignedToOtherArea.get(station.id) ? 'conflicted' : 'available'}
                                        onToggle={handleStationToggle}
                                    />
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="sticky bottom-6 text-right">
                          <button
                              onClick={handleSaveChanges} disabled={isSaving}
                              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            {isSaving ? 'Saving...' : 'Save Assignments'}
                          </button>
                        </motion.div>
                      </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
          <AnimatePresence>
            {showAreaModal && <AreaFormModal isOpen={showAreaModal} onClose={() => setShowAreaModal(false)} onSave={handleSaveArea} area={editingArea} />}
            {showConfirmModal && areaToDelete && <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmDelete} title="Delete Area" message={`Are you sure you want to delete "${areaToDelete.name}"? This also unassigns all its stations.`} />}
          </AnimatePresence>
        </div>
      </div>
  );
};

export default AreaAssignmentsPage;