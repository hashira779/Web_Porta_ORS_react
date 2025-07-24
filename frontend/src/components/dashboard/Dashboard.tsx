import React, { useEffect, useState, useCallback } from 'react';
import { getDashboardData } from '../../api/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { UsersIcon, BeakerIcon, FireIcon } from '@heroicons/react/24/outline';

// --- Type Definitions (no changes needed) ---
interface KpiData {
    total_stations: number; hds_volume: number; ulg95_volume: number; ulr91_volume: number;
}
interface ChartDataPoint { name: string; value: number; }
interface DashboardData {
    kpi: KpiData; charts: { sales_by_payment: ChartDataPoint[]; volume_by_product: ChartDataPoint[]; };
}

// --- Reusable Components ---

const KPICard: React.FC<{title: string, value: number, unit: string, icon: React.ElementType}> = ({ title, value, unit, icon: Icon }) => (
    <motion.div
        className="bg-white p-5 rounded-xl shadow-sm border border-gray-200/80"
        variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
    >
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-800">
                    {value ? value.toLocaleString() : '0'}
                    <span className="text-sm font-medium text-gray-500 ml-2">{unit}</span>
                </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
                <Icon className="h-6 w-6 text-indigo-600" />
            </div>
        </div>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="font-semibold text-gray-800">{label}</p>
                <p className="text-indigo-600">{`${payload[0].name}: ${payload[0].value.toLocaleString()}`}</p>
            </div>
        );
    }
    return null;
};

// --- Custom Active Shape for Pie Chart ---
const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;

    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#374151" className="font-bold text-lg">{payload.name}</text>
            <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#111827" className="font-semibold">{`${payload.value.toLocaleString()}`}</text>
            <text x={cx} y={cy} dy={35} textAnchor="middle" fill="#6B7280">{`( ${(percent * 100).toFixed(2)}%)`}</text>
            <Sector
                cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius}
                startAngle={startAngle} endAngle={endAngle} fill={fill}
            />
            <Sector
                cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle}
                innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill}
            />
        </g>
    );
};


// --- Main Dashboard Component ---
const Dashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        getDashboardData()
            .then(response => setData(response.data))
            .catch(error => console.error("Error fetching dashboard data:", error))
            .finally(() => setLoading(false));
    }, []);

    const onPieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, [setActiveIndex]);

    if (loading) return <div className="p-8 font-semibold">Loading Dashboard...</div>;
    if (!data) return <div className="p-8 font-semibold">Could not load dashboard data.</div>;

    // --- Color Mapping for Products ---
    const productColorMap: { [key: string]: string } = {
        'HDS': '#3B82F6',   // Blue
        'ULR91': '#EF4444', // Red
        'ULG95': '#F59E0B', // Yellow
    };
    const paymentColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#6366F1', '#F97316', '#14B8A6'];

    // @ts-ignore
    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-3xl font-bold text-gray-800">Sales Dashboard</h1>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.1 } }
                }}
            >
                <KPICard title="Active Stations" value={data.kpi.total_stations} unit="Stations" icon={UsersIcon} />
                <KPICard title="HDS Volume" value={data.kpi.hds_volume} unit="Liters" icon={BeakerIcon} />
                <KPICard title="ULG95 Volume" value={data.kpi.ulg95_volume} unit="Liters" icon={FireIcon} />
                <KPICard title="ULR91 Volume" value={data.kpi.ulr91_volume} unit="Liters" icon={BeakerIcon} />
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                {/* Volume by Product Chart */}
                <motion.div
                    className="xl:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-200/80"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                >
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Volume by Product</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data.charts.volume_by_product} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <defs>
                                {Object.keys(productColorMap).map(key => (
                                    <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={productColorMap[key]} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={productColorMap[key]} stopOpacity={0.2}/>
                                    </linearGradient>
                                ))}
                            </defs>
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                            <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} />
                            <Bar dataKey="value" name="Volume" radius={[5, 5, 0, 0]}>
                                {data.charts.volume_by_product.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#color${entry.name})`} stroke={productColorMap[entry.name]}/>
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Sales by Payment Method Chart */}
                <motion.div
                    className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200/80"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                >
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Sales by Payment Method</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                activeShape={renderActiveShape}
                                data={data.charts.sales_by_payment}
                                cx="50%" cy="50%" innerRadius={80} outerRadius={120}
                                dataKey="value" nameKey="name" onMouseEnter={onPieEnter}
                            >
                                {data.charts.sales_by_payment.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={paymentColors[index % paymentColors.length]} stroke={paymentColors[index % paymentColors.length]}/>
                                ))}
                            </Pie>
                            <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;