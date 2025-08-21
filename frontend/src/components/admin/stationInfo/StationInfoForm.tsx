import React, { useState, useEffect } from 'react';
import { IStationInfo, IAMControl, ISupporter, IProvince } from '../../../types';
import { lookupService } from '../../../services/stationInfo.service';
import { Dialog } from '@headlessui/react';
import {
    IdentificationIcon,
    BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

interface StationInfoFormProps {
    initialData?: IStationInfo | null;
    onSubmit: (data: Partial<IStationInfo>) => void;
    onCancel: () => void;
}

export const StationInfoForm: React.FC<StationInfoFormProps> = ({ initialData, onSubmit, onCancel }) => {
    // --- State Management ---
    const [formData, setFormData] = useState<Partial<IStationInfo>>({
        station_id: '',
        station_name: '',
        am_control_id: undefined,
        supporter_id: undefined,
        province_id: undefined,
        active: 1,
    });

    const [amControls, setAmControls] = useState<IAMControl[]>([]);
    const [supporters, setSupporters] = useState<ISupporter[]>([]);
    const [provinces, setProvinces] = useState<IProvince[]>([]);
    const [isLoadingLookups, setIsLoadingLookups] = useState(true);

    // --- Data Fetching for Dropdowns ---
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [amControlsData, supportersData, provincesData] = await Promise.all([
                    lookupService.getAMControls(),
                    lookupService.getSupporters(),
                    lookupService.getProvinces(),
                ]);
                setAmControls(amControlsData);
                setSupporters(supportersData);
                setProvinces(provincesData);
            } catch (error) {
                console.error("Failed to fetch lookup data", error);
            } finally {
                setIsLoadingLookups(false);
            }
        };
        fetchLookups();
    }, []);

    // --- Populating Form for Editing ---
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                am_control_id: initialData.am_control_id ?? undefined,
                supporter_id: initialData.supporter_id ?? undefined,
                province_id: initialData.province_id ?? undefined,
            });
        } else {
            // Reset form for creating a new station
            setFormData({
                station_id: '',
                station_name: '',
                am_control_id: undefined,
                supporter_id: undefined,
                province_id: undefined,
                active: 1,
            });
        }
    }, [initialData]);

    // --- Event Handlers ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // ✅ FIX: Removed 'province_id' so it's treated as a string, not a number.
        const isNumberField = ['am_control_id', 'supporter_id', 'active'].includes(name);
        const finalValue = isNumberField ? (value ? parseInt(value, 10) : undefined) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // --- Styling Classes ---
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const inputContainerClass = "relative";
    const inputIconClass = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-full";
    const inputClass = "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-10";
    const selectClass = "block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm";

    // --- Render Logic ---
    if (isLoadingLookups) {
        return <div className="text-center p-8">Loading form data...</div>;
    }

    return (
        <>
            <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                {initialData ? 'Edit Station Information' : 'Create New Station'}
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="station_id" className={labelClass}>Station ID</label>
                        <div className={inputContainerClass}>
                            <div className={inputIconClass}><IdentificationIcon className="h-5 w-5 text-gray-400"/></div>
                            <input id="station_id" name="station_id" value={formData.station_id ?? ''} onChange={handleChange} required className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="station_name" className={labelClass}>Station Name</label>
                        <div className={inputContainerClass}>
                            <div className={inputIconClass}><BuildingStorefrontIcon className="h-5 w-5 text-gray-400"/></div>
                            <input id="station_name" name="station_name" value={formData.station_name ?? ''} onChange={handleChange} required className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="am_control_id" className={labelClass}>AM Control</label>
                        <select id="am_control_id" name="am_control_id" value={String(formData.am_control_id ?? '')} onChange={handleChange} className={selectClass}>
                            <option value="">-- Select AM --</option>
                            {amControls.map(am => <option key={am.id} value={am.id}>{am.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="supporter_id" className={labelClass}>Supporter</label>
                        <select id="supporter_id" name="supporter_id" value={String(formData.supporter_id ?? '')} onChange={handleChange} className={selectClass}>
                            <option value="">-- Select Supporter --</option>
                            {supporters.map(sup => <option key={sup.id} value={sup.id}>{sup.supporter_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="province_id" className={labelClass}>Province</label>
                        <select id="province_id" name="province_id" value={String(formData.province_id ?? '')} onChange={handleChange} className={selectClass}>
                            <option value="">-- Select Province --</option>
                            {provinces.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="active" className={labelClass}>Status</label>
                        <select id="active" name="active" value={String(formData.active ?? '1')} onChange={handleChange} className={selectClass}>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="pt-5 flex justify-end space-x-3 border-t border-gray-200">
                    <button type="button" onClick={onCancel} className="rounded-md bg-white py-2 px-4 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit} className="inline-flex justify-center rounded-md bg-indigo-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        Save Station
                    </button>
                </div>
            </form>
        </>
    );
};