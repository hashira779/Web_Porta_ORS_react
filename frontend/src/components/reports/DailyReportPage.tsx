import React, { useState, useEffect, useMemo } from 'react';
import { getSalesDataByYear, searchStations } from '../../api/api';
import { Sale, StationSuggestion } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/CalSpin';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon, DocumentArrowDownIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Reusable Pagination Component ---
const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pageNumbers.push(i);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pageNumbers.push('...');
        }
    }
    return (
        <div className="flex items-center justify-between mt-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Previous
            </button>
            <div className="flex items-center space-x-1">
                {pageNumbers.map((page, index) =>
                    typeof page === 'number' ? (
                        <button
                            key={index}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1 text-sm font-medium rounded-md ${
                                currentPage === page
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={index} className="px-3 py-1 text-sm text-gray-400">...</span>
                    )
                )}
            </div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
        </div>
    );
};

// --- Custom Tooltip for Charts ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="font-semibold text-gray-800">{label}</p>
                <p className="text-sm text-indigo-600">{`${payload[0].name}: ${new Intl.NumberFormat().format(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};


const DailyReportPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [allData, setAllData] = useState<Sale[]>([]);
    const [year, setYear] = useState<string>('2025');
    const [dataLoading, setDataLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [filters, setFilters] = useState({ stationId: '', startDate: '', endDate: '' });
    // --- UPDATED: Sort config now uses string for key to support pivoted columns ---
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({ key: 'date_completed', direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(15);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [stationSearchInput, setStationSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<StationSuggestion[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

    const userPermissions = useMemo(() => {
        if (!currentUser) return { canExport: false, canFilter: false };
        const permissions = new Set(currentUser.role.permissions.map(p => p.name));
        return {
            canExport: permissions.has('export') || currentUser.role?.name === 'admin',
            canFilter: permissions.has('filter') || currentUser.role?.name === 'admin',
        };
    }, [currentUser]);

    useEffect(() => {
        if (stationSearchInput.length < 2) {
            setSuggestions([]);
            return;
        }
        setIsSuggestionsLoading(true);
        const debounceTimer = setTimeout(() => {
            searchStations(stationSearchInput)
                .then(response => setSuggestions(response.data))
                .catch(() => setSuggestions([]))
                .finally(() => setIsSuggestionsLoading(false));
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [stationSearchInput]);

    const handleFetch = (e: React.FormEvent) => {
        e.preventDefault();
        setDataLoading(true);
        setError('');
        setAllData([]);
        getSalesDataByYear(year)
            .then(response => {
                const salesData = response.data.map((d: any) => ({
                    ...d,
                    total_valume: Number(d.total_valume) || 0,
                    total_amount: Number(d.total_amount) || 0,
                }));
                setAllData(salesData);
                if (salesData.length === 0) {
                    setError("No data found for the selected year.");
                }
            })
            .catch(err => setError(err.response?.data?.detail || 'Failed to fetch report'))
            .finally(() => setDataLoading(false));
    };

    const handleSelectStation = (station: StationSuggestion) => {
        setStationSearchInput(station.station_name);
        setFilters({ ...filters, stationId: station.station_id });
        setSuggestions([]);
    };

    const filteredData = useMemo(() => {
        let data = [...allData];
        if (userPermissions.canFilter) {
            if (filters.stationId) data = data.filter(d => String(d.STATION_ID) === filters.stationId);
            if (filters.startDate) data = data.filter(d => new Date(d.date_completed) >= new Date(filters.startDate));
            if (filters.endDate) data = data.filter(d => new Date(d.date_completed) <= new Date(filters.endDate));
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                Object.values(item).some(val => val?.toString().toLowerCase().includes(query))
            );
        }
        return data;
    }, [filters, allData, searchQuery, userPermissions.canFilter]);

    // --- NEW: Logic to pivot sales data for the table ---
    const pivotedData = useMemo(() => {
        const groupedData = new Map<string, any>();

        filteredData.forEach(sale => {
            // Group by a unique transaction identifier, excluding product-specific details
            const key = `${sale.date_completed}-${sale.STATION_ID}-${sale.SHIFT_ID}-${sale.ID_Type}`;

            if (!groupedData.has(key)) {
                groupedData.set(key, {
                    ID_Type: sale.ID_Type,
                    STATION_ID: sale.STATION_ID,
                    STATION: sale.STATION,
                    AM_Name: sale.AM_Name,
                    province_name: sale.province_name,
                    date_completed: sale.date_completed,
                    PAYMENT: sale.PAYMENT,
                    SHIFT_ID: sale.SHIFT_ID,
                    HSD: 0,
                    'ULG 95': 0,
                    'ULR 91': 0,
                    total_amount: 0,
                });
            }

            const entry = groupedData.get(key);
            entry.total_amount += sale.total_amount;

            switch (sale.MAT_Name) {
                case 'HSD':
                    entry.HSD += sale.total_valume;
                    break;
                case 'ULG95':
                    entry['ULG 95'] += sale.total_valume;
                    break;
                case 'ULR 91':
                    entry['ULR 91'] += sale.total_valume;
                    break;
                default:
                    break;
            }
        });

        return Array.from(groupedData.values());
    }, [filteredData]);


    // --- UPDATED: Sorting now operates on the new pivoted data structure ---
    const sortedData = useMemo(() => {
        let sortableData = [...pivotedData];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableData;
    }, [pivotedData, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    // Chart data logic remains unchanged, operating on the original filtered data
    const volumeByProduct = useMemo(() => {
        const productMap = new Map<string, number>();
        filteredData.forEach(d => {
            const productName = (d as any).MAT_Name || 'Unknown';
            const currentVolume = productMap.get(productName) || 0;
            productMap.set(productName, currentVolume + d.total_valume);
        });
        return Array.from(productMap, ([name, value]) => ({ name, value }));
    }, [filteredData]);

    const salesByPayment = useMemo(() => {
        const paymentMap = new Map<string, number>();
        filteredData.forEach(d => {
            const payment = d.PAYMENT || 'Unknown';
            const count = paymentMap.get(payment) || 0;
            paymentMap.set(payment, count + 1);
        });
        return Array.from(paymentMap, ([name, value]) => ({ name, value }));
    }, [filteredData]);

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    // --- UPDATED: Table columns now reflect the pivoted structure ---
    const tableColumns: { key: string; label: string }[] = [
        { key: 'ID_Type', label: 'ID Type' },
        { key: 'STATION_ID', label: 'Station ID' },
        { key: 'STATION', label: 'Station Name' },
        { key: 'AM_Name', label: 'AM Name' },
        { key: 'province_name', label: 'Province' },
        { key: 'date_completed', label: 'Date' },
        { key: 'PAYMENT', label: 'Payment' },
        { key: 'SHIFT_ID', label: 'Shift' },
        { key: 'HSD', label: 'HSD' },
        { key: 'ULG 95', label: 'ULG95' },
        { key: 'ULR 91', label: 'ULR91' },
        { key: 'total_amount', label: 'Total Amount' },
    ];

    const exportToExcel = () => {
        const dataToExport = sortedData.map(row => {
            const newRow: { [key: string]: any } = {};
            tableColumns.forEach(col => {
                newRow[col.label] = (row as any)[col.key];
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
        XLSX.writeFile(workbook, `sales-report-${year}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const headers = tableColumns.map(col => col.label);
        const data = sortedData.map(row => tableColumns.map(col => String((row as any)[col.key] || '')));
        doc.text(`Sales Report - ${year}`, 14, 16);
        autoTable(doc, {
            head: [headers], body: data, startY: 20,
            styles: { fontSize: 8 }, headStyles: { fillColor: [79, 70, 229] }
        });
        doc.save(`sales-report-${year}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="p-6 bg-white rounded-xl shadow-sm border">
                <form onSubmit={handleFetch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        {userPermissions.canFilter && (
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                <FunnelIcon className="w-4 h-4 mr-2" />
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                        disabled={dataLoading}
                    >
                        {dataLoading ? <Spinner size="sm" color="white" /> : 'Fetch Report'}
                    </button>
                </form>

                {showFilters && userPermissions.canFilter && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700">Station</label>
                            <input
                                type="text"
                                value={stationSearchInput}
                                onChange={e => {
                                    setStationSearchInput(e.target.value);
                                    if (e.target.value === '') setFilters({ ...filters, stationId: '' });
                                }}
                                placeholder="Type ID or Name..."
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            />
                            {isSuggestionsLoading && <Spinner size="xs" className="absolute right-3 top-9" />}
                            {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {suggestions.map((s) => (
                                        <li key={s.station_id} onClick={() => handleSelectStation(s)} className="px-3 py-2 cursor-pointer hover:bg-indigo-50 text-sm">
                                            <span className="font-bold">{s.station_id}</span> - {s.station_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                )}
                {error && <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-md">{error}</div>}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 p-6 bg-white rounded-xl shadow-sm border h-96 flex flex-col">
                    <h3 className="font-semibold text-gray-800 mb-4">Volume by Product</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeByProduct} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.8}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.7)' }} />
                            <Bar dataKey="value" name="Volume" fill="url(#colorUv)" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 p-6 bg-white rounded-xl shadow-sm border h-96 flex flex-col">
                    <h3 className="font-semibold text-gray-800 mb-4">Transactions by Payment Method</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={salesByPayment}
                                dataKey="value" nameKey="name" cx="50%" cy="50%"
                                innerRadius="60%" outerRadius="80%" fill="#8884d8" paddingAngle={5}
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    if (percent === undefined || midAngle === undefined) return null;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                    return (
                                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    );
                                }}
                            >
                                {salesByPayment.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table Section */}
            <div className="p-6 bg-white rounded-xl shadow-sm border overflow-x-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div className="relative w-full sm:w-64">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search all columns..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="flex items-center">
                            <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-700">Show:</label>
                            <select
                                id="itemsPerPage"
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md"
                            >
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={sortedData.length}>All</option>
                            </select>
                        </div>
                        {userPermissions.canExport && (
                            <div className="relative">
                                <button
                                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md"
                                    onClick={() => { document.getElementById('export-menu')?.classList.toggle('hidden'); }}
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5 mr-1" /> Export
                                </button>
                                <div id="export-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <button onClick={exportToExcel} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full">
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-2 text-green-600" /> Excel
                                    </button>
                                    <button onClick={exportToPDF} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full">
                                        <DocumentTextIcon className="h-4 w-4 mr-2 text-red-600" /> PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            {tableColumns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => requestSort(col.key)}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                >
                                    <div className="flex items-center">
                                        {col.label}
                                        {sortConfig?.key === col.key && (
                                            sortConfig.direction === 'ascending' ?
                                                <ChevronUpIcon className="w-3 h-3 ml-1" /> :
                                                <ChevronDownIcon className="w-3 h-3 ml-1" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    {tableColumns.map(col => (
                                        <td key={col.key} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap" title={String((row as any)[col.key])}>
                                            {typeof (row as any)[col.key] === 'number' ? new Intl.NumberFormat().format((row as any)[col.key] as number) : String((row as any)[col.key] || '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={tableColumns.length} className="px-3 py-4 text-center text-sm text-gray-500">
                                    {dataLoading ? 'Loading data...' : 'No data available'}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                {paginatedData.length > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span>{' '}
                            of <span className="font-medium">{sortedData.length}</span> results
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyReportPage;