import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  adminGetAreaDetails,
  adminGetStations,
  adminGetRoles,
  adminCreateArea,
  adminUpdateArea,
  adminDeleteArea,
  adminAssignManagersToArea,
  adminAssignStationsToArea,
  adminGetAllUsers,
} from '../api/api';
import { AreaDetail, StationInfo, User, AreaUpdate } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Spinner from '../components/common/CalSpin';
import ConfirmationModal from '../components/area/ConfirmationModal';
import AreaFormModal from '../components/area/AreaFormModal';

const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-gray-800 rounded shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({
  message,
  type,
  onDismiss,
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
      className={`fixed bottom-6 right-6 flex items-center p-4 rounded-xl shadow-xl z-50 backdrop-blur-md ${
        type === 'success' ? 'bg-emerald-600/80 text-white border-emerald-400/50' : 'bg-red-600/80 text-white border-red-400/50'
      } border`}
    >
      {type === 'success' ? <CheckCircleIcon className="w-6 h-6 mr-3" /> : <ExclamationCircleIcon className="w-6 h-6 mr-3" />}
      <span className="text-sm font-medium tracking-wide">{message}</span>
    </motion.div>
  );
};

const AreaAssignmentsPage: React.FC = () => {
  const [areas, setAreas] = useState<AreaDetail[]>([]);
  const [allStations, setAllStations] = useState<StationInfo[]>([]);
  const [filteredStations, setFilteredStations] = useState<StationInfo[]>([]);
  const [areaManagers, setAreaManagers] = useState<User[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaDetail | null>(null);
  const [assignedStations, setAssignedStations] = useState<Set<number>>(new Set());
  const [assignedManagerId, setAssignedManagerId] = useState<number | string>('');
  const [newAreaName, setNewAreaName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [stationTimestamps, setStationTimestamps] = useState<Record<number, string>>({});
  const [importIds, setImportIds] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaDetail | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<AreaDetail | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const fetchData = useCallback(async () => {
    !selectedArea && setIsLoading(true);
    try {
      const [areasRes, stationsRes, usersRes, rolesRes] = await Promise.all([
        adminGetAreaDetails(),
        adminGetStations(),
        adminGetAllUsers(),
        adminGetRoles(),
      ]);
      const managerRole = rolesRes.data.find((role) => role.name.toLowerCase() === 'area');
      const managers = managerRole ? usersRes.data.filter((user) => user.role?.id === managerRole.id) : [];
      setAreas(areasRes.data);
      setAllStations(stationsRes.data);
      setFilteredStations(stationsRes.data);
      setAreaManagers(managers);
      if (areasRes.data.length > 0) {
        const currentSelected = selectedArea ? areasRes.data.find((a) => a.id === selectedArea.id) : null;
        setSelectedArea(currentSelected || areasRes.data[0]);
      } else {
        setSelectedArea(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Failed to load assignment data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedArea]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      setAssignedStations(new Set(selectedArea.stations.map((s) => s.id)));
      setAssignedManagerId(selectedArea.managers[0]?.id || '');
    } else {
      setAssignedStations(new Set());
    }
  }, [selectedArea]);

  const handleStationToggle = (stationId: number) => {
    const now = new Date().toISOString();
    setStationTimestamps((prev) => ({ ...prev, [stationId]: now }));
    setAssignedStations((prev) => {
      const newSelection = new Set(prev);
      const allAssignedIds = new Set(areas.flatMap((area) => area.stations.map((s) => s.id)));
      if (allAssignedIds.has(stationId) && !newSelection.has(stationId) && !selectedArea?.stations.some((s) => s.id === stationId)) {
        showToast('This station is already assigned to another area.', 'error');
        return prev;
      }
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

      const allAssignedIds = new Set(areas.flatMap((area) => area.stations.map((s) => s.id)));
      const conflictingIds = stationIds.filter((id) => allAssignedIds.has(id) && !selectedArea.stations.some((s) => s.id === id));
      if (conflictingIds.length > 0) {
        showToast(`Cannot save: Stations ${conflictingIds.join(', ')} are already assigned to other areas.`, 'error');
        return;
      }

      await Promise.all([
        adminAssignStationsToArea(selectedArea.id, stationIds),
        adminAssignManagersToArea(selectedArea.id, managerId ? [managerId] : []),
      ]);
      showToast('Assignments saved successfully!', 'success');
      await fetchData();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save assignments. Check console for details.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateArea = async () => {
    if (!newAreaName.trim()) return;
    try {
      await adminCreateArea({ name: newAreaName });
      setNewAreaName('');
      showToast(`Area "${newAreaName}" created.`, 'success');
      await fetchData();
    } catch (err) {
      console.error('Create area error:', err);
      showToast('Failed to create area.', 'error');
    }
  };

  const handleSaveArea = async (areaData: { id?: number; name: string }) => {
    try {
      if (areaData.id) {
        const payload: AreaUpdate = { name: areaData.name };
        await adminUpdateArea(areaData.id, payload);
        showToast(`Area "${areaData.name}" updated.`, 'success');
      }
      setShowAreaModal(false);
      await fetchData();
    } catch (err) {
      console.error('Save area error:', err);
      showToast('Failed to save area.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    try {
      await adminDeleteArea(areaToDelete.id);
      showToast(`Area "${areaToDelete.name}" deleted.`, 'success');
      setAreaToDelete(null);
      setShowConfirmModal(false);
      setSelectedArea(null);
      await fetchData();
    } catch (err) {
      console.error('Delete area error:', err);
      showToast('Failed to delete area.', 'error');
    }
  };

  const handleImportIds = () => {
    const ids = importIds.split(',').map((id) => id.trim()).filter((id) => id);
    const assignedStationIds = new Set(areas.flatMap((area) => area.stations.map((s) => s.id)));
    const validIds = allStations
      .filter((station) => {
        const stationIdStr = station.id.toString();
        const stationIDStr = station.station_ID || '';
        const isAlreadyAssigned = assignedStationIds.has(station.id);
        return ids.some(
          (inputId) => (inputId === stationIdStr || inputId === stationIDStr) && !isAlreadyAssigned
        );
      })
      .map((station) => station.id);
    const skippedIds = ids.filter(
      (inputId) =>
        !validIds.some(
          (id) =>
            allStations.find((s) => s.id === id)?.station_ID === inputId ||
            allStations.find((s) => s.id === id)?.id.toString() === inputId
        )
    );
    setAssignedStations((prev) => {
      const newSet = new Set(prev);
      validIds.forEach((id) => newSet.add(id));
      return newSet;
    });
    setImportIds('');
    if (validIds.length > 0) {
      showToast(`Added ${validIds.length} stations from input.`, 'success');
    }
    if (skippedIds.length > 0) {
      showToast(
        `Skipped ${skippedIds.length} stations already assigned to other areas: ${skippedIds.join(', ')}.`,
        'error'
      );
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      showToast('No file selected.', 'error');
      return;
    }
    if (!file.name.endsWith('.csv')) {
      showToast('Please upload a CSV file only.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const ids = text.split('\n').map((id) => id.trim()).filter((id) => id);
      const assignedStationIds = new Set(areas.flatMap((area) => area.stations.map((s) => s.id)));
      const validIds = allStations
        .filter((station) => {
          const stationIdStr = station.id.toString();
          const stationIDStr = station.station_ID || '';
          const isAlreadyAssigned = assignedStationIds.has(station.id);
          return ids.some(
            (inputId) => (inputId === stationIdStr || inputId === stationIDStr) && !isAlreadyAssigned
          );
        })
        .map((station) => station.id);
      const skippedIds = ids.filter(
        (inputId) =>
          !validIds.some(
            (id) =>
              allStations.find((s) => s.id === id)?.station_ID === inputId ||
              allStations.find((s) => s.id === id)?.id.toString() === inputId
          )
      );
      setAssignedStations((prev) => {
        const newSet = new Set(prev);
        validIds.forEach((id) => newSet.add(id));
        return newSet;
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (validIds.length > 0) {
        showToast(`Imported and added ${validIds.length} stations from file.`, 'success');
      }
      if (skippedIds.length > 0) {
        showToast(
          `Skipped ${skippedIds.length} stations already assigned to other areas: ${skippedIds.join(', ')}.`,
          'error'
        );
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = allStations.filter((station) => {
      const matchesQuery =
        station.station_name.toLowerCase().includes(lowercasedQuery) ||
        station.id.toString().includes(lowercasedQuery) ||
        (station.station_ID?.toLowerCase() || '').includes(lowercasedQuery);
      return matchesQuery;
    });
    setFilteredStations(filtered);
  }, [searchQuery, allStations]);

  if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 md:p-10">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Area Assignments
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Manage Areas Panel */}
          <motion.div
            layout
            className="md:col-span-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100/50 p-6 hover:shadow-2xl transition-all duration-300"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="mr-2 text-indigo-600">🌐</span> Manage Areas
            </h2>
            <motion.ul layout className="space-y-2">
              {areas.map((area) => (
                <motion.li
                  key={area.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between group hover:bg-gray-50/50 rounded-xl p-2 transition-all duration-200"
                >
                  <button
                    onClick={() => setSelectedArea(area)}
                    className={`w-full text-left px-4 py-2 rounded-lg font-medium ${
                      selectedArea?.id === area.id
                        ? 'bg-indigo-600/80 text-white shadow-inner'
                        : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    {area.name}
                  </button>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => {
                        setEditingArea(area);
                        setShowAreaModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                      title="Edit Area"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setAreaToDelete(area);
                        setShowConfirmModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete Area"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
            <div className="mt-6 pt-4 border-t border-gray-100/50">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Create New Area</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="New area name..."
                  className="flex-grow rounded-lg border-gray-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  onClick={handleCreateArea}
                  className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                  title="Add New Area"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Assignments Panel */}
          <motion.div
            className="md:col-span-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100/50 p-6 hover:shadow-2xl transition-all duration-300"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedArea ? selectedArea.id : 'empty'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {selectedArea ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                      <span className="mr-2 text-indigo-600">📍</span>
                      Assignments for {selectedArea.name}
                    </h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area Manager (AM)</label>
                      <select
                        value={assignedManagerId}
                        onChange={(e) => setAssignedManagerId(e.target.value)}
                        className="w-full rounded-lg border-gray-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      >
                        <option value="">-- Unassigned --</option>
                        {areaManagers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                        Stations in this Area
                        <span className="ml-2 text-xs text-gray-500">
                          (Last updated: {Object.values(stationTimestamps).length > 0 ? Object.values(stationTimestamps)[0] : 'N/A'})
                        </span>
                      </h3>

                      {/* Status Legend */}
                      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
                        <div className="flex items-center">
                          <div className="w-3 h-3 mr-1 bg-indigo-500 rounded-full"></div>
                          <span>Assigned to this area</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 mr-1 bg-amber-500 rounded-full"></div>
                          <span>Assigned to another area</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 mr-1 bg-gray-400 rounded-full"></div>
                          <span>Unassigned</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, ID, or station_ID..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          />
                          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto p-2 border border-gray-200/50 rounded-xl">
                          {filteredStations.map((station) => {
                              const isAssignedToCurrent = assignedStations.has(station.id);
                              const isAssignedAnywhere = areas.some(area =>
                                  area.stations.some(s => s.id === station.id)
                              );
                              const isAssignedToOther = isAssignedAnywhere && !isAssignedToCurrent;

                              return (
                                  <div
                                      key={station.id}
                                      className={`flex items-start p-3 rounded-lg transition-all ${
                                          isAssignedToCurrent
                                              ? 'bg-indigo-50 border-l-4 border-indigo-500'
                                              : isAssignedToOther
                                                  ? 'bg-amber-50 border-l-4 border-amber-500'
                                                  : 'bg-gray-50 hover:bg-gray-100'
                                      }`}
                                  >
                                      <input
                                          type="checkbox"
                                          id={`station-${station.id}`}
                                          checked={isAssignedToCurrent}
                                          onChange={() => handleStationToggle(station.id)}
                                          className={`mt-1 h-5 w-5 rounded focus:ring-2 ${
                                              isAssignedToCurrent
                                                  ? 'text-indigo-600 focus:ring-indigo-500'
                                                  : isAssignedToOther
                                                      ? 'text-amber-600 focus:ring-amber-500 opacity-50 cursor-not-allowed'
                                                      : 'text-gray-600 focus:ring-gray-500'
                                          }`}
                                          disabled={isAssignedToOther}
                                      />

                                      <div className="ml-3 flex-1 min-w-0">
                                          <div className="flex items-start justify-between">
                                              <div>
                                                  <label htmlFor={`station-${station.id}`} className="text-sm font-medium text-gray-900">
                                                      {station.station_name}
                                                  </label>
                                                  {station.station_ID && (
                                                      <p className="text-xs text-gray-500 mt-0.5">ID: {station.station_ID}</p>
                                                  )}
                                              </div>

                                              {isAssignedToOther && (
                                                  <div className="flex items-center">
                                                      <div className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 flex items-center">
                                                          <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                                          <span>Assigned</span>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>

                                          {stationTimestamps[station.id] && (
                                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                                  <ClockIcon className="h-3 w-3 mr-1" />
                                                  {new Date(stationTimestamps[station.id]).toLocaleTimeString()}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          Import Station IDs (CSV only)
                          <span
                            className="ml-2 text-xs text-gray-500 hover:text-gray-700 cursor-help"
                            title="Only .csv files are accepted. Use one ID per line, e.g., F601, F5986"
                          >
                            ℹ️
                          </span>
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={importIds}
                            onChange={(e) => setImportIds(e.target.value)}
                            placeholder="e.g., 601,F601,F4563435,23245"
                            className="flex-grow rounded-lg border-gray-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          />
                          <button
                            onClick={handleImportIds}
                            className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                            title="Add IDs"
                          >
                            <PlusIcon className="h-5 w-5" />
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept=".csv"
                            onChange={handleFileImport}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                            title="Import CSV File"
                          >
                            Import File
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={handleSaveChanges}
                          disabled={isSaving}
                          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-xl disabled:opacity-50 transition-all duration-300"
                        >
                          {isSaving ? 'Saving...' : 'Save Assignments'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-500 text-lg"
                  >
                    Select an area to manage its assignments.
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
        <AnimatePresence>
          {showAreaModal && (
            <AreaFormModal
              isOpen={showAreaModal}
              onClose={() => setShowAreaModal(false)}
              onSave={handleSaveArea}
              area={editingArea}
            />
          )}
          {showConfirmModal && areaToDelete && (
            <ConfirmationModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              onConfirm={handleConfirmDelete}
              title="Delete Area"
              message={`Are you sure you want to delete "${areaToDelete.name}"?`}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AreaAssignmentsPage;