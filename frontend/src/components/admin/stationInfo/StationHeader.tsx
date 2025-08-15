import { ArrowDownTrayIcon, PlusIcon } from '@heroicons/react/24/solid';

interface StationHeaderProps {
    totalStations: number;
    onExport: () => void;
    onCreate: () => void;
}

export const StationHeader: React.FC<StationHeaderProps> = ({ totalStations, onExport, onCreate }) => (
    <div className="sm:flex sm:items-center sm:justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Station Management</h1>
            <p className="mt-2 text-sm text-gray-600">Total Stations: {totalStations}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-x-3">
            <button onClick={onExport} type="button" className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <ArrowDownTrayIcon className="h-5 w-5 text-gray-500" /> Export
            </button>
            <button onClick={onCreate} type="button" className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
                <PlusIcon className="h-5 w-5" /> Add Station
            </button>
        </div>
    </div>
);