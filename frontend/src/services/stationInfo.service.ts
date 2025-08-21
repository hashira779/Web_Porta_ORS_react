import api from '../api/api';
import { IStationInfo, IAMControl, ISupporter, IProvince } from '../types';

type StationInfoCreateData = Omit<IStationInfo, 'id'>;
type StationInfoUpdateData = Partial<IStationInfo>;

export const stationInfoService = {
    getAll: async (): Promise<IStationInfo[]> => {
        const response = await api.get('/admin/station-info/');
        return response.data;
    },
    create: async (data: StationInfoCreateData): Promise<IStationInfo> => {
        const response = await api.post('/admin/station-info/', data);
        return response.data;
    },
    update: async (id: number, data: StationInfoUpdateData): Promise<IStationInfo> => {
        const response = await api.put(`/admin/station-info/${id}`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/admin/station-info/${id}`);
    },
};

// === ADD THIS NEW SERVICE OBJECT ===
export const lookupService = {
    getAMControls: async (): Promise<IAMControl[]> => {
        const response = await api.get('/lookups/am-controls');
        return response.data;
    },
    getSupporters: async (): Promise<ISupporter[]> => {
        const response = await api.get('/lookups/supporters');
        return response.data;
    },
    getProvinces: async (): Promise<IProvince[]> => {
        const response = await api.get('/lookups/provinces');
        return response.data;
    },
};