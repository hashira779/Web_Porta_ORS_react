import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { IProvince, ISupporter, IAMControl } from '../../../types'; // Adjust path
import { IFilters } from '../../../hooks/useStationManagement'; // Adjust path

interface StationFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filters: IFilters;
    onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onClear: () => void;
    provinces: IProvince[];
    supporters: ISupporter[];
    amControls: IAMControl[];
}

export const StationFilters: React.FC<StationFiltersProps> = ({ searchTerm, onSearchChange, filters, onFilterChange, onClear, provinces, supporters, amControls }) => (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
                <div className="relative mt-1">
                    <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-3 h-5 w-5 text-gray-400" />
                    <input type="text" id="search" placeholder="Search by ID or Name..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 shadow-sm" />
                </div>
            </div>
            <div>
                <label htmlFor="provinceId" className="block text-sm font-medium text-gray-700">Province</label>
                <select id="provinceId" name="provinceId" value={filters.provinceId} onChange={onFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="">All</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="supporterId" className="block text-sm font-medium text-gray-700">Supporter</label>
                <select id="supporterId" name="supporterId" value={filters.supporterId} onChange={onFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="">All</option>
                    {supporters.map(s => <option key={s.id} value={s.id}>{s.supporter_name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="amControlId" className="block text-sm font-medium text-gray-700">AM Control</label>
                <select id="amControlId" name="amControlId" value={filters.amControlId} onChange={onFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="">All</option>
                    {amControls.map(am => <option key={am.id} value={am.id}>{am.name}</option>)}
                </select>
            </div>
            <div className="flex items-end">
                <button onClick={onClear} className="flex h-10 w-full items-center justify-center rounded-md bg-white text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    <XMarkIcon className="h-5 w-5 mr-1 text-gray-500"/> Clear
                </button>
            </div>
        </div>
    </div>
);