import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IStationInfo, IProvince, ISupporter, IAMControl } from '../types'; // Adjust path
import { stationInfoService, lookupService } from '../services/stationInfo.service'; // Adjust path
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// --- Exported Type Definitions ---
export type SortKey = keyof IStationInfo | 'province.name' | 'am_control.name' | 'supporter.supporter_name';
export type SortConfig = {
    key: SortKey;
    direction: 'ascending' | 'descending';
} | null;

export interface IFilters {
    provinceId: string;
    supporterId: string;
    amControlId: string;
}

// --- The Custom Hook ---
export const useStationManagement = () => {
    // --- State Management ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStation, setEditingStation] = useState<IStationInfo | null>(null);
    const [stationToDelete, setStationToDelete] = useState<IStationInfo | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'station_id', direction: 'ascending' });
    const [filters, setFilters] = useState<IFilters>({ provinceId: '', supporterId: '', amControlId: '' });

    // --- React Query Client ---
    const queryClient = useQueryClient();

    // --- Data Fetching ---
    const { data: stations = [], isLoading: isLoadingStations, error: stationsError } = useQuery({
        queryKey: ['stations'],
        queryFn: () => stationInfoService.getAll(),
    });
    const { data: provinces = [] } = useQuery({ queryKey: ['provinces'], queryFn: lookupService.getProvinces, staleTime: Infinity });
    const { data: supporters = [] } = useQuery({ queryKey: ['supporters'], queryFn: lookupService.getSupporters, staleTime: Infinity });
    const { data: amControls = [] } = useQuery({ queryKey: ['amControls'], queryFn: lookupService.getAMControls, staleTime: Infinity });

    // --- Mutations ---
    const saveMutation = useMutation({
        mutationFn: (stationData: Partial<IStationInfo>) =>
            editingStation?.id
                ? stationInfoService.update(editingStation.id, stationData)
                : stationInfoService.create(stationData as IStationInfo),
        onSuccess: () => {
            toast.success(`Station ${editingStation ? 'updated' : 'created'} successfully!`);
            queryClient.invalidateQueries({ queryKey: ['stations'] });
            setIsFormOpen(false);
            setEditingStation(null);
        },
        onError: () => toast.error('Failed to save station.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (stationId: number) => stationInfoService.delete(stationId),
        onSuccess: () => {
            toast.success('Station deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['stations'] });
            setIsDeleteConfirmOpen(false);
            setStationToDelete(null);
        },
        onError: () => {
            toast.error('Failed to delete station.');
            setIsDeleteConfirmOpen(false);
        },
    });

    // --- Memoized Logic for Table Data ---
    const filteredAndSortedStations = useMemo(() => {
        let processedStations = stations.filter(station =>
            (!filters.provinceId || station.province_id === filters.provinceId) &&
            (!filters.supporterId || station.supporter_id?.toString() === filters.supporterId) &&
            (!filters.amControlId || station.am_control_id?.toString() === filters.amControlId)
        );

        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            processedStations = processedStations.filter(station =>
                `${station.station_id} ${station.station_name}`.toLowerCase().includes(lowercasedSearch)
            );
        }

        if (sortConfig) {
            processedStations.sort((a, b) => {
                const getNestedValue = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc?.[part], obj);
                const aValue = getNestedValue(a, sortConfig.key) ?? '';
                const bValue = getNestedValue(b, sortConfig.key) ?? '';
                const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return processedStations;
    }, [stations, searchTerm, filters, sortConfig]);

    // --- Memoized Logic for Chart Data ---
    const chartData = useMemo(() => {
        const getStationCountByCategory = (category: 'province' | 'am_control' | 'supporter') => {
            const counts = stations.reduce((acc, station) => {
                let key: string = 'Unknown';
                if (category === 'province' && station.province) key = station.province.name;
                else if (category === 'am_control' && station.am_control) key = station.am_control.name;
                else if (category === 'supporter' && station.supporter) key = station.supporter.supporter_name;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            return Object.entries(counts).map(([label, value]) => ({ label, value }));
        };

        const provinceCounts = getStationCountByCategory('province').sort((a, b) => b.value - a.value);
        const topProvinces = provinceCounts.slice(0, 12);
        const otherCount = provinceCounts.slice(12).reduce((sum, p) => sum + p.value, 0);
        const provinceData = otherCount > 0 ? [...topProvinces, { label: 'Other', value: otherCount }] : topProvinces;

        return { provinceData, amControlData: getStationCountByCategory('am_control'), supporterData: getStationCountByCategory('supporter') };
    }, [stations]);

    // --- Handlers ---
    const handleCreate = () => { setEditingStation(null); setIsFormOpen(true); };
    const handleEdit = (station: IStationInfo) => { setEditingStation(station); setIsFormOpen(true); };
    const handleDelete = (station: IStationInfo) => { setStationToDelete(station); setIsDeleteConfirmOpen(true); };
    const confirmDelete = () => stationToDelete && deleteMutation.mutate(stationToDelete.id);
    const handleFormSubmit = (data: Partial<IStationInfo>) => saveMutation.mutate(data);
    const requestSort = (key: SortKey) => {
        const direction = sortConfig?.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
        setSortConfig({ key, direction });
    };

    const handleExport = () => {
        const dataToExport = filteredAndSortedStations.map(s => ({
            'Station ID': s.station_id, Name: s.station_name, Province: s.province?.name,
            'AM Control': s.am_control?.name, Supporter: s.supporter?.supporter_name,
            Status: s.active === 1 ? 'Active' : 'Inactive',
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Stations");
        XLSX.writeFile(wb, "StationInfo.xlsx");
        toast.success('Data exported to Excel!');
    };

    // --- Returned State and Functions for UI ---
    return {
        stations, isLoadingStations, stationsError, filteredAndSortedStations, provinces, supporters, amControls,
        searchTerm, setSearchTerm, filters, setFilters, sortConfig, requestSort,
        handleCreate, handleEdit, handleDelete, handleFormSubmit, handleExport,
        isFormOpen, setIsFormOpen, editingStation,
        isDeleteConfirmOpen, setIsDeleteConfirmOpen, stationToDelete, confirmDelete,
        chartData,
        isSaving: saveMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};