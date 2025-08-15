import { ResponsiveBar, BarDatum } from '@nivo/bar';
import { ResponsivePie, PieSvgProps } from '@nivo/pie';

// --- Reusable Bar Chart ---
const CustomBarChart = ({ data, title }: { data: BarDatum[], title: string }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 h-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
        <div style={{ height: '350px' }}>
            <ResponsiveBar data={data} keys={['value']} indexBy="label" margin={{ top: 20, right: 20, bottom: 100, left: 60 }} padding={0.4} colors={{ scheme: 'nivo' }} axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45, legendPosition: 'middle', legendOffset: 32 }} axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: 'Count', legendPosition: 'middle', legendOffset: -50 }} labelSkipWidth={12} labelSkipHeight={12} labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }} animate={true} />
        </div>
    </div>
);

// --- Reusable Donut Chart ---
const CustomDonutChart = ({ data, title, total }: { data: PieSvgProps<{ id: string; value: number; }>['data'], title: string, total: number }) => {
    const CenteredMetric = ({ centerX, centerY }: { centerX: number, centerY: number }) => (
        <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="central" className="text-3xl font-bold text-gray-800">{total}</text>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
            <div style={{ height: '350px' }}>
                <ResponsivePie data={data} margin={{ top: 40, right: 80, bottom: 80, left: 80 }} innerRadius={0.6} padAngle={1} cornerRadius={3} activeOuterRadiusOffset={8} borderWidth={1} borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }} arcLinkLabelsSkipAngle={10} arcLinkLabelsTextColor="#333" arcLinkLabelsThickness={2} arcLinkLabelsColor={{ from: 'color' }} arcLabelsSkipAngle={10} colors={{ scheme: 'pastel1' }} layers={['arcs', 'arcLabels', 'arcLinkLabels', 'legends', CenteredMetric]} legends={[{ anchor: 'bottom', direction: 'row', justify: false, translateX: 0, translateY: 56, itemsSpacing: 0, itemWidth: 100, itemHeight: 18, itemTextColor: '#999', itemDirection: 'left-to-right', symbolSize: 18, symbolShape: 'circle' }]} />
            </div>
        </div>
    );
};

// --- Main Chart Section Component ---
interface StationChartsProps {
    chartData: {
        provinceData: { label: string; value: number }[];
        amControlData: { label: string; value: number }[];
        supporterData: { label: string; value: number }[];
    };
    totalStations: number;
}

export const StationCharts: React.FC<StationChartsProps> = ({ chartData, totalStations }) => (
    <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Station Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CustomDonutChart
                data={chartData.provinceData.map(d => ({ id: d.label, value: d.value }))}
                title="By Province"
                total={totalStations}
            />
            <CustomBarChart data={chartData.amControlData} title="By AM Control" />
            <CustomBarChart data={chartData.supporterData} title="By Supporter" />
        </div>
    </div>
);