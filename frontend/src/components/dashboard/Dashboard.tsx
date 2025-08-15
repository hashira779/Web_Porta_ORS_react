import React, { useState, useCallback, useMemo } from 'react';
import { getDashboardData } from '../../api/api';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { UsersIcon, BeakerIcon, FireIcon } from '@heroicons/react/24/outline';
import Spinner from '../common/CalSpin';

// --- Type Definitions ---
interface KpiData {
    total_stations: number;
    hds_volume: number;
    ulg95_volume: number;
    ulr91_volume: number;
}
interface ChartDataPoint { name: string; value: number; }
interface DashboardData { kpi: KpiData; charts: { sales_by_payment: ChartDataPoint[]; volume_by_product: ChartDataPoint[] }; }

// --- Reusable Components ---
const KPICard: React.FC<{ title: string; value: number; unit: string; icon: React.ElementType }> = ({ title, value, unit, icon: Icon }) => {
    const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
    return (
        <motion.div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200/80" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">{value ? formatNumber(value) : '0'}
                        <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>
                    </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full"><Icon className="h-6 w-6 text-indigo-600" /></div>
            </div>
        </motion.div>
    );
};

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200">
                <p className="font-semibold text-gray-800 text-sm">{label}</p>
                <p className="text-indigo-600 text-sm">{`${payload[0].name}: ${payload[0].value.toLocaleString()}`}</p>
            </div>
        );
    }
    return null;
};

const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
        <g>
            <text x={cx} y={cy} dy={-8} textAnchor="middle" fill="#374151" className="font-bold text-sm">{payload.name}</text>
            <text x={cx} y={cy} dy={12} textAnchor="middle" fill="#111827" className="font-semibold text-sm">{`${payload.value.toLocaleString()}`}</text>
            <text x={cx} y={cy} dy={28} textAnchor="middle" fill="#6B7280" className="text-xs">{`( ${(percent * 100).toFixed(2)}%)`}</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
        </g>
    );
};

const FilterSelect: React.FC<{ label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, name: string, options: { value: string | number, label: string }[], disabled?: boolean }> = ({ label, value, onChange, name, options, disabled = false }) => (
    <div className="flex flex-col">
        <label htmlFor={name} className="text-xs font-medium text-gray-600 mb-1">{label}</label>
        <select
            id={name} name={name} value={value} onChange={onChange} disabled={disabled}
            className="w-full sm:w-32 p-2 text-xs border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
            {options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
    </div>
);

const Dashboard: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [filters, setFilters] = useState({ year: '', month: '', day: '', id_type: '' });

    const { data, isLoading: loading, isError } = useQuery<DashboardData>({
        queryKey: ['dashboardData', filters],
        queryFn: () => getDashboardData(filters).then(res => res.data),
        staleTime: 1000 * 60 * 5,
    });

    const sanitizedData = useMemo(() => {
        return {
            kpi: data?.kpi || { total_stations: 0, hds_volume: 0, ulg95_volume: 0, ulr91_volume: 0 },
            charts: {
                volume_by_product: data?.charts?.volume_by_product || [],
                sales_by_payment: data?.charts?.sales_by_payment || [],
            }
        };
    }, [data]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'year' && !value) { newFilters.month = ''; newFilters.day = ''; }
            if (name === 'month' && !value) { newFilters.day = ''; }
            return newFilters;
        });
    };

    const onPieEnter = useCallback((_: any, index: number) => setActiveIndex(index), []);

    const yearOptions = [{ value: '', label: 'All Years' }, { value: '2023', label: '2023' }, { value: '2024', label: '2024' }, { value: '2025', label: '2025' }];
    const monthOptions = [{ value: '', label: 'All Months' }, ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('default', { month: 'long' }) }))];
    const dayOptions = [{ value: '', label: 'All Days' }, ...Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }))];
    const idTypeOptions = [{ value: '', label: 'All Types' }, { value: 'COCO', label: 'COCO' }, { value: 'DODO', label: 'DODO' }];

    const productColorMap: { [key: string]: string } = { 'HDS': '#3B82F6', 'ULR91': '#EF4444', 'ULG95': '#F59E0B' };
    const paymentColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h1 className="text-3xl font-bold text-gray-800">Sales Dashboard</h1>
                </motion.div>
                <div className="flex flex-wrap items-end gap-2 p-2 bg-gray-50 rounded-lg border">
                    <FilterSelect name="id_type" label="ID Type" value={filters.id_type} onChange={handleFilterChange} options={idTypeOptions} />
                    <FilterSelect name="year" label="Year" value={filters.year} onChange={handleFilterChange} options={yearOptions} />
                    <FilterSelect name="month" label="Month" value={filters.month} onChange={handleFilterChange} options={monthOptions} disabled={!filters.year} />
                    <FilterSelect name="day" label="Day" value={filters.day} onChange={handleFilterChange} options={dayOptions} disabled={!filters.month} />
                </div>
            </div>

            {loading && <div className="p-6 text-center text-gray-500 flex justify-center items-center h-96"><Spinner size="lg" /></div>}
            {isError && !loading && <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">Could not load dashboard data. Please try again.</div>}

            {!loading && !isError && data && (
                <>
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                        <KPICard title="Active Stations" value={sanitizedData.kpi.total_stations} unit="Stations" icon={UsersIcon} />
                        <KPICard title="HDS Volume" value={sanitizedData.kpi.hds_volume} unit="Liters" icon={BeakerIcon} />
                        <KPICard title="ULG95 Volume" value={sanitizedData.kpi.ulg95_volume} unit="Liters" icon={FireIcon} />
                        <KPICard title="ULR91 Volume" value={sanitizedData.kpi.ulr91_volume} unit="Liters" icon={BeakerIcon} />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div className="bg-white p-4 rounded-lg shadow-sm border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <h3 className="font-semibold text-lg text-gray-800 mb-2">Volume by Product</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sanitizedData.charts.volume_by_product} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                                        <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} />
                                        <Bar dataKey="value" name="Volume" radius={[5, 5, 0, 0]}>
                                            {sanitizedData.charts.volume_by_product.map((entry: ChartDataPoint, index: number) => (
                                                <Cell key={`cell-${index}`} fill={productColorMap[entry.name] || '#8884d8'} stroke={productColorMap[entry.name]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                        <motion.div className="bg-white p-4 rounded-lg shadow-sm border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <h3 className="font-semibold text-lg text-gray-800 mb-2">Sales by Payment Method</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            // @ts-ignore ✨ ADD THIS COMMENT TO FIX THE ERROR
                                            activeIndex={activeIndex}
                                            activeShape={renderActiveShape}
                                            data={sanitizedData.charts.sales_by_payment}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            dataKey="value"
                                            nameKey="name"
                                            onMouseEnter={onPieEnter}
                                        >
                                            {sanitizedData.charts.sales_by_payment.map((entry: ChartDataPoint, index: number) => (
                                                <Cell key={`cell-${index}`} fill={paymentColors[index % paymentColors.length]} stroke={'#FFFFFF'} />
                                            ))}
                                        </Pie>
                                        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;