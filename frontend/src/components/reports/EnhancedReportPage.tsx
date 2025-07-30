import React, { useState, useEffect, useMemo } from 'react';
import { getSalesDataByYear, searchStations } from '../../api/api';
import { Sale, StationSuggestion } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/CalSpin';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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


const EnhancedReportPage: React.FC = () => {
    // --- Get current user from our global AuthContext ---
    const { currentUser } = useAuth();

    // --- State for this page's data and UI ---
    const [allData, setAllData] = useState<Sale[]>([]);
    const [year, setYear] = useState<string>('2025');
    const [dataLoading, setDataLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // UI states
    const [filters, setFilters] = useState({ stationId: '', startDate: '', endDate: '' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Sale; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(15);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [stationSearchInput, setStationSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<StationSuggestion[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

    // --- Check for specific IN-PAGE permissions like filter and export ---
    const userPermissions = useMemo(() => {
        if (!currentUser) return { canExport: false, canFilter: false };
        const permissions = new Set(currentUser.role.permissions.map(p => p.name));
        return {
            canExport: permissions.has('export') || currentUser.role?.name === 'admin',
            canFilter: permissions.has('filter') || currentUser.role?.name === 'admin',
        };
    }, [currentUser]);

    // --- Data fetching and processing logic ---
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
                const salesData = response.data.map(d => ({
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
        setFilters({ ...filters, stationId: station.station_ID });
        setSuggestions([]);
    };

    const filteredData = useMemo(() => {
        let data = [...allData];
        if (userPermissions.canFilter) {
            if (filters.stationId) {
                data = data.filter(d => d.STATION_ID === filters.stationId);
            }
            if (filters.startDate) {
                data = data.filter(d => new Date(d.date_completed) >= new Date(filters.startDate));
            }
            if (filters.endDate) {
                data = data.filter(d => new Date(d.date_completed) <= new Date(filters.endDate));
            }
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                Object.values(item).some(val => val?.toString().toLowerCase().includes(query))
            );
        }
        return data;
    }, [filters, allData, searchQuery, userPermissions.canFilter]);

    // ... other data processing functions (sortedData, paginatedData, charts, exports) remain the same ...
    const sortedData = useMemo(() => {
        let sortableData = [...filteredData];
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
    }, [filteredData, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const requestSort = (key: keyof Sale) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const volumeByProduct = useMemo(() => {
        const productMap = new Map<string, number>();
        filteredData.forEach(d => {
            const matIdKey = d.MAT_ID === '500033' ? 'HDS' : d.MAT_ID === '500024' ? 'ULG95' : d.MAT_ID === '500014' ? 'ULR91' : 'Other';
            const volume = productMap.get(matIdKey) || 0;
            productMap.set(matIdKey, volume + d.total_valume);
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

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    const exportToCSV = () => {
        const headers = Object.keys(allData[0] || {});
        const csvContent = [
            headers.join(','),
            ...sortedData.map(row =>
                headers.map(header => `"${String(row[header as keyof Sale] || '').replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `sales-report-${year}.csv`);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(sortedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
        XLSX.writeFile(workbook, `sales-report-${year}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const headers = Object.keys(allData[0] || {});
        const data = sortedData.map(row => headers.map(header => String(row[header as keyof Sale] || '')));
        doc.text(`Sales Report - ${year}`, 14, 16);
        autoTable(doc, {
            head: [headers], body: data, startY: 20,
            styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] }
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
                        // --- UPDATED: Button is now also disabled if the user cannot filter ---
                        disabled={dataLoading || !userPermissions.canFilter}
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
                                    if (e.target.value === '') {
                                        setFilters({ ...filters, stationId: '' });
                                    }
                                }}
                                placeholder="Type ID or Name..."
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {isSuggestionsLoading && <Spinner size="xs" className="absolute right-3 top-9" />}
                            {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {suggestions.map((station) => (
                                        <li
                                            key={station.station_ID}
                                            onClick={() => handleSelectStation(station)}
                                            className="px-3 py-2 cursor-pointer hover:bg-indigo-50 text-sm"
                                        >
                                            <span className="font-bold">{station.station_ID}</span> - {station.station_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={e => setFilters({...filters, startDate: e.target.value})}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={e => setFilters({...filters, endDate: e.target.value})}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border h-80">
                    <h3 className="font-semibold text-gray-800 mb-4">Volume by Product</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeByProduct}>
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                            <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)} />
                            <Tooltip
                                cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }}
                                formatter={(value) => new Intl.NumberFormat('en').format(Number(value))}
                            />
                            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border h-80">
                    <h3 className="font-semibold text-gray-800 mb-4">Transactions by Payment</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={salesByPayment}
                                dataKey="value" nameKey="name" cx="50%" cy="50%"
                                innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}
                                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            >
                                {salesByPayment.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} transactions`, 'Count']} />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table Section */}
            <div className="p-6 bg-white rounded-xl shadow-sm border overflow-x-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
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
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value={sortedData.length}>All</option>
                            </select>
                        </div>

                        {userPermissions.canExport && (
                            <div className="relative">
                                <button
                                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md"
                                    onClick={() => { document.getElementById('export-menu')?.classList.toggle('hidden'); }}
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
                                    Export
                                </button>
                                <div id="export-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <button onClick={exportToCSV} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full">
                                        <DocumentTextIcon className="h-4 w-4 mr-2" /> CSV
                                    </button>
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
                            {(Object.keys(allData[0] || {}) as Array<keyof Sale>).map((key) => (
                                <th
                                    key={key}
                                    onClick={() => requestSort(key)}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                                >
                                    <div className="flex items-center">
                                        {key.replace(/_/g, ' ')}
                                        {sortConfig?.key === key && (
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
                                    {Object.values(row).map((val, i) => (
                                        <td key={i} className="px-3 py-2 text-sm text-gray-700" title={String(val)}>
                                            {typeof val === 'number' ? new Intl.NumberFormat().format(val) : String(val)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={Object.keys(allData[0] || {}).length} className="px-3 py-2 text-center text-sm text-gray-500">
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
                            <span className="font-medium">
                                {Math.min(currentPage * itemsPerPage, sortedData.length)}
                            </span>{' '}
                            of <span className="font-medium">{sortedData.length}</span> results
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedReportPage;