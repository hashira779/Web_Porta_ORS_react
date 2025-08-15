import React, { useState, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IStationInfo, IProvince, ISupporter, IAMControl } from '../../types';
import { stationInfoService, lookupService } from '../../services/stationInfo.service';
import { StationInfoForm } from '../../components/admin/stationInfo/StationInfoForm';
import { Dialog, Transition } from '@headlessui/react';
import toast, { Toaster } from 'react-hot-toast';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid';
import * as XLSX from 'xlsx';
import { ResponsiveBar, BarDatum } from '@nivo/bar';
import { ResponsivePie, PieSvgProps } from '@nivo/pie';

// --- Reusable Bar Chart Component ---
const CustomBarChart = ({ data, colors, title }: { data: BarDatum[], colors: string[], title: string }) => {
    const theme = {
        axis: {
            ticks: { text: { fontSize: 12, fill: '#6b7280', fontWeight: 500 } },
            legend: { text: { fontSize: 14, fill: '#1f2937', fontWeight: 600 } },
        },
        tooltip: {
            container: {
                background: '#ffffff',
                color: '#1f2937',
                fontSize: 13,
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '10px',
            },
        },
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
            <div style={{ height: '350px' }}>
                <ResponsiveBar
                    data={data}
                    keys={['value']}
                    indexBy="label"
                    margin={{ top: 30, right: 30, bottom: 120, left: 60 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={{ scheme: 'nivo' }}
                    borderColor={{ from: 'color', modifiers: [['darker', 1.4]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                        tickSize: 6,
                        tickPadding: 8,
                        tickRotation: -45,
                        legend: '',
                        legendPosition: 'middle',
                        legendOffset: 60,
                    }}
                    axisLeft={{
                        tickSize: 6,
                        tickPadding: 8,
                        tickRotation: 0,
                        legend: 'Station Count',
                        legendPosition: 'middle',
                        legendOffset: -50,
                        tickValues: 6,
                    }}
                    enableLabel={true}
                    label={(d) => `${d.value}`}
                    labelSkipWidth={20}
                    labelSkipHeight={20}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    animate={true}
                    motionConfig="wobbly"
                    theme={theme}
                    defs={[{ id: 'gradientA', type: 'linearGradient', colors: [{ offset: 0, color: colors[0] }, { offset: 100, color: '#ffffff' }] }]}
                    fill={[{ match: '*', id: 'gradientA' }]}
                    ariaLabel={`Bar chart showing ${title.toLowerCase()}`}
                />
            </div>
        </div>
    );
};

// --- Reusable Donut Chart Component with Centered Metric ---
const CustomDonutChart = ({ data, title, total }: { data: PieSvgProps<{ id: string; value: number; }>['data'], title: string, total: number }) => {
    const CenteredMetric = ({ centerX, centerY }: { centerX: number, centerY: number }) => {
        return (
            <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-3xl font-bold text-gray-800"
            >
                {total}
            </text>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
            <div style={{ height: '350px' }}>
                <ResponsivePie
                    data={data}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.6}
                    padAngle={1}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    colors={{ scheme: 'pastel1' }}
                    layers={['arcs', 'arcLabels', 'arcLinkLabels', 'legends', CenteredMetric]}
                    legends={[
                        {
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: '#999',
                            itemDirection: 'left-to-right',
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: 'circle',
                            effects: [{ on: 'hover', style: { itemTextColor: '#000' } }]
                        }
                    ]}
                />
            </div>
        </div>
    );
};


// --- Type Definitions ---
type SortConfigObject = {
    key: keyof IStationInfo | 'province.name' | 'am_control.name' | 'supporter.supporter_name';
    direction: 'ascending' | 'descending';
};
type SortConfig = SortConfigObject | null;
type SortKey = SortConfigObject['key'];

interface IFilters {
    provinceId: string;
    supporterId: string;
    amControlId: string;
}

export const StationInfoAdminPage: React.FC = () => {
    // --- UI State Management (remains the same) ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStation, setEditingStation] = useState<IStationInfo | null>(null);
    const [stationToDelete, setStationToDelete] = useState<IStationInfo | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'station_id', direction: 'ascending' });
    const [filters, setFilters] = useState<IFilters>({ provinceId: '', supporterId: '', amControlId: '' });

    // --- React Query Client ---
    const queryClient = useQueryClient();

    // --- Data Fetching with React Query ---
    const { data: stations = [], isLoading: isLoadingStations, error: stationsError } = useQuery({
        queryKey: ['stations'],
        queryFn: () => stationInfoService.getAll(),
        staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    });

    const { data: provinces = [] } = useQuery({
        queryKey: ['provinces'],
        queryFn: () => lookupService.getProvinces(),
        staleTime: Infinity, // This data rarely changes, cache it forever
    });

    const { data: supporters = [] } = useQuery({
        queryKey: ['supporters'],
        queryFn: () => lookupService.getSupporters(),
        staleTime: Infinity,
    });

    const { data: amControls = [] } = useQuery({
        queryKey: ['amControls'],
        queryFn: () => lookupService.getAMControls(),
        staleTime: Infinity,
    });

    // --- Mutations with React Query ---
    const saveMutation = useMutation({
        mutationFn: (stationData: Partial<IStationInfo>) => {
            const isEditing = !!editingStation;
            if (isEditing && editingStation.id) {
                return stationInfoService.update(editingStation.id, stationData);
            } else {
                return stationInfoService.create(stationData as IStationInfo);
            }
        },
        onSuccess: () => {
            const isEditing = !!editingStation;
            toast.success(`Station ${isEditing ? 'updated' : 'created'} successfully!`);
            queryClient.invalidateQueries({ queryKey: ['stations'] }); // Crucial for auto-refetch
            setIsFormOpen(false);
        },
        onError: () => {
            toast.error('Failed to save station.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (stationId: number) => stationInfoService.delete(stationId),
        onSuccess: () => {
            toast.success('Station deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['stations'] }); // Crucial for auto-refetch
            setIsDeleteConfirmOpen(false);
            setStationToDelete(null);
        },
        onError: () => {
            toast.error('Failed to delete station.');
            setIsDeleteConfirmOpen(false);
            setStationToDelete(null);
        },
    });

    // --- Memoized Filtering and Sorting Logic ---
    const filteredAndSortedStations = useMemo(() => {
        let processedStations = [...stations];

        processedStations = processedStations.filter(station => {
            const matchProvince = !filters.provinceId || (station.province_id?.toString() === filters.provinceId);
            const matchSupporter = !filters.supporterId || (station.supporter_id?.toString() === filters.supporterId);
            const matchAmControl = !filters.amControlId || (station.am_control_id?.toString() === filters.amControlId);
            return matchProvince && matchSupporter && matchAmControl;
        });

        if (searchTerm) {
            processedStations = processedStations.filter(station =>
                (station.station_id.toLowerCase() + station.station_name.toLowerCase())
                    .includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig) {
            processedStations.sort((a, b) => {
                const getNestedValue = (obj: IStationInfo, path: string): string => {
                    const [first, ...rest] = path.split('.');
                    let value: any = obj[first as keyof IStationInfo];
                    if (rest.length > 0) {
                        if (first === 'province' && value) value = (value as IProvince).name;
                        else if (first === 'am_control' && value) value = (value as IAMControl).name;
                        else if (first === 'supporter' && value) value = (value as ISupporter).supporter_name;
                        else value = '';
                    }
                    return value ?? '';
                };
                const aValue = getNestedValue(a, sortConfig.key);
                const bValue = getNestedValue(b, sortConfig.key);
                const aStr = String(aValue);
                const bStr = String(bValue);
                const comparison = aStr.localeCompare(bStr, undefined, { numeric: true });
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return processedStations;
    }, [stations, searchTerm, filters, sortConfig]);

    // --- Handlers ---
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const clearFilters = () => {
        setFilters({ provinceId: '', supporterId: '', amControlId: '' });
        setSearchTerm('');
    };
    const handleCreate = () => {
        setEditingStation(null);
        setIsFormOpen(true);
    };
    const handleEdit = (station: IStationInfo) => {
        setEditingStation(station);
        setIsFormOpen(true);
    };
    const handleDelete = (station: IStationInfo) => {
        setStationToDelete(station);
        setIsDeleteConfirmOpen(true);
    };
    const confirmDelete = () => {
        if (!stationToDelete) return;
        const toastId = toast.loading('Deleting station...');
        deleteMutation.mutate(stationToDelete.id, {
            onSettled: () => {
                toast.dismiss(toastId);
            }
        });
    };
    const handleFormSubmit = (data: Partial<IStationInfo>) => {
        const isEditing = !!editingStation;
        const toastId = toast.loading(isEditing ? 'Updating station...' : 'Creating station...');
        saveMutation.mutate(data, {
            onSettled: () => {
                toast.dismiss(toastId);
            }
        });
    };
    const handleExport = () => {
        const dataToExport = filteredAndSortedStations.map(s => ({
            'Station ID': s.station_id,
            'Name': s.station_name,
            'Province': s.province?.name || 'N/A',
            'AM Control': s.am_control?.name || s.AM_Control || 'N/A',
            'Supporter': s.supporter?.supporter_name || 'N/A',
            'Status': s.active === 1 ? 'Active' : s.active === 0 ? 'Inactive' : 'N/A',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stations");
        XLSX.writeFile(workbook, "StationInfo.xlsx");
        toast.success('Data exported to Excel!');
    };
    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // --- Render Logic ---
    const renderSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronUpIcon className="w-4 h-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
        }
        return sortConfig.direction === 'ascending'
            ? <ChevronUpIcon className="w-4 h-4 ml-2 text-indigo-600" />
            : <ChevronDownIcon className="w-4 h-4 ml-2 text-indigo-600" />;
    };

    // --- Chart Data Preparation ---
    const { processedProvinceData, amControlData, supporterData } = useMemo(() => {
        const getStationCountByCategory = (category: 'province' | 'am_control' | 'supporter') => {
            const counts = stations.reduce((acc, station) => {
                let key: string;
                if (category === 'province' && station.province) key = station.province.name;
                else if (category === 'am_control' && station.am_control) key = station.am_control.name;
                else if (category === 'supporter' && station.supporter) key = station.supporter.supporter_name;
                else key = 'Unknown';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            return Object.entries(counts).map(([label, value]) => ({ label, value }));
        };
        const provinceData = getStationCountByCategory('province');
        const amControlData = getStationCountByCategory('am_control');
        const supporterData = getStationCountByCategory('supporter');
        const sortedProvinces = [...provinceData].sort((a, b) => b.value - a.value);
        const topProvinces = sortedProvinces.slice(0, 12);
        const otherProvinces = sortedProvinces.slice(12);
        const otherCount = otherProvinces.reduce((sum, p) => sum + p.value, 0);
        let processedProvinceData = topProvinces;
        if (otherCount > 0) {
            processedProvinceData.push({ label: 'Other', value: otherCount });
        }
        return { processedProvinceData, amControlData, supporterData };
    }, [stations]);

    if (stationsError) {
        return <div className="p-8 text-center text-red-600">Failed to load station data. Please try again later.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="p-4 sm:p-6 lg:p-8">
                {/* Page Header */}
                <div className="sm:flex sm:items-center sm:justify-between">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Station Management</h1>
                        <p className="mt-2 text-sm text-gray-600">Total Stations: {stations.length}</p>
                        <p className="mt-2 text-sm text-gray-600">Manage, filter, and export station information.</p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 flex items-center gap-x-3">
                        <button onClick={handleExport} type="button" className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            <ArrowDownTrayIcon className="h-5 w-5 text-gray-500" /> Export
                        </button>
                        <button onClick={handleCreate} type="button" className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                            <PlusIcon className="h-5 w-5" /> Add Station
                        </button>
                    </div>
                </div>

                {/* Filters and Search Card */}
                <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-2">
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="text" id="search" placeholder="Search by ID or Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="provinceId" className="block text-sm font-medium text-gray-700">Province</label>
                            <select id="provinceId" name="provinceId" value={filters.provinceId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                                <option value="">All</option>
                                {provinces.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="supporterId" className="block text-sm font-medium text-gray-700">Supporter</label>
                            <select id="supporterId" name="supporterId" value={filters.supporterId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                                <option value="">All</option>
                                {supporters.map(s => <option key={s.id} value={s.id.toString()}>{s.supporter_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="amControlId" className="block text-sm font-medium text-gray-700">AM Control</label>
                            <select id="amControlId" name="amControlId" value={filters.amControlId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                                <option value="">All</option>
                                {amControls.map(am => <option key={am.id} value={am.id.toString()}>{am.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={clearFilters} className="flex items-center justify-center w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                <XMarkIcon className="h-5 w-5 mr-1 text-gray-500"/>
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Station Distribution</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <CustomDonutChart
                                data={processedProvinceData.map(d => ({ id: d.label, value: d.value }))}
                                title="By Province"
                                total={stations.length}
                            />
                        </div>
                        <div>
                            <CustomBarChart data={amControlData} colors={['#6ee7b7']} title="By AM Control" />
                        </div>
                        <div>
                            <CustomBarChart data={supporterData} colors={['#fca5a5']} title="By Supporter" />
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="mt-8 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"><button onClick={() => requestSort('station_id')} className="group inline-flex items-center">Station ID {renderSortIcon('station_id')}</button></th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"><button onClick={() => requestSort('station_name')} className="group inline-flex items-center">Name {renderSortIcon('station_name')}</button></th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"><button onClick={() => requestSort('province.name')} className="group inline-flex items-center">Province {renderSortIcon('province.name')}</button></th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"><button onClick={() => requestSort('am_control.name')} className="group inline-flex items-center">AM Control {renderSortIcon('am_control.name')}</button></th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"><button onClick={() => requestSort('supporter.supporter_name')} className="group inline-flex items-center">Supporter {renderSortIcon('supporter.supporter_name')}</button></th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                    {isLoadingStations ? (
                                        <tr><td colSpan={7} className="text-center p-8 text-gray-500">Loading stations...</td></tr>
                                    ) : filteredAndSortedStations.length > 0 ? filteredAndSortedStations.map(station => (
                                        <tr key={station.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{station.station_id}</td>
                                            <td className="max-w-xs truncate px-3 py-4 text-sm text-gray-500" title={station.station_name}>{station.station_name}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{station.province?.name || 'N/A'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{station.am_control?.name || station.AM_Control || 'N/A'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{station.supporter?.supporter_name || 'N/A'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${station.active === 1 ? 'bg-green-100 text-green-800' : station.active === 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {station.active === 1 ? 'Active' : station.active === 0 ? 'Inactive' : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button onClick={() => handleEdit(station)} className="p-1 text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md" title="Edit Station"><PencilSquareIcon className="h-5 w-5"/></button>
                                                <button onClick={() => handleDelete(station)} className="p-1 ml-2 text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md" title="Delete Station"><TrashIcon className="h-5 w-5"/></button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={7} className="text-center p-8 text-gray-500">No stations match the current filters.</td></tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Modals --- */}
                <Transition appear show={isFormOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => setIsFormOpen(false)}>
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-25" /></Transition.Child>
                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <StationInfoForm initialData={editingStation} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} />
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
                <Transition appear show={isDeleteConfirmOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteConfirmOpen(false)}>
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-30" /></Transition.Child>
                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">Delete Station</Dialog.Title>
                                        <div className="mt-2"><p className="text-sm text-gray-500">Are you sure you want to delete station "{stationToDelete?.station_name}"? This action cannot be undone.</p></div>
                                        <div className="mt-4 flex justify-end space-x-2">
                                            <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</button>
                                            <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none" onClick={confirmDelete}>Delete</button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </div>
    );
};